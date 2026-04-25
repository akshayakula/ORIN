import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

const useSheet = () => {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet>");
  return ctx;
};

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: "right" | "left";
  showClose?: boolean;
}

export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      className,
      children,
      side = "right",
      showClose = true,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      ...props
    },
    ref
  ) => {
    const { open, onOpenChange } = useSheet();
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      window.addEventListener("keydown", handleKey);
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const focusable = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKey);
        document.body.style.overflow = originalOverflow;
        previouslyFocused?.focus?.();
      };
    }, [open, onOpenChange]);

    if (typeof document === "undefined") return null;

    const initial = side === "right" ? { x: "100%" } : { x: "-100%" };
    const animate = { x: 0 };
    const exit = side === "right" ? { x: "100%" } : { x: "-100%" };
    const sideClass =
      side === "right" ? "right-0 border-l" : "left-0 border-r";

    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onOpenChange(false)}
              aria-hidden
            />
            <motion.div
              key="content"
              ref={(node) => {
                contentRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }}
              role="dialog"
              aria-modal="true"
              className={cn(
                "fixed top-0 h-full w-[420px] max-w-[90vw] bg-space-800/95 backdrop-blur-xl border-white/15 shadow-2xl text-white p-6 overflow-y-auto",
                sideClass,
                className
              )}
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              {...props}
            >
              {showClose && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="absolute right-4 top-4 rounded-md p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-slate-300/30"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
SheetContent.displayName = "SheetContent";

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 mb-6 pr-8", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

export const SheetTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold tracking-tight text-white", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";
