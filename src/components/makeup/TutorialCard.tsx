// components/makeup/TutorialCard.tsx
// Shows a single recommended tutorial with creator info.

import { PlayCircle, User } from "lucide-react";
import type { TutorialRecommendation } from "@/types";

interface Props {
  tutorial: TutorialRecommendation;
  index: number;
}

export default function TutorialCard({ tutorial, index }: Props) {
  // Build a YouTube search URL for this tutorial
  const searchQuery = encodeURIComponent(`${tutorial.title} ${tutorial.creator} makeup tutorial`);
  const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/80 border border-nude-100 rounded-2xl p-5 hover:border-blush-200 hover:shadow-md transition-all card-shadow group"
    >
      <div className="flex items-start gap-4">
        {/* Number badge */}
        <div className="w-8 h-8 bg-blush-100 text-blush-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blush-700 transition-colors">
            {tutorial.title}
          </h3>

          {/* Creator */}
          <div className="flex items-center gap-1.5 text-nude-500 text-sm mb-2">
            <User className="w-3.5 h-3.5" />
            <span>{tutorial.creator}</span>
          </div>

          {/* Why it fits */}
          <div className="bg-blush-50 border border-blush-100 rounded-lg px-3 py-2 text-xs text-blush-700 font-medium mb-3">
            {tutorial.whyItFits}
          </div>

          {/* Summary */}
          <p className="text-nude-600 text-sm leading-relaxed">{tutorial.summary}</p>
        </div>

        {/* Play icon */}
        <PlayCircle className="w-5 h-5 text-nude-300 group-hover:text-blush-400 transition-colors shrink-0 mt-1" />
      </div>
    </a>
  );
}
