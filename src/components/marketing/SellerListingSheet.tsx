import { useEffect, useState } from "react";
import { Loader2, Crosshair, MapPin } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Separator,
  Textarea,
  toast,
} from "../ui";
import CompanyLookupField from "../CompanyLookupField";
import CrustdataBadge from "./CrustdataBadge";
import { useSellerListings, type SellerListing } from "../../hooks/useSellerListings";
import type { DCode, QAPStatus } from "../../types/rin";
import type { CrustdataResult } from "../../lib/crustdata";

export interface SellerListingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin?: { lat: number; lng: number } | null;
  onPickLocation: () => void;
  onCreated?: (listing: SellerListing) => void;
}

const DCODES: DCode[] = ["D3", "D4", "D5", "D6", "D7"];
const QAP_STATUSES: QAPStatus[] = ["Verified", "Partial", "Missing", "Pending"];

function encode(data: Record<string, string>): string {
  return Object.keys(data)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(data[key] ?? ""),
    )
    .join("&");
}

interface FormState {
  name: string;
  email: string;
  company: string;
  dCode: DCode;
  type: string;
  quantity: string;
  vintage: string;
  price: string;
  facility: string;
  city: string;
  qapProvider: string;
  qapStatus: QAPStatus;
  lat: string;
  lng: string;
  notes: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  dCode: "D3",
  type: "Cellulosic / RNG",
  quantity: "250000",
  vintage: "2026",
  price: "0.85",
  facility: "",
  city: "",
  qapProvider: "",
  qapStatus: "Pending",
  lat: "",
  lng: "",
  notes: "",
};

const selectClass =
  "flex h-10 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-300/30 focus:border-slate-300/40";

function suggestCityFromCompany(c: CrustdataResult["company"]): string | null {
  // Prefer first office formatted "City, ST, US"
  const office = c.offices?.[0];
  if (office) {
    const parts = office.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    if (parts.length === 1) return parts[0];
  }
  // Fallback: parse hqAddress, take first two comma-separated tokens
  if (c.hqAddress) {
    const parts = c.hqAddress.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    if (parts.length === 1) return parts[0];
  }
  return null;
}

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
  const [suggestedCity, setSuggestedCity] = useState<string | null>(null);

  // When pin is updated, update lat/lng fields
  useEffect(() => {
    if (pin) {
      setForm((s) => ({
        ...s,
        lat: pin.lat.toFixed(4),
        lng: pin.lng.toFixed(4),
      }));
    }
  }, [pin]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const reset = () => {
    setForm(INITIAL);
    setEnrichment(null);
    setSuggestedCity(null);
  };

  const handleCompanyResolved = (r: CrustdataResult | null) => {
    setEnrichment(r);
    if (!r) {
      setSuggestedCity(null);
      return;
    }
    setForm((s) => ({
      ...s,
      // Only set company if we got a name back; don't blow away the user's typing if missing
      company: r.company.name ?? s.company,
    }));
    setSuggestedCity(suggestCityFromCompany(r.company));
  };

  const applySuggestedCity = () => {
    if (!suggestedCity) return;
    setForm((s) => (s.city.trim() ? s : { ...s, city: suggestedCity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const latN = parseFloat(form.lat);
    const lngN = parseFloat(form.lng);
    const quantityN = parseInt(form.quantity, 10);
    const vintageN = parseInt(form.vintage, 10);
    const priceN = parseFloat(form.price);

    if (
      !form.name ||
      !form.email ||
      !form.company ||
      !form.facility ||
      !form.city ||
      Number.isNaN(latN) ||
      Number.isNaN(lngN) ||
      Number.isNaN(quantityN) ||
      Number.isNaN(vintageN) ||
      Number.isNaN(priceN)
    ) {
      toast({
        title: "Missing fields",
        description: "Fill in required fields and a valid location.",
        variant: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Netlify form submission
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": "listing",
          "bot-field": "",
          name: form.name,
          email: form.email,
          company: form.company,
          facility: form.facility,
          dCode: form.dCode,
          type: form.type,
          quantity: String(quantityN),
          vintage: String(vintageN),
          price: String(priceN),
          qapProvider: form.qapProvider,
          qapStatus: form.qapStatus,
          lat: String(latN),
          lng: String(lngN),
          city: form.city,
          notes: form.notes,
        }),
      }).catch(() => {
        // non-fatal: still publish locally
      });

      const verified =
        !!enrichment &&
        enrichment.status === "found" &&
        enrichment.source === "live";

      const listing = add({
        lat: latN,
        lng: lngN,
        city: form.city,
        dCode: form.dCode,
        type: form.type,
        quantity: quantityN,
        vintage: vintageN,
        price: priceN,
        seller: form.company,
        facility: form.facility,
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

      onCreated?.(listing);
      onOpenChange(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-[520px] !max-w-[95vw]">
        <SheetHeader>
          <SheetTitle>List Your RINs</SheetTitle>
          <SheetDescription>
            Publish a new lot to the ORIN marketplace. Every listing is subject
            to an ORIN Integrity Audit before buyers can purchase.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1 — Your Info */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Your Info</h3>
              <span className="label-mono">STEP 1</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="seller-name">Name *</Label>
                  <Input
                    id="seller-name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seller-email">Email *</Label>
                  <Input
                    id="seller-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <CompanyLookupField
                  id="seller-company"
                  label="Company"
                  hint="We use Crustdata to verify firm details."
                  initialValue={form.company}
                  onResolved={handleCompanyResolved}
                />
                <div className="mt-2">
                  <CrustdataBadge variant="compact" />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 2 — Lot Details */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Lot Details</h3>
              <span className="label-mono">STEP 2</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="seller-dcode">D-Code</Label>
                <select
                  id="seller-dcode"
                  value={form.dCode}
                  onChange={(e) => update("dCode", e.target.value as DCode)}
                  className={selectClass}
                >
                  {DCODES.map((d) => (
                    <option key={d} value={d} className="bg-space-900">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="seller-type">Fuel Type</Label>
                <Input
                  id="seller-type"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seller-quantity">Quantity (RINs)</Label>
                <Input
                  id="seller-quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seller-vintage">Vintage Year</Label>
                <Input
                  id="seller-vintage"
                  type="number"
                  value={form.vintage}
                  onChange={(e) => update("vintage", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seller-price">Price (USD)</Label>
                <Input
                  id="seller-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seller-qap-status">QAP Status</Label>
                <select
                  id="seller-qap-status"
                  value={form.qapStatus}
                  onChange={(e) =>
                    update("qapStatus", e.target.value as QAPStatus)
                  }
                  className={selectClass}
                >
                  {QAP_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-space-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="seller-facility">Facility *</Label>
                <Input
                  id="seller-facility"
                  value={form.facility}
                  onChange={(e) => update("facility", e.target.value)}
                  required
                  placeholder="Green Valley Landfill RNG"
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="seller-city">City / Region *</Label>
                  {suggestedCity && !form.city.trim() ? (
                    <button
                      type="button"
                      onClick={applySuggestedCity}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline-offset-4 hover:underline"
                    >
                      <MapPin className="h-3 w-3" aria-hidden />
                      Use HQ ({suggestedCity}) as facility location
                    </button>
                  ) : null}
                </div>
                <Input
                  id="seller-city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  required
                  placeholder="Minneapolis, MN"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="seller-qap-provider">QAP Provider</Label>
                <Input
                  id="seller-qap-provider"
                  value={form.qapProvider}
                  onChange={(e) => update("qapProvider", e.target.value)}
                  placeholder="EcoEngineers, Christianson PLLP, etc."
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 3 — Location */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Location</h3>
              <span className="label-mono">STEP 3</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              {pin ? (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Pin dropped
                    </p>
                    <p className="text-xs text-white/55 mt-0.5 tabular-nums">
                      {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onPickLocation}
                  >
                    Re-pin
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={onPickLocation}
                >
                  <Crosshair className="h-4 w-4" aria-hidden />
                  Drop a pin on the map
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="seller-lat">Latitude</Label>
                  <Input
                    id="seller-lat"
                    type="number"
                    step="0.0001"
                    value={form.lat}
                    onChange={(e) => update("lat", e.target.value)}
                    placeholder="39.7392"
                  />
                </div>
                <div>
                  <Label htmlFor="seller-lng">Longitude</Label>
                  <Input
                    id="seller-lng"
                    type="number"
                    step="0.0001"
                    value={form.lng}
                    onChange={(e) => update("lng", e.target.value)}
                    placeholder="-104.9903"
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 4 — Notes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notes</h3>
              <span className="label-mono">STEP 4</span>
            </div>
            <div>
              <Label htmlFor="seller-notes">Additional context</Label>
              <Textarea
                id="seller-notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Feedstock source, operational context, anything buyers should know."
              />
            </div>
          </section>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {submitting ? "Publishing" : "Publish Listing"}
            </Button>
            <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
              ORIN does not certify EPA validity. ORIN does not process EMTS
              transfers. Your listing will be subject to an ORIN Integrity
              Audit before buyers can purchase.
            </p>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default SellerListingSheet;
