import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  FileCheck2,
  FileWarning,
  Satellite,
  FlaskConical,
  Receipt,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "../lib/cn";
import { fmtRins, fmtUSD, fmtUSDCompact } from "../lib/format";
import type { RinLot } from "../types/rin";
import { getRiskTier } from "../data/rinLots";
import RiskBadge from "./RiskBadge";

interface SelectedLotPanelProps {
  lot: RinLot | null;
  onClose: () => void;
  onAudit: () => void;
  onViewPurchaseInfo: () => void;
  onAddToCompare?: (lot: RinLot) => void;
}

const tierText = {
  low: "text-cyan-glow",
  medium: "text-amber-glow",
  high: "text-rose-glow",
} as const;

const tierPillBg = {
  low: "bg-cyan-glow/15 text-cyan-glow border-cyan-glow/30",
  medium: "bg-amber-glow/15 text-amber-glow border-amber-glow/30",
  high: "bg-rose-glow/15 text-rose-glow border-rose-glow/30",
} as const;

const tierRecommendationBg = {
  low: "bg-cyan-glow/10 border-cyan-glow/20",
  medium: "bg-amber-glow/10 border-amber-glow/20",
  high: "bg-rose-glow/10 border-rose-glow/20",
} as const;

const tierSeverity = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

interface StatProps {
  icon: typeof Layers;
  label: string;
  value: string;
  valueClass?: string;
}

function Stat({ icon: Icon, label, value, valueClass }: StatProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon size={12} strokeWidth={2} />
        <span className="label-mono">{label}</span>
      </div>
      <div
        className={cn(
          "font-mono text-base text-white tabular-nums",
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

interface RowProps {
  icon: typeof Building2;
  label: string;
  value: string;
  valueClass?: string;
  trailing?: React.ReactNode;
}

function Row({ icon: Icon, label, value, valueClass, trailing }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon
          size={14}
          strokeWidth={2}
          className="mt-0.5 text-white/60 shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="label-mono">{label}</span>
          <span
            className={cn(
              "text-sm text-white/90 truncate",
              valueClass,
            )}
            title={value}
          >
            {value}
          </span>
        </div>
      </div>
      {trailing}
    </div>
  );
}

function Divider() {
  return <div className="hairline" />;
}

export default function SelectedLotPanel({
  lot,
  onClose,
  onAudit,
  onViewPurchaseInfo,
  onAddToCompare,
}: SelectedLotPanelProps) {
  return (
    <AnimatePresence>
      {lot && (
        <motion.aside
          key={lot.id}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass fixed right-6 top-6 bottom-6 w-[420px] z-30 overflow-y-auto"
        >
          <PanelBody
            lot={lot}
            onClose={onClose}
            onAudit={onAudit}
            onViewPurchaseInfo={onViewPurchaseInfo}
            onAddToCompare={onAddToCompare}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

interface PanelBodyProps {
  lot: RinLot;
  onClose: () => void;
  onAudit: () => void;
  onViewPurchaseInfo: () => void;
  onAddToCompare?: (lot: RinLot) => void;
}

function PanelBody({
  lot,
  onClose,
  onAudit,
  onViewPurchaseInfo,
  onAddToCompare,
}: PanelBodyProps) {
  const tier = getRiskTier(lot.riskScore);
  const estimatedTotal = lot.quantity * lot.price;
  const qapVerified = lot.qapStatus === "Verified";

  const qapDotColor = qapVerified
    ? "bg-cyan-glow"
    : lot.qapStatus === "Partial"
      ? "bg-amber-glow"
      : "bg-rose-glow";

  const satLower = lot.satelliteStatus.toLowerCase();
  const satColor = satLower.includes("no major")
    ? "text-cyan-glow"
    : satLower.includes("mismatch") || satLower.includes("review")
      ? "text-amber-glow"
      : "text-white/80";

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-white/60">
            {lot.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-full p-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <X size={14} strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="font-display font-bold text-3xl text-white leading-none">
            {lot.dCode}
          </div>
          <span
            className={cn(
              "pill border font-mono",
              tierPillBg[tier],
            )}
          >
            {lot.orinGrade}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium text-white/90">
            {lot.type}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/65">
            <MapPin size={13} strokeWidth={2} />
            <span>{lot.city}</span>
          </div>
        </div>
      </div>

      <Divider />

      <div className="px-6 py-5 grid grid-cols-2 gap-5">
        <Stat
          icon={Layers}
          label="Quantity"
          value={fmtRins(lot.quantity)}
        />
        <Stat
          icon={Calendar}
          label="Vintage"
          value={String(lot.vintage)}
        />
        <Stat
          icon={DollarSign}
          label="Price per RIN"
          value={fmtUSD(lot.price)}
        />
        <Stat
          icon={Receipt}
          label="Est. Total Value"
          value={fmtUSDCompact(estimatedTotal)}
          valueClass="text-white"
        />
      </div>

      <Divider />

      <div className="px-6 py-5 flex flex-col gap-4">
        <Row icon={Building2} label="Seller" value={lot.seller} />
        <Row icon={FlaskConical} label="Facility" value={lot.facility} />
      </div>

      <Divider />

      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <span className="label-mono">ORIN Grade</span>
          <span
            className={cn(
              "font-display font-bold text-3xl leading-none",
              tierText[tier],
            )}
          >
            {lot.orinGrade}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="label-mono">Risk Score</span>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "font-mono text-xl font-bold tabular-nums",
                tierText[tier],
              )}
            >
              {Math.round(lot.riskScore)}
            </span>
            <RiskBadge severity={tierSeverity[tier]} size="sm" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="label-mono">QAP Status</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block rounded-full h-1.5 w-1.5",
                qapDotColor,
              )}
            />
            {qapVerified ? (
              <FileCheck2
                size={14}
                strokeWidth={2}
                className="text-cyan-glow"
              />
            ) : (
              <FileWarning
                size={14}
                strokeWidth={2}
                className={
                  lot.qapStatus === "Partial"
                    ? "text-amber-glow"
                    : "text-rose-glow"
                }
              />
            )}
            <span className="font-mono text-sm text-white/90">
              {lot.qapStatus}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <span className="label-mono mt-0.5">Satellite</span>
          <div className="flex items-start gap-2 max-w-[240px] text-right">
            <Satellite
              size={14}
              strokeWidth={2}
              className={cn("mt-0.5 shrink-0", satColor)}
            />
            <span className={cn("text-sm", satColor)}>
              {lot.satelliteStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-5">
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            tierRecommendationBg[tier],
          )}
        >
          <div className="label-mono mb-1.5">Recommendation</div>
          <p className="italic text-sm text-white/85 leading-relaxed">
            {lot.recommendation}
          </p>
        </div>
      </div>

      <Divider />

      <div className="px-6 py-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onAudit}
          className="btn-primary justify-center w-full"
        >
          <Sparkles size={15} strokeWidth={2.25} />
          Audit RIN
        </button>
        <button
          type="button"
          onClick={onViewPurchaseInfo}
          className="btn-ghost justify-center w-full"
        >
          <Receipt size={15} strokeWidth={2} />
          View Purchase Info
        </button>
        {onAddToCompare && (
          <button
            type="button"
            onClick={() => onAddToCompare(lot)}
            className="btn-ghost justify-center w-full"
          >
            <Plus size={15} strokeWidth={2} />
            Add to Compare
          </button>
        )}
      </div>

      <div className="px-6 pb-6 mt-auto">
        <p className="text-[10px] leading-relaxed text-white/40">
          ORIN flags diligence risk before purchase. ORIN does not accuse
          sellers of fraud.
        </p>
      </div>
    </div>
  );
}
