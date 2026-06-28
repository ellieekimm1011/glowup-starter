// components/makeup/FaceShapeCard.tsx
// Shows the detected face shape with a description.

import { getFaceShapeInfo } from "@/lib/utils";
import { getFaceShapeGoal } from "@/lib/makeupGuide";
import type { FaceAnalysis } from "@/types";

interface Props {
  analysis: FaceAnalysis;
}

export default function FaceShapeCard({ analysis }: Props) {
  const shapeInfo = getFaceShapeInfo(analysis.faceShape);

  return (
    <div className="bg-white/90 rounded-2xl p-6 card-shadow border border-nude-100">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-blush-100 rounded-2xl flex items-center justify-center text-2xl">
          {shapeInfo.emoji}
        </div>
        <div>
          <p className="text-xs font-semibold text-nude-400 uppercase tracking-widest mb-0.5">
            Your face shape
          </p>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            {shapeInfo.label}
          </h2>
        </div>
      </div>
      <p className="text-nude-600 leading-relaxed mb-3">{analysis.faceShapeDescription}</p>
      <p className="text-xs font-semibold text-blush-600 uppercase tracking-wider">
        Goal: <span className="font-normal text-nude-600 normal-case">{getFaceShapeGoal(analysis.faceShape)}</span>
      </p>
    </div>
  );
}
