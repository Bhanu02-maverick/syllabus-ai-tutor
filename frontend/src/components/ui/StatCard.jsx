import React from "react";
import { cn } from "../../lib/utils";

/**
 * StatCard — Metric display card for dashboards.
 *
 * Usage:
 *   <StatCard
 *     icon={BookOpen}
 *     label="Units Completed"
 *     value={7}
 *     trend="+12%"
 *     trendUp
 *   />
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  trendUp,
  iconColor = "text-primary-500",
  iconBg = "bg-primary-50 dark:bg-primary-950/40",
  className,
  ...props
}) {
  return (
    <div className={cn("vce-stat-card", className)} {...props}>
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={cn("p-2.5 rounded-xl", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              trendUp
                ? "text-success-700 bg-success-50 dark:text-emerald-300 dark:bg-emerald-950/40"
                : "text-danger-600 bg-danger-50 dark:text-red-300 dark:bg-red-950/40"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="vce-stat-value">{value}</div>
        <div className="vce-stat-label mt-0.5">{label}</div>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export { StatCard };
