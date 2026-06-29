"use client";
// app/upload/page.tsx
// The selfie upload page. Users pick a photo and send it for analysis.

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Upload, X, Sparkles, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { uploadSelfie, saveAnalysis } from "@/lib/supabase";
import { fileToBase64 } from "@/lib/utils";
import { detectFaceLandmarks, loadImageFromFile } from "@/lib/faceLandmarks";
import { classifyFaceShape } from "@/lib/faceShapeClassifier";

// Measures face shape from landmarks instead of letting the AI guess it —
// returns null (rather than throwing) if no face could be detected, so the
// caller can fall back to the AI's own guess instead of blocking upload.
async function measureFaceShape(file: File) {
  try {
    const img = await loadImageFromFile(file);
    const landmarks = await detectFaceLandmarks(img);
    if (!landmarks) return null;
    return classifyFaceShape(landmarks, img.naturalWidth, img.naturalHeight);
  } catch (err) {
    console.error("Face shape measurement failed:", err);
    return null;
  }
}

type UploadState = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Handle file selection (from input or drag-drop)
  const handleFile = useCallback((selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.");
      return;
    }

    setError("");
    setFile(selectedFile);
    // Create a preview URL so the user can see their photo
    setPreview(URL.createObjectURL(selectedFile));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file || !user) return;

    try {
      setState("uploading");
      setError("");

      // Step 1: Upload image to Supabase Storage
      const imageUrl = await uploadSelfie(file, user.id);

      // Step 2: Measure face shape from landmarks, then convert image to
      // base64 for the AI API
      setState("analyzing");
      const faceShape = await measureFaceShape(file);
      const base64 = await fileToBase64(file);

      // Step 3: Call our API route to analyze with Claude
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
          faceShape,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const { analysis } = await response.json();

      // Step 4: Save results to Supabase database
      const saved = await saveAnalysis(
        user.id,
        imageUrl,
        analysis.faceShape,
        analysis
      );

      setState("done");
      // Step 5: Redirect to results page
      router.push(`/analysis?id=${saved.id}`);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const stateLabel: Record<UploadState, string> = {
    idle: "Analyze my face",
    uploading: "Uploading photo…",
    analyzing: "AI is analyzing your features…",
    done: "Done! Redirecting…",
    error: "Try again",
  };

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Upload your selfie
          </h1>
          <p className="text-nude-600 max-w-md mx-auto">
            Take or choose a clear, well-lit photo of your face looking directly at the camera.
            No makeup needed — we want to see your natural features!
          </p>
        </div>

        {/* Tips */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { emoji: "☀️", tip: "Good lighting" },
            { emoji: "👁️", tip: "Look straight ahead" },
            { emoji: "📏", tip: "Full face visible" },
          ].map(({ emoji, tip }) => (
            <div key={tip} className="bg-white/70 border border-nude-100 rounded-xl py-3 text-center text-sm">
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-nude-600 font-medium text-xs">{tip}</div>
            </div>
          ))}
        </div>

        {/* Upload area */}
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-blush-400 bg-blush-50"
                : "border-nude-200 hover:border-blush-300 hover:bg-nude-50"
            }`}
          >
            <div className="w-16 h-16 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-blush-500" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">
              Drop your photo here or click to browse
            </p>
            <p className="text-nude-400 text-sm">JPG, PNG or WebP — up to 10MB</p>
          </div>
        ) : (
          /* Preview */
          <div className="relative bg-white rounded-2xl overflow-hidden card-shadow border border-nude-100">
            <div className="relative aspect-square">
              <Image src={preview} alt="Your selfie preview" fill className="object-cover" />
            </div>
            <button
              onClick={removeFile}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Analyze button */}
        {file && state !== "done" && (
          <button
            onClick={handleAnalyze}
            disabled={state !== "idle" && state !== "error"}
            className="mt-6 w-full bg-blush-500 hover:bg-blush-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all hover:shadow-md flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {stateLabel[state]}
          </button>
        )}

        {/* Analysis progress indicator */}
        {(state === "uploading" || state === "analyzing") && (
          <div className="mt-4 bg-white/80 rounded-xl p-4 border border-nude-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blush-500 rounded-full animate-pulse" />
              <p className="text-sm text-nude-600">
                {state === "uploading"
                  ? "Uploading your photo securely…"
                  : "Claude AI is analyzing your facial features — this takes about 15–20 seconds…"}
              </p>
            </div>
          </div>
        )}

        {/* Upload a different photo link */}
        {preview && state === "idle" && (
          <button
            onClick={removeFile}
            className="mt-3 w-full text-center text-sm text-nude-500 hover:text-nude-700 transition-colors flex items-center justify-center gap-1.5 py-2"
          >
            <Upload className="w-4 h-4" />
            Choose a different photo
          </button>
        )}
      </div>
    </div>
  );
}
