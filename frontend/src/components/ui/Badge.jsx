import React from "react";
import { cn } from "../../lib/utils";

/**
 * Badge — Status/label indicator.
 *
 * Variants: primary, success, warning, danger, neutral, accent
 * Sizes: sm, default, lg
 */
const variantMap = {
  primary: "vce-badge-primary",
  success: "vce-badge-success",
  warning: "vce-badge-warning",
  danger: "vce-badge-danger",
  neutral: "vce-badge-neutral",
  accent:
    "vce-badge bg-accent-50 text-accent-700 border border-accent-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
};

const sizeMap = {
  sm: "text-[10px] px-2 py-px",
  default: "",
  lg: "text-sm px-3 py-1",
};

function Badge({
  variant = "neutral",
  size = "default",
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(variantMap[variant], sizeMap[size], className)}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
      {children}
    </span>
  );
}

export { Badge };
