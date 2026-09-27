import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Button — Styled button primitive.
 *
 * Variants: primary, secondary, ghost, accent, danger, outline
 * Sizes: sm, default, lg, icon
 */
const variantClasses = {
  primary: "vce-btn-primary",
  secondary: "vce-btn-secondary",
  ghost: "vce-btn-ghost",
  accent: "vce-btn-accent",
  danger: "vce-btn-danger",
  outline:
    "vce-btn border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
};

const sizeClasses = {
  sm: "vce-btn-sm",
  default: "",
  lg: "vce-btn-lg",
  icon: "vce-btn-icon",
};

const Button = React.forwardRef(
  (
    {
      variant = "primary",
      size = "default",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className={cn("flex-shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        ) : null}
        {children}
        {IconRight && !loading && (
          <IconRight className={cn("flex-shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
