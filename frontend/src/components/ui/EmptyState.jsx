import React from "react";
import { cn } from "../../lib/utils";

/**
 * EmptyState — Placeholder for empty data views.
 *
 * Usage:
 *   <EmptyState
 *     icon={FileText}
 *     title="No notes yet"
 *     description="Generate revision notes for a unit to get started."
 *     action={<Button variant="primary">Generate Notes</Button>}
 *   />
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
          <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
