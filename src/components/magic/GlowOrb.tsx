import { useId, type CSSProperties } from "react";
import { cn } from "../../lib/cn";

export interface GlowOrbProps {
  className?: string;
  color?: string;
  size?: number;
  pulse?: boolean;
  intensity?: number;
  style?: CSSProperties;
}

export function GlowOrb({
  className,
  color = "#475569",
  size = 400,
  pulse = false,
  intensity = 0.5,
  style,
}: GlowOrbProps) {
  const id = useId().replace(/[:]/g, "");
  const animName = `orbPulse-${id}`;

  return (
    <>
      {pulse && (
        <style>{`
          @keyframes ${animName} {
            0%, 100% { transform: scale(1); opacity: ${intensity}; }
            50% { transform: scale(1.12); opacity: ${Math.min(1, intensity + 0.18)}; }
          }
        `}</style>
      )}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at center, ${color} 0%, ${color}99 30%, transparent 70%)`,
          mixBlendMode: "screen",
          opacity: intensity,
          animation: pulse ? `${animName} 4.6s ease-in-out infinite` : undefined,
          ...style,
        }}
      />
    </>
  );
}

export default GlowOrb;
