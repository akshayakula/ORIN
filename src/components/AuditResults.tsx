import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  Sparkles,
  AlertTriangle,
  Satellite,
  FileCheck2,
  Activity,
  Globe2,
  FlaskConical,
  FileText,
  Mail,
  Gavel,
  ShoppingCart,
  ShieldAlert,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/cn";
import {
  fmtRins,
  fmtUSD,
  fmtUSDCompact,
  fmtPct,
} from "../lib/format";
import { fetchFirms } from "../lib/firms";
import type { RinLot, FirmsResponse } from "../types/rin";
import { getRiskTier } from "../data/rinLots";
import {
  getRiskFlagsForLot,
  evidenceChecklist,
  buildAnalytics,
} from "../data/riskFlags";
import { epaSummary, referencePrices } from "../data/epaContext";
import RiskBadge from "./RiskBadge";
import ScoreCard from "./ScoreCard";
import Google3DInspection from "./Google3DInspection";
import AirQualityCard from "./AirQualityCard";

interface AuditResultsProps {
  lot: RinLot;
  onBack: () => void;
  onRequestPurchase: () => void;
  onGenerateAuditPacket: () => void;
  onRequestSellerDocs: () => void;
  onStartAuction?: (lot: RinLot) => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const cardTransition = (i: number) => ({
  duration: 0.45,
  delay: 0.05 + i * 0.04,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
});

interface CardProps {
  className?: string;
  children: React.ReactNode;
  index?: number;
}

function Card({ className, children, index = 0 }: CardProps) {
  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={cardTransition(index)}
      className={cn("glass rounded-2xl p-5", className)}
    >
      {children}
    </motion.div>
  );
}

interface CardTitleProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

function CardTitle({ icon, title, subtitle, right }: CardTitleProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10 text-steel-400 [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold tracking-tight text-white">
            {title}
          </h3>
          {subtitle && (
            <div className="mt-0.5 text-[11px] text-white/50">{subtitle}</div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Purchase Information
// -----------------------------------------------------------------------------

interface PurchaseInfoProps {
  lot: RinLot;
}

function PurchaseInfo({ lot }: PurchaseInfoProps) {
  const total = lot.quantity * lot.price;
  const refs = referencePrices[lot.dCode];
  // Clamp to [0.30, 1.20] for the band scale.
  const bandMin = 0.3;
  const bandMax = 1.2;
  const clampedPrice = Math.max(bandMin, Math.min(bandMax, lot.price));
  const pricePct =
    ((clampedPrice - bandMin) / (bandMax - bandMin)) * 100;
  const lowPct = refs ? ((refs.low - bandMin) / (bandMax - bandMin)) * 100 : 0;
  const midPct = refs ? ((refs.mid - bandMin) / (bandMax - bandMin)) * 100 : 0;
  const highPct = refs
    ? ((refs.high - bandMin) / (bandMax - bandMin)) * 100
    : 0;

  let outOfBandNote: string | null = null;
  if (refs) {
    if (lot.price < refs.low)
      outOfBandNote = `Listed below reference low (${fmtUSD(refs.low)}) for ${lot.dCode}.`;
    if (lot.price > refs.high)
      outOfBandNote = `Listed above reference high (${fmtUSD(refs.high)}) for ${lot.dCode}.`;
  }

  const rows: Array<{
    label: string;
    value: React.ReactNode;
    emphasize?: boolean;
  }> = [
    { label: "D-code", value: <span className="font-mono">{lot.dCode}</span> },
    {
      label: "Quantity",
      value: (
        <span className="tabular-nums">{fmtRins(lot.quantity)} RINs</span>
      ),
    },
    { label: "Vintage", value: <span>{lot.vintage}</span> },
    {
      label: "Price per RIN",
      value: <span className="tabular-nums">{fmtUSD(lot.price)}</span>,
    },
    {
      label: "Estimated total",
      value: (
        <span className="text-xl font-semibold tabular-nums text-white">
          {fmtUSDCompact(total)}
        </span>
      ),
      emphasize: true,
    },
    { label: "Seller", value: <span>{lot.seller}</span> },
    { label: "Facility", value: <span>{lot.facility}</span> },
    { label: "City", value: <span>{lot.city}</span> },
    {
      label: "QAP provider",
      value: (
        <span
          className={cn(
            lot.qapStatus === "Verified" && "text-emerald-300",
            lot.qapStatus === "Partial" && "text-amber-300",
            lot.qapStatus === "Missing" && "text-red-300",
          )}
        >
          {lot.qapProvider}
        </span>
      ),
    },
  ];

  return (
    <>
      <CardTitle
        icon={<Receipt size={16} strokeWidth={2.25} />}
        title="Purchase Information"
        subtitle={`${lot.type} · Lot ${lot.id}`}
      />

      <div className="grid grid-cols-3 gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className={cn(
              "rounded-xl border border-white/10 bg-white/[0.03] p-3",
              r.emphasize && "border-amber-500/30 bg-amber-500/[0.05]",
            )}
          >
            <div className="label-mono">{r.label}</div>
            <div className="mt-1 text-sm text-white/90">{r.value}</div>
          </div>
        ))}
      </div>

      {refs && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <div className="label-mono">Market percentile · {lot.dCode}</div>
            <div className="font-mono text-[11px] tabular-nums text-white/70">
              {fmtUSD(refs.low)} · {fmtUSD(refs.mid)} · {fmtUSD(refs.high)}
            </div>
          </div>
          <div className="relative mt-2 h-2 rounded-full bg-white/[0.06]">
            {/* low to high band tint */}
            <div
              className="absolute inset-y-0 rounded-full bg-steel-400/10"
              style={{
                left: `${lowPct}%`,
                width: `${Math.max(0, highPct - lowPct)}%`,
              }}
            />
            {/* mid marker */}
            <div
              className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/30"
              style={{ left: `${midPct}%` }}
            />
            {/* low marker */}
            <div
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/20"
              style={{ left: `${lowPct}%` }}
            />
            {/* high marker */}
            <div
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/20"
              style={{ left: `${highPct}%` }}
            />
            {/* lot price marker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-steel-300 ring-2 ring-space-900"
              style={{ left: `${pricePct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] tabular-nums text-white/40">
            <span>{fmtUSD(bandMin)}</span>
            <span>{fmtUSD(bandMax)}</span>
          </div>
          {outOfBandNote && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/90">
              <AlertCircle size={12} strokeWidth={2.25} />
              {outOfBandNote}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-white/40">
        ORIN does not process EMTS transfers or payments.
      </p>
    </>
  );
}

// -----------------------------------------------------------------------------
// Risk Flags
// -----------------------------------------------------------------------------

interface RiskFlagsCardProps {
  lot: RinLot;
}

function RiskFlagsCard({ lot }: RiskFlagsCardProps) {
  const flags = getRiskFlagsForLot(lot);
  const hasHigh = flags.some(
    (f) => f.severity === "high" || f.severity === "critical",
  );
  const allClear = lot.riskScore <= 25 && !hasHigh;

  const severityBarColor: Record<string, string> = {
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    high: "bg-red-400",
    critical: "bg-red-500",
  };

  return (
    <>
      <CardTitle
        icon={<AlertTriangle size={16} strokeWidth={2.25} />}
        title="Risk Flags"
        subtitle={`${flags.length} flag${flags.length === 1 ? "" : "s"} reviewed`}
      />

      {allClear && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2"
        >
          <CheckCircle2 size={14} className="text-emerald-300" strokeWidth={2.5} />
          <div className="text-sm font-medium text-emerald-300">
            All checks passed
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-2.5">
        <AnimatePresence>
          {flags.map((flag, i) => (
            <motion.div
              key={`${flag.title}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{
                duration: 0.35,
                delay: 0.06 * i,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 pl-4"
            >
              <span
                className={cn(
                  "absolute left-0 top-0 h-full w-[2px]",
                  severityBarColor[flag.severity],
                )}
              />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge severity={flag.severity} size="sm" />
                  <span className="text-sm font-semibold text-white">
                    {flag.title}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/70">
                  {flag.description}
                </p>
                <div className="mt-1 rounded-lg bg-white/5 p-2 text-sm italic leading-relaxed text-white/60">
                  {flag.recommendedAction}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// NASA FIRMS Thermal Scan
// -----------------------------------------------------------------------------

interface FirmsScanProps {
  lot: RinLot;
}

function FirmsScan({ lot }: FirmsScanProps) {
  const [data, setData] = useState<FirmsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    fetchFirms(lot.lat, lot.lng, 7, ctrl.signal)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as Error)?.name === "AbortError") return;
        setFailed(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [lot.lat, lot.lng]);

  const statusTint = data
    ? data.status === "no-anomaly"
      ? {
          text: "text-emerald-300",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          dot: "#10b981",
        }
      : data.status === "low-activity"
        ? {
            text: "text-amber-300",
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            dot: "#f59e0b",
          }
        : {
            text: "text-red-300",
            bg: "bg-red-500/10",
            border: "border-red-500/30",
            dot: "#ef4444",
          }
    : null;

  return (
    <>
      <CardTitle
        icon={<Satellite size={16} strokeWidth={2.25} />}
        title="NASA FIRMS Thermal Scan"
        subtitle={data ? `Past ${data.scanDays} days` : "VIIRS · 375m"}
      />

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
          <div className="h-[120px] animate-pulse rounded-xl bg-white/5" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
        </div>
      )}

      {!loading && failed && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
          Scan unavailable — try again shortly.
        </div>
      )}

      {!loading && data && statusTint && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div>
              <div className="label-mono">Detections</div>
              <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-white">
                {data.count}
              </div>
            </div>
            <span
              className={cn(
                "pill border",
                statusTint.bg,
                statusTint.border,
                statusTint.text,
              )}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: statusTint.dot }}
              />
              {data.statusLabel}
            </span>
          </div>

          <FirmsMiniMap data={data} lot={lot} />

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60">
              Source: NASA FIRMS ·{" "}
              <span
                className={cn(
                  "font-mono uppercase tracking-wide",
                  data.source === "live"
                    ? "text-emerald-300"
                    : "text-white/50",
                )}
              >
                {data.source}
              </span>
            </span>
            <span className="font-mono text-[10px] text-white/40">
              fetchedAt: {data.fetchedAt}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

interface FirmsMiniMapProps {
  data: FirmsResponse;
  lot: RinLot;
}

function FirmsMiniMap({ data, lot }: FirmsMiniMapProps) {
  const W = 200;
  const H = 120;
  const { bbox } = data;
  const w = bbox.east - bbox.west || 1;
  const h = bbox.north - bbox.south || 1;

  const project = (lng: number, lat: number) => {
    const x = ((lng - bbox.west) / w) * W;
    const y = H - ((lat - bbox.south) / h) * H;
    return { x, y };
  };

  const center = project(lot.lng, lot.lat);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[120px] w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* grid */}
        <defs>
          <pattern
            id="firms-grid"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#firms-grid)" />

        {/* center crosshair */}
        <g opacity={0.6}>
          <circle
            cx={center.x}
            cy={center.y}
            r={4}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={0.8}
          />
          <line
            x1={center.x - 6}
            y1={center.y}
            x2={center.x + 6}
            y2={center.y}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={0.6}
          />
          <line
            x1={center.x}
            y1={center.y - 6}
            x2={center.x}
            y2={center.y + 6}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={0.6}
          />
        </g>

        {/* detections */}
        {data.detections.map((d, i) => {
          const p = project(d.longitude, d.latitude);
          const color =
            data.status === "review-recommended"
              ? "#ef4444"
              : data.status === "low-activity"
                ? "#f59e0b"
                : "#10b981";
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3.5} fill={color} opacity={0.25} />
              <circle cx={p.x} cy={p.y} r={1.6} fill={color} />
            </g>
          );
        })}
      </svg>

      <div className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        BBOX {bbox.west.toFixed(2)}, {bbox.south.toFixed(2)} →{" "}
        {bbox.east.toFixed(2)}, {bbox.north.toFixed(2)}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Evidence Reviewed
// -----------------------------------------------------------------------------

interface EvidenceCardProps {
  lot: RinLot;
}

function EvidenceCard({ lot }: EvidenceCardProps) {
  const items = useMemo(() => evidenceChecklist(lot), [lot]);
  const present = items.filter((i) => i.present).length;
  const total = items.length;
  const pct = total === 0 ? 0 : (present / total) * 100;

  return (
    <>
      <CardTitle
        icon={<FileCheck2 size={16} strokeWidth={2.25} />}
        title="Evidence Reviewed"
        subtitle={`${present}/${total} items present`}
      />

      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.25,
              delay: 0.03 * i,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2">
              {item.present ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                  <Check size={12} strokeWidth={2.75} />
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30">
                  <X size={12} strokeWidth={2.75} />
                </span>
              )}
              <span className="text-sm text-white/85">{item.label}</span>
            </div>
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.14em]",
                item.present ? "text-white/50" : "text-red-300/80",
              )}
            >
              {item.present ? "Available" : "Missing"}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full",
                pct >= 80
                  ? "bg-emerald-400"
                  : pct >= 50
                    ? "bg-amber-400"
                    : "bg-red-400",
              )}
            />
          </div>
        </div>
        <div className="font-mono text-[11px] tabular-nums text-white/60">
          {fmtPct(pct)}
        </div>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

interface AnalyticsCardProps {
  lot: RinLot;
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function AnalyticsCard({ lot }: AnalyticsCardProps) {
  const analytics = useMemo(() => buildAnalytics(lot), [lot]);
  const tier = getRiskTier(lot.riskScore);
  const refs = referencePrices[lot.dCode];

  const recText = {
    low: "text-emerald-300",
    medium: "text-amber-300",
    high: "text-red-300",
  }[tier];

  const tiles: Array<{
    label: string;
    content: React.ReactNode;
  }> = [
    {
      label: "Market Price Percentile",
      content: (
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums text-white">
            {ordinalSuffix(analytics.marketPercentile)}
          </span>
          <span className="text-xs text-white/50">vs reference band</span>
        </div>
      ),
    },
    {
      label: "Risk-Adjusted Value",
      content: (
        <span className="font-mono text-2xl font-semibold tabular-nums text-white">
          {fmtUSDCompact(analytics.riskAdjustedValue)}
        </span>
      ),
    },
    {
      label: "Document Completeness",
      content: (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums text-white">
            {fmtPct(analytics.documentCompleteness)}
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analytics.documentCompleteness}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full",
                analytics.documentCompleteness >= 80
                  ? "bg-emerald-400"
                  : analytics.documentCompleteness >= 50
                    ? "bg-amber-400"
                    : "bg-red-400",
              )}
            />
          </div>
        </div>
      ),
    },
    {
      label: "Satellite Mismatch",
      content: (
        <span
          className={cn(
            "pill border",
            analytics.satelliteMismatch
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          )}
        >
          {analytics.satelliteMismatch ? "Yes" : "No"}
        </span>
      ),
    },
    {
      label: "Replacement-Risk Exposure",
      content: (
        <span className="font-mono text-2xl font-semibold tabular-nums text-white">
          {fmtUSDCompact(analytics.replacementRiskExposure)}
        </span>
      ),
    },
    {
      label: "Risk-Adjusted Recommendation",
      content: (
        <p className={cn("text-sm font-medium leading-snug", recText)}>
          {analytics.recommendation}
        </p>
      ),
    },
  ];

  // Reference price band
  const bandMin = 0.3;
  const bandMax = 1.2;
  const priceToPct = (p: number) =>
    ((Math.max(bandMin, Math.min(bandMax, p)) - bandMin) /
      (bandMax - bandMin)) *
    100;
  const lotPct = priceToPct(lot.price);

  return (
    <>
      <CardTitle
        icon={<Activity size={16} strokeWidth={2.25} />}
        title="Analytics"
        subtitle={`Risk tier · ${tier.toUpperCase()}`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.04 * i,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="label-mono">{tile.label}</div>
            <div className="mt-2">{tile.content}</div>
          </motion.div>
        ))}
      </div>

      {refs && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="label-mono">
              Reference price band for {lot.dCode}
            </div>
            <div className="font-mono text-[11px] tabular-nums text-white/60">
              Lot {fmtUSD(lot.price)}
            </div>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-white/[0.06]">
            <div
              className="absolute inset-y-0 rounded-full bg-steel-400/10"
              style={{
                left: `${priceToPct(refs.low)}%`,
                width: `${Math.max(0, priceToPct(refs.high) - priceToPct(refs.low))}%`,
              }}
            />
            {[
              { pos: priceToPct(refs.low), label: `L ${fmtUSD(refs.low)}` },
              { pos: priceToPct(refs.mid), label: `M ${fmtUSD(refs.mid)}` },
              { pos: priceToPct(refs.high), label: `H ${fmtUSD(refs.high)}` },
            ].map((m) => (
              <div
                key={m.label}
                className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/25"
                style={{ left: `${m.pos}%` }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-steel-300 ring-2 ring-space-900"
              style={{ left: `${lotPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-white/40">
            <span>{fmtUSD(bandMin)}</span>
            <span>
              Low {fmtUSD(refs.low)} · Mid {fmtUSD(refs.mid)} · High{" "}
              {fmtUSD(refs.high)}
            </span>
            <span>{fmtUSD(bandMax)}</span>
          </div>
        </div>
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// EPA RFS Context
// -----------------------------------------------------------------------------

function EpaContextCard() {
  return (
    <>
      <CardTitle
        icon={<FlaskConical size={16} strokeWidth={2.25} />}
        title="EPA RFS Context"
        subtitle={epaSummary.fileWindow}
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {epaSummary.highlights.map((h, i) => (
          <motion.div
            key={h.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.04 * i,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="label-mono">{h.label}</div>
            <div className="mt-1 text-sm font-medium text-white/90">
              {h.value}
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-white/40">
        Synthesized from public EPA RFS reports through Mar 2026.
      </p>
    </>
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

export default function AuditResults({
  lot,
  onBack,
  onRequestPurchase,
  onGenerateAuditPacket,
  onRequestSellerDocs,
  onStartAuction,
}: AuditResultsProps) {
  const analytics = useMemo(() => buildAnalytics(lot), [lot]);
  const tier = getRiskTier(lot.riskScore);
  const isHigh = tier === "high";

  const dCodePillStyle = {
    D3: "bg-steel-400/15 border-steel-400/30 text-steel-300",
    D4: "bg-steel-400/15 border-steel-400/30 text-steel-300",
    D5: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    D6: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    D7: "bg-red-500/10 border-red-500/30 text-red-300",
  }[lot.dCode];

  return (
    <AnimatePresence>
      <motion.div
        key="audit-results"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-30"
      >
        {/* Top bar */}
        <div className="glass-dark absolute left-0 right-0 top-0 z-10 h-16 rounded-none border-0 border-b border-white/10">
          <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="btn-ghost !py-2 !px-3"
              >
                <ArrowLeft size={14} strokeWidth={2.25} />
                <span>Back to Marketplace</span>
              </button>
              <div className="mx-1 h-6 w-px bg-white/15" />
              <span className="font-mono text-sm text-white/85 truncate">
                {lot.id}
              </span>
              <span
                className={cn(
                  "pill border font-mono",
                  dCodePillStyle,
                )}
              >
                {lot.dCode}
              </span>
              <span className="hidden md:inline text-[11px] text-white/40 truncate">
                {lot.city}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGenerateAuditPacket}
                className="btn-ghost"
              >
                <FileText size={14} strokeWidth={2.25} />
                <span className="hidden sm:inline">Generate Audit Packet</span>
                <span className="sm:hidden">Packet</span>
              </button>
              {onStartAuction && (
                <button
                  type="button"
                  onClick={() => onStartAuction(lot)}
                  className="btn-ghost"
                >
                  <Gavel size={14} strokeWidth={2.25} />
                  <span className="hidden sm:inline">Start live auction</span>
                  <span className="sm:hidden">Auction</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRequestSellerDocs}
                className="btn-ghost"
              >
                <Mail size={14} strokeWidth={2.25} />
                <span className="hidden sm:inline">Request Seller Docs</span>
                <span className="sm:hidden">Docs</span>
              </button>
              <button
                type="button"
                onClick={onRequestPurchase}
                className={isHigh ? "btn-danger" : "btn-primary"}
              >
                {isHigh ? (
                  <>
                    <ShieldAlert size={14} strokeWidth={2.25} />
                    <span>Request Purchase</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} strokeWidth={2.25} />
                    <span>Request Purchase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="absolute inset-0 overflow-y-auto pt-16"
          style={{ maxHeight: "100vh" }}
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-4 p-6">
            {/* Purchase Information */}
            <div className="col-span-12 lg:col-span-5">
              <Card index={0} className="h-full">
                <PurchaseInfo lot={lot} />
              </Card>
            </div>

            {/* ORIN Quality Score */}
            <div className="col-span-12 lg:col-span-3">
              <Card index={1} className="h-full">
                <CardTitle
                  icon={<Sparkles size={16} strokeWidth={2.25} />}
                  title="ORIN Quality Score"
                />
                <ScoreCard
                  riskScore={lot.riskScore}
                  grade={lot.orinGrade}
                  recommendation={analytics.recommendation}
                />
                <p className="mt-3 text-[10px] leading-relaxed text-white/40 text-center">
                  ORIN does not certify EPA validity. ORIN does not accuse
                  sellers of fraud.
                </p>
              </Card>
            </div>

            {/* Risk Flags */}
            <div className="col-span-12 lg:col-span-4">
              <Card index={2} className="h-full">
                <RiskFlagsCard lot={lot} />
              </Card>
            </div>

            {/* NASA FIRMS Thermal Scan */}
            <div className="col-span-12 lg:col-span-4">
              <Card index={3} className="h-full">
                <FirmsScan lot={lot} />
              </Card>
            </div>

            {/* Evidence Reviewed */}
            <div className="col-span-12 lg:col-span-4">
              <Card index={4} className="h-full">
                <EvidenceCard lot={lot} />
              </Card>
            </div>

            {/* Analytics */}
            <div className="col-span-12 lg:col-span-4">
              <Card index={5} className="h-full">
                <AnalyticsCard lot={lot} />
              </Card>
            </div>

            {/* Ambient Air Quality (Google Air Quality API) */}
            <div className="col-span-12 lg:col-span-6">
              <AirQualityCard lot={lot} className="h-full" />
            </div>

            {/* Google 3D Site Inspection */}
            <div className="col-span-12 lg:col-span-6">
              <Card index={6} className="h-full">
                <CardTitle
                  icon={<Globe2 size={16} strokeWidth={2.25} />}
                  title="3D Site Inspection"
                  subtitle={`${lot.facility} · ${lot.city}`}
                />
                <Google3DInspection lot={lot} />
              </Card>
            </div>

            {/* EPA RFS Context */}
            <div className="col-span-12">
              <Card index={7} className="h-full">
                <EpaContextCard />
              </Card>
            </div>

            <div className="col-span-12 py-4 text-center text-[10px] text-white/30">
              ORIN · Origin-Verified RIN Marketplace · Demo build
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
