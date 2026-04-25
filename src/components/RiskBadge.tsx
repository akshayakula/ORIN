import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "../lib/cn";

interface RiskBadgeProps {
  severity: "low" | "medium" | "high" | "critical";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<NonNullable<RiskBadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-2",
};

const iconSizePx: Record<NonNullable<RiskBadgeProps["size"]>, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

interface SeverityStyle {
  Icon: typeof ShieldCheck;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow?: string;
  pulse?: boolean;
}

const styles: Record<RiskBadgeProps["severity"], SeverityStyle> = {
  low: {
    Icon: ShieldCheck,
    label: "LOW RISK",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  medium: {
    Icon: ShieldAlert,
    label: "MEDIUM RISK",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  high: {
    Icon: ShieldX,
    label: "HIGH RISK",
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  critical: {
    Icon: ShieldX,
    label: "CRITICAL",
    color: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    pulse: true,
  },
};

export default function RiskBadge({
  severity,
  label,
  size = "md",
  className,
}: RiskBadgeProps) {
  const style = styles[severity];
  const { Icon } = style;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono uppercase tracking-[0.14em] font-semibold",
        sizeClasses[size],
        style.bg,
        style.border,
        style.color,
        style.glow,
        style.pulse && "animate-pulse",
        "border-white/20",
        className,
      )}
    >
      <Icon size={iconSizePx[size]} strokeWidth={2.25} />
      <span>{label ?? style.label}</span>
    </span>
  );
}
