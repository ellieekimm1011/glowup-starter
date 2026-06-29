// app/api/analyze/route.ts
// This is a SERVER-SIDE API route.
// The browser calls this endpoint, and this endpoint calls the AI model via OpenRouter.
// This keeps our OpenRouter API key secret (it never goes to the browser).

import { NextRequest, NextResponse } from "next/server";
import { analyzeFace } from "@/lib/ai";
import type { FaceShape } from "@/types";

const FACE_SHAPES: FaceShape[] = ["oval", "round", "square", "heart", "diamond", "oblong"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, faceShape } = body;

    // Validate inputs
    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported image format. Please use JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // faceShape, when provided, comes from client-side landmark measurement
    // (lib/faceShapeClassifier.ts) rather than the AI guessing it — only
    // trust it if it's actually one of the known shapes.
    const knownFaceShape: FaceShape | undefined = FACE_SHAPES.includes(faceShape)
      ? faceShape
      : undefined;

    // Call the AI model to analyze the face
    const analysis = await analyzeFace(imageBase64, mimeType, knownFaceShape);

    // Return the analysis to the browser
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
