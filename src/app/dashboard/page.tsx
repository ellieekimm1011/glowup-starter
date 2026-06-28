"use client";
// app/dashboard/page.tsx
// The main page users see after logging in.
// Shows their previous analyses and a prompt to do a new one.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Sparkles, ChevronRight, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getUserAnalyses } from "@/lib/supabase";
import { getFaceShapeInfo, formatDate } from "@/lib/utils";
import type { StoredAnalysis } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Load previous analyses
  useEffect(() => {
    if (user) {
      getUserAnalyses(user.id)
        .then(setAnalyses)
        .catch(console.error)
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center">
        <div className="text-nude-400 text-sm">Loading…</div>
      </div>
    );
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
            Hi, {firstName} ✨
          </h1>
          <p className="text-nude-600">
            {analyses.length === 0
              ? "Ready for your personalized makeup guide? Upload a selfie to get started."
              : `You have ${analyses.length} analysis${analyses.length === 1 ? "" : " results"}. Upload a new selfie to get fresh recommendations.`}
          </p>
        </div>

        {/* New analysis CTA */}
        <Link
          href="/upload"
          className="block bg-blush-500 hover:bg-blush-600 text-white rounded-2xl p-6 mb-10 transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {analyses.length === 0 ? "Start your first analysis" : "New face analysis"}
                </div>
                <div className="text-blush-100 text-sm">
                  Upload a selfie to get personalized makeup guidance
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Previous analyses */}
        {loadingData ? (
          <div className="text-center py-12 text-nude-400 text-sm">Loading your analyses…</div>
        ) : analyses.length > 0 ? (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-nude-400" />
              Previous analyses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {analyses.map((analysis) => {
                const shapeInfo = getFaceShapeInfo(analysis.face_shape);
                return (
                  <Link
                    key={analysis.id}
                    href={`/analysis?id=${analysis.id}`}
                    className="bg-white/80 border border-nude-100 rounded-2xl p-5 hover:border-blush-200 hover:shadow-md transition-all card-shadow group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${shapeInfo.color}`}>
                        <span>{shapeInfo.emoji}</span>
                        {shapeInfo.label} face
                      </span>
                      <ChevronRight className="w-4 h-4 text-nude-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs text-nude-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      {formatDate(analysis.created_at)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-nude-100">
            <Sparkles className="w-8 h-8 text-blush-300 mx-auto mb-3" />
            <p className="text-nude-500 font-medium">No analyses yet</p>
            <p className="text-nude-400 text-sm mt-1">
              Upload your first selfie above to get personalized makeup tips.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
