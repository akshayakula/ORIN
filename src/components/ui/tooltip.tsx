import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  show: () => void;
  hide: () => void;
  delay: number;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

const useTooltipContext = () => {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip components must be inside <Tooltip>");
  return ctx;
};

export interface TooltipProps {
  children: ReactNode;
  delay?: number;
  defaultOpen?: boolean;
}

export function Tooltip({ children, delay = 200, defaultOpen = false }: TooltipProps) {
  const [open, setOpen] = useState(defaultOpen);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimers();
    showTimerRef.current = window.setTimeout(() => setOpen(true), delay);
  }, [delay, clearTimers]);

  const hide = useCallback(() => {
    clearTimers();
    hideTimerRef.current = window.setTimeout(() => setOpen(false), 80);
  }, [clearTimers]);

  return (
    <TooltipContext.Provider value={{ open, setOpen, show, hide, delay }}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

export const TooltipTrigger = forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  ({ className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
    const { show, hide } = useTooltipContext();
    return (
      <span
        ref={ref}
        className={cn("inline-flex", className)}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          show();
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e);
          hide();
        }}
        onFocus={(e) => {
          onFocus?.(e);
          show();
        }}
        onBlur={(e) => {
          onBlur?.(e);
          hide();
        }}
        {...props}
      />
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

export interface TooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom";
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({
    className,
    children,
    side = "bottom",
    onAnimationStart: _onAnimationStart,
    onAnimationEnd: _onAnimationEnd,
    onAnimationIteration: _onAnimationIteration,
    onDrag: _onDrag,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    ...props
  }, ref) => {
    const { open } = useTooltipContext();
    const positionClass =
      side === "top"
        ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
        : "top-full mt-2 left-1/2 -translate-x-1/2";
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            role="tooltip"
            className={cn(
              "pointer-events-none absolute z-50 px-2 py-1 text-xs rounded-md bg-space-800 border border-white/10 shadow-lg text-white whitespace-nowrap",
              positionClass,
              className
            )}
            initial={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
TooltipContent.displayName = "TooltipContent";
