import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface MarqueeProps {
  children: ReactNode;
  speed?: number | string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  fade?: boolean;
  vertical?: boolean;
}

const formatDuration = (speed: number | string): string => {
  if (typeof speed === "number") return `${speed}s`;
  return speed;
};

export function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  reverse = false,
  className,
  fade = true,
  vertical = false,
}: MarqueeProps) {
  const id = useId().replace(/[:]/g, "");
  const animName = vertical
    ? `marqueeVert-${id}`
    : `marqueeHoriz-${id}`;
  const dir = reverse ? "reverse" : "normal";

  const fadeMaskHoriz =
    "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)";
  const fadeMaskVert =
    "linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%)";

  const wrapStyle = fade
    ? {
        WebkitMaskImage: vertical ? fadeMaskVert : fadeMaskHoriz,
        maskImage: vertical ? fadeMaskVert : fadeMaskHoriz,
      }
    : undefined;

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        vertical ? "flex flex-col h-full" : "flex w-full",
        className
      )}
      style={wrapStyle}
    >
      <style>{`
        @keyframes ${animName} {
          0% { transform: ${vertical ? "translateY(0)" : "translateX(0)"}; }
          100% { transform: ${vertical ? "translateY(-50%)" : "translateX(-50%)"}; }
        }
        .marquee-track-${id} {
          animation: ${animName} ${formatDuration(speed)} linear infinite ${dir};
          ${vertical ? "flex-direction: column;" : "flex-direction: row;"}
        }
        ${pauseOnHover ? `.group:hover .marquee-track-${id} { animation-play-state: paused; }` : ""}
      `}</style>
      <div
        className={cn(
          `marquee-track-${id} flex shrink-0 items-center gap-6`,
          vertical ? "h-full" : "w-max"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-6",
            vertical && "flex-col"
          )}
          aria-hidden={false}
        >
          {children}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-6",
            vertical && "flex-col"
          )}
          aria-hidden
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default Marquee;
