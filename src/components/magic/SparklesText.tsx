import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export interface SparklesTextProps {
  children: ReactNode;
  className?: string;
  sparklesCount?: number;
  colors?: string[];
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  scale: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

const SparkleSvg = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 0L13.0902 7.40983L20.5 10L13.0902 12.5902L10.5 20L7.90983 12.5902L0.5 10L7.90983 7.40983L10.5 0Z"
      fill={color}
    />
  </svg>
);

export function SparklesText({
  children,
  className,
  sparklesCount = 10,
  colors = ["#cbd5e1", "#94a3b8", "#d97706"],
}: SparklesTextProps) {
  const generate = useMemo(
    () => () =>
      Array.from({ length: sparklesCount }).map((_, i) => ({
        id: i + Math.random() * 1000,
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.4 + Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        delay: Math.random() * 1.5,
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
      })),
    [sparklesCount, colors]
  );

  const [sparkles, setSparkles] = useState<Sparkle[]>(() => generate());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSparkles(generate());
    }, 2400);
    return () => window.clearInterval(interval);
  }, [generate]);

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative z-10">{children}</span>
      <span aria-hidden className="pointer-events-none absolute inset-0">
        {sparkles.map((s) => (
          <motion.span
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, s.scale, 0],
            }}
            transition={{
              duration: 1.6,
              delay: s.delay,
              repeat: Infinity,
              repeatDelay: 0.6,
              ease: "easeInOut",
            }}
          >
            <SparkleSvg color={s.color} size={s.size} />
          </motion.span>
        ))}
      </span>
    </span>
  );
}

export default SparklesText;
