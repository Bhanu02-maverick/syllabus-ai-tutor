import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Brain, Network, Zap } from "lucide-react";

export default function WorkspaceHero({ onEnterWorkspace, isDark = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-12 rounded-3xl border overflow-hidden transition-colors duration-500 z-10 ${
        isDark
          ? "bg-slate-950/80 border-slate-800/80 shadow-2xl shadow-indigo-950/30"
          : "bg-white/90 border-slate-200/90 shadow-2xl shadow-slate-200/50"
      }`}
    >
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-600/20 via-purple-500/20 to-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Central Pulsing Focal Node */}
      <div className="relative mb-8 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-32 h-32 rounded-full border-2 border-indigo-500/40 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute w-48 h-48 rounded-full border border-cyan-500/30 pointer-events-none"
        />
        <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition border ${
          isDark
            ? "bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 border-indigo-500/50 text-indigo-400 shadow-indigo-500/20"
            : "bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 border-blue-400 text-white shadow-blue-500/30"
        }`}>
          <Sparkles className="w-10 h-10 animate-bounce" />
        </div>
      </div>

      {/* Tagline Badge */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-6 ${
          isDark
            ? "bg-indigo-950/60 border-indigo-700/50 text-indigo-300"
            : "bg-indigo-50 border-indigo-200 text-indigo-700"
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
        <span>VCE AI Tutor · Animated Knowledge Workspace</span>
      </motion.div>

      {/* Main Title Typography */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-none mb-6 ${
          isDark ? "text-white" : "text-slate-950"
        }`}
      >
        YOUR SYLLABUS IS A{" "}
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          KNOWLEDGE NETWORK.
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={`text-base sm:text-lg max-w-2xl mb-10 font-medium ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Explore concepts as an interactive neural graph. Ask syllabus-bound questions, generate AI revision notes, master weak topics with adaptive quizzes, and track your constellation progress.
      </motion.p>

      {/* Key Features Quick Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mb-10"
      >
        {[
          { icon: Network, title: "Interactive Graph", desc: "SVG concept node maps" },
          { icon: Brain, title: "Syllabus RAG AI", desc: "Verifiable textbook answers" },
          { icon: Sparkles, title: "Constellation XP", desc: "Gamified learning path" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-left transition ${
                isDark
                  ? "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/50"
                  : "bg-slate-50/80 border-slate-200/80 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <Icon className="w-4 h-4 text-indigo-400" />
                <h4 className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {item.title}
                </h4>
              </div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {item.desc}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Enter Workspace Action CTA */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onEnterWorkspace}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
      >
        <span>Enter Knowledge Workspace</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  );
}
