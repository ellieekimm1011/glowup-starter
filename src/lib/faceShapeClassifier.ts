// lib/faceShapeClassifier.ts
// Determines face shape from measured geometry (forehead/cheekbone/jaw width,
// face length, jaw angle) instead of asking a vision model to guess — the
// same "measure, don't guess" principle already used for makeup placement
// (see lib/faceLandmarks.ts and components/makeup/FaceOverlay.tsx).

import { LANDMARKS, type NormalizedPoint } from "@/lib/faceLandmarks";
import type { FaceShape } from "@/types";

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Angle (in degrees) at `vertex`, between rays toward `a` and `b`.
function angleAt(vertex: Point, a: Point, b: Point): number {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

// Normalized landmarks are fractions of width/height *separately*, so a
// non-square photo would distort distances that mix horizontal and vertical
// measurements (face length vs. face width). Converting to the source
// image's real pixel dimensions first keeps the ratios true to life.
function toPixels(points: NormalizedPoint[], width: number, height: number): Point[] {
  return points.map((p) => ({ x: p.x * width, y: p.y * height }));
}

// Ratio thresholds below are heuristic, not physical constants — they're a
// reasonable starting point based on standard face-shape descriptions and
// may need tuning against real test photos.
export function classifyFaceShape(
  landmarks: NormalizedPoint[],
  imageWidth: number,
  imageHeight: number
): FaceShape {
  const px = toPixels(landmarks, imageWidth, imageHeight);
  const get = (key: keyof typeof LANDMARKS) => px[LANDMARKS[key]];

  const faceLength = dist(get("foreheadCenter"), get("chin"));
  const foreheadWidth = dist(get("rightTemple"), get("leftTemple"));
  const cheekboneWidth = dist(get("rightFaceEdge"), get("leftFaceEdge"));
  const jawWidth = dist(get("rightJawLower"), get("leftJawLower"));

  // How sharp the jaw's corner is: closer to 180° means the jawline curves
  // smoothly into the chin (round/oval), a smaller angle means a distinct
  // corner (square/rectangle).
  const jawAngle =
    (angleAt(get("rightJawLower"), get("rightJaw"), get("chin")) +
      angleAt(get("leftJawLower"), get("leftJaw"), get("chin"))) /
    2;
  const isAngularJaw = jawAngle < 155;

  const lengthToWidth = faceLength / cheekboneWidth;
  const foreheadToCheek = foreheadWidth / cheekboneWidth;
  const jawToCheek = jawWidth / cheekboneWidth;

  // Long face: if the forehead and jaw stay nearly as wide as the
  // cheekbones (straight sides), it's oblong. Otherwise a long face that
  // still tapers reads as oval.
  if (lengthToWidth > 1.45) {
    return foreheadToCheek > 0.9 && jawToCheek > 0.85 ? "oblong" : "oval";
  }

  // Forehead clearly the widest point, jaw clearly the narrowest => heart.
  if (foreheadToCheek > 1.05 && jawToCheek < 0.85) return "heart";

  // Cheekbones clearly the widest point, forehead and jaw both notably
  // narrower => diamond.
  if (foreheadToCheek < 0.9 && jawToCheek < 0.85) return "diamond";

  // Forehead, cheekbones, and jaw all roughly the same width => square (with
  // a sharp jaw corner) or round (with a soft one).
  if (foreheadToCheek > 0.92 && jawToCheek > 0.92 && lengthToWidth < 1.15) {
    return isAngularJaw ? "square" : "round";
  }

  // Balanced default: length somewhat greater than width, jaw narrower than
  // the cheekbones but still gently rounded.
  return "oval";
}
