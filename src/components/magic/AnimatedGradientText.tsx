import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
  from?: string;
  to?: string;
  via?: string;
  durationSec?: number;
}

export function AnimatedGradientText({
  children,
  className,
  from = "#cbd5e1",
  to = "#cbd5e1",
  via = "#94a3b8",
  durationSec = 6,
}: AnimatedGradientTextProps) {
  const id = useId().replace(/[:]/g, "");
  const animName = `gradTextShift-${id}`;
  const colors = via ? `${from}, ${via}, ${to}, ${via}, ${from}` : `${from}, ${to}, ${from}`;

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <span
        className={cn("inline-block bg-clip-text text-transparent", className)}
        style={{
          backgroundImage: `linear-gradient(110deg, ${colors})`,
          backgroundSize: "200% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: `${animName} ${durationSec}s ease-in-out infinite`,
        }}
      >
        {children}
      </span>
    </>
  );
}

export default AnimatedGradientText;
