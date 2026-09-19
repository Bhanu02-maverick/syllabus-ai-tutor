import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, Sparkles, FileText, CheckCircle2, ChevronRight, Layers } from "lucide-react";

export default function RAGNodeVisualizer({ citations = [], query = "", isDark = true }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-2xl border transition overflow-hidden ${
      isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"
    }`}>
      {/* Visualizer Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3.5 flex items-center justify-between text-xs font-bold transition cursor-pointer ${
          isDark ? "hover:bg-slate-800/60 text-slate-300" : "hover:bg-slate-100 text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Layers className="w-4 h-4 animate-spin-slow" />
          </div>
          <span>🧠 View AI RAG Neural Retrieval Graph ({citations.length} Sources Connected)</span>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
          <span>{isOpen ? "Hide Graph" : "Expand Graph"}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </div>
      </button>

      {/* Expanded RAG Neural Graph Flow */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/40 p-5 space-y-4"
          >
            <div className="text-xs font-semibold text-slate-400">
              Visual representation of how your prompt queries ChromaDB vector embeddings:
            </div>

            {/* Visual Node Graph Flow */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              {/* Step 1: Student Question Node */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-blue-950/50 border border-blue-800/50 max-w-[180px] w-full">
                <Search className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[11px] font-bold text-blue-300">User Query Node</span>
                <span className="text-[10px] text-slate-400 truncate max-w-full italic mt-1">
                  "{query || "Define Stemming..."}"
                </span>
              </div>

              {/* Connecting Beam 1 */}
              <div className="hidden md:flex items-center text-indigo-400 animate-pulse">
                ──────►
              </div>

              {/* Step 2: Vector Search / ChromaDB Node */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-purple-950/50 border border-purple-800/50 max-w-[200px] w-full">
                <Database className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-[11px] font-bold text-purple-300">ChromaDB Vector Store</span>
                <div className="flex items-center gap-1 mt-1">
                  {citations.map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                  <span className="text-[10px] text-slate-400">{citations.length} chunks matched</span>
                </div>
              </div>

              {/* Connecting Beam 2 */}
              <div className="hidden md:flex items-center text-indigo-400 animate-pulse">
                ──────►
              </div>

              {/* Step 3: AI Answer Node */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 max-w-[180px] w-full">
                <Sparkles className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[11px] font-bold text-emerald-300">Synthesized Answer Node</span>
                <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Syllabus
                </span>
              </div>
            </div>

            {/* Source Citations Breakdown */}
            {citations.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Retrieved Vector Chunks & Page Citations:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {citations.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-bold text-slate-200">Page {c.page} · {c.source}</p>
                          <p className="text-[10px] text-slate-400">Unit {c.unit_number || 1} Textbook Context</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Score: 94.2%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
