import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
  toast,
} from "../ui";
import CompanyLookupField from "../CompanyLookupField";
import CompanySuggestionChips from "./CompanySuggestionChips";
import { useSellerListings, type SellerListing } from "../../hooks/useSellerListings";
import type { DCode, QAPStatus } from "../../types/rin";
import type { CrustdataResult } from "../../lib/crustdata";
import { lookupCompany } from "../../lib/crustdata";
import { sellerSuggestions, type SellerSuggestion } from "../../data/demoCompanies";
import { cn } from "../../lib/cn";
import { startAuction } from "../../lib/auctions";

export interface SellerListingCreatedMeta {
  auctionStarted: boolean;
  auctionId?: string;
}

export interface SellerListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin?: { lat: number; lng: number } | null;
  onPickLocation: () => void;
  onCreated?: (listing: SellerListing, meta: SellerListingCreatedMeta) => void;
}

const DCODES: DCode[] = ["D3", "D4", "D5", "D6", "D7"];

const D_CODE_DEFAULTS: Record<DCode, string> = {
  D3: "Cellulosic / RNG",
  D4: "Biomass-based Diesel",
  D5: "Advanced Biofuel",
  D6: "Renewable Fuel / Ethanol",
  D7: "Cellulosic Diesel",
};

const CURRENT_YEAR = new Date().getFullYear();

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(data[key] ?? ""),
    )
    .join("&");
}

function suggestCityFromCompany(
  c: CrustdataResult["company"] | undefined,
): string | null {
  if (!c) return null;
  const office = c.offices?.[0];
  if (office) {
    const parts = office.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    if (parts.length === 1) return parts[0];
  }
  if (c.hqAddress) {
    const parts = c.hqAddress.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    if (parts.length === 1) return parts[0];
  }
  return null;
}

interface FormState {
  email: string;
  company: string;
  dCode: DCode;
  quantity: string;
  price: string;
  city: string;
  // optional/advanced
  vintage: string;
  facility: string;
  qapProvider: string;
  qapStatus: QAPStatus;
  notes: string;
}

const INITIAL: FormState = {
  email: "",
  company: "",
  dCode: "D3",
  quantity: "",
  price: "",
  city: "",
  vintage: String(CURRENT_YEAR),
  facility: "",
  qapProvider: "",
  qapStatus: "Pending",
  notes: "",
};

export function SellerListingSheet({
  open,
  onOpenChange,
  pin,
  onPickLocation,
  onCreated,
}: SellerListingSheetProps) {
  const { add } = useSellerListings();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [enrichment, setEnrichment] = useState<CrustdataResult | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [seedQuery, setSeedQuery] = useState("");
  const [lookupKey, setLookupKey] = useState(0);
  const [startAuctionToggle, setStartAuctionToggle] = useState(false);

  // Lat/lng come from the dropped pin OR from Crustdata HQ (as a fallback).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (pin) setCoords(pin);
  }, [pin]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const reset = () => {
    setForm(INITIAL);
    setEnrichment(null);
    setCoords(null);
    setAdvancedOpen(false);
    setSeedQuery("");
    setStartAuctionToggle(false);
  };

  const pickSellerSample = async (s: SellerSuggestion) => {
    // Pre-fill the form with realistic defaults so the user only has to confirm.
    setForm((f) => ({
      ...f,
      company: s.name,
      city: s.city,
      facility: s.facility,
      dCode: s.dCode,
      quantity: String(s.quantity),
      vintage: String(s.vintage),
      price: s.price.toFixed(2),
      qapProvider: s.qapProvider,
      qapStatus: s.qapStatus,
    }));
    setSeedQuery(s.name);
    setLookupKey((k) => k + 1);
    try {
      const r = await lookupCompany({ domain: s.domain, name: s.name });
      setEnrichment(r);
    } catch {
      /* ignore — user can edit fields manually */
    }
  };

  const suggestedCity = useMemo(
    () => suggestCityFromCompany(enrichment?.company),
    [enrichment],
  );

  const handleCompanyResolved = (r: CrustdataResult | null) => {
    setEnrichment(r);
    if (!r) return;
    setForm((s) => ({
      ...s,
      company: r.company.name ?? s.company,
      city: s.city.trim() ? s.city : suggestCityFromCompany(r.company) ?? "",
      facility: s.facility.trim()
        ? s.facility
        : r.company.name
          ? `${r.company.name} Facility`
          : s.facility,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const quantityN = parseInt(form.quantity, 10);
    const priceN = parseFloat(form.price);
    const vintageN = parseInt(form.vintage, 10) || CURRENT_YEAR;

    if (
      !form.company ||
      !form.city ||
      !coords ||
      Number.isNaN(quantityN) ||
      Number.isNaN(priceN)
    ) {
      toast({
        title: "A few details still needed",
        description: "Add company, location, quantity, and price.",
        variant: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      const facility =
        form.facility.trim() || `${form.company} Facility`;

      // Best-effort Netlify Forms capture (non-blocking).
      void fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": "listing",
          "bot-field": "",
          name: "",
          email: form.email,
          company: form.company,
          facility,
          dCode: form.dCode,
          type: D_CODE_DEFAULTS[form.dCode],
          quantity: String(quantityN),
          vintage: String(vintageN),
          price: String(priceN),
          qapProvider: form.qapProvider,
          qapStatus: form.qapStatus,
          lat: String(coords.lat),
          lng: String(coords.lng),
          city: form.city,
          notes: form.notes,
        }),
      }).catch(() => {});

      const verified =
        !!enrichment &&
        enrichment.status === "found" &&
        enrichment.source === "live";

      const listing = add({
        lat: coords.lat,
        lng: coords.lng,
        city: form.city,
        dCode: form.dCode,
        type: D_CODE_DEFAULTS[form.dCode],
        quantity: quantityN,
        vintage: vintageN,
        price: priceN,
        seller: form.company,
        facility,
        qapProvider: form.qapProvider || "Pending review",
        qapStatus: form.qapStatus,
        ownerEmail: form.email,
        notes: form.notes || undefined,
        companyEnrichment: enrichment?.company,
        companyEnrichmentSource: enrichment?.source,
        companyEnrichmentStatus: enrichment?.status,
        companyEnrichedAt: enrichment?.fetchedAt,
        sellerVerifiedByCrustdata: verified,
      });

      toast({
        title: verified
          ? "Listing published — verified via Crustdata"
          : "Listing published",
        description: "Your lot is now on the ORIN marketplace.",
        variant: "success",
      });

      let auctionId: string | undefined;
      if (startAuctionToggle) {
        try {
          const auction = await startAuction({
            lot: listing,
            startedByCompany: form.company,
          });
          auctionId = auction.auctionId;
          toast({
            title: "Auction live — buyers can bid now",
            description: "Your 5-minute live auction is open.",
            variant: "success",
          });
        } catch (err) {
          console.warn("[SellerListingSheet] startAuction failed", err);
          toast({
            title: "Listing published — auction failed to start",
            description: (err as Error)?.message ?? "Try again from the Auctions panel.",
            variant: "danger",
          });
        }
      }

      onCreated?.(listing, {
        auctionStarted: !!auctionId,
        auctionId,
      });
      onOpenChange(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const locationLabel = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>List a RIN lot</DialogTitle>
          <DialogDescription>
            Three things and you're listed. Everything else is optional.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-h-[80vh] overflow-y-auto pr-1"
        >
          {/* 1 — Company */}
          <div className="space-y-3">
            <CompanyLookupField
              key={lookupKey}
              id="seller-company"
              label="Company"
              hint="We pull live firm details from Crustdata."
              initialValue={seedQuery || form.company}
              onResolved={handleCompanyResolved}
            />

            <CompanySuggestionChips
              label="Quick-fill from a sample generator"
              options={sellerSuggestions}
              onPick={pickSellerSample}
            />
          </div>

          {/* 2 — Lot essentials */}
          <div className="space-y-3">
            <div>
              <Label>Fuel category</Label>
              <div className="flex flex-wrap gap-1.5">
                {DCODES.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => update("dCode", d)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium border transition",
                      form.dCode === d
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[11px] text-white/45">
                {D_CODE_DEFAULTS[form.dCode]}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="seller-quantity">Quantity (RINs)</Label>
                <Input
                  id="seller-quantity"
                  type="number"
                  inputMode="numeric"
                  placeholder="250000"
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="seller-price">Price per RIN ($)</Label>
                <Input
                  id="seller-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0.85"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* 3 — Location */}
          <div className="space-y-2">
            <Label>Facility location</Label>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
              <Input
                placeholder="City, State (e.g. Houston, TX)"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-white/55">
                  {locationLabel
                    ? `Pin · ${locationLabel}`
                    : "No pin set yet"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onPickLocation}
                >
                  {coords ? "Move pin" : "Drop pin on globe"}
                </Button>
              </div>
              {!coords && suggestedCity && enrichment?.company && (
                <button
                  type="button"
                  onClick={() => {
                    if (suggestedCity)
                      setForm((s) =>
                        s.city.trim()
                          ? s
                          : { ...s, city: suggestedCity },
                      );
                    // We don't have lat/lng from Crustdata directly — prompt pin drop.
                    onPickLocation();
                  }}
                  className="text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Use HQ as facility location ({suggestedCity}) — drop pin to
                  confirm
                </button>
              )}
            </div>
          </div>

          {/* 4 — Email (optional) */}
          <div>
            <Label htmlFor="seller-email">
              Email <span className="text-white/40 normal-case">(optional)</span>
            </Label>
            <Input
              id="seller-email"
              type="email"
              placeholder="you@firm.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          {/* Advanced (collapsible) */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-white/80 hover:text-white"
            >
              <span>Advanced details (optional)</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white/50 transition-transform",
                  advancedOpen && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {advancedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/10 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="seller-vintage">Vintage</Label>
                        <Input
                          id="seller-vintage"
                          type="number"
                          inputMode="numeric"
                          value={form.vintage}
                          onChange={(e) => update("vintage", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seller-qapstatus">QAP status</Label>
                        <select
                          id="seller-qapstatus"
                          value={form.qapStatus}
                          onChange={(e) =>
                            update("qapStatus", e.target.value as QAPStatus)
                          }
                          className="flex h-10 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-300/30"
                        >
                          {(
                            ["Verified", "Partial", "Missing", "Pending"] as QAPStatus[]
                          ).map((s) => (
                            <option key={s} value={s} className="bg-space-800">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="seller-facility">Facility name</Label>
                      <Input
                        id="seller-facility"
                        placeholder={
                          form.company
                            ? `${form.company} Facility`
                            : "Auto-named from company"
                        }
                        value={form.facility}
                        onChange={(e) => update("facility", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller-qapprovider">
                        QAP provider
                      </Label>
                      <Input
                        id="seller-qapprovider"
                        placeholder="EcoEngineers, Christianson PLLP, …"
                        value={form.qapProvider}
                        onChange={(e) =>
                          update("qapProvider", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller-notes">Notes</Label>
                      <Textarea
                        id="seller-notes"
                        rows={3}
                        placeholder="Anything ORIN buyers should know about this lot."
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setStartAuctionToggle((v) => !v)}
              aria-pressed={startAuctionToggle}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition flex items-start gap-3",
                startAuctionToggle
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-white/5 border-white/10 hover:bg-white/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                  startAuctionToggle
                    ? "bg-amber-400 border-amber-400 text-space-950"
                    : "bg-transparent border-white/30",
                )}
              >
                {startAuctionToggle ? (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="h-3 w-3"
                    aria-hidden
                  >
                    <path
                      d="M3 8.5l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-medium",
                    startAuctionToggle ? "text-amber-200" : "text-white/90",
                  )}
                >
                  Start a 5-minute live auction immediately
                </span>
                <span className="text-[11px] leading-relaxed text-white/55">
                  Buyers will see your lot in the header and can place bids using their company name.
                </span>
              </span>
            </button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                "Publish listing"
              )}
            </Button>
            <p className="text-[10px] text-white/40 leading-relaxed">
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud and does not certify EPA validity. Your listing
              will be subject to an ORIN Integrity Audit before buyers can
              purchase.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SellerListingSheet;
