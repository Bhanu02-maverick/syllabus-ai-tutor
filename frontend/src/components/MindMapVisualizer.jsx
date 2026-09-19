import React, { useState } from "react";
import { Sparkles, Lightbulb, BookOpen, Target, MessageSquare, ChevronRight, ChevronDown, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function TreeNode({ node, onAction, isDark, depth = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  const depthStyles = isDark
    ? [
        "bg-gradient-to-r from-slate-900/90 to-indigo-950/60 border-indigo-500/30 text-white shadow-indigo-950/50 hover:border-indigo-400/60",
        "bg-gradient-to-r from-slate-900/80 to-purple-950/50 border-purple-500/30 text-slate-100 shadow-purple-950/40 hover:border-purple-400/60",
        "bg-gradient-to-r from-slate-900/70 to-cyan-950/40 border-cyan-500/30 text-slate-200 shadow-cyan-950/30 hover:border-cyan-400/60",
      ]
    : [
        "bg-white/95 border-indigo-200/80 text-slate-900 shadow-indigo-100/60 hover:border-indigo-400",
        "bg-white/90 border-purple-200/80 text-slate-800 shadow-purple-50 hover:border-purple-400",
        "bg-white/85 border-cyan-200/80 text-slate-800 shadow-cyan-50 hover:border-cyan-400",
      ];

  const currentStyle = depthStyles[depth % depthStyles.length];

  return (
    <div className="ml-2 sm:ml-5 my-3 border-l-2 border-dashed border-indigo-400/30 pl-3 sm:pl-5 relative group/line">
      {/* Node Container */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.01, y: -1 }}
        transition={{ duration: 0.2 }}
        className={`p-4 sm:p-5 rounded-2xl border shadow-lg backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${currentStyle}`}
      >
        {/* Subtle glowing background accent */}
        <div className="absolute -right-12 -top-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover/line:bg-indigo-500/20 transition-all duration-500" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            {hasChildren && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 transition cursor-pointer border border-indigo-500/20"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </motion.button>
            )}

            <span className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 inline-flex">
                <Sparkles className="w-4 h-4" />
              </span>
              {node.label}
            </span>
          </div>

          {/* Vibrant Action Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Explain Badge -> Slides in from LEFT */}
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onAction(node.id, node.label, "explain")}
              className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
            >
              <Lightbulb className="w-3.5 h-3.5 animate-pulse" /> Explain
            </motion.button>

            {/* Example Badge -> Slides in from TOP RIGHT */}
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onAction(node.id, node.label, "example")}
              className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/30"
            >
              <BookOpen className="w-3.5 h-3.5" /> Example
            </motion.button>

            {/* Quiz Me Badge -> Centered Quiz Modal */}
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onAction(node.id, node.label, "quiz")}
              className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/30"
            >
              <Target className="w-3.5 h-3.5" /> Quiz Me
            </motion.button>

            {/* Ask AI Badge -> Interactive Concept AI Chat */}
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onAction(node.id, node.label, "ask")}
              className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 text-white shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer border border-purple-400/30"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Ask AI
            </motion.button>
          </div>
        </div>

        {node.description && (
          <p className="text-xs opacity-75 mt-2 leading-relaxed font-medium pl-8 border-l-2 border-indigo-500/20">
            {node.description}
          </p>
        )}
      </motion.div>

      {/* Children Nodes */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-1 overflow-hidden"
          >
            {node.children.map((child, idx) => (
              <TreeNode key={child.id || idx} node={child} onAction={onAction} isDark={isDark} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MindMapVisualizer({ tree, onAction, isDark, unitNumber, unitName, isCached }) {
  if (!tree) return null;

  return (
    <div className="space-y-4">
      {/* Mind Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-indigo-400">
              Unit {unitNumber}: {unitName} Concept Network
            </h3>
            <p className="text-xs opacity-60">Interactive flowchart & node actions</p>
          </div>
        </div>

        {isCached && (
          <span className="text-[11px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ⚡ Instant Cached Mind Map
          </span>
        )}
      </div>

      {/* Mind Map Canvas / Tree Container */}
      <div
        className={`p-4 sm:p-6 rounded-3xl border shadow-inner backdrop-blur-2xl overflow-x-auto transition-all ${
          isDark
            ? "bg-slate-950/70 border-slate-800/80 shadow-slate-950/80"
            : "bg-slate-50/90 border-slate-200 shadow-slate-200/50"
        }`}
      >
        <TreeNode node={tree} onAction={onAction} isDark={isDark} depth={0} />
      </div>
    </div>
  );
}

