"use client";
// app/debug-overlay/page.tsx
// Temporary dev tool: preview how the makeup overlay differs across all six
// face shapes using one of your real uploaded photos as the canvas. Safe to
// delete once you're done comparing — not linked from anywhere in the app.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import FaceOverlay from "@/components/makeup/FaceOverlay";
import MakeupGuideSection from "@/components/makeup/MakeupGuideSection";
import { useAuth } from "@/hooks/useAuth";
import { getUserAnalyses, getSelfieUrl } from "@/lib/supabase";
import { buildOverlayZones, buildRecommendations, getFaceShapeGoal } from "@/lib/makeupGuide";
import type { FaceShape, StoredAnalysis } from "@/types";

const FACE_SHAPES: FaceShape[] = ["oval", "round", "square", "heart", "diamond", "oblong"];

export default function DebugOverlayPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [faceShape, setFaceShape] = useState<FaceShape>("oval");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getUserAnalyses(user.id).then((data) => {
      setAnalyses(data);
      if (data.length > 0) setAnalysisId(data[0].id);
    });
  }, [user]);

  const selected = analyses.find((a) => a.id === analysisId);

  // The stored "image_url" is actually a storage path — signed URLs expire
  // after an hour, so a fresh one is fetched whenever the selected photo changes.
  useEffect(() => {
    if (!selected) return;
    setImageUrl(null);
    setImageError("");
    getSelfieUrl(selected.image_url)
      .then(setImageUrl)
      .catch(() => setImageError("Could not load this photo — it may need to be re-uploaded."));
  }, [selected]);

  if (loading || !user) return null;

  const recommendations = buildRecommendations(faceShape);
  const overlayZones = buildOverlayZones(faceShape);

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Overlay debug preview</h1>
          <p className="text-nude-600 text-sm">
            Pick a photo and a face shape to see how placement differs — not linked anywhere in the app.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            <span className="block text-nude-500 mb-1">Photo</span>
            <select
              value={analysisId}
              onChange={(e) => setAnalysisId(e.target.value)}
              className="border border-nude-200 rounded-lg px-3 py-2"
            >
              {analyses.length === 0 && <option>No analyses yet — upload one first</option>}
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.created_at).toLocaleString()} ({a.face_shape})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-nude-500 mb-1">Face shape to preview</span>
            <select
              value={faceShape}
              onChange={(e) => setFaceShape(e.target.value as FaceShape)}
              className="border border-nude-200 rounded-lg px-3 py-2 capitalize"
            >
              {FACE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selected ? (
          <>
            <p className="text-sm text-nude-500">
              Goal for <span className="font-semibold capitalize">{faceShape}</span>: {getFaceShapeGoal(faceShape)}
            </p>
            {imageUrl ? (
              <FaceOverlay
                imageUrl={imageUrl}
                recommendations={recommendations}
                overlayZones={overlayZones}
              />
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center text-nude-500 text-sm border border-nude-100">
                {imageError || "Loading photo…"}
              </div>
            )}
            <MakeupGuideSection recommendations={recommendations} />
          </>
        ) : (
          <p className="text-nude-500">Upload a photo first at /upload, then come back here.</p>
        )}
      </div>
    </div>
  );
}
