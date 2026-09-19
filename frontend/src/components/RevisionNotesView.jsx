import React, { useState } from "react";
import { BookMarked, Copy, Check, Printer, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { preprocessLaTeX } from "../utils/latexHelper.js";

export default function RevisionNotesView({ notesData, isDark, markdownComponents }) {
  const [copied, setCopied] = useState(false);

  if (!notesData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(notesData.notes_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-3xl border shadow-xl backdrop-blur-md space-y-5 ${
        isDark
          ? "bg-slate-900/90 border-slate-800 text-slate-100"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">AI Syllabus Revision Sheet</span>
            <h3 className="font-extrabold text-base tracking-tight">
              Unit {notesData.unit_number}: {notesData.unit_name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notesData.cached && (
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              ⚡ Instant Cached
            </span>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Notes"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </motion.button>
        </div>
      </div>

      {/* Markdown Document Content with Formatted Math LaTeX & HTML Break Tags */}
      <div className="prose-custom text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
          components={markdownComponents}
        >
          {preprocessLaTeX(notesData.notes_markdown)}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

