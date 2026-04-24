import { forwardRef, cloneElement, isValidElement, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export type ButtonVariant =
  | "default"
  | "primary"
  | "ghost"
  | "danger"
  | "outline"
  | "secondary"
  | "link";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 select-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-white/10 hover:bg-white/15 border border-white/20 text-white",
  primary:
    "bg-gradient-to-b from-cyan-300/90 to-cyan-500/90 text-space-900 shadow-glowCyan hover:from-cyan-200 hover:to-cyan-400 font-semibold",
  ghost:
    "bg-white/5 hover:bg-white/10 text-white border border-white/10",
  danger:
    "bg-gradient-to-b from-rose-400/90 to-rose-600/90 text-white shadow-glowRose hover:from-rose-300 hover:to-rose-500 font-semibold",
  outline:
    "bg-transparent border border-white/30 hover:bg-white/5 text-white",
  secondary:
    "bg-white/15 hover:bg-white/25 text-white border border-white/10",
  link:
    "text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline px-0 h-auto bg-transparent border-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export const buttonVariants = (
  variant: ButtonVariant = "default",
  size: ButtonSize = "md"
): string =>
  cn(
    baseClasses,
    variantClasses[variant],
    variant === "link" ? "" : sizeClasses[size]
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      children,
      type,
      ...props
    },
    ref
  ) => {
    const composedClass = cn(buttonVariants(variant, size), className);

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<Record<string, unknown>>;
      const childProps = child.props as { className?: string } & Record<string, unknown>;
      return cloneElement(child, {
        ...props,
        className: cn(composedClass, childProps.className),
        ref,
      } as Record<string, unknown>);
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={composedClass}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
