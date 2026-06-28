"use client";
// app/profile/page.tsx
// Shows the user's profile info and their analysis history.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { getUserAnalyses } from "@/lib/supabase";
import { formatDate, getFaceShapeInfo } from "@/lib/utils";
import type { StoredAnalysis } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserAnalyses(user.id).then(setAnalyses).catch(console.error);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center">
        <div className="text-nude-400 text-sm">Loading…</div>
      </div>
    );
  }

  const joinDate = user.created_at ? formatDate(user.created_at) : "Unknown";
  const displayName = user.user_metadata?.full_name || user.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Count each face shape detected
  const shapeCount: Record<string, number> = {};
  analyses.forEach((a) => {
    shapeCount[a.face_shape] = (shapeCount[a.face_shape] || 0) + 1;
  });
  const mostCommonShape = Object.entries(shapeCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Profile header */}
        <div className="bg-white/90 rounded-2xl p-8 card-shadow border border-nude-100 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 bg-blush-100 rounded-full flex items-center justify-center text-blush-600 font-display text-2xl font-bold mx-auto mb-4">
            {initials}
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
            {user.user_metadata?.full_name || "Your Profile"}
          </h1>
          <p className="text-nude-500 text-sm">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: Sparkles,
              label: "Analyses",
              value: analyses.length,
            },
            {
              icon: User,
              label: "Face shape",
              value: mostCommonShape
                ? getFaceShapeInfo(mostCommonShape).label
                : "—",
            },
            {
              icon: Calendar,
              label: "Member since",
              value: joinDate.split(",")[0], // Just "June 26" part
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-white/80 rounded-2xl p-4 card-shadow border border-nude-100 text-center"
            >
              <Icon className="w-5 h-5 text-blush-400 mx-auto mb-2" />
              <div className="font-display font-bold text-gray-900 text-lg leading-tight">
                {value}
              </div>
              <div className="text-nude-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-white/90 rounded-2xl card-shadow border border-nude-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-nude-100">
            <h2 className="font-display font-bold text-gray-900">Account details</h2>
          </div>
          <div className="divide-y divide-nude-50">
            {[
              { icon: User, label: "Name", value: user.user_metadata?.full_name || "Not set" },
              { icon: Mail, label: "Email", value: user.email || "" },
              { icon: Calendar, label: "Joined", value: joinDate },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-4">
                <Icon className="w-4 h-4 text-nude-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-nude-400 font-medium mb-0.5">{label}</div>
                  <div className="text-gray-700 text-sm truncate">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis history */}
        {analyses.length > 0 && (
          <div className="bg-white/90 rounded-2xl card-shadow border border-nude-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-nude-100">
              <h2 className="font-display font-bold text-gray-900">Analysis history</h2>
            </div>
            <div className="divide-y divide-nude-50">
              {analyses.map((analysis) => {
                const shapeInfo = getFaceShapeInfo(analysis.face_shape);
                return (
                  <a
                    key={analysis.id}
                    href={`/analysis?id=${analysis.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-nude-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{shapeInfo.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {shapeInfo.label} face
                        </div>
                        <div className="text-xs text-nude-400">
                          {formatDate(analysis.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className="text-nude-300 group-hover:text-blush-400 text-sm transition-colors">
                      View →
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
