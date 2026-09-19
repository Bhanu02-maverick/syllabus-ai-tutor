import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`relative flex items-center justify-between w-14 h-8 px-1 rounded-full transition-colors duration-300 shadow-inner cursor-pointer border ${
        isDark
          ? "bg-slate-900 border-indigo-500/40 text-amber-300"
          : "bg-slate-200 border-slate-300 text-slate-700"
      }`}
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <Sun className={`w-3.5 h-3.5 ml-1 transition-opacity ${isDark ? "opacity-30 text-slate-400" : "opacity-100 text-amber-500"}`} />
      <Moon className={`w-3.5 h-3.5 mr-1 transition-opacity ${isDark ? "opacity-100 text-indigo-300" : "opacity-30 text-slate-400"}`} />

      <motion.div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
          isDark
            ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white"
            : "bg-white text-amber-500"
        }`}
        animate={{
          x: isDark ? 24 : 0,
          rotate: isDark ? 360 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </motion.div>
    </motion.button>
  );
}
