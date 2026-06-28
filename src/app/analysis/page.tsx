"use client";
// app/analysis/page.tsx
// Shows the full facial analysis results:
// - Detected face shape
// - Personalized makeup guide (blush, contour, highlight)
// - Recommended tutorials

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import FaceShapeCard from "@/components/makeup/FaceShapeCard";
import FaceOverlay from "@/components/makeup/FaceOverlay";
import MakeupGuideSection from "@/components/makeup/MakeupGuideSection";
import TutorialCard from "@/components/makeup/TutorialCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getSelfieUrl } from "@/lib/supabase";
import { buildOverlayZones } from "@/lib/makeupGuide";
import type { StoredAnalysis } from "@/types";

export default function AnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const analysisId = searchParams.get("id");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Load the analysis from Supabase
  useEffect(() => {
    if (!user || !analysisId) return;

    supabase
      .from("face_analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id) // Security: only load the user's own data
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Analysis not found.");
          setLoadingData(false);
          return;
        }
        setAnalysis(data);
        getSelfieUrl(data.image_url)
          .then(setImageUrl)
          .catch(() => setImageError("Could not load your photo — it may need to be re-uploaded."))
          .finally(() => setLoadingData(false));
      });
  }, [user, analysisId]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-warm-gradient">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blush-300 border-t-blush-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-nude-500 text-sm">Loading your results…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-warm-gradient">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-nude-500 mb-4">{error || "Analysis not found."}</p>
          <Link href="/upload" className="text-blush-600 hover:text-blush-700 font-medium">
            ← Try a new analysis
          </Link>
        </div>
      </div>
    );
  }

  const analysisData = analysis.analysis_data;

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-nude-500 hover:text-gray-700 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
            Your Makeup Analysis ✨
          </h1>
          <p className="text-nude-600">
            Personalized guidance based on your unique facial features.
          </p>
        </div>

        {/* Face shape card */}
        <FaceShapeCard analysis={analysisData} />

        {/* Visual makeup placement on the actual photo */}
        {imageUrl ? (
          <FaceOverlay
            imageUrl={imageUrl}
            recommendations={analysisData.recommendations}
            overlayZones={analysisData.overlayZones ?? buildOverlayZones(analysisData.faceShape)}
          />
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center text-nude-500 text-sm border border-nude-100">
            {imageError || "Loading your photo…"}
          </div>
        )}

        {/* Makeup guide */}
        <MakeupGuideSection recommendations={analysisData.recommendations} />

        {/* Tutorial recommendations */}
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Tutorials For You
          </h2>
          <p className="text-nude-600 mb-6">
            These tutorials are picked specifically for your face shape and beginner level.
          </p>
          <div className="space-y-4">
            {analysisData.tutorials.map((tutorial, i) => (
              <TutorialCard key={i} tutorial={tutorial} index={i} />
            ))}
          </div>
        </div>

        {/* New analysis CTA */}
        <div className="border-t border-nude-200 pt-8 text-center">
          <p className="text-nude-500 text-sm mb-4">Want to try with a different photo?</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-blush-500 hover:bg-blush-600 text-white font-semibold px-6 py-3 rounded-full transition-all hover:shadow-md"
          >
            <Camera className="w-4 h-4" />
            New analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
