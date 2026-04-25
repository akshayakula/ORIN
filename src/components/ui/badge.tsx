import { forwardRef } from "react";
import { cn } from "../../lib/cn";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "secondary";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const baseClasses =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide border";

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-white/5 text-white/80 border-white/15",
  success:
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  warning:
    "bg-amber-500/10 text-amber-300 border-amber-500/30",
  danger:
    "bg-red-500/10 text-red-300 border-red-500/30",
  outline:
    "bg-transparent text-white border-white/25",
  secondary:
    "bg-white/10 text-white border-white/15",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export default Badge;
