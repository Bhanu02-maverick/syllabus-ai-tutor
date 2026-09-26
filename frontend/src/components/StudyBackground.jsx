import React from "react";

// Calm page background: a soft brand-colour glow at the top, with faint
// exam-paper ruling that fades in on reading-heavy pages (notes, revision).
export default function StudyBackground({ isDark = false, ruled = false }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Base colour */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark ? "bg-[#0B1020]" : "bg-[#F8FAFC]"
        }`}
      />

      {/* Soft top glow */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(129, 140, 248, 0.16), transparent 70%)"
            : "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(79, 70, 229, 0.10), transparent 70%)",
        }}
      />

      {/* Notebook ruling, shown only on reading pages */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
          ruled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px)"
            : "linear-gradient(rgba(79, 70, 229, 0.07) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          maskImage: "linear-gradient(to bottom, transparent, black 120px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 120px)",
        }}
      />
    </div>
  );
}
