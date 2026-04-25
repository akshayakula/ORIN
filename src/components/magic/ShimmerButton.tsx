import { forwardRef, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  shimmerColor?: string;
  background?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      children,
      className,
      shimmerColor = "rgba(255,255,255,0.45)",
      background,
      type,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40",
          className
        )}
        style={{
          background:
            background ??
            "linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(203,213,225,0.10) 50%, rgba(148,163,184,0.12) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 18px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
        {...props}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current to-transparent opacity-40 group-hover:translate-x-full transition-transform duration-700 ease-out"
          style={{ color: shimmerColor }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-shimmer"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.35) 55%, transparent 70%)",
            backgroundSize: "200% 100%",
            mixBlendMode: "overlay",
          }}
        />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
ShimmerButton.displayName = "ShimmerButton";

export default ShimmerButton;
