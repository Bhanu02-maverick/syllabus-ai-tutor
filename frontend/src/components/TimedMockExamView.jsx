import React, { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Flag,
  AlertTriangle,
  BookMarked,
  ClipboardList,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import { motion, AnimatePresence, animate } from "framer-motion";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const ease = [0.22, 1, 0.36, 1];

function ScoreRing({ percent, passed, isDark }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const c = animate(0, percent, { duration: 1.1, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [percent]);
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className={isDark ? "stroke-slate-800" : "stroke-slate-200"} />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={passed ? "stroke-success-500" : "stroke-rose-500"}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - percent / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{shown}%</span>
        <span className={`text-[11px] font-semibold ${passed ? "text-success-600 dark:text-emerald-400" : "text-rose-500"}`}>
          {passed ? "Passed" : "Below 60%"}
        </span>
      </div>
    </div>
  );
}

export default function TimedMockExamView({
  mockExamActive,
  mockExamReport,
  mockExamSelectedUnits,
  setMockExamSelectedUnits,
  mockExamDuration,
  setMockExamDuration,
  mockExamNumQuestions,
  setMockExamNumQuestions,
  units,
  mockExamLoading,
  mockExamError,
  handleStartMockExam,
  mockExamData,
  mockExamCurrentIndex,
  setMockExamCurrentIndex,
  mockExamAnswers,
  setMockExamAnswers,
  mockExamTimeLeft,
  handleFinalSubmitMockExam,
  setMockExamReport,
  setMockExamActive,
  onReviseUnit,
  onPracticeUnit,
  isDark,
}) {
  const [flagged, setFlagged] = useState({});
  const [direction, setDirection] = useState(1);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("wrong");

  const questions = mockExamData?.questions || [];
  const current = questions[mockExamCurrentIndex];
  const answeredCount = questions.filter((q) => mockExamAnswers[q.id]).length;
  const unanswered = questions.length - answeredCount;
  const totalSeconds = (mockExamData?.duration_minutes || mockExamDuration) * 60;
  const timeLow = mockExamTimeLeft <= 300;
  const unitName = (n) => units.find((u) => u.unit_number === n)?.unit_name || "";

  useEffect(() => {
    if (mockExamActive) {
      setFlagged({});
      setConfirmSubmit(false);
    }
  }, [mockExamActive, mockExamData]);

  const goTo = (idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setDirection(idx > mockExamCurrentIndex ? 1 : -1);
    setMockExamCurrentIndex(idx);
  };

  const choose = (opt) => {
    if (!current) return;
    setMockExamAnswers((prev) => ({ ...prev, [current.id]: opt }));
  };

  // Keyboard: A-D / 1-4 to answer, arrow keys to move, F to flag
  useEffect(() => {
    if (!mockExamActive || !current) return;
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.metaKey || e.ctrlKey) return;
      const k = e.key.toUpperCase();
      const idx = LETTERS.indexOf(k) !== -1 ? LETTERS.indexOf(k) : ["1", "2", "3", "4", "5", "6"].indexOf(k);
      if (idx !== -1 && current.options[idx]) choose(current.options[idx]);
      else if (e.key === "ArrowRight") goTo(mockExamCurrentIndex + 1);
      else if (e.key === "ArrowLeft") goTo(mockExamCurrentIndex - 1);
      else if (k === "F") setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const card = `vce-card ${isDark ? "!bg-surface-dark-secondary !border-slate-800" : ""}`;
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const secondaryBtn = isDark
    ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";

  return (
    <div className="space-y-6">
      {/* ─── 1. Setup ─── */}
      {!mockExamActive && !mockExamReport && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }} className={`${card} p-6 space-y-6`}>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mock Exam</h3>
              <p className={`text-xs mt-0.5 ${muted}`}>
                A timed exam across the units you choose, with questions from your course notes. You'll get a score per unit and a full answer review.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Units to include</label>
              <button
                onClick={() =>
                  setMockExamSelectedUnits(
                    mockExamSelectedUnits.length === units.length ? [] : units.map((u) => u.unit_number)
                  )
                }
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                {mockExamSelectedUnits.length === units.length ? "Clear" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {units.map((u) => {
                const on = mockExamSelectedUnits.includes(u.unit_number);
                return (
                  <motion.button
                    key={u.unit_number}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setMockExamSelectedUnits((prev) =>
                        on ? prev.filter((id) => id !== u.unit_number) : [...prev, u.unit_number]
                      )
                    }
                    className={`flex items-center gap-2.5 text-left text-xs p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                      on
                        ? "border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-500/10 dark:text-primary-200"
                        : isDark
                        ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {on ? <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />}
                    <span className="font-semibold">Unit {u.unit_number}</span>
                    <span className={`truncate ${muted}`}>{u.unit_name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Duration", value: mockExamDuration, set: setMockExamDuration, opts: [10, 20, 30], unit: "minutes" },
              { label: "Questions", value: mockExamNumQuestions, set: setMockExamNumQuestions, opts: [10, 15, 20], unit: "questions" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">{f.label}</label>
                <div className={`flex p-1 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                  {f.opts.map((o) => (
                    <button
                      key={o}
                      onClick={() => f.set(o)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        f.value === o
                          ? isDark ? "bg-slate-700 text-white" : "bg-white text-slate-900 shadow-sm"
                          : muted
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <p className={`text-[11px] mt-1 ${muted}`}>{f.unit}</p>
              </div>
            ))}
          </div>

          {mockExamError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border text-xs font-medium bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {mockExamError}
            </div>
          )}

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartMockExam}
            disabled={mockExamLoading || mockExamSelectedUnits.length === 0}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-lg shadow-primary-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {mockExamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {mockExamLoading
              ? "Writing questions from your notes…"
              : mockExamSelectedUnits.length === 0
              ? "Choose at least one unit"
              : `Start ${mockExamDuration}-minute exam`}
          </motion.button>
        </motion.div>
      )}

      {/* ─── 2. Exam in progress ─── */}
      {mockExamActive && mockExamData && current && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${card} overflow-hidden`}>
          {/* Time bar */}
          <div className={`h-1 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
            <motion.div
              className={`h-full ${timeLow ? "bg-rose-500" : "bg-amber-500"}`}
              animate={{ width: `${(mockExamTimeLeft / totalSeconds) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>

          <div className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-medium ${muted}`}>
                  Question {mockExamCurrentIndex + 1} of {questions.length} · {answeredCount} answered
                </p>
                <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-700 dark:text-primary-300">
                  Unit {current.unit_number}
                  {unitName(current.unit_number) && ` · ${unitName(current.unit_number)}`}
                </span>
              </div>
              <motion.div
                animate={timeLow ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-semibold text-sm border ${
                  timeLow
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30"
                    : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
                }`}
              >
                <Clock className="w-4 h-4" />
                {Math.floor(mockExamTimeLeft / 60)}:{String(mockExamTimeLeft % 60).padStart(2, "0")}
              </motion.div>
            </div>

            {/* Question + options, sliding in the direction of travel */}
            <div className="relative min-h-[280px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  initial={{ opacity: 0, x: 30 * direction }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 * direction }}
                  transition={{ duration: 0.22, ease }}
                  className="space-y-4"
                >
                  <h4 className="text-base font-semibold leading-snug text-slate-900 dark:text-white">{current.question}</h4>
                  <div className="space-y-2.5">
                    {current.options.map((opt, idx) => {
                      const selected = mockExamAnswers[current.id] === opt;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => choose(opt)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 text-sm transition-colors flex items-center gap-3 cursor-pointer ${
                            selected
                              ? "border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-500/10 dark:text-primary-100"
                              : isDark
                              ? "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 flex-shrink-0 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                              selected ? "bg-primary-600 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {LETTERS[idx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {mockExamError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border text-xs font-medium bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {mockExamError}
              </div>
            )}

            {/* Navigator */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => goTo(idx)}
                    title={flagged[q.id] ? "Flagged for review" : mockExamAnswers[q.id] ? "Answered" : "Not answered"}
                    className={`relative w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      mockExamCurrentIndex === idx
                        ? "bg-primary-600 text-white ring-2 ring-primary-300 dark:ring-primary-800"
                        : mockExamAnswers[q.id]
                        ? "bg-success-50 text-success-700 border border-success-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                    {flagged[q.id] && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button onClick={() => goTo(mockExamCurrentIndex - 1)} disabled={mockExamCurrentIndex === 0} className={`vce-btn vce-btn-sm ${secondaryBtn} disabled:opacity-40`}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    onClick={() => setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }))}
                    className={`vce-btn vce-btn-sm ${
                      flagged[current.id] ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" : secondaryBtn
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" /> {flagged[current.id] ? "Flagged" : "Flag"}
                  </button>
                </div>
                <span className={`hidden md:inline-flex items-center gap-1.5 text-[11px] ${muted}`}>
                  <Keyboard className="w-3.5 h-3.5" /> A–D to answer · ← → to move · F to flag
                </span>
                {mockExamCurrentIndex < questions.length - 1 ? (
                  <button onClick={() => goTo(mockExamCurrentIndex + 1)} className="vce-btn-primary vce-btn-sm">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => (unanswered > 0 ? setConfirmSubmit(true) : handleFinalSubmitMockExam())}
                    disabled={mockExamLoading}
                    className="vce-btn vce-btn-sm bg-success-600 hover:bg-success-700 text-white border-success-600"
                  >
                    {mockExamLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Submit exam
                  </button>
                )}
              </div>

              <AnimatePresence>
                {confirmSubmit && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-200">
                      <span className="text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {unanswered} question{unanswered > 1 ? "s are" : " is"} not answered. Submit anyway?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmSubmit(false);
                            goTo(questions.findIndex((q) => !mockExamAnswers[q.id]));
                          }}
                          className={`vce-btn vce-btn-sm ${secondaryBtn}`}
                        >
                          Go to first unanswered
                        </button>
                        <button onClick={handleFinalSubmitMockExam} className="vce-btn vce-btn-sm bg-amber-600 hover:bg-amber-700 text-white border-amber-600">
                          Submit
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── 3. Results ─── */}
      {mockExamReport && (
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className={`${card} p-6 flex flex-col sm:flex-row items-center gap-6`}>
            <ScoreRing percent={mockExamReport.score_percent} passed={mockExamReport.passed} isDark={isDark} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {mockExamReport.correct_count} of {mockExamReport.total_questions} correct
              </h3>
              <p className={`text-sm mt-1 ${muted}`}>{mockExamReport.ai_feedback}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <button
                  onClick={() => {
                    setMockExamReport(null);
                    setMockExamActive(false);
                  }}
                  className="vce-btn-primary vce-btn-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New exam
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className={`${card} p-5`}>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Score by unit</h4>
            <div className="space-y-4">
              {mockExamReport.unit_breakdown.map((ub, i) => {
                const weak = ub.score_percent < 60;
                return (
                  <div key={ub.unit_number}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Unit {ub.unit_number}
                        <span className={`font-normal ${muted}`}> · {unitName(ub.unit_number)}</span>
                      </span>
                      <span className={`font-semibold ${weak ? "text-rose-500" : "text-success-600 dark:text-emerald-400"}`}>
                        {ub.correct}/{ub.total} · {ub.score_percent}%
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                      <motion.div
                        className={`h-full rounded-full ${weak ? "bg-rose-500" : "bg-success-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(ub.score_percent, 2)}%` }}
                        transition={{ duration: 0.8, ease, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                    {weak && (onReviseUnit || onPracticeUnit) && (
                      <div className="flex gap-2 mt-2">
                        {onReviseUnit && (
                          <button onClick={() => onReviseUnit(ub.unit_number)} className={`vce-btn vce-btn-sm ${secondaryBtn}`}>
                            <BookMarked className="w-3.5 h-3.5" /> Revise notes
                          </button>
                        )}
                        {onPracticeUnit && (
                          <button onClick={() => onPracticeUnit(ub.unit_number)} className={`vce-btn vce-btn-sm ${secondaryBtn}`}>
                            <ClipboardList className="w-3.5 h-3.5" /> Practice quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {questions.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className={`${card} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Answer review</h4>
                <div className={`flex p-1 rounded-lg border text-xs ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                  {[
                    ["wrong", "Mistakes"],
                    ["all", "All questions"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setReviewFilter(id)}
                      className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition ${
                        reviewFilter === id ? (isDark ? "bg-slate-700 text-white" : "bg-white text-slate-900 shadow-sm") : muted
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {questions
                  .map((q, idx) => ({ q, idx, mine: mockExamAnswers[q.id], ok: mockExamAnswers[q.id] === q.correct_answer }))
                  .filter((r) => reviewFilter === "all" || !r.ok)
                  .map(({ q, idx, mine, ok }) => (
                    <div key={q.id} className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-start gap-2.5">
                        {ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" />}
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          <span className={muted}>Q{idx + 1}.</span> {q.question}
                        </p>
                      </div>
                      <div className="pl-[26px] mt-2 space-y-1 text-xs">
                        {!ok && (
                          <p className="text-rose-600 dark:text-rose-400">
                            Your answer: {mine || <em>not answered</em>}
                          </p>
                        )}
                        <p className="text-success-700 dark:text-emerald-400">Correct: {q.correct_answer}</p>
                        {q.explanation && <p className={`pt-1 ${muted}`}>{q.explanation}</p>}
                      </div>
                    </div>
                  ))}
                {reviewFilter === "wrong" && questions.every((q) => mockExamAnswers[q.id] === q.correct_answer) && (
                  <p className={`text-sm text-center py-6 ${muted}`}>No mistakes. Well done!</p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
