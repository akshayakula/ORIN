import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { cn } from "../lib/cn";
import type { RinLot } from "../types/rin";

interface AuditLoadingProps {
  lot: RinLot;
  onComplete: () => void;
}

const STEPS = [
  "Checking QAP provider",
  "Matching seller and facility identity",
  "Scanning satellite methane signals",
  "Checking NASA thermal / flare anomalies",
  "Sampling ambient air quality",
  "Reviewing production plausibility",
  "Generating diligence packet",
] as const;

const STEP_DURATION = 300; // ms per step transition
const INITIAL_DELAY = 120; // ms before first step goes running
const FINAL_HOLD = 220; // ms after last step completes before onComplete

type StepState = "idle" | "running" | "done";

interface RightLabelProps {
  state: StepState;
}

function RightLabel({ state }: RightLabelProps) {
  return (
    <div className="relative h-4 w-[68px] overflow-hidden text-right">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "absolute inset-0 font-mono text-[10px] tracking-[0.14em] uppercase",
            state === "idle" && "text-white/30",
            state === "running" && "text-steel-300",
            state === "done" && "text-white/60",
          )}
        >
          {state === "idle"
            ? "queued"
            : state === "running"
              ? "scanning…"
              : "ok"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

interface StatusIndicatorProps {
  state: StepState;
}

function StatusIndicator({ state }: StatusIndicatorProps) {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="h-4 w-4 rounded-full ring-1 ring-inset ring-white/15"
          />
        )}
        {state === "running" && (
          <motion.div
            key="running"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex h-6 w-6 items-center justify-center"
          >
            <Loader2
              size={18}
              className="animate-spin text-steel-300"
              strokeWidth={2.25}
            />
          </motion.div>
        )}
        {state === "done" && (
          <motion.div
            key="done"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/30"
          >
            <Check
              size={14}
              className="text-emerald-300"
              strokeWidth={2.75}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuditLoading({ lot, onComplete }: AuditLoadingProps) {
  const [states, setStates] = useState<StepState[]>(() =>
    STEPS.map(() => "idle"),
  );

  useEffect(() => {
    const timers: number[] = [];

    // Advance step by step. For each step i:
    //   at time t_i: set step i to "running"
    //   at time t_i + STEP_DURATION: set step i to "done"
    // Then after the last step, call onComplete.
    for (let i = 0; i < STEPS.length; i++) {
      const runAt = INITIAL_DELAY + i * STEP_DURATION;
      timers.push(
        window.setTimeout(() => {
          setStates((prev) => {
            const next = [...prev];
            next[i] = "running";
            return next;
          });
        }, runAt),
      );
      timers.push(
        window.setTimeout(() => {
          setStates((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });
        }, runAt + STEP_DURATION),
      );
    }

    const totalMs =
      INITIAL_DELAY + STEPS.length * STEP_DURATION + FINAL_HOLD;
    timers.push(
      window.setTimeout(() => {
        onComplete();
      }, totalMs),
    );

    return () => {
      for (const t of timers) {
        window.clearTimeout(t);
      }
    };
  }, [onComplete]);

  const doneCount = states.filter((s) => s === "done").length;
  const runningCount = states.filter((s) => s === "running").length;
  // Count running as half-progress so the bar feels alive.
  const progress = Math.min(
    100,
    ((doneCount + runningCount * 0.5) / STEPS.length) * 100,
  );

  return (
    <div className="fixed inset-0 z-30 grid place-items-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative max-w-lg w-[92vw] p-7 pointer-events-auto overflow-hidden"
      >
        <div className="scan-overlay" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="label-mono">ORIN INTEGRITY AUDIT</div>
            <h2 className="text-2xl font-semibold leading-tight">
              Running ORIN Integrity Audit
            </h2>
            <div className="text-sm text-white/60">
              Lot <span className="font-mono text-white/80">{lot.id}</span>
              <span className="mx-1.5 text-white/30">·</span>
              <span>{lot.city}</span>
            </div>
          </div>

          <div className="hairline" />

          <ul className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => {
              const state = states[i];
              return (
                <motion.li
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.05 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5",
                    "bg-white/[0.03] border border-white/10",
                    state === "running" &&
                      "bg-steel-400/[0.06] border-steel-400/20",
                    state === "done" && "bg-white/[0.04] border-white/10",
                  )}
                >
                  <StatusIndicator state={state} />
                  <span
                    className={cn(
                      "flex-1 text-sm transition-colors",
                      state === "idle" && "text-white/50",
                      state === "running" && "text-white",
                      state === "done" && "text-white/75",
                    )}
                  >
                    {step}
                  </span>
                  <RightLabel state={state} />
                </motion.li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              <span>Audit progress</span>
              <span className="tabular-nums text-white/60">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-steel-300"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <p className="text-[10px] leading-relaxed text-white/40 text-center">
            ORIN does not accuse sellers of fraud. ORIN flags diligence risk
            before purchase.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
