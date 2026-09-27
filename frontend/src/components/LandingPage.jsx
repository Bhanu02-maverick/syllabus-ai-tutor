import React from "react";
import { GraduationCap, ArrowRight } from "lucide-react";
import { MacbookScroll } from "./ui/MacbookScroll.jsx";

export default function LandingPage({ onNavigateLogin, onNavigateSignup }) {
  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* 1. Minimal Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: VCE AI Tutor Brand */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                VCE AI Tutor
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                PRO
              </span>
            </div>
          </div>

          {/* Right: Login & Get Started Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition cursor-pointer"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={onNavigateSignup}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-100 transition cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Hero Area with Dominant MacBook Scroll Animation */}
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div id="showcase" className="relative z-10 pt-4">
          <MacbookScroll
            src="/vce-app-preview.png"
            title={
              <div className="space-y-3 max-w-2xl mx-auto px-4">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Learn Smarter. <br />
                  <span className="text-indigo-600">Stay Syllabus-Bound.</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
                  An academic AI tutor grounded strictly in your university course curriculum,
                  featuring interactive concept mind maps and verified lecture citations.
                </p>
              </div>
            }
            badge={
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur border border-slate-700 text-white text-xs font-medium shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>VCE Syllabus Verified</span>
              </div>
            }
            showGradient={false}
          />
        </div>

        {/* 3. Below the MacBook: Focused Action Area */}
        <section className="relative z-20 -mt-16 sm:-mt-24 pb-20 px-4 text-center">
          <div className="max-w-xl mx-auto space-y-5 bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-3xl p-8 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ready to explore your course syllabus?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Study through visual concept hierarchies, practice unit quizzes, and resolve doubts with direct slide citations.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onNavigateSignup}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Log In
              </button>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 pt-2">
              Faculty-grounded RAG • Course syllabus bound • Zero hallucination risk
            </p>
          </div>
        </section>
      </main>

      {/* 4. Minimal Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 VCE AI Tutor • Syllabus-Bound Adaptive Learning</span>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-slate-500 hover:text-indigo-600 font-medium transition cursor-pointer"
          >
            Account Login →
          </button>
        </div>
      </footer>
    </div>
  );
}
