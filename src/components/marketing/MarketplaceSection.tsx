import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowUpDown,
  X,
} from "lucide-react";
import type { RinLot } from "../../types/rin";
import type { SellerListing } from "../../hooks/useSellerListings";
import { getRiskTier } from "../../data/rinLots";
import { referencePrices } from "../../data/epaContext";
import { fmtRins, fmtUSD, fmtUSDCompact } from "../../lib/format";
import { cn } from "../../lib/cn";
import { Input, Button, Badge } from "../ui";

interface MarketplaceSectionProps {
  lots: RinLot[];
  onSelectLot: (lot: RinLot) => void;
  onAuditLot: (lot: RinLot) => void;
}

type DFilter = "all" | "D3" | "D4" | "D5" | "D6" | "D7";
type RiskFilter = "all" | "low" | "medium" | "high";
type SortKey =
  | "risk-asc"
  | "risk-desc"
  | "price-asc"
  | "price-desc"
  | "quantity-desc"
  | "grade";

const GRADE_ORDER = ["A+", "A", "B+", "B", "B-", "C+", "C", "D"];

function asSellerListing(lot: RinLot): SellerListing | null {
  const candidate = lot as Partial<SellerListing>;
  if (
    candidate.source === "seller" ||
    candidate.companyEnrichment ||
    candidate.sellerVerifiedByCrustdata
  ) {
    return lot as SellerListing;
  }
  return null;
}

function CrustdataPill() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] font-semibold">
      Verified via Crustdata
    </span>
  );
}

function tierIcon(tier: "low" | "medium" | "high") {
  if (tier === "low") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (tier === "medium") return <ShieldAlert className="h-3.5 w-3.5" />;
  return <ShieldX className="h-3.5 w-3.5" />;
}

function tierClasses(tier: "low" | "medium" | "high") {
  if (tier === "low")
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  if (tier === "medium")
    return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  return "bg-red-500/10 text-red-300 border-red-500/30";
}

export default function MarketplaceSection({
  lots,
  onSelectLot,
  onAuditLot,
}: MarketplaceSectionProps) {
  const [query, setQuery] = useState("");
  const [dFilter, setDFilter] = useState<DFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [qapVerifiedOnly, setQapVerifiedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("risk-asc");
  const [priceCap, setPriceCap] = useState<number>(1.5);

  const filtered = useMemo(() => {
    let out = lots.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (l) =>
          l.id.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.seller.toLowerCase().includes(q) ||
          l.facility.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q),
      );
    }
    if (dFilter !== "all") out = out.filter((l) => l.dCode === dFilter);
    if (riskFilter !== "all")
      out = out.filter((l) => getRiskTier(l.riskScore) === riskFilter);
    if (qapVerifiedOnly) out = out.filter((l) => l.qapStatus === "Verified");
    out = out.filter((l) => l.price <= priceCap);

    const sorted = out.slice();
    switch (sortKey) {
      case "risk-asc":
        sorted.sort((a, b) => a.riskScore - b.riskScore);
        break;
      case "risk-desc":
        sorted.sort((a, b) => b.riskScore - a.riskScore);
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "quantity-desc":
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case "grade":
        sorted.sort(
          (a, b) =>
            GRADE_ORDER.indexOf(a.orinGrade) - GRADE_ORDER.indexOf(b.orinGrade),
        );
        break;
    }
    return sorted;
  }, [lots, query, dFilter, riskFilter, qapVerifiedOnly, priceCap, sortKey]);

  const totalValue = useMemo(
    () => filtered.reduce((s, l) => s + l.price * l.quantity, 0),
    [filtered],
  );
  const avgRisk = useMemo(
    () =>
      filtered.length === 0
        ? 0
        : Math.round(
            filtered.reduce((s, l) => s + l.riskScore, 0) / filtered.length,
          ),
    [filtered],
  );

  const hasFilters =
    query ||
    dFilter !== "all" ||
    riskFilter !== "all" ||
    qapVerifiedOnly ||
    priceCap < 1.5;

  const clearFilters = () => {
    setQuery("");
    setDFilter("all");
    setRiskFilter("all");
    setQapVerifiedOnly(false);
    setPriceCap(1.5);
  };

  return (
    <section
      id="marketplace-list"
      className="relative py-20 bg-space-900/40 border-t border-white/5"
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <div className="label-mono mb-3">MARKETPLACE · LIVE LOTS</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Browse verified RIN lots
            </h2>
            <p className="text-white/60 max-w-2xl">
              {filtered.length} lot{filtered.length === 1 ? "" : "s"} ·{" "}
              {fmtUSDCompact(totalValue)} tracked value · avg ORIN risk {avgRisk}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SortButton sortKey={sortKey} setSortKey={setSortKey} />
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, seller, facility, lot ID…"
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chips
                label="D-code"
                options={["all", "D3", "D4", "D5", "D6", "D7"] as DFilter[]}
                value={dFilter}
                onChange={(v) => setDFilter(v as DFilter)}
                labelFor={(v) => (v === "all" ? "All" : v)}
              />
              <Chips
                label="Risk"
                options={["all", "low", "medium", "high"] as RiskFilter[]}
                value={riskFilter}
                onChange={(v) => setRiskFilter(v as RiskFilter)}
                labelFor={(v) =>
                  v === "all"
                    ? "All"
                    : v === "low"
                      ? "Low"
                      : v === "medium"
                        ? "Med"
                        : "High"
                }
                tone={(v) =>
                  v === "low"
                    ? "cyan"
                    : v === "medium"
                      ? "amber"
                      : v === "high"
                        ? "rose"
                        : "neutral"
                }
              />
              <button
                type="button"
                onClick={() => setQapVerifiedOnly((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                  qapVerifiedOnly
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                QAP Verified only
              </button>
              <PriceRange priceCap={priceCap} setPriceCap={setPriceCap} />
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <SlidersHorizontal className="mx-auto h-8 w-8 text-white/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No lots match your filters</h3>
            <p className="text-sm text-white/60 mb-4">
              Try broadening your criteria or clearing filters.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lot, i) => (
              <LotCard
                key={lot.id}
                lot={lot}
                index={i}
                onSelect={() => onSelectLot(lot)}
                onAudit={() => onAuditLot(lot)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface ChipsProps<T extends string> {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelFor: (v: T) => string;
  tone?: (v: T) => "cyan" | "amber" | "rose" | "neutral";
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  labelFor,
  tone,
}: ChipsProps<T>) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 p-1">
      <span className="px-2 text-[10px] uppercase tracking-[0.18em] text-white/50">
        {label}
      </span>
      {options.map((opt) => {
        const active = opt === value;
        const t = tone ? tone(opt) : "neutral";
        const activeClass =
          t === "cyan"
            ? "bg-emerald-500/15 text-emerald-200"
            : t === "amber"
              ? "bg-amber-500/15 text-amber-200"
              : t === "rose"
                ? "bg-red-500/15 text-red-200"
                : "bg-white/15 text-white";
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition",
              active ? activeClass : "text-white/60 hover:text-white",
            )}
          >
            {labelFor(opt)}
          </button>
        );
      })}
    </div>
  );
}

function PriceRange({
  priceCap,
  setPriceCap,
}: {
  priceCap: number;
  setPriceCap: (v: number) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
        Max price
      </span>
      <input
        type="range"
        min={0.3}
        max={1.5}
        step={0.01}
        value={priceCap}
        onChange={(e) => setPriceCap(Number(e.target.value))}
        className="accent-slate-300 w-28"
      />
      <span className="font-mono text-xs text-white min-w-[3ch] text-right">
        ${priceCap.toFixed(2)}
      </span>
    </label>
  );
}

function SortButton({
  sortKey,
  setSortKey,
}: {
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
}) {
  const options: { key: SortKey; label: string }[] = [
    { key: "risk-asc", label: "Risk (low → high)" },
    { key: "risk-desc", label: "Risk (high → low)" },
    { key: "price-asc", label: "Price (low → high)" },
    { key: "price-desc", label: "Price (high → low)" },
    { key: "quantity-desc", label: "Quantity (high → low)" },
    { key: "grade", label: "ORIN Grade" },
  ];
  return (
    <div className="relative inline-block">
      <label className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 cursor-pointer">
        <ArrowUpDown className="h-3.5 w-3.5 text-white/60" />
        <select
          className="bg-transparent outline-none text-xs text-white pr-1 cursor-pointer"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          {options.map((o) => (
            <option
              key={o.key}
              value={o.key}
              className="bg-space-800 text-white"
            >
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

interface LotCardProps {
  lot: RinLot;
  index: number;
  onSelect: () => void;
  onAudit: () => void;
}

function LotCard({ lot, index, onSelect, onAudit }: LotCardProps) {
  const tier = getRiskTier(lot.riskScore);
  const ref = referencePrices[lot.dCode];
  const priceTone =
    ref && lot.price < ref.low
      ? "text-red-300"
      : ref && lot.price > ref.high
        ? "text-emerald-300"
        : "text-white";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "group glass rounded-2xl p-5 flex flex-col transition-all",
        "hover:-translate-y-1 hover:border-white/30",
        tier === "low" && "hover:shadow-glowCyan",
        tier === "medium" && "hover:shadow-glowAmber",
        tier === "high" && "hover:shadow-glowRose",
      )}
    >
      <header className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="label-mono mb-1">{lot.id}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {lot.dCode}
            </span>
            <Badge variant="secondary">{lot.orinGrade}</Badge>
          </div>
        </div>
        <span
          className={cn(
            "pill border gap-1 whitespace-nowrap",
            tierClasses(tier),
          )}
        >
          {tierIcon(tier)}
          {lot.riskScore}
        </span>
      </header>

      <div className="text-sm text-white/80 mb-1 line-clamp-1">{lot.type}</div>
      <div className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
        <MapPin className="h-3 w-3" />
        {lot.city}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-4">
        <Stat
          label="Quantity"
          value={fmtRins(lot.quantity)}
        />
        <Stat
          label="Vintage"
          value={String(lot.vintage)}
        />
        <Stat
          label="Price / RIN"
          value={fmtUSD(lot.price)}
          valueClass={cn("font-mono", priceTone)}
        />
        <Stat
          label="Est. Value"
          value={fmtUSDCompact(lot.price * lot.quantity)}
        />
      </div>

      <div className="mt-auto space-y-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-xs text-white/60 line-clamp-1 min-w-0">
            <span className="text-white/40">Seller:</span> {lot.seller}
          </div>
          {(() => {
            const seller = asSellerListing(lot);
            if (
              seller?.sellerVerifiedByCrustdata ||
              seller?.companyEnrichment
            ) {
              return <CrustdataPill />;
            }
            return null;
          })()}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={onAudit}
          >
            Audit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onSelect}
          >
            Details
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
        {label}
      </div>
      <div className={cn("text-sm text-white", valueClass)}>{value}</div>
    </div>
  );
}
