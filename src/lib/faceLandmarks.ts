// lib/faceLandmarks.ts
// Runs face landmark detection entirely in the browser (MediaPipe), so we
// can place makeup overlay zones at the user's actual cheeks/forehead/jaw.

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface NormalizedPoint {
  x: number; // 0–1, relative to image width
  y: number; // 0–1, relative to image height
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    ).then((fileset) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      })
    );
  }
  return landmarkerPromise;
}

// Detects the first face in an image and returns its 478 normalized landmarks.
// Returns null if no face was found.
export async function detectFaceLandmarks(
  image: HTMLImageElement
): Promise<NormalizedPoint[] | null> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);
  const landmarks = result.faceLandmarks[0];
  return landmarks ?? null;
}

// Loads a File into an HTMLImageElement so it can be passed to
// detectFaceLandmarks — needed when measuring face shape ahead of upload,
// before any <img> for the photo exists in the DOM.
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

// Key landmark indices used to position makeup zones.
// Reference: MediaPipe Face Mesh 468-point topology.
export const LANDMARKS = {
  foreheadCenter: 10,
  glabella: 151, // between eyebrows
  noseBridge: 6,
  noseTip: 1,
  chin: 152,
  rightCheekApple: 116,
  leftCheekApple: 345,
  rightCheekTop: 117,
  leftCheekTop: 346,
  rightFaceEdge: 234,
  leftFaceEdge: 454,
  rightTemple: 127,
  leftTemple: 356,
  rightJaw: 58,
  leftJaw: 288,
  rightJawLower: 172,
  leftJawLower: 397,
  rightEyeInner: 133,
  rightEyeOuter: 33,
  leftEyeInner: 362,
  leftEyeOuter: 263,
} as const;
