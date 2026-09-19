import React from "react";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Sparkles, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InteractiveQuizView({
  isAdaptiveMode,
  setIsAdaptiveMode,
  quizUnitSelect,
  setQuizUnitSelect,
  quizNumQuestions,
  setQuizNumQuestions,
  indexedUnits,
  quizLoading,
  handleStartQuiz,
  handleStartAdaptiveQuiz,
  quizzes,
  selectedAnswers,
  setSelectedAnswers,
  quizSubmitted,
  handleSubmitQuiz,
  quizScore,
  adaptiveState,
  handleSubmitAdaptiveQuestion,
  handleNextAdaptiveQuestion,
  isDark,
}) {
  return (
    <div className="space-y-6">
      {/* Mode Switch Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          <h3 className="font-extrabold text-sm tracking-tight">AI Assessment Center</h3>
        </div>

        <div className={`flex p-1 rounded-xl border text-xs font-bold ${
          isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            onClick={() => setIsAdaptiveMode(false)}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              !isAdaptiveMode
                ? isDark ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-blue-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Standard Quiz
          </button>
          <button
            onClick={() => {
              setIsAdaptiveMode(true);
              if (!adaptiveState.questionData) handleStartAdaptiveQuiz();
            }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              isAdaptiveMode
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-200" />
            <span>🔄 Adaptive Assessment</span>
          </button>
        </div>
      </div>

      {/* 1. ADAPTIVE QUIZ MODE */}
      {isAdaptiveMode ? (
        <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-md space-y-6 ${
          isDark ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}>
          {/* Header Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                adaptiveState.currentDifficulty === "hard"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : adaptiveState.currentDifficulty === "easy"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                Difficulty: {adaptiveState.currentDifficulty || "Medium"}
              </span>
              <span className="text-xs font-bold opacity-70">Question {adaptiveState.questionNumber}</span>
            </div>

            <div className="text-xs font-semibold opacity-80">
              Accuracy: {adaptiveState.correctCount} / {adaptiveState.correctCount + adaptiveState.wrongCount} Correct
            </div>
          </div>

          {/* Question Content */}
          {adaptiveState.loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-bold opacity-70">Generating next adaptive question based on performance...</p>
            </div>
          ) : adaptiveState.questionData ? (
            <div className="space-y-4">
              <h4 className="font-extrabold text-base leading-snug">
                {adaptiveState.questionData.question}
              </h4>

              <div className="space-y-2.5">
                {(adaptiveState.questionData.options || []).map((opt, idx) => {
                  const isSelected = adaptiveState.selectedAnswer === opt;
                  const isCorrect = opt.trim().toLowerCase() === adaptiveState.questionData.correct_answer.trim().toLowerCase();

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 3, scale: 1.005 }}
                      onClick={() => {
                        if (!adaptiveState.isSubmitted) {
                          adaptiveState.selectedAnswer = opt;
                          handleSubmitAdaptiveQuestion();
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        adaptiveState.isSubmitted
                          ? isCorrect
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md"
                            : isSelected
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md"
                            : isDark ? "bg-slate-950/40 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                          : isSelected
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md"
                          : isDark ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>{opt}</span>
                      {adaptiveState.isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {adaptiveState.isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {adaptiveState.isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border text-xs font-medium space-y-1.5 ${
                    adaptiveState.selectedAnswer.trim().toLowerCase() === adaptiveState.questionData.correct_answer.trim().toLowerCase()
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                      : "bg-amber-950/40 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Explanation:
                  </p>
                  <p className="leading-relaxed opacity-90">{adaptiveState.questionData.explanation}</p>
                </motion.div>
              )}

              {adaptiveState.isSubmitted && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextAdaptiveQuestion}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs shadow-lg hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Adaptive Question</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          ) : (
            <div className="text-center text-xs opacity-70 py-8">
              Click Start Adaptive Quiz to test your syllabus knowledge dynamically.
            </div>
          )}
        </div>
      ) : (
        /* 2. STANDARD QUIZ MODE */
        <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-md space-y-6 ${
          isDark ? "bg-slate-900/90 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}>
          {quizzes.length === 0 ? (
            <div className="space-y-4 max-w-xl mx-auto text-center py-4">
              <h3 className="font-extrabold text-base">Standard Practice Quiz</h3>
              <p className="text-xs opacity-70">Select a syllabus unit and question count to begin.</p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <select
                  value={quizUnitSelect}
                  onChange={(e) => setQuizUnitSelect(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {indexedUnits.map((u) => (
                    <option key={u.unit_number} value={u.unit_number}>
                      Unit {u.unit_number}: {u.unit_name}
                    </option>
                  ))}
                </select>

                <select
                  value={quizNumQuestions}
                  onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleStartQuiz}
                  disabled={quizLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {quizLoading ? "Generating Quiz..." : "Start Quiz"}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">Unit Quiz</span>
                {quizSubmitted && quizScore && (
                  <span className="text-xs font-black text-emerald-400">
                    Score: {quizScore.correct} / {quizScore.total} Correct
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {quizzes.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-extrabold text-xs">
                      Q{idx + 1}. {q.question}
                    </h4>

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isSel = selectedAnswers[q.question] === opt;
                        const isCorr = opt.trim().toLowerCase() === q.answer.trim().toLowerCase();

                        return (
                          <motion.button
                            key={oIdx}
                            whileHover={{ x: 2 }}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setSelectedAnswers((prev) => ({ ...prev, [q.question]: opt }));
                              }
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              quizSubmitted
                                ? isCorr
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                  : isSel
                                  ? "bg-rose-500/20 border-rose-500 text-rose-300"
                                  : "opacity-40 border-slate-800"
                                : isSel
                                ? "bg-blue-500/20 border-blue-400 text-blue-300"
                                : isDark ? "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorr && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitQuiz}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Submit & Grade Quiz
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
