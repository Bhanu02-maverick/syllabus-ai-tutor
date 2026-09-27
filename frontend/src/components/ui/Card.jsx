import React from "react";
import { cn } from "../../lib/utils";

/**
 * Card — The primary surface container component.
 *
 * Variants:
 *   - default: Standard card with border and subtle shadow
 *   - elevated: More prominent shadow for floating panels
 *   - interactive: Hover lift effect for clickable cards
 *   - ghost: No border/shadow, just padding (for inline grouping)
 */
const Card = React.forwardRef(
  ({ className, variant = "default", padding = "default", children, ...props }, ref) => {
    const variants = {
      default: "vce-card",
      elevated: "vce-card shadow-elevated",
      interactive: "vce-card-interactive",
      ghost: "bg-transparent",
    };

    const paddings = {
      none: "",
      sm: "p-3",
      default: "p-5",
      lg: "p-6",
      xl: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * CardHeader — Top section of a card with title + optional description.
 */
function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * CardTitle — Main heading inside a card.
 */
function CardTitle({ className, as: Tag = "h3", children, ...props }) {
  return (
    <Tag
      className={cn(
        "text-base font-bold tracking-tight text-slate-900 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * CardDescription — Subtitle / helper text inside a card.
 */
function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * CardContent — Body content section.
 */
function CardContent({ className, children, ...props }) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter — Bottom action bar of a card.
 */
function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
