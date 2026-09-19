import React from "react";
import { Flame, Trophy, Award, Star, Lock, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function GamificationCard({ gamification, isDark }) {
  if (!gamification) return null;

  const currentXp = gamification.xp || 0;
  const levelXpTarget = gamification.next_level_xp || ((gamification.level || 1) * 100);
  const xpPercent = Math.min(100, roundPct((currentXp % 100)));

  function roundPct(val) {
    return Math.round(val);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden backdrop-blur-md transition-colors ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border-indigo-500/30 text-slate-100"
          : "bg-gradient-to-br from-white via-indigo-50/50 to-blue-50 border-blue-200/80 text-slate-900"
      }`}
    >
      {/* Glow Orbs */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Level Avatar & Info */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-200 cursor-pointer"
          >
            {gamification.level}
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">Level {gamification.level} Scholar</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isDark
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}>
                ⭐ {currentXp} XP
              </span>
            </div>
            <p className="text-xs opacity-70 mt-0.5 font-medium">
              {gamification.total_questions_correct} correct answers · {gamification.accuracy_percent}% accuracy
            </p>
          </div>
        </div>

        {/* Active Streak Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm ${
            isDark
              ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
              : "bg-orange-50 border-orange-200 text-orange-800"
          }`}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame className="w-6 h-6 text-orange-500" />
          </motion.div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Active Streak</span>
            <p className="text-sm font-black leading-none">
              {gamification.streak_days} Day{gamification.streak_days !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Spring Progress Bar */}
      <div className="mt-5 space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold opacity-80">
          <span>Level Progress</span>
          <span>{xpPercent}% ({currentXp} / {levelXpTarget} XP)</span>
        </div>
        <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
          isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-200 border-slate-300"
        }`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, xpPercent)}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
        </div>
      </div>

      {/* Interactive Badges Row */}
      <div className="mt-5 pt-4 border-t border-slate-700/30 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider opacity-60 flex-shrink-0">
          Badges:
        </span>
        {(gamification.badges || []).map((badge) => (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.06 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 border transition cursor-pointer ${
              badge.unlocked
                ? isDark
                  ? "bg-amber-400/20 text-amber-200 border-amber-400/40 shadow-xs"
                  : "bg-amber-100 text-amber-900 border-amber-300 shadow-xs"
                : isDark
                ? "bg-slate-950/40 text-slate-500 border-slate-800 opacity-50"
                : "bg-slate-100 text-slate-400 border-slate-200 opacity-50"
            }`}
            title={`${badge.name}: ${badge.description}`}
          >
            <span>{badge.icon}</span>
            <span>{badge.name}</span>
            {badge.unlocked ? (
              <Check className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 opacity-60" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
