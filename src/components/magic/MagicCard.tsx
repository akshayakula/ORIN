import { forwardRef, useRef, type ReactNode, type CSSProperties } from "react";
import { cn } from "../../lib/cn";

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientSize?: number;
  borderColor?: string;
}

const hexToRgb = (hex: string): string => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return "34, 224, 255";
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
};

export const MagicCard = forwardRef<HTMLDivElement, MagicCardProps>(
  (
    {
      children,
      className,
      gradientColor = "#94a3b8",
      gradientOpacity = 0.10,
      gradientSize = 240,
      borderColor,
      onMouseMove,
      onMouseLeave,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    const rgb = hexToRgb(gradientColor);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      const node = innerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--mouse-x", `${x}%`);
      node.style.setProperty("--mouse-y", `${y}%`);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      const node = innerRef.current;
      if (!node) return;
      node.style.setProperty("--mouse-x", `50%`);
      node.style.setProperty("--mouse-y", `-30%`);
    };

    const cssVars: CSSProperties = {
      ["--magic-rgb" as string]: rgb,
      ["--magic-opacity" as string]: String(gradientOpacity),
      ["--magic-size" as string]: `${gradientSize}px`,
      ["--mouse-x" as string]: "50%",
      ["--mouse-y" as string]: "-30%",
      ...style,
    };

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-xl shadow-glass text-white transition-colors",
          className
        )}
        style={{
          ...cssVars,
          borderColor: borderColor ?? "rgba(255,255,255,0.15)",
        }}
        {...props}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(var(--magic-size) circle at var(--mouse-x) var(--mouse-y), rgba(var(--magic-rgb), var(--magic-opacity)), transparent 70%)",
          }}
        />
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }
);
MagicCard.displayName = "MagicCard";

export default MagicCard;
