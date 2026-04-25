import { useEffect, useState } from "react";
import { Gavel, Info } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from "../ui";
import { fmtRins, fmtUSD } from "../../lib/format";
import { useBuyerProfile } from "../../hooks/useBuyerProfile";
import { startAuction } from "../../lib/auctions";
import type { RinLot } from "../../types/rin";
import type { AuctionRecord } from "../../types/auction";

export interface StartAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: RinLot | null;
  onStarted: (auction: AuctionRecord) => void;
}

const BIDDER_KEY = "orin.bidderCompany";

export function StartAuctionDialog({
  open,
  onOpenChange,
  lot,
  onStarted,
}: StartAuctionDialogProps) {
  const { profile } = useBuyerProfile();
  const [price, setPrice] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPrice(lot ? lot.price.toFixed(2) : "");
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(BIDDER_KEY) ?? ""
        : "";
    setCompany(profile?.companyName ?? stored ?? "");
    setErr(null);
  }, [open, lot, profile?.companyName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lot) return;
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErr("Enter a valid starting price.");
      return;
    }
    if (!company.trim()) {
      setErr("Enter your company name.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const lotForAuction: RinLot = { ...lot, price: parsedPrice };
      const auction = await startAuction({
        lot: lotForAuction,
        startedByCompany: company.trim(),
      });
      try {
        window.localStorage.setItem(BIDDER_KEY, company.trim());
      } catch {
        /* ignore */
      }
      toast({
        title: "Auction started",
        description: `${auction.auctionId} — ${fmtRins(auction.quantity)} RINs at ${fmtUSD(auction.startPrice)}/RIN`,
        variant: "success",
      });
      onStarted(auction);
    } catch (e2) {
      setErr((e2 as Error)?.message ?? "Failed to start auction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-amber-300" aria-hidden />
            Start a live auction
          </DialogTitle>
          <DialogDescription>
            Open this lot for live bidding for the next 5 minutes.
          </DialogDescription>
        </DialogHeader>

        {lot && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {lot.dCode}
                </span>
                <span className="text-sm text-white/70 tabular-nums">
                  {fmtRins(lot.quantity)} RINs
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                {lot.id}
              </span>
            </div>
            <div className="mt-1 text-xs text-white/60 truncate">
              {lot.seller} · {lot.city}
              <span className="ml-1 text-white/40">(via Crustdata)</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auction-price">Starting price (USD per RIN)</Label>
            <Input
              id="auction-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.92"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auction-company">Your company</Label>
            <Input
              id="auction-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Refining"
              autoComplete="organization"
            />
            {profile?.companyName && (
              <p className="text-[10px] text-white/40">
                Auto-filled from your buyer profile
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-100/90">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-300" aria-hidden />
            <p className="leading-relaxed">
              Live auctions run for 5 minutes. Anyone with the auction link can place
              a bid using their company name. ORIN flags diligence risk before
              purchase. ORIN does not accuse sellers of fraud.
            </p>
          </div>

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-3 text-xs text-red-200">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Start auction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StartAuctionDialog;
