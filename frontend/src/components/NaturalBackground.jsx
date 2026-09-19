import React from "react";

export default function NaturalBackground({ isDark = false }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-500">
      {/* Base background color */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"
        }`}
      />

      {/* Subtle top ambient radial lighting */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isDark
            ? "bg-gradient-to-b from-indigo-900/30 via-slate-900/10 to-transparent opacity-70"
            : "bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent opacity-80"
        }`}
      />

      {/* Natural CSS Engineering Grid Pattern */}
      <div
        className="absolute inset-0 opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(51, 65, 85, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 65, 85, 0.1) 1px, transparent 1px)`
            : `radial-gradient(rgba(99, 102, 241, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)`,
          backgroundSize: "24px 24px, 48px 48px, 48px 48px",
        }}
      />
    </div>
  );
}
