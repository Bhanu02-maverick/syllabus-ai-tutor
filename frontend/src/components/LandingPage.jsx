import React from "react";
import {
  GraduationCap,
  ArrowRight,
  UserPlus,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  Network,
  BookMarked,
  Clock,
  Target,
  ShieldCheck,
} from "lucide-react";
import { MacbookScroll } from "./ui/MacbookScroll.jsx";

const STUDENT_STEPS = [
  { icon: UserPlus, title: "Sign up & pick your course", desc: "Create a student account and choose your subject and professor." },
  { icon: BookOpen, title: "Open a unit", desc: "Your faculty has already uploaded the notes. Pick the unit you're studying." },
  { icon: MessageSquare, title: "Ask your doubts", desc: "Ask in your own words. Every answer comes from your notes and shows the page it came from." },
  { icon: ClipboardCheck, title: "Practise & track", desc: "Take quizzes and mock exams. Your dashboard shows which units need more work." },
];

const FEATURES = [
  { icon: MessageSquare, title: "Doubt solving", desc: "Exam-style or analogy explanations, with page references." },
  { icon: Network, title: "Mind maps", desc: "See how every topic in a unit connects. Click a topic to learn it." },
  { icon: BookMarked, title: "Revision notes", desc: "One-click summary notes for last-minute revision." },
  { icon: ClipboardCheck, title: "Adaptive quizzes", desc: "Questions get harder or easier based on your answers." },
  { icon: Clock, title: "Timed mock exams", desc: "Practise under real exam conditions across several units." },
  { icon: Target, title: "Weak-topic finder", desc: "Find what to study next and get a day-by-day study plan." },
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

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

          {/* Center: Section links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button type="button" onClick={() => scrollTo("features")} className="hover:text-indigo-600 transition cursor-pointer">Features</button>
            <button type="button" onClick={() => scrollTo("how-it-works")} className="hover:text-indigo-600 transition cursor-pointer">How it works</button>
            <button type="button" onClick={() => scrollTo("about")} className="hover:text-indigo-600 transition cursor-pointer">About</button>
          </nav>

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
                  Your AI study companion built on your actual syllabus. Ask doubts, explore mind maps,
                  revise with notes and practise with quizzes and mock exams — all in one place.
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

        {/* Sections below sit on an opaque layer so the laptop's scroll animation slides behind them */}
        <div className="relative z-30 bg-[#FBFBFC] pt-16 border-t border-slate-200/80">
        {/* 3. How it works for students */}
        <section id="how-it-works" className="relative z-20 px-4 pb-20 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">How it works</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
                Start studying in four steps
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STUDENT_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Features */}
        <section id="features" className="relative z-20 px-4 pb-20 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Features</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
                Everything you need before an exam
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-3 bg-white border border-slate-200/90 rounded-2xl p-5">
                    <div className="p-2 h-fit rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. About */}
        <section id="about" className="relative z-20 px-4 pb-20 scroll-mt-20">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-5 items-start bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 sm:p-8">
            <div className="p-3 rounded-2xl bg-white text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Why you can trust the answers</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                Generic chatbots answer from the whole internet. VCE AI Tutor only reads the notes your faculty
                uploaded for your course. If your question isn't covered by the syllabus, it tells you so instead
                of guessing — and every answer shows the page it was taken from, so you can check it yourself.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Focused Action Area */}
        <section className="relative z-20 pb-20 px-4 text-center">
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
              Answers only from your course notes • Page references on every answer
            </p>
          </div>
        </section>
        </div>
      </main>

      {/* 7. Minimal Footer */}
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
