import React, { useState, useMemo } from "react";
import { BookMarked, Copy, Check, Printer, Download, Clock } from "lucide-react";
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

  // Calculate estimated reading time
  const readingTime = useMemo(() => {
    if (!notesData.notes_markdown) return 1;
    const words = notesData.notes_markdown.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [notesData.notes_markdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(notesData.notes_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([notesData.notes_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Unit-${notesData.unit_number}-Revision-Notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`vce-card overflow-hidden ${
        isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200/90"
      }`}
    >
      {/* Textbook Header Toolbar */}
      <div
        className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? "bg-slate-950/50 border-slate-800"
            : "bg-slate-50/80 border-slate-200/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="vce-badge vce-badge-primary">
                Unit {notesData.unit_number} Revision
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" /> ~{readingTime} min read
              </span>
              {notesData.cached && (
                <span className="vce-badge vce-badge-success">
                  Saved copy
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-base tracking-tight mt-1 text-slate-900 dark:text-white">
              {notesData.unit_name || `Unit ${notesData.unit_number}`} Revision Notes
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="vce-btn vce-btn-secondary vce-btn-sm"
            title="Copy notes to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleDownload}
            className="vce-btn vce-btn-secondary vce-btn-sm"
            title="Download as Markdown file"
          >
            <Download className="w-3.5 h-3.5" /> Markdown
          </button>

          <button
            onClick={handlePrint}
            className="vce-btn vce-btn-secondary vce-btn-sm"
            title="Print or export to PDF"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Digital Textbook Document Body */}
      <div className="p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="prose-custom text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
            components={markdownComponents}
          >
            {preprocessLaTeX(notesData.notes_markdown)}
          </ReactMarkdown>
        </div>

        {/* Document Footnote */}
        <div className="mt-10 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Syllabus-verified AI synthesis • Grounded in curriculum documents</span>
          <span>VCE AI Tutor Pro</span>
        </div>
      </div>
    </motion.div>
  );
}


