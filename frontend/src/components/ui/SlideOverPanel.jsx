import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * SlideOverPanel — Animated drawer that slides in from the right.
 *
 * Usage:
 *   <SlideOverPanel
 *     open={isPanelOpen}
 *     onClose={() => setIsPanelOpen(false)}
 *     title="Node Details"
 *   >
 *     <p>Content here</p>
 *   </SlideOverPanel>
 */
function SlideOverPanel({
  open,
  onClose,
  title,
  subtitle,
  width = "max-w-lg",
  children,
  className,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full",
              width,
              "bg-white dark:bg-slate-900 shadow-2xl",
              "border-l border-slate-200 dark:border-slate-800",
              "flex flex-col",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                {title && (
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { SlideOverPanel };
