import { cn } from "../../lib/cn";
import {
  AnimatedGridPattern,
  GlowOrb,
  Particles,
} from "../magic";

export interface ChromeBackgroundProps {
  intensity?: "low" | "medium" | "high";
  className?: string;
}

const config = {
  low: { particles: 24, gridOpacity: 0.25, orbIntensity: 0.28 },
  medium: { particles: 48, gridOpacity: 0.4, orbIntensity: 0.4 },
  high: { particles: 80, gridOpacity: 0.55, orbIntensity: 0.55 },
} as const;

export function ChromeBackground({
  intensity = "medium",
  className,
}: ChromeBackgroundProps) {
  const cfg = config[intensity];
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 -z-0 overflow-hidden pointer-events-none",
        className,
      )}
    >
      <AnimatedGridPattern
        squares={Math.round(cfg.particles / 4)}
        maxOpacity={cfg.gridOpacity}
        className="opacity-60"
      />
      <GlowOrb
        color="#475569"
        size={520}
        intensity={cfg.orbIntensity * 0.7}
        className="-top-40 -left-32"
      />
      <GlowOrb
        color="#334155"
        size={480}
        intensity={cfg.orbIntensity * 0.55}
        className="top-1/3 -right-32"
      />
      <GlowOrb
        color="#d97706"
        size={420}
        intensity={cfg.orbIntensity * 0.35}
        className="bottom-0 left-1/3"
      />
      <Particles
        quantity={cfg.particles}
        size={1.2}
        color="#94a3b8"
        className="opacity-50"
      />
    </div>
  );
}

export default ChromeBackground;
