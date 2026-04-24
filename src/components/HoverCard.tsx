import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Calendar,
  DollarSign,
  Activity,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/cn";
import { fmtRins, fmtUSD } from "../lib/format";
import type { RinLot } from "../types/rin";
import { getRiskTier } from "../data/rinLots";

interface HoverCardProps {
  lot: RinLot;
  x: number;
  y: number;
  visible: boolean;
}

const gradePillStyles = {
  low: "bg-cyan-glow/15 text-cyan-glow border-cyan-glow/30",
  medium: "bg-amber-glow/15 text-amber-glow border-amber-glow/30",
  high: "bg-rose-glow/15 text-rose-glow border-rose-glow/30",
} as const;

interface DatumProps {
  icon: typeof Layers;
  label: string;
  value: string;
  valueClass?: string;
}

function Datum({ icon: Icon, label, value, valueClass }: DatumProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon size={11} strokeWidth={2} />
        <span className="label-mono">{label}</span>
      </div>
      <div
        className={cn(
          "font-mono text-sm text-white tabular-nums",
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function HoverCard({ lot, x, y, visible }: HoverCardProps) {
  const tier = getRiskTier(lot.riskScore);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={lot.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="fixed pointer-events-none z-40"
          style={{ left: x + 16, top: y + 16 }}
        >
          <div
            className="glass px-4 py-3 flex flex-col gap-2.5"
            style={{ width: 280 }}
          >
            <div className="flex items-center justify-between">
              <span className="pill bg-white/10 text-white/90 border border-white/15">
                {lot.dCode}
              </span>
              <span
                className={cn(
                  "pill border font-mono",
                  gradePillStyles[tier],
                )}
              >
                {lot.orinGrade}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold text-white leading-tight">
                {lot.type}
              </div>
              <div className="text-xs text-white/70">{lot.city}</div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-3">
              <Datum
                icon={Layers}
                label="Quantity"
                value={fmtRins(lot.quantity)}
              />
              <Datum
                icon={Calendar}
                label="Vintage"
                value={String(lot.vintage)}
              />
              <Datum
                icon={DollarSign}
                label="Price"
                value={fmtUSD(lot.price)}
              />
              <Datum
                icon={Activity}
                label="Risk Score"
                value={`${Math.round(lot.riskScore)} / 100`}
                valueClass={
                  tier === "low"
                    ? "text-cyan-glow"
                    : tier === "medium"
                      ? "text-amber-glow"
                      : "text-rose-glow"
                }
              />
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-end gap-1 text-[11px] text-white/60 font-mono uppercase tracking-[0.14em]">
              <span>Click to audit</span>
              <ArrowRight size={11} strokeWidth={2} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
