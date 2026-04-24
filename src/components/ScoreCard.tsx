import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { getRiskTier } from "../data/rinLots";
import RiskBadge from "./RiskBadge";

interface ScoreCardProps {
  riskScore: number;
  grade: string;
  recommendation: string;
}

const RING_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TierStyle {
  gradientId: string;
  stops: Array<{ offset: string; color: string }>;
  text: string;
  severity: "low" | "medium" | "high";
  glow: string;
}

const tierStyles: Record<"low" | "medium" | "high", TierStyle> = {
  low: {
    gradientId: "scoreCardGradientLow",
    stops: [
      { offset: "0%", color: "#22e0ff" },
      { offset: "100%", color: "#2dd4bf" },
    ],
    text: "text-cyan-glow",
    severity: "low",
    glow: "drop-shadow(0 0 18px rgba(34, 224, 255, 0.45))",
  },
  medium: {
    gradientId: "scoreCardGradientMed",
    stops: [
      { offset: "0%", color: "#ffb547" },
      { offset: "100%", color: "#f59e0b" },
    ],
    text: "text-amber-glow",
    severity: "medium",
    glow: "drop-shadow(0 0 18px rgba(255, 181, 71, 0.45))",
  },
  high: {
    gradientId: "scoreCardGradientHigh",
    stops: [
      { offset: "0%", color: "#ff5c7a" },
      { offset: "100%", color: "#f43f5e" },
    ],
    text: "text-rose-glow",
    severity: "high",
    glow: "drop-shadow(0 0 18px rgba(255, 92, 122, 0.45))",
  },
};

export default function ScoreCard({
  riskScore,
  grade,
  recommendation,
}: ScoreCardProps) {
  const tier = getRiskTier(riskScore);
  const style = tierStyles[tier];
  const quality = Math.max(0, Math.min(100, 100 - riskScore));
  const targetOffset = CIRCUMFERENCE * (1 - quality / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
      className="glass px-8 py-7 flex flex-col items-center gap-5"
    >
      <div className="label-mono">ORIN Quality Score</div>

      <div
        className="relative"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ filter: style.glow }}
        >
          <defs>
            <linearGradient
              id={style.gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {style.stops.map((s) => (
                <stop
                  key={s.offset}
                  offset={s.offset}
                  stopColor={s.color}
                />
              ))}
            </linearGradient>
          </defs>

          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={`url(#${style.gradientId})`}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              transform: "rotate(90deg) scaleX(-1)",
              transformOrigin: "center",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              "font-display font-bold leading-none",
              style.text,
            )}
            style={{ fontSize: 64 }}
          >
            {grade}
          </div>
          <div className="label-mono mt-2">Grade</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-white/70">
            Risk Score:
          </span>
          <span
            className={cn(
              "font-mono text-2xl font-bold tabular-nums",
              style.text,
            )}
          >
            {Math.round(riskScore)}
          </span>
          <span className="font-mono text-sm text-white/40">/ 100</span>
        </div>
        <RiskBadge severity={style.severity} size="md" />
      </div>

      <p className="italic text-center text-sm text-white/80 leading-relaxed max-w-xs line-clamp-3">
        {recommendation}
      </p>
    </motion.div>
  );
}
