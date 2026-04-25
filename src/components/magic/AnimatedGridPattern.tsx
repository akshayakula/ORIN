import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

export interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  gridLines?: boolean;
  squares?: number;
  className?: string;
  strokeDasharray?: string | number;
  maxOpacity?: number;
}

interface GridSquare {
  id: number;
  x: number;
  y: number;
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  gridLines = true,
  squares = 20,
  className,
  strokeDasharray = "0",
  maxOpacity = 0.6,
}: AnimatedGridPatternProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setDimensions({ width: w, height: h });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cols = Math.max(1, Math.floor(dimensions.width / width));
  const rows = Math.max(1, Math.floor(dimensions.height / height));

  const initialSquares = useMemo<GridSquare[]>(() => {
    return Array.from({ length: squares }).map((_, i) => ({
      id: i,
      x: Math.floor(Math.random() * Math.max(cols, 1)),
      y: Math.floor(Math.random() * Math.max(rows, 1)),
    }));
  }, [squares, cols, rows]);

  const [activeSquares, setActiveSquares] = useState<GridSquare[]>(initialSquares);

  useEffect(() => {
    setActiveSquares(initialSquares);
  }, [initialSquares]);

  useEffect(() => {
    if (cols < 1 || rows < 1) return;
    const interval = window.setInterval(() => {
      setActiveSquares((prev) =>
        prev.map((sq) => ({
          id: sq.id,
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
        }))
      );
    }, 3000);
    return () => window.clearInterval(interval);
  }, [cols, rows]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none",
        className
      )}
      aria-hidden
    >
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0 h-full w-full text-white/15"
      >
        {gridLines && (
          <defs>
            <pattern
              id={`grid-${id}`}
              width={width}
              height={height}
              patternUnits="userSpaceOnUse"
              x="-1"
              y="-1"
            >
              <path
                d={`M ${width} 0 L 0 0 0 ${height}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray={strokeDasharray}
              />
            </pattern>
          </defs>
        )}
        {gridLines && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#grid-${id})`}
          />
        )}
        {activeSquares.map((sq, idx) => (
          <motion.rect
            key={`${sq.id}-${sq.x}-${sq.y}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, maxOpacity, 0] }}
            transition={{
              duration: 4,
              delay: (idx % 6) * 0.4,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
            x={sq.x * width + 1}
            y={sq.y * height + 1}
            width={width - 2}
            height={height - 2}
            fill="currentColor"
            className="text-steel-400"
          />
        ))}
      </svg>
    </div>
  );
}

export default AnimatedGridPattern;
