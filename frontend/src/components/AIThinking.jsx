import React from "react";
import { Sparkles, CheckCircle2, Loader2, Database, Search, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIThinking({ isDark, step = 3, message = "Retrieving syllabus context..." }) {
  const steps = [
    { id: 1, label: "Querying ChromaDB Vector Store", icon: Database },
    { id: 2, label: "Matching Unit & Subtopic Citations", icon: Search },
    { id: 3, label: "Synthesizing Syllabus-Bound Response", icon: Brain },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-5 rounded-2xl border shadow-lg backdrop-blur-md overflow-hidden relative ${
        isDark
          ? "bg-slate-900/90 border-indigo-500/30 text-slate-200"
          : "bg-white/95 border-blue-200 text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md">
          <Sparkles className="w-5 h-5 animate-spin" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">AI Knowledge Engine Active</h4>
          <p className="text-xs opacity-70 font-mono">{message}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {steps.map((st, idx) => {
          const isDone = step > st.id;
          const isCurrent = step === st.id;
          const Icon = st.icon;

          return (
            <motion.div
              key={st.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                isDone
                  ? isDark
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : isCurrent
                  ? isDark
                    ? "bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-sm"
                    : "bg-blue-50 border-blue-300 text-blue-800 shadow-sm"
                  : isDark
                  ? "bg-slate-950/40 border-slate-800 text-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{st.label}</span>
              </div>

              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
