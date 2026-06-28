// lib/utils.ts
// Small helper functions used across the app

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes without conflicts
// Usage: cn("px-4 py-2", isActive && "bg-blue-500")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert a File object to base64 string (needed for AI API)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result looks like: "data:image/jpeg;base64,/9j/4AAQ..."
      // We only want the part after the comma
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

// Format a date nicely (e.g., "June 26, 2026")
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Get emoji and color for each face shape
export function getFaceShapeInfo(shape: string): {
  emoji: string;
  color: string;
  label: string;
} {
  const map: Record<string, { emoji: string; color: string; label: string }> = {
    oval: { emoji: "🥚", color: "bg-blush-100 text-blush-700", label: "Oval" },
    round: { emoji: "🌕", color: "bg-nude-100 text-nude-700", label: "Round" },
    square: { emoji: "⬛", color: "bg-champagne-100 text-champagne-700", label: "Square" },
    heart: { emoji: "🫀", color: "bg-blush-100 text-blush-700", label: "Heart" },
    diamond: { emoji: "💎", color: "bg-nude-100 text-nude-700", label: "Diamond" },
    oblong: { emoji: "📏", color: "bg-champagne-100 text-champagne-700", label: "Oblong" },
  };
  return map[shape] ?? { emoji: "✨", color: "bg-gray-100 text-gray-700", label: shape };
}

// Get icon color for each makeup type
export function getMakeupTypeStyle(type: string): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    blush: {
      label: "Blush",
      color: "text-blush-700",
      bg: "bg-blush-50",
      border: "border-blush-200",
    },
    contour: {
      label: "Contour",
      color: "text-nude-700",
      bg: "bg-nude-50",
      border: "border-nude-200",
    },
    highlight: {
      label: "Highlight",
      color: "text-champagne-700",
      bg: "bg-champagne-50",
      border: "border-champagne-200",
    },
    concealer: {
      label: "Concealer",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  };
  return map[type] ?? { label: type, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" };
}
