import { useId, type CSSProperties } from "react";
import { cn } from "../../lib/cn";

export interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  borderWidth?: number;
}

export function BorderBeam({
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "#94a3b8",
  colorTo = "#64748b",
  className,
  borderWidth = 1.5,
}: BorderBeamProps) {
  const id = useId().replace(/[:]/g, "");
  const animName = `borderBeamSpin-${id}`;

  const style: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    padding: borderWidth,
    background: `conic-gradient(from 0deg, transparent 0%, transparent calc(100% - ${size / 4}%), ${colorFrom} calc(100% - ${size / 8}%), ${colorTo} 100%)`,
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    maskComposite: "exclude",
    pointerEvents: "none",
    animation: `${animName} ${duration}s linear infinite`,
    animationDelay: `${delay}s`,
  };

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        aria-hidden
        className={cn("absolute inset-0 rounded-[inherit]", className)}
        style={style}
      />
    </>
  );
}

export default BorderBeam;
