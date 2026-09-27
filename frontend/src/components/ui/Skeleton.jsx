import React from "react";
import { cn } from "../../lib/utils";

/**
 * Skeleton — Loading placeholder with shimmer effect.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />           // text line
 *   <Skeleton className="h-10 w-10 rounded-full" />  // avatar
 *   <Skeleton className="h-32 w-full" />         // card content
 */
function Skeleton({ className, shimmer = false, ...props }) {
  return (
    <div
      className={cn(
        shimmer ? "vce-shimmer" : "vce-skeleton",
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonCard — Pre-composed card skeleton for loading states.
 */
function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn("vce-card p-5 space-y-4", className)}>
      {/* Header area */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      {/* Body lines */}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonText — Multiple shimmer lines for text content.
 */
function SkeletonText({ lines = 4, className }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{
            width: i === lines - 1 ? "60%" : `${90 - Math.random() * 20}%`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonTable — Skeleton for tabular data.
 */
function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 py-1.5">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonTable };
