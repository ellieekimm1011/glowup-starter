// app/layout.tsx
// This is the ROOT layout — it wraps every single page in the app.
// Think of it as the "shell" that stays constant as you navigate.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlowUp — AI Makeup Coach",
  description:
    "Personalized makeup guidance tailored to your unique facial features. Discover techniques that actually work for YOUR face.",
  keywords: ["makeup", "AI", "beauty", "facial analysis", "makeup tips"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-nude-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
