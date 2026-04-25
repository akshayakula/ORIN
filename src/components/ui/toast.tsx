import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type ToastVariant = "default" | "success" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
}

type Listener = (toasts: ToastItem[]) => void;

const listeners = new Set<Listener>();
let toastQueue: ToastItem[] = [];
let toastIdCounter = 0;

const emit = () => {
  for (const listener of listeners) listener(toastQueue);
};

export const toast = (opts: ToastOptions): number => {
  const id = ++toastIdCounter;
  const item: ToastItem = {
    id,
    title: opts.title,
    description: opts.description,
    variant: opts.variant ?? "default",
    duration: opts.duration ?? 4000,
  };
  toastQueue = [...toastQueue, item];
  emit();
  if (item.duration && item.duration > 0) {
    window.setTimeout(() => dismissToast(id), item.duration);
  }
  return id;
};

export const dismissToast = (id: number) => {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  emit();
};

const accent: Record<ToastVariant, string> = {
  default: "bg-steel-400",
  success: "bg-emerald-400",
  danger: "bg-red-400",
};

const iconFor = (variant: ToastVariant) => {
  if (variant === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (variant === "danger") return <AlertTriangle className="h-4 w-4 text-red-300" />;
  return <Info className="h-4 w-4 text-white/70" />;
};

export interface ToasterProps {
  className?: string;
}

export function Toaster({ className }: ToasterProps) {
  const [items, setItems] = useState<ToastItem[]>(toastQueue);

  useEffect(() => {
    const listener: Listener = (next) => setItems(next);
    listeners.add(listener);
    listener(toastQueue);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none",
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-auto relative w-[320px] rounded-xl border border-white/15 bg-space-800/90 backdrop-blur-xl shadow-glass overflow-hidden"
            role="status"
          >
            <div className={cn("absolute inset-y-0 left-0 w-1", accent[t.variant ?? "default"])} aria-hidden />
            <div className="flex items-start gap-3 pl-4 pr-3 py-3">
              <span className="mt-0.5">{iconFor(t.variant ?? "default")}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                className="text-white/40 hover:text-white/80 transition rounded p-1 -mr-1 -mt-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default Toaster;
