import React, { useState, useMemo, useEffect } from "react";
import { BookMarked, Copy, Check, Printer, Download, Clock, CheckCircle2, Circle, MessageSquare, ListOrdered } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { preprocessLaTeX } from "../utils/latexHelper.js";

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "section";

// "(p. 7)", "(p. 7, 9)", "(pp. 3-5)" -> small page badges (rehypeRaw renders the span)
const withPageBadges = (md) =>
  md.replace(/\((?:p|pp)\.\s?(\d+(?:\s?[-–,]\s?\d+)*)\)/g, '<span class="page-ref">p. $1</span>');

const isExamSection = (title) => /exam|expected question|likely question/i.test(title);

/*
 * Split the notes into top-level sections (the shallowest heading level that occurs
 * at least twice), so each section can get a contents entry, scroll-spy and a
 * "revised" checkbox.
 */
function splitSections(markdown) {
  const lines = markdown.split("\n");
  const levels = [1, 2, 3, 4].filter((lvl) => lines.filter((l) => l.startsWith("#".repeat(lvl) + " ")).length >= 2);
  const level = levels[0];
  if (!level) return [{ id: "notes", title: "Notes", body: markdown }];

  const marker = "#".repeat(level) + " ";
  const sections = [];
  let current = { id: "overview", title: "Introduction", body: [] };
  const seen = {};
  for (const line of lines) {
    if (line.startsWith(marker)) {
      if (current.body.join("").trim()) sections.push({ ...current, body: current.body.join("\n") });
      // Older saved notes put emojis in headings; strip them for a cleaner contents list
      const title = line
        .slice(marker.length)
        .replace(/\*\*/g, "")
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
      let id = slugify(title);
      seen[id] = (seen[id] || 0) + 1;
      if (seen[id] > 1) id = `${id}-${seen[id]}`;
      current = { id, title, body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.join("").trim()) sections.push({ ...current, body: current.body.join("\n") });

  // The intro usually repeats the unit title as an H1, which the toolbar already shows
  if (sections[0]?.id === "overview") {
    sections[0].body = sections[0].body.replace(/^#\s.*$/m, "").trim();
    if (sections[0].body.replace(/[*_\s-]/g, "").length < 60) sections.shift();
  }
  return sections;
}

/*
 * Top-level list items are questions; indented lines below one (given data, sub-parts)
 * stay attached to it as details instead of becoming questions of their own.
 */
function parseQuestions(body) {
  const questions = [];
  for (const line of body.split("\n")) {
    const top = line.match(/^(?:\d+[.)]|[-*])\s+(.+)/);
    const nested = line.match(/^\s{2,}(?:\d+[.)]|[-*])?\s*(.+)/);
    if (top) {
      questions.push({ text: top[1].trim(), details: [] });
    } else if (nested && questions.length && nested[1].trim()) {
      questions[questions.length - 1].details.push(nested[1].trim());
    }
  }
  return questions.filter((q) => q.text.replace(/\*\*/g, "").length > 8);
}

// Question text keeps inline formatting and maths, rendered without block margins
const inlineMd = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
};

function InlineMarkdown({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
      components={inlineMd}
    >
      {preprocessLaTeX(text)}
    </ReactMarkdown>
  );
}

function readKey(unit) {
  return `vce_notes_revised_${unit}`;
}

export default function RevisionNotesView({ notesData, isDark, markdownComponents, onAskQuestion }) {
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [revised, setRevised] = useState({});

  const markdown = notesData?.notes_markdown || "";
  const sections = useMemo(() => splitSections(markdown), [markdown]);

  const readingTime = useMemo(() => {
    const words = markdown.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [markdown]);

  // Per-student "revised" ticks, kept in this browser only
  useEffect(() => {
    if (!notesData) return;
    try {
      setRevised(JSON.parse(localStorage.getItem(readKey(notesData.unit_number)) || "{}"));
    } catch {
      setRevised({});
    }
  }, [notesData]);

  const toggleRevised = (id) => {
    setRevised((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(readKey(notesData.unit_number), JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in memory */
      }
      return next;
    });
  };

  // Scroll-spy: highlight the section currently being read
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`notes-${s.id}`)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id.replace("notes-", ""));
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  // Reading progress across the whole page
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  if (!notesData) return null;

  const revisedCount = sections.filter((s) => revised[s.id]).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Unit-${notesData.unit_number}-Revision-Notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const jumpTo = (id) => {
    document.getElementById(`notes-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const muted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <>
      {/* Reading progress bar pinned under the header */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 h-1 bg-primary-500 origin-left z-50 print:hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-start">
        {/* Contents sidebar */}
        <motion.nav
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={`vce-card p-4 lg:sticky lg:top-24 print:hidden ${isDark ? "!bg-surface-dark-secondary !border-slate-800" : ""}`}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${muted}`}>
            <ListOrdered className="h-3.5 w-3.5" /> Contents
          </p>
          <ul className="space-y-0.5">
            {sections.map((s) => {
              const active = activeId === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => jumpTo(s.id)}
                    className={`w-full flex items-start gap-2 text-left text-xs px-2 py-1.5 rounded-lg transition cursor-pointer ${
                      active
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-300 font-semibold"
                        : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {revised[s.id] ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mt-px flex-shrink-0 text-success-500" />
                    ) : (
                      <Circle className={`h-3.5 w-3.5 mt-px flex-shrink-0 ${active ? "" : "opacity-40"}`} />
                    )}
                    <span className="line-clamp-2">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={`mt-4 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className={muted}>Revised</span>
              <span className="font-semibold text-success-500">
                {revisedCount}/{sections.length}
              </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <motion.div
                className="h-full bg-success-500 rounded-full"
                animate={{ width: `${(revisedCount / Math.max(sections.length, 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </motion.nav>

        {/* Document */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`vce-card overflow-hidden min-w-0 ${isDark ? "!bg-surface-dark-secondary !border-slate-800" : ""}`}
        >
          {/* Toolbar */}
          <div
            className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
              isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/80 border-slate-200/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="vce-badge vce-badge-primary">Unit {notesData.unit_number}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${muted}`}>
                    <Clock className="w-3 h-3" /> ~{readingTime} min read
                  </span>
                  {notesData.cached && <span className="vce-badge vce-badge-success">Saved copy</span>}
                </div>
                <h3 className="font-bold text-base tracking-tight mt-1 text-slate-900 dark:text-white truncate">
                  {notesData.unit_name || `Unit ${notesData.unit_number}`}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button onClick={handleCopy} className="vce-btn vce-btn-secondary vce-btn-sm" title="Copy notes to clipboard">
                {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleDownload} className="vce-btn vce-btn-secondary vce-btn-sm" title="Download as Markdown file">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button onClick={() => window.print()} className="vce-btn vce-btn-secondary vce-btn-sm" title="Print or save as PDF">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="px-6 sm:px-10 py-8 max-w-4xl mx-auto space-y-10">
            {sections.map((s, idx) => {
              const questions = isExamSection(s.title) ? parseQuestions(s.body) : [];
              return (
                <motion.section
                  key={s.id}
                  id={`notes-${s.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="scroll-mt-28"
                >
                  <div className={`flex items-start justify-between gap-3 pb-2 mb-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-baseline gap-2.5">
                      <span className="text-xs font-bold text-primary-500 tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                      {s.title}
                    </h2>
                    <button
                      onClick={() => toggleRevised(s.id)}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer print:hidden ${
                        revised[s.id]
                          ? "bg-success-500/10 border-success-500/30 text-success-600 dark:text-emerald-400"
                          : isDark
                          ? "border-slate-700 text-slate-400 hover:border-slate-500"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {revised[s.id] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      {revised[s.id] ? "Revised" : "Mark revised"}
                    </button>
                  </div>

                  {questions.length > 0 ? (
                    <ol className="space-y-2.5">
                      {questions.map((q, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className={`group flex items-start gap-3 p-3.5 rounded-xl border ${
                            isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="w-6 h-6 flex-shrink-0 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            <InlineMarkdown text={q.text} />
                            {q.details.length > 0 && (
                              <ul className={`mt-1.5 space-y-0.5 text-xs ${muted}`}>
                                {q.details.map((d, j) => (
                                  <li key={j} className="flex gap-1.5">
                                    <span className="opacity-50">–</span>
                                    <span>
                                      <InlineMarkdown text={d} />
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {onAskQuestion && (
                            <button
                              onClick={() =>
                                onAskQuestion(
                                  [q.text, ...q.details].join(" ").replace(/\*\*/g, ""),
                                  notesData.unit_number
                                )
                              }
                              className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-500/10 transition cursor-pointer print:hidden"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> See answer
                            </button>
                          )}
                        </motion.li>
                      ))}
                    </ol>
                  ) : (
                    <div className="prose-custom text-sm leading-relaxed notes-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
                        components={markdownComponents}
                      >
                        {withPageBadges(preprocessLaTeX(s.body))}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.section>
              );
            })}

            <div className={`pt-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
              Summarised from your course notes. Page numbers point to the original PDF your faculty uploaded.
            </div>
          </div>
        </motion.article>
      </div>
    </>
  );
}
