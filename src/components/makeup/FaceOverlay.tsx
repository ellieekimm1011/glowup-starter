"use client";
// components/makeup/FaceOverlay.tsx
// Renders the user's uploaded photo with blush/contour/highlight/concealer
// zones drawn directly on it, positioned using detected facial landmarks.
// Which zones get drawn (and their exact shape) come from a deterministic
// guide (lib/makeupGuide.ts), not the AI, so placement is consistent every time.

import { useEffect, useRef, useState } from "react";
import { detectFaceLandmarks, LANDMARKS, type NormalizedPoint } from "@/lib/faceLandmarks";
import type { BlushZone, MakeupRecommendation, OverlayZones } from "@/types";

interface Props {
  imageUrl: string;
  recommendations: MakeupRecommendation[];
  overlayZones: OverlayZones;
}

interface PixelPoint {
  x: number;
  y: number;
}

// Opacity kept in the 50–70% "guide" range — strong enough to read clearly,
// soft enough not to look like paint.
const ZONE_STYLE: Record<MakeupRecommendation["type"], { fill: string; label: string }> = {
  blush: { fill: "rgba(244, 114, 182, 0.55)", label: "Blush" },
  contour: { fill: "rgba(120, 72, 45, 0.7)", label: "Contour" },
  highlight: { fill: "rgba(255, 201, 102, 0.65)", label: "Highlight" }, // golden shimmer
  concealer: { fill: "rgba(255, 255, 255, 0.6)", label: "Concealer" }, // clean white, clearly distinct from highlight's gold
};

function lerp(a: PixelPoint, b: PixelPoint, t: number): PixelPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function dist(a: PixelPoint, b: PixelPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(from: PixelPoint, to: PixelPoint) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

// Eye-corner landmarks sit at eye level, not the lower lash line/under-eye
// area — nudge down so the under-eye triangle sits in the eye-bag area
// instead of overlapping the eye itself.
function belowEye(p: PixelPoint, faceWidthPx: number): PixelPoint {
  return { x: p.x, y: p.y + faceWidthPx * 0.07 };
}

// Under-eye concealer: an inverted triangle whose base follows the lower
// lash line (inner to outer corner), inner edge aligned to the side of the
// nose, outer edge angled toward the outer cheek, and the apex extending
// down to roughly the bottom of the nostril.
function underEyeTriangle(
  eyeInner: PixelPoint,
  eyeOuter: PixelPoint,
  noseTip: PixelPoint,
  cheekApple: PixelPoint,
  faceWidthPx: number
): { innerTop: PixelPoint; outerTop: PixelPoint; apex: PixelPoint } {
  const innerTop = lerp(belowEye(eyeInner, faceWidthPx), noseTip, 0.15);
  const outerTop = lerp(belowEye(eyeOuter, faceWidthPx), cheekApple, 0.2);
  const apex = { x: lerp(innerTop, outerTop, 0.5).x, y: noseTip.y };
  return { innerTop, outerTop, apex };
}

// A soft elongated arc (rotated ellipse) running from `start` to `end` —
// the same shape language used for both the cheek highlight and blush, so
// the two read as one consistent "band" rather than mismatched shapes.
function elongatedArc(
  start: PixelPoint,
  end: PixelPoint,
  ry: number,
  elongation = 1.25
): { cx: number; cy: number; rx: number; ry: number; angle: number; bottomY: number } {
  const center = lerp(start, end, 0.5);
  const angle = angleDeg(start, end);
  const rx = Math.max((dist(start, end) / 2) * elongation, ry); // never thinner than it is tall
  const angleRad = (angle * Math.PI) / 180;
  const bottomY = center.y + Math.sqrt((rx * Math.sin(angleRad)) ** 2 + (ry * Math.cos(angleRad)) ** 2);
  return { cx: center.x, cy: center.y, rx, ry, angle, bottomY };
}

// Highlight on the cheek is a soft elongated arc starting from the top of
// the cheekbone and sweeping upward toward (but not reaching) the temple/
// hairline. Returns `bottomY`, the lowest point the arc reaches, so blush
// can be kept below it.
function highlightCheekArc(cheekTop: PixelPoint, temple: PixelPoint, faceWidthPx: number) {
  return elongatedArc(cheekTop, lerp(cheekTop, temple, 0.7), faceWidthPx * 0.032, 1.25);
}

// Blush is the same elongated-arc shape as the highlight, just positioned
// below it — the start/end points (and so the sweep direction) follow each
// face shape's described blend direction: temple-ward for round/oval/square,
// horizontal toward the ear for heart/oblong, outward toward the jaw for
// diamond. `highlightBottomY` guarantees blush always renders below the
// cheek highlight (with a small transition gap), and `noseTipY` keeps it
// from ever sitting below the nostril line.
function blushGeometry(
  zone: BlushZone,
  apple: PixelPoint,
  top: PixelPoint,
  jaw: PixelPoint,
  temple: PixelPoint,
  highlightBottomY: number,
  noseTipY: number,
  faceWidthPx: number
): { cx: number; cy: number; rx: number; ry: number; angle: number } {
  let start: PixelPoint, end: PixelPoint;
  let ry = faceWidthPx * 0.07;

  switch (zone) {
    case "higherCheeks": { // behind the apples, 45° up toward the hairline — anchored
      // relative to the apple→cheekTop segment (not apple→temple), so it stays
      // naturally below the highlight band instead of colliding with it.
      const base = lerp(apple, top, 0.5);
      start = base;
      end = lerp(base, temple, 0.35);
      ry = faceWidthPx * 0.06;
      break;
    }
    case "applesCircular": // square: a soft circle right on the center of the
      // cheek — no directional sweep, so start === end gives a perfect circle.
      start = apple;
      end = apple;
      ry = faceWidthPx * 0.1;
      break;
    case "upperCheekCircle": { // round: a circle nudged up from the apple toward the
      // cheekbone, so it sits right next to the under-eye concealer instead of
      // down at the apple.
      const base = lerp(apple, top, 0.35);
      start = base;
      end = base;
      ry = faceWidthPx * 0.09;
      break;
    }
    case "centerCheeks": // heart: horizontal spread, no lift
      start = { x: apple.x - faceWidthPx * 0.08, y: apple.y };
      end = { x: apple.x + faceWidthPx * 0.08, y: apple.y };
      ry = faceWidthPx * 0.07;
      break;
    case "lowerCheeks": // diamond: starts below the widest point, blends outward toward
      // the jaw — longer than most blush zones so it reaches further into the cheek.
      start = apple;
      end = lerp(apple, jaw, 0.55);
      ry = faceWidthPx * 0.07;
      break;
    case "lowerCheeksCircle": { // oblong: a circle below the apple, in the lower cheek —
      // no directional sweep toward the ear.
      const base = lerp(apple, jaw, 0.3);
      start = base;
      end = base;
      ry = faceWidthPx * 0.1;
      break;
    }
    case "apples":
    default: // oval: soft blend upward toward the temple
      start = apple;
      end = lerp(apple, temple, 0.4);
      ry = faceWidthPx * 0.08;
  }

  const arc = elongatedArc(start, end, ry, 1.15);

  // Never place blush below the nostril line, but always keep it below the
  // cheek highlight (with a small blended transition gap) — this takes
  // priority if the two constraints ever disagree.
  const cy = Math.max(Math.min(arc.cy, noseTipY), highlightBottomY + faceWidthPx * 0.02);
  return { cx: arc.cx, cy, rx: arc.rx, ry: arc.ry, angle: arc.angle };
}

// A tapered ribbon between two points — wider at `from`, narrower at `to` —
// used for cheek/jaw contour, which should be thickest near the ear and
// gradually narrow as it moves forward, never a flat constant-width stripe.
function taperedPath(from: PixelPoint, to: PixelPoint, widthStart: number, widthEnd: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const p1 = { x: from.x + (nx * widthStart) / 2, y: from.y + (ny * widthStart) / 2 };
  const p2 = { x: to.x + (nx * widthEnd) / 2, y: to.y + (ny * widthEnd) / 2 };
  const p3 = { x: to.x - (nx * widthEnd) / 2, y: to.y - (ny * widthEnd) / 2 };
  const p4 = { x: from.x - (nx * widthStart) / 2, y: from.y - (ny * widthStart) / 2 };
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
}

// The <img> uses object-cover: the photo is scaled up uniformly until it
// fills the container, then the overflow is cropped evenly from the center.
// Landmark coordinates are normalized against the original (uncropped) photo,
// so we have to redo that same scale+crop math to place them correctly.
function makeProjector(containerSize: { width: number; height: number }, img: HTMLImageElement) {
  const scale = Math.max(containerSize.width / img.naturalWidth, containerSize.height / img.naturalHeight);
  const displayedWidth = img.naturalWidth * scale;
  const displayedHeight = img.naturalHeight * scale;
  const offsetX = (displayedWidth - containerSize.width) / 2;
  const offsetY = (displayedHeight - containerSize.height) / 2;

  return (point: NormalizedPoint): PixelPoint => ({
    x: point.x * displayedWidth - offsetX,
    y: point.y * displayedHeight - offsetY,
  });
}

export default function FaceOverlay({ imageUrl, recommendations, overlayZones }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [points, setPoints] = useState<Record<keyof typeof LANDMARKS, PixelPoint> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "no-face" | "error">("loading");

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const runDetection = async () => {
      try {
        const landmarks = await detectFaceLandmarks(img);
        if (!landmarks) {
          setStatus("no-face");
          return;
        }

        const containerSize = { width: img.clientWidth, height: img.clientHeight };
        const project = makeProjector(containerSize, img);

        const projected = {} as Record<keyof typeof LANDMARKS, PixelPoint>;
        for (const key of Object.keys(LANDMARKS) as (keyof typeof LANDMARKS)[]) {
          projected[key] = project(landmarks[LANDMARKS[key]]);
        }

        setSize(containerSize);
        setPoints(projected);
        setStatus("ready");
      } catch (err) {
        console.error("Face landmark detection failed:", err);
        setStatus("error");
      }
    };

    if (img.complete) {
      runDetection();
    } else {
      img.addEventListener("load", runDetection, { once: true });
      return () => img.removeEventListener("load", runDetection);
    }
  }, [imageUrl]);

  const activeTypes = new Set(recommendations.map((r) => r.type));
  const faceWidthPx = points ? dist(points.rightFaceEdge, points.leftFaceEdge) : 0;
  const highlightZones = new Set(overlayZones.highlightZones);
  const contourZones = new Set(overlayZones.contourZones);
  const concealerZones = new Set(overlayZones.concealerZones);
  const rightHighlightArc = points ? highlightCheekArc(points.rightCheekTop, points.rightTemple, faceWidthPx) : null;
  const leftHighlightArc = points ? highlightCheekArc(points.leftCheekTop, points.leftTemple, faceWidthPx) : null;
  const rightBlush = points && rightHighlightArc ? blushGeometry(overlayZones.blushZone, points.rightCheekApple, points.rightCheekTop, points.rightJaw, points.rightTemple, rightHighlightArc.bottomY, points.noseTip.y, faceWidthPx) : null;
  const leftBlush = points && leftHighlightArc ? blushGeometry(overlayZones.blushZone, points.leftCheekApple, points.leftCheekTop, points.leftJaw, points.leftTemple, leftHighlightArc.bottomY, points.noseTip.y, faceWidthPx) : null;

  const rightUnderEye = points ? underEyeTriangle(points.rightEyeInner, points.rightEyeOuter, points.noseTip, points.rightCheekApple, faceWidthPx) : null;
  const leftUnderEye = points ? underEyeTriangle(points.leftEyeInner, points.leftEyeOuter, points.noseTip, points.leftCheekApple, faceWidthPx) : null;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden card-shadow border border-nude-100">
      <div className="relative aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Your selfie with makeup placement guide"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {status === "ready" && points && size.width > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${size.width} ${size.height}`}
          >
            <defs>
              <filter id="makeup-feather" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={faceWidthPx * 0.012} />
              </filter>
            </defs>

            {/* All washes share a feathered filter so there are never hard edges. */}
            <g filter="url(#makeup-feather)">
              {activeTypes.has("blush") && rightBlush && leftBlush && (
                <>
                  <ellipse cx={rightBlush.cx} cy={rightBlush.cy} rx={rightBlush.rx} ry={rightBlush.ry} fill={ZONE_STYLE.blush.fill} transform={`rotate(${rightBlush.angle} ${rightBlush.cx} ${rightBlush.cy})`} />
                  <ellipse cx={leftBlush.cx} cy={leftBlush.cy} rx={leftBlush.rx} ry={leftBlush.ry} fill={ZONE_STYLE.blush.fill} transform={`rotate(${leftBlush.angle} ${leftBlush.cx} ${leftBlush.cy})`} />
                </>
              )}

              {activeTypes.has("contour") && (
                <>
                  {/* Forehead contour: short stroke at each temple curving toward the
                      hairline — never the center of the forehead. */}
                  {contourZones.has("temples") && (
                    <>
                      <path d={taperedPath(points.rightTemple, lerp(points.rightTemple, points.foreheadCenter, 0.4), faceWidthPx * 0.065, faceWidthPx * 0.028)} fill={ZONE_STYLE.contour.fill} />
                      <path d={taperedPath(points.leftTemple, lerp(points.leftTemple, points.foreheadCenter, 0.4), faceWidthPx * 0.065, faceWidthPx * 0.028)} fill={ZONE_STYLE.contour.fill} />
                    </>
                  )}
                  {/* Cheek contour: top of ear (temple) to just before the mouth (jaw point),
                      thickest near the ear and narrowing forward, staying in the hollow. */}
                  {contourZones.has("hollowCheeks") && (
                    <>
                      <path d={taperedPath(points.rightTemple, points.rightJaw, faceWidthPx * 0.09, faceWidthPx * 0.035)} fill={ZONE_STYLE.contour.fill} />
                      <path d={taperedPath(points.leftTemple, points.leftJaw, faceWidthPx * 0.09, faceWidthPx * 0.035)} fill={ZONE_STYLE.contour.fill} />
                    </>
                  )}
                  {/* Diamond: a single shadow following the cheekbone's own curve —
                      from its high point down into the cheek, not a separate shape. */}
                  {contourZones.has("cheekboneShadow") && (
                    <>
                      <path d={taperedPath(points.rightCheekTop, points.rightCheekApple, faceWidthPx * 0.06, faceWidthPx * 0.03)} fill={ZONE_STYLE.contour.fill} />
                      <path d={taperedPath(points.leftCheekTop, points.leftCheekApple, faceWidthPx * 0.06, faceWidthPx * 0.03)} fill={ZONE_STYLE.contour.fill} />
                    </>
                  )}
                  {/* Jaw contour: below the ear, stopping before the center of the chin. */}
                  {contourZones.has("jawline") && (
                    <>
                      <path d={taperedPath(points.rightJaw, lerp(points.rightJawLower, points.chin, 0.7), faceWidthPx * 0.08, faceWidthPx * 0.04)} fill={ZONE_STYLE.contour.fill} />
                      <path d={taperedPath(points.leftJaw, lerp(points.leftJawLower, points.chin, 0.7), faceWidthPx * 0.08, faceWidthPx * 0.04)} fill={ZONE_STYLE.contour.fill} />
                    </>
                  )}
                  {/* Under-chin curve: hugs the chin's actual lower edge — endpoints
                      pulled in from the jaw toward the chin's corners, dipping just
                      below the chin tip itself rather than cutting across the jaw. */}
                  {contourZones.has("underChinCurve") && (() => {
                    const rightEdge = lerp(points.rightJawLower, points.chin, 0.55);
                    const leftEdge = lerp(points.leftJawLower, points.chin, 0.55);
                    return (
                      <path
                        d={`M ${rightEdge.x} ${rightEdge.y} Q ${points.chin.x} ${points.chin.y + faceWidthPx * 0.035} ${leftEdge.x} ${leftEdge.y}`}
                        stroke={ZONE_STYLE.contour.fill}
                        strokeWidth={faceWidthPx * 0.045}
                        strokeLinecap="round"
                        fill="none"
                      />
                    );
                  })()}
                  {/* Forehead-top curve: hugs the forehead's hairline edge —
                      endpoints pulled up and inward from the temples toward the
                      hairline's height, rather than cutting across mid-forehead. */}
                  {contourZones.has("foreheadTopCurve") && (() => {
                    const rightEdge = { x: lerp(points.rightTemple, points.foreheadCenter, 0.6).x, y: points.foreheadCenter.y };
                    const leftEdge = { x: lerp(points.leftTemple, points.foreheadCenter, 0.6).x, y: points.foreheadCenter.y };
                    return (
                      <path
                        d={`M ${rightEdge.x} ${rightEdge.y} Q ${points.foreheadCenter.x} ${points.foreheadCenter.y - faceWidthPx * 0.035} ${leftEdge.x} ${leftEdge.y}`}
                        stroke={ZONE_STYLE.contour.fill}
                        strokeWidth={faceWidthPx * 0.045}
                        strokeLinecap="round"
                        fill="none"
                      />
                    );
                  })()}
                </>
              )}

              {activeTypes.has("highlight") && (
                <>
                  {/* Nose bridge: between the brows, following the bridge, ending just
                      before the tip — kept narrow so it never widens over the nostrils. */}
                  {highlightZones.has("noseBridge") && (
                    <ellipse cx={points.noseBridge.x} cy={points.noseBridge.y} rx={faceWidthPx * 0.028} ry={faceWidthPx * 0.09} fill={ZONE_STYLE.highlight.fill} />
                  )}
                  {highlightZones.has("noseTip") && (
                    <ellipse cx={points.noseTip.x} cy={points.noseTip.y} rx={faceWidthPx * 0.03} ry={faceWidthPx * 0.03} fill={ZONE_STYLE.highlight.fill} />
                  )}
                  {/* Cheekbone highlight: a soft elongated arc that always caps the
                      cheekbone above the blush, never a straight stripe. */}
                  {highlightZones.has("cheekTops") && rightHighlightArc && leftHighlightArc && (
                    <>
                      <ellipse cx={rightHighlightArc.cx} cy={rightHighlightArc.cy} rx={rightHighlightArc.rx} ry={rightHighlightArc.ry} fill={ZONE_STYLE.highlight.fill} transform={`rotate(${rightHighlightArc.angle} ${rightHighlightArc.cx} ${rightHighlightArc.cy})`} />
                      <ellipse cx={leftHighlightArc.cx} cy={leftHighlightArc.cy} rx={leftHighlightArc.rx} ry={leftHighlightArc.ry} fill={ZONE_STYLE.highlight.fill} transform={`rotate(${leftHighlightArc.angle} ${leftHighlightArc.cx} ${leftHighlightArc.cy})`} />
                    </>
                  )}
                  {/* Heart-shape exception: brighten the sides of the jaw to add width
                      to the lower half of the face. */}
                  {highlightZones.has("jawSides") && (
                    <>
                      <ellipse cx={points.rightJaw.x} cy={points.rightJaw.y} rx={faceWidthPx * 0.045} ry={faceWidthPx * 0.06} fill={ZONE_STYLE.highlight.fill} />
                      <ellipse cx={points.leftJaw.x} cy={points.leftJaw.y} rx={faceWidthPx * 0.045} ry={faceWidthPx * 0.06} fill={ZONE_STYLE.highlight.fill} />
                    </>
                  )}
                </>
              )}

              {activeTypes.has("concealer") && (
                <>
                  {/* Under-eye: an actual inverted triangle in the eye-bag area —
                      just below the lash line at the top, tapering down toward the cheek. */}
                  {concealerZones.has("underEyeTriangle") && rightUnderEye && leftUnderEye && (
                    <>
                      <polygon points={`${rightUnderEye.innerTop.x},${rightUnderEye.innerTop.y} ${rightUnderEye.outerTop.x},${rightUnderEye.outerTop.y} ${rightUnderEye.apex.x},${rightUnderEye.apex.y}`} fill={ZONE_STYLE.concealer.fill} />
                      <polygon points={`${leftUnderEye.innerTop.x},${leftUnderEye.innerTop.y} ${leftUnderEye.outerTop.x},${leftUnderEye.outerTop.y} ${leftUnderEye.apex.x},${leftUnderEye.apex.y}`} fill={ZONE_STYLE.concealer.fill} />
                    </>
                  )}
                  {concealerZones.has("centerFace") && (
                    <ellipse cx={lerp(points.noseBridge, points.noseTip, 0.5).x} cy={lerp(points.noseBridge, points.noseTip, 0.5).y} rx={faceWidthPx * 0.06} ry={faceWidthPx * 0.13} fill={ZONE_STYLE.concealer.fill} />
                  )}
                  {/* Heart-shape exception: a touch of concealer on the jaw sides,
                      layered with the matching highlight there. */}
                  {concealerZones.has("jawSides") && (
                    <>
                      <ellipse cx={points.rightJaw.x} cy={points.rightJaw.y} rx={faceWidthPx * 0.035} ry={faceWidthPx * 0.045} fill={ZONE_STYLE.concealer.fill} />
                      <ellipse cx={points.leftJaw.x} cy={points.leftJaw.y} rx={faceWidthPx * 0.035} ry={faceWidthPx * 0.045} fill={ZONE_STYLE.concealer.fill} />
                    </>
                  )}
                  {/* Diamond: a soft circle in the middle of the chin (nudged up from
                      the chin's bottommost point), to widen the narrow lower face. */}
                  {concealerZones.has("chinCircle") && (
                    <ellipse cx={points.chin.x} cy={points.chin.y - faceWidthPx * 0.035} rx={faceWidthPx * 0.06} ry={faceWidthPx * 0.06} fill={ZONE_STYLE.concealer.fill} />
                  )}
                  {/* Diamond: a bigger, wider circle in the middle of the forehead
                      (nudged down from the hairline), to widen the narrow upper face. */}
                  {concealerZones.has("foreheadCircle") && (
                    <ellipse cx={points.foreheadCenter.x} cy={points.foreheadCenter.y + faceWidthPx * 0.06} rx={faceWidthPx * 0.11} ry={faceWidthPx * 0.08} fill={ZONE_STYLE.concealer.fill} />
                  )}
                </>
              )}
            </g>
          </svg>
        )}

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white/90 rounded-full px-4 py-2 text-xs font-medium text-nude-600">
              Mapping your features…
            </div>
          </div>
        )}

        {(status === "no-face" || status === "error") && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/90 rounded-xl px-3 py-2 text-xs text-nude-600">
            {status === "no-face"
              ? "Couldn't map exact placement on this photo — see the written guide below."
              : "Placement mapping failed — see the written guide below."}
          </div>
        )}
      </div>

      {status === "ready" && (
        <div className="flex items-center gap-4 px-4 py-3 border-t border-nude-100 text-xs">
          {recommendations.map((r) => (
            <div key={r.type} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ZONE_STYLE[r.type].fill }}
              />
              <span className="text-nude-600 font-medium">{ZONE_STYLE[r.type].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
