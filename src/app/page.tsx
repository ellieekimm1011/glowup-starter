// app/page.tsx
// The landing page — the first thing visitors see at glowup.com

import Link from "next/link";
import { Sparkles, Camera, Brain, BookOpen, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Navigation */}
      <nav className="border-b border-nude-200/60 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blush-500" />
            <span className="font-display text-xl font-semibold tracking-tight">GlowUp</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-nude-700 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-blush-500 hover:bg-blush-600 text-white px-4 py-2 rounded-full transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blush-100 text-blush-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by AI
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Makeup made for
          <span className="text-blush-500 italic block">your face.</span>
        </h1>
        <p className="text-xl text-nude-700 max-w-2xl mx-auto mb-12 leading-relaxed">
          Upload a selfie and get a personalized makeup guide based on your
          unique facial features. No more generic tips — learn exactly what
          works for <em>you</em>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-blush-500 hover:bg-blush-600 text-white text-lg font-semibold px-8 py-4 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Analyze my face
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 border border-nude-300 text-nude-700 hover:border-nude-400 hover:text-gray-900 text-lg font-medium px-8 py-4 rounded-full transition-colors bg-white/60"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center text-gray-900 mb-4">
          How it works
        </h2>
        <p className="text-center text-nude-600 mb-16 max-w-xl mx-auto">
          Three steps from selfie to personalized beauty coach.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Camera,
              step: "01",
              title: "Upload a selfie",
              description:
                "Take or upload a clear photo of your face in good lighting. No makeup needed — we want to see the real you.",
            },
            {
              icon: Brain,
              step: "02",
              title: "AI analyzes your features",
              description:
                "Our AI identifies your face shape and key features to understand exactly what makeup techniques will flatter you.",
            },
            {
              icon: BookOpen,
              step: "03",
              title: "Get your personalized guide",
              description:
                "Receive step-by-step guidance on blush, contour, and highlight — plus handpicked tutorials for your face shape.",
            },
          ].map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="bg-white/80 rounded-2xl p-8 card-shadow border border-nude-100"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blush-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blush-600" />
                </div>
                <span className="font-display text-sm text-nude-400 font-semibold tracking-widest">
                  {step}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-nude-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Face shapes */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-center text-gray-900 mb-4">
          Every face shape, covered
        </h2>
        <p className="text-center text-nude-600 mb-12">
          We provide tailored guidance for all six face shapes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {["Oval", "Round", "Square", "Heart", "Diamond", "Oblong"].map((shape) => (
            <div
              key={shape}
              className="bg-white/80 border border-nude-200 rounded-full px-6 py-2.5 text-nude-700 font-medium card-shadow"
            >
              {shape}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-blush-500 rounded-3xl p-12 text-center text-white">
          <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-80" />
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to find your glow?
          </h2>
          <p className="text-blush-100 mb-8 max-w-md mx-auto">
            Join thousands of people who&apos;ve discovered makeup techniques
            that actually work for their unique features.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-blush-600 font-semibold px-8 py-4 rounded-full hover:bg-blush-50 transition-colors"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-nude-200 py-8 text-center text-nude-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blush-400" />
          <span className="font-display font-semibold text-gray-700">GlowUp</span>
        </div>
        <p>AI-powered makeup guidance tailored to your unique face.</p>
      </footer>
    </div>
  );
}
