// ============================================================
// CORE TYPES — every important data shape in the app
// ============================================================

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong";

// A single makeup recommendation
export interface MakeupRecommendation {
  type: "blush" | "contour" | "highlight" | "concealer";
  where: string;        // Where/how exactly to apply it
  why: string;          // Why it works for this face shape
  beginnerTip: string;  // Practical tip for beginners
}

// A recommended tutorial (YouTube or similar)
export interface TutorialRecommendation {
  title: string;
  creator: string;
  whyItFits: string;    // Why it matches this user's face shape/level
  summary: string;
}

// Named facial regions the overlay can shade. Which ones apply is looked up
// deterministically per face shape (see lib/makeupGuide.ts) rather than left
// to the AI to decide. Highlight is restricted to the nose and cheek tops for
// every face shape, with "jawSides" as the one explicit exception (heart,
// to widen the lower half of the face).
export type HighlightZone = "noseBridge" | "noseTip" | "cheekTops" | "jawSides";
export type ContourZone = "temples" | "hollowCheeks" | "jawline" | "underChinCurve" | "foreheadTopCurve" | "cheekboneShadow";
export type ConcealerZone = "underEyeTriangle" | "centerFace" | "jawSides" | "chinCircle" | "foreheadCircle";
export type BlushZone = "apples" | "higherCheeks" | "applesCircular" | "centerCheeks" | "lowerCheeks" | "horizontalCheeks" | "upperCheekCircle" | "lowerCheeksCircle";

// Where on the photo to draw the makeup overlay zones. Separate from
// `recommendations` (which is prose for the written guide) because the
// overlay needs machine-readable positions, not free text.
export interface OverlayZones {
  highlightZones: HighlightZone[];
  contourZones: ContourZone[];
  concealerZones: ConcealerZone[];
  blushZone: BlushZone;
}

// The full analysis result from the AI
export interface FaceAnalysis {
  faceShape: FaceShape;
  faceShapeDescription: string;  // Short explanation of what defines this shape
  recommendations: MakeupRecommendation[];
  tutorials: TutorialRecommendation[];
  overlayZones: OverlayZones;
}

// Stored in Supabase face_analyses table.
// NOTE: despite the name, `image_url` holds a Supabase Storage *path*, not a
// ready-to-use URL — signed URLs expire after an hour, so one is generated
// fresh (via lib/supabase.ts getSelfieUrl) whenever the photo is displayed.
export interface StoredAnalysis {
  id: string;
  user_id: string;
  image_url: string;
  face_shape: FaceShape;
  analysis_data: FaceAnalysis;
  created_at: string;
}

// User profile from Supabase profiles table
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
