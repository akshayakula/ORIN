import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";

export interface CountdownProps {
  to: string; // ISO time
  className?: string;
  warnSeconds?: number;
  size?: "sm" | "md" | "lg";
}

function format(ms: number): string {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Countdown({
  to,
  className,
  warnSeconds = 30,
  size = "md",
}: CountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const target = Date.parse(to);
  const remaining = Number.isFinite(target) ? target - now : 0;
  const isWarn = remaining > 0 && remaining < warnSeconds * 1000;
  const isOver = remaining <= 0;

  const sizeClass =
    size === "lg"
      ? "text-5xl"
      : size === "sm"
        ? "text-sm"
        : "text-2xl";

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums tracking-tight",
        sizeClass,
        isOver
          ? "text-white/40"
          : isWarn
            ? "text-red-300"
            : "text-white",
        className,
      )}
      aria-label={isOver ? "Auction ended" : `Time remaining: ${format(remaining)}`}
    >
      {isOver ? "00:00" : format(remaining)}
    </span>
  );
}

export default Countdown;
