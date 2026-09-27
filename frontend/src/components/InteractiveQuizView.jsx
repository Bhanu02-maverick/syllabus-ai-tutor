import React from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  Send,
  RotateCcw,
  Check,
  AlertTriangle,
  Loader2,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InteractiveQuizView({
  isAdaptiveMode,
  setIsAdaptiveMode,
  quizUnitSelect,
  setQuizUnitSelect,
  quizNumQuestions,
  setQuizNumQuestions,
  indexedUnits = [],
  quizLoading,
  quizError,
  onDismissError,
  handleStartQuiz,
  handleStartAdaptiveQuiz,
  quizzes = [],
  selectedAnswers = {},
  setSelectedAnswers,
  quizSubmitted,
  handleSubmitQuiz,
  quizScore,
  onResetQuiz,
  adaptiveState = {},
  handleSubmitAdaptiveQuestion,
  handleNextAdaptiveQuestion,
  isDark,
}) {
  // Count how many questions answered in standard quiz
  const answeredCount = quizzes.filter(
    (q) => selectedAnswers[q.question] !== undefined
  ).length;
  const allAnswered = quizzes.length > 0 && answeredCount === quizzes.length;

  return (
    <div className="space-y-6">
      {/* ─── Mode Switcher Bar ─── */}
      <div
        className={`vce-card p-4 flex flex-wrap items-center justify-between gap-4 ${
          isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              AI Knowledge Assessment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active recall testing grounded in syllabus curriculum
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setIsAdaptiveMode(false)}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              !isAdaptiveMode
                ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Standard Quiz
          </button>
          <button
            onClick={() => {
              setIsAdaptiveMode(true);
              if (!adaptiveState?.questionData) handleStartAdaptiveQuiz();
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdaptiveMode
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Adaptive Engine</span>
          </button>
        </div>
      </div>

      {/* ─── Error Alert ─── */}
      {quizError && !quizLoading && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-danger-50 dark:bg-red-950/40 border border-danger-100 dark:border-red-900/50 flex items-start justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-danger-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{quizError}</p>
              <p className="opacity-80 mt-0.5">Please check network or try with fewer questions.</p>
            </div>
          </div>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-xs font-bold text-danger-700 dark:text-red-300 hover:underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          )}
        </motion.div>
      )}

      {/* ═══════════════ 1. ADAPTIVE QUIZ MODE ═══════════════ */}
      {isAdaptiveMode ? (
        <div
          className={`vce-card p-6 space-y-6 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          {/* Header Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span
                className={`vce-badge ${
                  adaptiveState.currentDifficulty === "hard"
                    ? "vce-badge-danger"
                    : adaptiveState.currentDifficulty === "easy"
                    ? "vce-badge-success"
                    : "vce-badge-warning"
                }`}
              >
                Difficulty: {adaptiveState.currentDifficulty ? adaptiveState.currentDifficulty.toUpperCase() : "MEDIUM"}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Question {adaptiveState.questionNumber || 1}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Accuracy:{" "}
              <span className="font-extrabold text-primary-600 dark:text-primary-400">
                {adaptiveState.correctCount || 0}
              </span>{" "}
              / {(adaptiveState.correctCount || 0) + (adaptiveState.wrongCount || 0)} Correct
            </div>
          </div>

          {/* Adaptive Question Content */}
          {adaptiveState.loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Generating next adaptive question based on your accuracy...
              </p>
            </div>
          ) : adaptiveState.questionData ? (
            <div className="space-y-4">
              <h4 className="font-extrabold text-base leading-snug text-slate-900 dark:text-white">
                {adaptiveState.questionData.question}
              </h4>

              <div className="space-y-2.5">
                {(adaptiveState.questionData.options || []).map((opt, idx) => {
                  const isSelected = adaptiveState.selectedAnswer === opt;
                  const isCorrect =
                    opt.trim().toLowerCase() ===
                    adaptiveState.questionData.correct_answer.trim().toLowerCase();

                  return (
                    <button
                      key={idx}
                      disabled={adaptiveState.isSubmitted}
                      onClick={() => {
                        if (!adaptiveState.isSubmitted) {
                          adaptiveState.selectedAnswer = opt;
                          handleSubmitAdaptiveQuestion();
                        }
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        adaptiveState.isSubmitted
                          ? isCorrect
                            ? "bg-success-50 dark:bg-emerald-950/40 border-success-500 text-emerald-800 dark:text-emerald-300"
                            : isSelected
                            ? "bg-danger-50 dark:bg-red-950/40 border-danger-500 text-danger-800 dark:text-red-300"
                            : "opacity-40 border-slate-200 dark:border-slate-800"
                          : isSelected
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200"
                          : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {adaptiveState.isSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {adaptiveState.isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {adaptiveState.isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-xs font-medium space-y-1.5 ${
                    adaptiveState.selectedAnswer?.trim().toLowerCase() ===
                    adaptiveState.questionData.correct_answer.trim().toLowerCase()
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Explanation:
                  </p>
                  <p className="leading-relaxed opacity-90">
                    {adaptiveState.questionData.explanation}
                  </p>
                </motion.div>
              )}

              {adaptiveState.isSubmitted && (
                <button
                  onClick={handleNextAdaptiveQuestion}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-8">
              Click Start Adaptive Quiz to test your syllabus knowledge dynamically.
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════ 2. STANDARD QUIZ MODE ═══════════════ */
        <div className="space-y-6">
          {quizzes.length === 0 ? (
            /* Quiz Configuration Card */
            <div
              className={`vce-card p-6 md:p-8 space-y-6 text-center max-w-2xl mx-auto ${
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto border border-primary-500/20">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Take a Syllabus Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Test your retention on any indexed unit. Choose the unit and number of questions to generate an active recall quiz.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-end justify-center gap-3">
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Select Unit
                  </label>
                  <select
                    value={quizUnitSelect}
                    onChange={(e) => setQuizUnitSelect(e.target.value)}
                    className="vce-select text-xs min-w-[220px]"
                  >
                    {indexedUnits.map((u) => (
                      <option key={u.unit_number} value={u.unit_number}>
                        Unit {u.unit_number}: {u.unit_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Questions
                  </label>
                  <select
                    value={quizNumQuestions}
                    onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                    className="vce-select text-xs min-w-[120px]"
                  >
                    <option value={2}>2 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <button
                  onClick={handleStartQuiz}
                  disabled={quizLoading || indexedUnits.length === 0}
                  className="vce-btn vce-btn-primary vce-btn-sm"
                >
                  {quizLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {quizLoading ? "Generating Quiz..." : "Start Quiz"}
                </button>
              </div>

              {indexedUnits.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  No syllabus units indexed yet. Upload curriculum PDFs in Faculty portal first.
                </p>
              )}
            </div>
          ) : (
            /* Active Quiz Questions View */
            <div className="space-y-4">
              {/* Quiz Header Bar */}
              <div
                className={`vce-card p-4 flex flex-wrap items-center justify-between gap-4 ${
                  isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="vce-badge vce-badge-primary">
                      {quizzes.length} Questions
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Answered: {answeredCount} / {quizzes.length}
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${(answeredCount / quizzes.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Score or Action */}
                {quizSubmitted && quizScore ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-base font-extrabold ${
                          quizScore.correct / quizScore.total >= 0.7
                            ? "text-success-600 dark:text-success-500"
                            : quizScore.correct / quizScore.total >= 0.4
                            ? "text-warning-600 dark:text-warning-500"
                            : "text-danger-600 dark:text-danger-500"
                        }`}
                      >
                        Score: {quizScore.correct} / {quizScore.total} (
                        {Math.round((quizScore.correct / quizScore.total) * 100)}%)
                      </p>
                      <p className="text-[10px] text-slate-400">Retentive Knowledge Logged</p>
                    </div>
                    {onResetQuiz && (
                      <button
                        onClick={onResetQuiz}
                        className="vce-btn vce-btn-secondary vce-btn-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Another Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Select an option for each question below
                  </span>
                )}
              </div>

              {/* Questions List */}
              {quizzes.map((q, qIndex) => {
                const isAnswered = selectedAnswers[q.question] !== undefined;

                return (
                  <motion.div
                    key={qIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qIndex * 0.04 }}
                    className={`vce-card p-5 space-y-3.5 ${
                      isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.question}
                      </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = selectedAnswers[q.question] === opt;
                        const isCorrect =
                          quizSubmitted && isSelected && opt === q.answer;
                        const isWrong =
                          quizSubmitted && isSelected && opt !== q.answer;
                        const isRevealCorrect =
                          quizSubmitted && !isSelected && opt === q.answer;

                        return (
                          <button
                            key={optIndex}
                            disabled={quizSubmitted}
                            onClick={() =>
                              setSelectedAnswers({
                                ...selectedAnswers,
                                [q.question]: opt,
                              })
                            }
                            className={`text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isCorrect || isRevealCorrect
                                ? "bg-success-50 dark:bg-emerald-950/40 border-success-500 text-emerald-800 dark:text-emerald-300 font-bold"
                                : isWrong
                                ? "bg-danger-50 dark:bg-red-950/40 border-danger-500 text-danger-800 dark:text-red-300"
                                : isSelected
                                ? "bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-900 dark:text-primary-200 font-bold"
                                : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {/* Status Icon */}
                            {quizSubmitted && (isCorrect || isRevealCorrect) && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                            )}
                            {quizSubmitted && isWrong && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              {/* Submit & Reset Bar */}
              <div
                className={`vce-card p-4 flex flex-wrap items-center justify-between gap-4 ${
                  isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                {!quizSubmitted ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!allAnswered}
                      className="vce-btn vce-btn-primary"
                    >
                      <Send className="w-4 h-4" /> Submit & Grade Quiz
                    </button>
                    {!allAnswered && (
                      <span className="text-xs text-slate-400">
                        Please answer all {quizzes.length} questions to submit
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="vce-badge vce-badge-success">
                      <Check className="w-3.5 h-3.5" /> Quiz Completed
                    </span>
                    {onResetQuiz && (
                      <button
                        onClick={onResetQuiz}
                        className="vce-btn vce-btn-secondary vce-btn-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Take Another Quiz
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

