// lib/makeupGuide.ts
// Deterministic makeup placement guide, keyed by face shape. This used to be
// left to the AI to decide per request, which was unreliable with free
// models — placement should be the same every time for the same face shape,
// so it's hard-coded here instead. The AI is only used for detecting face
// shape and for tutorials.

import type {
  BlushZone,
  ConcealerZone,
  ContourZone,
  FaceShape,
  HighlightZone,
  MakeupRecommendation,
  OverlayZones,
} from "@/types";

interface ZoneGuide<Zone> {
  zones: Zone[];
  where: string;
  why: string;
  beginnerTip: string;
}

interface FaceShapeGuide {
  goal: string;
  highlight: ZoneGuide<HighlightZone>;
  concealer: ZoneGuide<ConcealerZone>;
  contour: ZoneGuide<ContourZone>;
  blush: ZoneGuide<BlushZone>;
}

const FACE_SHAPE_GUIDE: Record<FaceShape, FaceShapeGuide> = {
  oval: {
    goal: "Maintain balance.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops"],
      where: "Starting between your brows, follow the exact center of your nose bridge and stop just before the tip, adding a tiny circular highlight on the center of the tip itself — never widening over the nostrils. Add a touch on top of each cheekbone too.",
      why: "Oval faces are already balanced, so highlight is used to enhance natural high points rather than reshape anything.",
      beginnerTip: "A little goes a long way — dab with a finger or small brush and blend immediately so it looks like skin, not paint.",
    },
    concealer: {
      zones: ["underEyeTriangle", "centerFace"],
      where: "Brighten in an inverted triangle beneath both eyes — spanning your entire lower lash line at the top, tapering down to just above your cheek — plus the center of your face (forehead, nose, chin).",
      why: "Oval faces don't need much correcting, so the standard full brightening routine (under-eyes plus center face) works as-is without needing to be restricted anywhere.",
      beginnerTip: "Pat, don't drag — use a damp sponge to press concealer into place so it doesn't crease.",
    },
    contour: {
      zones: ["hollowCheeks"],
      where: "Keep it very soft. Starting near the top of your ear, sweep a thin line through the hollow beneath your cheekbone, stopping a couple finger-widths before your mouth — thickest near your ear, fading out as it moves forward. Skip the temples and jaw entirely.",
      why: "Oval is the shape other shapes are corrected toward, so it only needs the lightest dimension in the cheek hollow — no temple or jaw contour is needed.",
      beginnerTip: "Use a fluffy brush, blend upward (never downward), and build up slowly — it's much easier to add more than to fix overdone contour.",
    },
    blush: {
      zones: ["apples"],
      where: "Smile and apply directly over the highest point of your cheekbone (the apples), blending upward toward your temples in a soft oval.",
      why: "Applying to the apples and blending upward gives a fresh, lifted look that suits balanced proportions.",
      beginnerTip: "Smiling first helps you find the apples of your cheeks exactly where they naturally sit.",
    },
  },
  round: {
    goal: "Create length and definition.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops"],
      where: "Run a narrow highlight down your nose bridge to its tip, and add it to the top of each cheekbone, keeping everything compact rather than wide.",
      why: "A narrow nose highlight draws the eye up and down rather than side to side, supporting the lengthening effect without adding width via the forehead.",
      beginnerTip: "Keep the highlight narrow rather than wide — a thin strip elongates, a wide patch widens.",
    },
    concealer: {
      zones: ["underEyeTriangle", "centerFace"],
      where: "Brighten under your eyes and down the center of your face to reinforce the lengthening effect.",
      why: "Concentrating brightness in the center (and avoiding the outer cheeks) supports the same lengthening goal as the highlight.",
      beginnerTip: "Stick to the center of the face — avoid brightening the outer cheeks, which would add width instead.",
    },
    contour: {
      zones: ["temples", "hollowCheeks", "jawline"],
      where: "Skip the classic three-shape Western contour. Instead, sculpt vertically: deeper contour at your temples, a thicker line from the top of your ear through the hollow of your cheek narrowing toward (but stopping short of) your mouth, and a defined jawline below the ear. Blend a small amount gently under your chin to help define it.",
      why: "Vertical sculpting (rather than horizontal shading) breaks up the roundness and adds the angles and length a round face is naturally missing.",
      beginnerTip: "Keep the contour thickest near your ear and blend it upward, never downward — that direction is what creates the slimming effect.",
    },
    blush: {
      zones: ["upperCheekCircle"],
      where: "Apply blush as a soft circle on the center of your cheek, sitting just beside your under-eye concealer.",
      why: "Keeping blush high and close to the concealer (rather than down at the apple) supports the lifted, lengthened look this shape needs.",
      beginnerTip: "If it feels close to your under-eye area, that's correct — the two should sit right next to each other.",
    },
  },
  square: {
    goal: "Soften angles.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops"],
      where: "Highlight down your nose bridge to its tip, and add a touch on top of each cheekbone to draw soft attention to the center of your face.",
      why: "Central highlight draws the eye inward and softens the strong corners of a square face shape.",
      beginnerTip: "Blend the edges of each highlight spot really well — sharp edges will emphasize the angles you're trying to soften.",
    },
    concealer: {
      zones: ["underEyeTriangle", "centerFace"],
      where: "Brighten the standard under-eye triangle plus the center of your face (forehead, nose, chin) to keep the center soft and lifted.",
      why: "Centered brightening draws the eye inward, away from your face's strong outer corners.",
      beginnerTip: "Set with a light dusting of powder so the brightening doesn't crease into fine lines.",
    },
    contour: {
      zones: ["temples", "hollowCheeks", "jawline"],
      where: "Use soft, rounded strokes — never a sharp line — on the outer edges of your forehead and on the sharpest parts of your jawline to diffuse the angles there, plus a softer line through the hollow of your cheek.",
      why: "Square faces have strong angular corners at the forehead and jaw; soft, rounded contour right on those corners is what actually diffuses them.",
      beginnerTip: "Use soft, well-blended strokes rather than a sharp line — the goal is to round off corners, not sharpen them.",
    },
    blush: {
      zones: ["applesCircular"],
      where: "Apply blush directly on the apples of your cheeks in a soft, circular motion — not pulled outward toward your temples.",
      why: "A soft circular blend on the apples (rather than a directional sweep) adds softness without echoing the face's strong angles.",
      beginnerTip: "Smile to find your apples, then blend in small circles rather than long strokes — circular motion is what keeps this soft.",
    },
  },
  heart: {
    goal: "Balance a wider forehead and narrower chin.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops", "jawSides"],
      where: "Highlight down the center of your nose and add a touch on top of each cheekbone. Skip your forehead entirely — it's already the widest part of your face. As an exception just for your shape, also brighten the sides of your jawline.",
      why: "Heart faces already have a wide forehead, so keeping highlight off it avoids emphasizing the width further, while brightening the jaw sides visually adds width to the lower half of your face to balance it.",
      beginnerTip: "Skip your usual forehead highlight routine here — your forehead doesn't need any extra emphasis. The jawline brightening is the one exception for your shape.",
    },
    concealer: {
      zones: ["underEyeTriangle", "jawSides"],
      where: "Brighten under your eyes with standard placement, and add a touch of concealer to the sides of your jaw too. Skip your forehead entirely.",
      why: "Brightening the jaw sides (alongside the matching highlight there) reinforces the lower-face width that balances a heart shape — forehead brightening would only add more emphasis to a part that's already wide.",
      beginnerTip: "Keep it simple here — under-eye brightening is doing most of the work, with the jaw touch as the one extra step for your shape.",
    },
    contour: {
      zones: ["temples", "hollowCheeks", "underChinCurve"],
      where: "Lightly contour your temples to slim the upper portion of your face. Keep any contour under your cheekbones very light. Instead of contouring along your jaw, add a soft curved line that hugs the underside of your chin, dipping just below its tip.",
      why: "Contouring the temples narrows the forehead's apparent width, while the curve under the chin softens its pointed tip — together balancing the upper and lower halves of your face, without adding definition along the jaw itself, which would only draw more attention to its narrowness.",
      beginnerTip: "The temple contour is the most important step for your shape — don't skip it even if it feels unfamiliar. Keep the under-chin curve soft and light so it reads as natural shadow, not a line.",
    },
    blush: {
      zones: ["centerCheeks"],
      where: "Apply blush to the center of your cheeks and spread it horizontally, without lifting it upward. Avoid placing it too high.",
      why: "Centered, horizontally-blended blush balances a heart face without adding extra width near the already-wide forehead.",
      beginnerTip: "Keep blush centered and avoid sweeping it upward toward your temples, which would add even more width up top.",
    },
  },
  diamond: {
    goal: "Soften cheekbone width.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops"],
      where: "Highlight down your nose bridge to its tip, and add a light touch on top of each cheekbone.",
      why: "Keeping highlight centered on the nose (rather than spreading it wide) avoids drawing extra attention to your face's widest point.",
      beginnerTip: "Use a light hand on the cheekbone highlight — a little goes further on your most prominent feature.",
    },
    concealer: {
      zones: ["underEyeTriangle", "chinCircle", "foreheadCircle"],
      where: "Brighten under your eyes, plus a soft circle on your chin and a soft circle on your forehead. Skip the nose.",
      why: "Brightening the narrow forehead and chin (rather than the already-prominent nose) widens those areas to balance your widest point, the cheekbones.",
      beginnerTip: "Keep the nose untouched here — the chin and forehead circles are doing the balancing work for your shape.",
    },
    contour: {
      zones: ["cheekboneShadow", "hollowCheeks"],
      where: "Sweep a single soft shadow following the natural contour of your face — one line running from the high point of your cheekbone down into your cheek. Then add a thinner contour in the hollow beneath your cheekbone, starting near your ear and fading out before your mouth.",
      why: "The line along the cheekbone's own curve softens its width naturally, and the added hollow-cheek contour deepens that effect right where your face is widest, without adding extra shape it doesn't need.",
      beginnerTip: "Follow the bone itself rather than drawing a separate shape, and keep the hollow contour thin and light — the goal is one continuous, natural-looking shadow, not two competing ones.",
    },
    blush: {
      zones: ["lowerCheeks"],
      where: "Apply blush starting slightly below your widest cheekbone point and blend outward. Avoid emphasizing the widest point itself.",
      why: "Placing blush lower (rather than right on the cheekbone's widest point) avoids drawing extra attention to where the face is already widest.",
      beginnerTip: "If your blush brush naturally lands on the apples, sweep it slightly downward before blending.",
    },
  },
  oblong: {
    goal: "Reduce perceived length.",
    highlight: {
      zones: ["noseBridge", "noseTip", "cheekTops"],
      where: "Keep highlight centered on your nose bridge and tip — short and compact — plus a touch on top of each cheekbone. Skip your forehead and chin entirely.",
      why: "A long vertical highlight running forehead-to-chin would elongate the face further, which is the opposite of what an already-long face needs.",
      beginnerTip: "Resist the urge to highlight a long center line — shorter and more contained is what works for your shape.",
    },
    concealer: {
      zones: ["underEyeTriangle"],
      where: "Brighten under your eyes with standard placement. Skip concealer on the nose.",
      why: "Keeping brightness off the nose avoids drawing the eye down its length, which would emphasize rather than counteract an already-long face.",
      beginnerTip: "Keep it simple here — the contour and blush are doing the heavy lifting for your shape.",
    },
    contour: {
      zones: ["hollowCheeks", "underChinCurve", "foreheadTopCurve"],
      where: "Two contour lines along the sides of your face (in the hollow beneath each cheekbone), a curved line under your chin, and a curved line along the top of your forehead near the hairline.",
      why: "Horizontal curves at the top and bottom of the face visually shorten it, while the side contour lines add definition without adding length.",
      beginnerTip: "Blend each curve horizontally, side to side, instead of up and down — that direction is what adds width and breaks up the length.",
    },
    blush: {
      zones: ["lowerCheeksCircle"],
      where: "Apply blush as a soft circle in the lower part of your cheek, below the apple.",
      why: "A contained circle low on the cheek adds width and fullness to the center of the face without lifting the eye upward, which would add length.",
      beginnerTip: "Keep it round and centered low on the cheek — resist the urge to drag it outward toward your ears.",
    },
  },
};

// Builds the four written recommendations (blush, contour, highlight, concealer)
// from the deterministic face-shape guide.
export function buildRecommendations(faceShape: FaceShape): MakeupRecommendation[] {
  const guide = FACE_SHAPE_GUIDE[faceShape];

  return [
    { type: "blush", ...guide.blush },
    { type: "contour", ...guide.contour },
    { type: "highlight", ...guide.highlight },
    { type: "concealer", ...guide.concealer },
  ];
}

export function getFaceShapeGoal(faceShape: FaceShape): string {
  return FACE_SHAPE_GUIDE[faceShape].goal;
}

export function buildOverlayZones(faceShape: FaceShape): OverlayZones {
  const guide = FACE_SHAPE_GUIDE[faceShape];
  return {
    highlightZones: guide.highlight.zones,
    contourZones: guide.contour.zones,
    concealerZones: guide.concealer.zones,
    blushZone: guide.blush.zones[0],
  };
}
