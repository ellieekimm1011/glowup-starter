// app/api/analyze/route.ts
// This is a SERVER-SIDE API route.
// The browser calls this endpoint, and this endpoint calls the AI model via OpenRouter.
// This keeps our OpenRouter API key secret (it never goes to the browser).

import { NextRequest, NextResponse } from "next/server";
import { analyzeFace } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

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

    // Call the AI model to analyze the face
    const analysis = await analyzeFace(imageBase64, mimeType);

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
