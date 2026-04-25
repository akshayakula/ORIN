import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../ui";

export interface PinDropOverlayProps {
  active: boolean;
  onCancel: () => void;
}

export function PinDropOverlay({ active, onCancel }: PinDropOverlayProps) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    // Add crosshair cursor on the body while active
    const prev = document.body.style.cursor;
    document.body.style.cursor = "crosshair";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.cursor = prev;
    };
  }, [active, onCancel]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="pin-drop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 pointer-events-none"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto absolute left-1/2 top-24 -translate-x-1/2 glass-dark flex items-center gap-3 rounded-full border border-white/15 bg-space-900/80 px-5 py-2.5 backdrop-blur-xl"
          >
            <p className="text-sm font-medium text-white">
              Click anywhere on the globe to drop your pin.
            </p>
            <span className="hidden sm:inline text-xs text-white/50">
              Press Esc to cancel
            </span>
          </motion.div>

          <div className="pointer-events-auto absolute inset-x-0 bottom-10 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="!rounded-full border border-white/20 bg-space-900/70 backdrop-blur-xl"
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel pin drop
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PinDropOverlay;
