import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  FlaskConical,
  ShoppingCart,
  Building2,
} from "lucide-react";
import { cn } from "../lib/cn";
import { fmtRins, fmtUSD, fmtUSDCompact } from "../lib/format";
import type { RinLot } from "../types/rin";
import type { SellerListing } from "../hooks/useSellerListings";
import { epaSummary } from "../data/epaContext";
import Google3DInspection from "./Google3DInspection";
import AirQualityCard from "./AirQualityCard";
import CrustdataBadge from "./marketing/CrustdataBadge";

interface AuditResultsProps {
  lot: RinLot;
  onBack: () => void;
  onRequestPurchase: () => void;
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

function SourcePill({ source }: { source: "live" | "mock" }) {
  return (
    <span
      className={cn(
        "pill border text-[10px]",
        source === "live"
          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
          : "bg-white/10 text-white/70 border-white/15",
      )}
    >
      {source === "live" ? "LIVE" : "MOCK"}
    </span>
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

  const rows: Array<{
    label: string;
    value: React.ReactNode;
    emphasize?: boolean;
  }> = [
    { label: "Lot ID", value: <span className="font-mono">{lot.id}</span> },
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
    {
      label: "QAP status",
      value: <span>{lot.qapStatus}</span>,
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

      <p className="mt-3 text-[10px] leading-relaxed text-white/40">
        ORIN flags diligence risk before purchase. ORIN does not accuse sellers
        of fraud and does not certify EPA validity.
      </p>
    </>
  );
}


// -----------------------------------------------------------------------------
// Crustdata company signals
// -----------------------------------------------------------------------------

interface CrustdataCompanyCardProps {
  lot: SellerListing;
}

function CrustdataCompanyCard({ lot }: CrustdataCompanyCardProps) {
  const c = lot.companyEnrichment;
  if (!c) return null;
  const industries = c.taxonomy?.industries ?? [];

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Company", value: <span>{c.name ?? lot.seller}</span> },
    {
      label: "Domain",
      value: c.domain ? (
        <a
          href={c.website ?? `https://${c.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel-300 hover:text-white underline-offset-2 hover:underline"
        >
          {c.domain}
        </a>
      ) : (
        <span className="text-white/40">—</span>
      ),
    },
    {
      label: "HQ address",
      value: <span>{c.hqAddress ?? "—"}</span>,
    },
    {
      label: "HQ country",
      value: <span>{c.hqCountry ?? "—"}</span>,
    },
    {
      label: "Year founded",
      value: <span className="tabular-nums">{c.yearFounded ?? "—"}</span>,
    },
    {
      label: "Employees",
      value: (
        <span className="tabular-nums">
          {typeof c.employeeCount === "number" ? c.employeeCount : "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <CardTitle
        icon={<Building2 size={16} strokeWidth={2.25} />}
        title="Crustdata company signals"
        subtitle="Verified seller enrichment"
        right={<SourcePill source="live" />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="label-mono">{r.label}</div>
            <div className="mt-1 text-sm text-white/90">{r.value}</div>
          </div>
        ))}
      </div>

      {industries.length > 0 && (
        <div className="mt-3">
          <div className="label-mono mb-2">Industries</div>
          <div className="flex flex-wrap gap-1.5">
            {industries.map((ind) => (
              <span
                key={ind}
                className="pill border border-white/10 bg-white/5 text-[11px] text-white/80"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <CrustdataBadge variant="full" />
      </div>
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
        Sourced from public EPA RFS reports through Mar 2026.
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
}: AuditResultsProps) {
  const dCodePillStyle = {
    D3: "bg-steel-400/15 border-steel-400/30 text-steel-300",
    D4: "bg-steel-400/15 border-steel-400/30 text-steel-300",
    D5: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    D6: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    D7: "bg-red-500/10 border-red-500/30 text-red-300",
  }[lot.dCode];

  const sellerLot = lot as Partial<SellerListing> & RinLot;
  const showCrustdata =
    sellerLot.companyEnrichmentSource === "live" &&
    !!sellerLot.companyEnrichment;

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
              <span className={cn("pill border font-mono", dCodePillStyle)}>
                {lot.dCode}
              </span>
              <span className="hidden md:inline text-[11px] text-white/40 truncate">
                {lot.city}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRequestPurchase}
                className="btn-primary"
              >
                <ShoppingCart size={14} strokeWidth={2.25} />
                <span>Request Purchase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="absolute inset-0 overflow-y-auto pt-16"
          style={{ maxHeight: "100vh" }}
        >
          <div className="mx-auto max-w-[1400px] p-6">
            <div className="mb-5">
              <h1 className="text-xl font-semibold tracking-tight text-white">
                ORIN Diligence Snapshot — live data
              </h1>
              <p className="mt-1 text-sm text-white/55">
                Live signals from Google Air Quality, Google Photorealistic 3D,
                EPA RFS, and Crustdata. No simulated content.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {/* Purchase Information */}
              <div className="col-span-12 lg:col-span-6">
                <Card index={0} className="h-full">
                  <PurchaseInfo lot={lot} />
                </Card>
              </div>

              {/* Ambient Air Quality */}
              <div className="col-span-12 lg:col-span-6">
                <AirQualityCard lot={lot} className="h-full" />
              </div>

              {/* Photorealistic 3D Site Inspection */}
              <div className="col-span-12 lg:col-span-6">
                <Card index={3} className="h-full">
                  <Google3DInspection lot={lot} />
                </Card>
              </div>

              {/* Crustdata company signals (only when live) */}
              {showCrustdata && (
                <div className="col-span-12">
                  <Card index={4} className="h-full">
                    <CrustdataCompanyCard
                      lot={sellerLot as SellerListing}
                    />
                  </Card>
                </div>
              )}

              {/* EPA RFS Context */}
              <div className="col-span-12">
                <Card index={5} className="h-full">
                  <EpaContextCard />
                </Card>
              </div>

              <div className="col-span-12 py-4 text-center text-[10px] text-white/30">
                ORIN flags diligence risk before purchase. ORIN does not accuse
                sellers of fraud and does not certify EPA validity.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
