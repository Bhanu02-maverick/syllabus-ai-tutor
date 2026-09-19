import React, { useState } from "react";
import { Sparkles, X, Loader2, BookOpen, Lightbulb, Target, MessageSquare, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { preprocessLaTeX } from "../utils/latexHelper.js";

export default function NodeActionPanel({ modal, onClose, isDark, markdownComponents, onAskSubmit }) {
  const [userChatInput, setUserChatInput] = useState("");
  const [quizAnswer, setQuizAnswer] = useState(null);

  if (!modal.isOpen) return null;

  const actionIcons = {
    explain: Lightbulb,
    example: BookOpen,
    quiz: Target,
    ask: MessageSquare,
  };

  const IconComponent = actionIcons[modal.action] || Sparkles;

  // Determine layout positioning based on user audio request:
  // Explain -> LEFT side of page
  // Example -> TOP RIGHT / RIGHT side of page
  // Quiz & Ask -> CENTER modal with rich entrance animation
  let positionClass = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";
  let panelContainerClass = "max-w-lg w-full rounded-3xl p-6 shadow-2xl border relative overflow-hidden backdrop-blur-2xl";
  let motionInitial = { opacity: 0, scale: 0.9, y: 20 };
  let motionAnimate = { opacity: 1, scale: 1, y: 0 };
  let motionExit = { opacity: 0, scale: 0.9, y: 20 };

  if (modal.action === "explain") {
    positionClass = "fixed inset-y-0 left-0 z-50 flex items-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs pointer-events-auto";
    panelContainerClass = "max-w-lg w-full h-[90vh] my-auto rounded-3xl p-6 shadow-2xl border relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between";
    motionInitial = { opacity: 0, x: -120 };
    motionAnimate = { opacity: 1, x: 0 };
    motionExit = { opacity: 0, x: -120 };
  } else if (modal.action === "example") {
    positionClass = "fixed inset-y-0 right-0 z-50 flex items-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs pointer-events-auto";
    panelContainerClass = "max-w-lg w-full h-[90vh] my-auto rounded-3xl p-6 shadow-2xl border relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between";
    motionInitial = { opacity: 0, x: 120, y: -20 };
    motionAnimate = { opacity: 1, x: 0, y: 0 };
    motionExit = { opacity: 0, x: 120, y: -20 };
  }

  const badgeGradients = {
    explain: "from-blue-600 to-cyan-500 border-blue-400/40 text-blue-300",
    example: "from-amber-500 to-orange-500 border-amber-400/40 text-amber-300",
    quiz: "from-emerald-600 to-teal-500 border-emerald-400/40 text-emerald-300",
    ask: "from-purple-600 to-pink-500 border-purple-400/40 text-purple-300",
  };

  const currentGradient = badgeGradients[modal.action] || "from-indigo-600 to-purple-500 text-indigo-300";

  return (
    <AnimatePresence>
      <div className={positionClass} onClick={onClose}>
        <motion.div
          initial={motionInitial}
          animate={motionAnimate}
          exit={motionExit}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`${panelContainerClass} ${
            isDark
              ? "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/60"
              : "bg-white/95 border-blue-200 text-slate-900 shadow-2xl"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${currentGradient} text-white shadow-lg`}>
                <IconComponent className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-base capitalize tracking-tight flex items-center gap-2">
                  <span>{modal.action} Concept:</span>
                  <span className="text-indigo-400 font-bold underline decoration-indigo-500/40">{modal.nodeLabel}</span>
                </h3>
                <p className="text-[11px] opacity-60">Syllabus AI Instant Knowledge Breakdown</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700/40"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Body */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {modal.loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-indigo-400 font-semibold text-xs">
                <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
                <span className="animate-pulse">Retrieving textbook context & synthesizing response...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Content Render with Formatted LaTeX */}
                <div className="text-sm leading-relaxed prose-custom font-medium">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
                    components={markdownComponents}
                  >
                    {preprocessLaTeX(modal.content)}
                  </ReactMarkdown>
                </div>

                {/* Ask AI Input Mode */}
                {modal.action === "ask" && (
                  <div className="pt-4 border-t border-slate-700/30 space-y-3">
                    <p className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Ask a follow-up question on "{modal.nodeLabel}":
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (userChatInput.trim() && onAskSubmit) {
                          onAskSubmit(userChatInput, modal.nodeLabel);
                          setUserChatInput("");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={userChatInput}
                        onChange={(e) => setUserChatInput(e.target.value)}
                        placeholder={`Ask AI about ${modal.nodeLabel}...`}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs border outline-none transition ${
                          isDark
                            ? "bg-slate-950 border-slate-800 text-white focus:border-purple-500"
                            : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" /> Ask
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Tag */}
          <div className="mt-4 pt-3 border-t border-slate-700/20 flex items-center justify-between text-[11px] opacity-60 font-semibold">
            <span>VCE Syllabus AI Tutor • Unit {modal.nodeLabel ? "RAG Knowledge" : ""}</span>
            <span className="text-indigo-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> AI Verified
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

