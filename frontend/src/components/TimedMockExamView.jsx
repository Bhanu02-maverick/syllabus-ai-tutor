import React from "react";
import { Clock, Trophy, CheckCircle2, Zap, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
  isDark,
}) {
  const isTimeRunningLow = mockExamTimeLeft <= 300; // < 5 mins

  return (
    <div className="space-y-6">
      {/* 1. Exam Configuration Screen */}
      {!mockExamActive && !mockExamReport && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border shadow-xl backdrop-blur-md space-y-6 ${
            isDark ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="text-center space-y-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mx-auto border border-amber-500/20">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Timed AI Mock Exam Simulator</h3>
            <p className="text-xs opacity-70 max-w-md mx-auto">
              Simulate actual examination conditions across multiple syllabus units with live timer and per-unit score analysis.
            </p>
          </div>

          <div className={`max-w-xl mx-auto space-y-5 p-5 rounded-2xl border ${
            isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div>
              <label className="block text-xs font-bold mb-2">Select Examination Units:</label>
              <div className="grid grid-cols-2 gap-2">
                {units.map((u) => (
                  <label
                    key={u.unit_number}
                    className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border font-semibold cursor-pointer transition ${
                      mockExamSelectedUnits.includes(u.unit_number)
                        ? isDark ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-900"
                        : isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={mockExamSelectedUnits.includes(u.unit_number)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMockExamSelectedUnits((prev) => [...prev, u.unit_number]);
                        } else {
                          setMockExamSelectedUnits((prev) => prev.filter((id) => id !== u.unit_number));
                        }
                      }}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Unit {u.unit_number}: {u.unit_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Duration (Minutes):</label>
                <select
                  value={mockExamDuration}
                  onChange={(e) => setMockExamDuration(Number(e.target.value))}
                  className={`w-full rounded-xl border p-2 text-xs font-bold ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value={10}>10 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Total Questions:</label>
                <select
                  value={mockExamNumQuestions}
                  onChange={(e) => setMockExamNumQuestions(Number(e.target.value))}
                  className={`w-full rounded-xl border p-2 text-xs font-bold ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartMockExam}
              disabled={mockExamLoading || mockExamSelectedUnits.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-extrabold text-xs hover:from-amber-600 hover:to-orange-700 shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {mockExamLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {mockExamLoading ? "Generating Balanced Exam Questions..." : "Start Timed Mock Exam"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 2. Active Exam Simulator */}
      {mockExamActive && mockExamData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-md space-y-6 ${
            isDark ? "bg-slate-900/95 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Header & Live Pulse Timer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
            <div>
              <h3 className="font-black text-base tracking-tight">Timed Mock Examination</h3>
              <p className="text-xs opacity-60 font-semibold">Question {mockExamCurrentIndex + 1} of {mockExamData.questions.length}</p>
            </div>

            <motion.div
              animate={isTimeRunningLow ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xs border shadow-sm ${
                isTimeRunningLow
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : isDark ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-amber-50 text-amber-900 border-amber-300"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Time Left: {Math.floor(mockExamTimeLeft / 60)}:{(mockExamTimeLeft % 60).toString().padStart(2, "0")}</span>
            </motion.div>
          </div>

          {/* Question Card */}
          {mockExamData.questions[mockExamCurrentIndex] && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Unit {mockExamData.questions[mockExamCurrentIndex].unit_number}
                </span>
                <h4 className="font-extrabold text-sm mt-2 leading-snug">
                  Q{mockExamCurrentIndex + 1}. {mockExamData.questions[mockExamCurrentIndex].question}
                </h4>
              </div>

              <div className="space-y-2.5">
                {mockExamData.questions[mockExamCurrentIndex].options.map((opt, idx) => {
                  const isSelected = mockExamAnswers[mockExamData.questions[mockExamCurrentIndex].id] === opt;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 3 }}
                      onClick={() => {
                        setMockExamAnswers((prev) => ({
                          ...prev,
                          [mockExamData.questions[mockExamCurrentIndex].id]: opt,
                        }));
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                          : isDark ? "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Navigator Drawer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-700/30">
            <button
              onClick={() => setMockExamCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={mockExamCurrentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer hover:bg-slate-700 transition"
            >
              Previous
            </button>

            <div className="flex gap-1.5 overflow-x-auto max-w-xs py-1">
              {mockExamData.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setMockExamCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-xl text-xs font-black transition flex items-center justify-center cursor-pointer ${
                    mockExamCurrentIndex === idx
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : mockExamAnswers[q.id]
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : isDark ? "bg-slate-950 text-slate-500" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {mockExamCurrentIndex < mockExamData.questions.length - 1 ? (
              <button
                onClick={() => setMockExamCurrentIndex((prev) => prev + 1)}
                className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-amber-400 transition cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinalSubmitMockExam}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-md transition cursor-pointer"
              >
                Submit Mock Exam
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* 3. Post-Exam Score Report */}
      {mockExamReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-md space-y-6 ${
            isDark ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="text-center space-y-2 pb-4 border-b border-slate-700/30">
            <Trophy className={`w-12 h-12 mx-auto ${mockExamReport.passed ? "text-amber-400" : "text-slate-500"}`} />
            <h3 className="text-xl font-black tracking-tight">Mock Exam Performance Report</h3>
            <p className="text-sm font-bold opacity-80">
              Overall Score: <span className={mockExamReport.passed ? "text-emerald-400 font-black text-base" : "text-rose-400 font-black text-base"}>{mockExamReport.score_percent}%</span> ({mockExamReport.correct_count} / {mockExamReport.total_questions})
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 font-medium">
            💡 <strong>AI Tutor Feedback:</strong> {mockExamReport.ai_feedback}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider opacity-70">Per-Unit Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockExamReport.unit_breakdown.map((ub) => (
                <div key={ub.unit_number} className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div>
                    <span className="font-extrabold text-xs">Unit {ub.unit_number}</span>
                    <p className="text-[10px] opacity-60">{ub.correct} of {ub.total} correct</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                    ub.score_percent >= 60 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  }`}>
                    {ub.score_percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setMockExamReport(null);
              setMockExamActive(false);
            }}
            className="w-full py-3 bg-slate-800 text-white rounded-2xl text-xs font-extrabold hover:bg-slate-700 transition cursor-pointer"
          >
            Close Exam Report
          </button>
        </motion.div>
      )}
    </div>
  );
}
