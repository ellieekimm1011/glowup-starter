// components/makeup/MakeupGuideSection.tsx
// Shows the three makeup recommendations (blush, contour, highlight)
// in an easy-to-read card layout.

import { MapPin, HelpCircle, Lightbulb } from "lucide-react";
import { getMakeupTypeStyle } from "@/lib/utils";
import type { MakeupRecommendation } from "@/types";

interface Props {
  recommendations: MakeupRecommendation[];
}

// Icons for each makeup type
const typeIcons: Record<string, string> = {
  blush: "🌸",
  contour: "🎨",
  highlight: "✨",
  concealer: "🩹",
};

export default function MakeupGuideSection({ recommendations }: Props) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
        Your Personalized Makeup Guide
      </h2>
      <p className="text-nude-600 mb-6">
        Techniques tailored specifically for your face shape.
      </p>

      <div className="space-y-5">
        {recommendations.map((rec) => {
          const style = getMakeupTypeStyle(rec.type);
          return (
            <div
              key={rec.type}
              className={`border rounded-2xl p-6 ${style.bg} ${style.border}`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{typeIcons[rec.type]}</span>
                <h3 className={`font-display text-xl font-bold ${style.color}`}>
                  {style.label}
                </h3>
              </div>

              {/* Three info blocks */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Where to apply */}
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className={`w-4 h-4 ${style.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                      Where to apply
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{rec.where}</p>
                </div>

                {/* Why it works */}
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle className={`w-4 h-4 ${style.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                      Why it works
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{rec.why}</p>
                </div>

                {/* Beginner tip */}
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className={`w-4 h-4 ${style.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                      Beginner tip
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{rec.beginnerTip}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
