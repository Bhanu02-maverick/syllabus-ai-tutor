import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Star, Award, Zap, Shield, Sparkles } from "lucide-react";

export default function GamificationConstellation({ gamification, isDark = true }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const level = gamification?.level || 1;
  const levelTitle = gamification?.level_title || "Scholar";
  const xp = gamification?.xp || 0;
  const nextLevelXp = gamification?.next_level_xp || 100;
  const streak = gamification?.streak_days || 0;
  const badges = gamification?.badges || [];

  // Constellation nodes positioning logic
  const constellationNodes = [
    {
      id: "level",
      x: 120,
      y: 70,
      label: `Level ${level}: ${levelTitle}`,
      icon: Trophy,
      unlocked: true,
      desc: `${xp} / ${nextLevelXp} XP to next level`,
      glowColor: "from-amber-400 to-orange-500",
    },
    {
      id: "streak",
      x: 280,
      y: 40,
      label: `${streak} Day Streak`,
      icon: Flame,
      unlocked: streak > 0,
      desc: streak > 0 ? "Daily study streak active!" : "Complete a quiz today to start a streak",
      glowColor: "from-red-500 to-amber-500",
    },
    {
      id: "quiz_master",
      x: 420,
      y: 100,
      label: "Quiz Master",
      icon: Award,
      unlocked: badges.some((b) => b.id === "quiz_master" || b.unlocked),
      desc: "Scored 80%+ on 3 quizzes",
      glowColor: "from-blue-400 to-indigo-500",
    },
    {
      id: "scholar",
      x: 230,
      y: 150,
      label: "Syllabus Conqueror",
      icon: Star,
      unlocked: level >= 2,
      desc: "Reach Level 2 in course progress",
      glowColor: "from-purple-400 to-pink-500",
    },
    {
      id: "speed_demon",
      x: 350,
      y: 190,
      label: "Fast Learner",
      icon: Zap,
      unlocked: level >= 3,
      desc: "Complete 10 syllabus questions",
      glowColor: "from-emerald-400 to-teal-500",
    },
  ];

  // Connecting line segments between constellation stars
  const connections = [
    { from: "level", to: "streak" },
    { from: "level", to: "scholar" },
    { from: "streak", to: "quiz_master" },
    { from: "scholar", to: "quiz_master" },
    { from: "scholar", to: "speed_demon" },
  ];

  return (
    <div className={`relative p-6 rounded-3xl border transition shadow-lg overflow-hidden ${
      isDark ? "bg-slate-900/90 border-slate-800 shadow-indigo-950/20" : "bg-white border-slate-200 shadow-slate-200/50"
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 z-10 relative">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${
            isDark ? "bg-indigo-950/80 border-indigo-700/50 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
          }`}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
              Knowledge Constellation
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Interactive achievement map & progress graph
            </p>
          </div>
        </div>

        {/* Level XP Pill */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
          isDark ? "bg-slate-800/80 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
        }`}>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Flame className="w-4 h-4 animate-bounce" />
            <span>{streak} Days</span>
          </div>
          <span className="text-slate-500">•</span>
          <div className="text-xs font-bold text-indigo-400">
            Level {level}: {levelTitle} ({xp} XP)
          </div>
        </div>
      </div>

      {/* Constellation Canvas Viewport */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950/40 via-slate-900/20 to-transparent flex items-center justify-center border border-slate-800/40">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 540 240">
          {/* Constellation connecting lines */}
          {connections.map((c, i) => {
            const n1 = constellationNodes.find((n) => n.id === c.from);
            const n2 = constellationNodes.find((n) => n.id === c.to);
            if (!n1 || !n2) return null;
            const isBothUnlocked = n1.unlocked && n2.unlocked;

            return (
              <line
                key={i}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke={isBothUnlocked ? (isDark ? "rgba(129, 140, 248, 0.6)" : "rgba(99, 102, 241, 0.4)") : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")}
                strokeWidth={isBothUnlocked ? "2" : "1"}
                strokeDasharray={isBothUnlocked ? "none" : "4 4"}
              />
            );
          })}
        </svg>

        {/* Constellation Star Nodes */}
        {constellationNodes.map((node) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.id}
              style={{ left: `${(node.x / 540) * 100}%`, top: `${(node.y / 240) * 100}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              whileHover={{ scale: 1.25 }}
              onClick={() => setSelectedNode(node)}
            >
              {/* Radial glow background */}
              {node.unlocked && (
                <div className={`absolute -inset-2 rounded-full bg-gradient-to-r ${node.glowColor} opacity-50 blur-sm animate-pulse`} />
              )}

              <div
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md transition ${
                  node.unlocked
                    ? isDark
                      ? "bg-slate-900 border-indigo-500/70 text-indigo-300 shadow-indigo-500/30"
                      : "bg-white border-indigo-400 text-indigo-600 shadow-indigo-200"
                    : isDark
                    ? "bg-slate-950/80 border-slate-800 text-slate-600 opacity-60"
                    : "bg-slate-100 border-slate-300 text-slate-400 opacity-60"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}

        {/* Floating Glass Tooltip for Selected Node */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl border shadow-xl backdrop-blur-md z-20 flex items-center gap-3 ${
                isDark ? "bg-slate-900/95 border-indigo-500/40 text-white" : "bg-white/95 border-indigo-200 text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedNode.unlocked ? "bg-emerald-400 shadow-emerald-400/50" : "bg-slate-500"}`} />
                <span className="font-bold text-xs">{selectedNode.label}:</span>
                <span className="text-xs text-slate-400">{selectedNode.desc}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
