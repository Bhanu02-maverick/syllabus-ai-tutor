import React from "react";
import { cn } from "../../lib/utils";

/**
 * ProgressBar — Visual progress indicator.
 *
 * Colors auto-scale based on value (green > 80, amber > 40, indigo otherwise).
 * Optionally pass a custom `color` class.
 */
function ProgressBar({
  value = 0,
  max = 100,
  color,
  size = "default",
  showLabel = false,
  className,
  ...props
}) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
  };

  const autoColor =
    percent >= 80
      ? "bg-success-500"
      : percent >= 40
      ? "bg-warning-500"
      : "bg-primary-500";

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className={cn("vce-progress-bar flex-1", sizeClasses[size])}>
        <div
          className={cn("vce-progress-fill", color || autoColor)}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums min-w-[2.5rem] text-right">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

export { ProgressBar };
