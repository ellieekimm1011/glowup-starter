// lib/ai.ts
// This file handles all communication with the AI API (via OpenRouter).
// It sends the user's selfie and gets back facial analysis + makeup tips.
//
// NOTE: This file runs on the SERVER (in API routes), not the browser.
// That's why the API key is safe here — users can't see server code.

import type { FaceAnalysis, FaceShape } from "@/types";
import { buildOverlayZones, buildRecommendations } from "@/lib/makeupGuide";

// What we actually need the AI to determine from the photo — placement
// itself is looked up deterministically afterward (see lib/makeupGuide.ts),
// since that needs to be 100% consistent and free models are not reliable
// enough to be trusted with it.
interface AIShapeAnalysis {
  faceShape: FaceShape;
  faceShapeDescription: string;
  tutorials: FaceAnalysis["tutorials"];
}

// Free, vision-capable models on OpenRouter, tried in order — free models get
// deprecated/rate-limited often, so we fall back rather than depend on just one.
// See https://openrouter.ai/models?max_price=0
const MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
];

// The main function: takes an image (as base64) and returns full analysis
export async function analyzeFace(imageBase64: string, mimeType: string): Promise<FaceAnalysis> {
  const prompt = `You are an expert makeup artist and beauty coach with 15+ years of experience.
Analyze this facial photo carefully and identify this person's face shape.

Respond with ONLY a valid JSON object (no markdown, no explanation outside the JSON) in this exact format:

{
  "faceShape": "oval|round|square|heart|diamond|oblong",
  "faceShapeDescription": "2-3 sentences describing this person's face shape and its key characteristics",
  "tutorials": [
    {
      "title": "Specific tutorial title appropriate for this face shape",
      "creator": "YouTube creator name known for makeup tutorials",
      "whyItFits": "Why this specific tutorial is perfect for this face shape and beginner level",
      "summary": "2-3 sentence description of what the tutorial covers and what the viewer will learn"
    },
    {
      "title": "Second tutorial title",
      "creator": "Creator name",
      "whyItFits": "Why it fits",
      "summary": "Summary"
    },
    {
      "title": "Third tutorial title",
      "creator": "Creator name",
      "whyItFits": "Why it fits",
      "summary": "Summary"
    }
  ]
}

Be warm, encouraging, and specific. Use beginner-friendly language.`;

  let lastError = "No text response from AI";

  for (const model of MODELS) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      lastError = `OpenRouter request failed (${response.status}): ${await response.text()}`;
      console.error(`[analyzeFace] ${model} failed:`, lastError);
      continue;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      lastError = "No text response from AI";
      console.error(`[analyzeFace] ${model} returned no content:`, JSON.stringify(data));
      continue;
    }

    // Some models wrap JSON in markdown code fences despite instructions — strip those.
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    try {
      const shapes = JSON.parse(cleaned) as AIShapeAnalysis;
      console.log(`[analyzeFace] ${model} succeeded`);
      return {
        faceShape: shapes.faceShape,
        faceShapeDescription: shapes.faceShapeDescription,
        tutorials: shapes.tutorials,
        recommendations: buildRecommendations(shapes.faceShape),
        overlayZones: buildOverlayZones(shapes.faceShape),
      };
    } catch {
      lastError = "AI returned invalid JSON. Please try again.";
      console.error(`[analyzeFace] ${model} returned non-JSON content:`, text);
    }
  }

  throw new Error(lastError);
}
