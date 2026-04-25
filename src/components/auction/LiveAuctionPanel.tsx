import { useEffect, useMemo, useRef, useState } from "react";
import { Gavel, Trophy, Users } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from "../ui";
import { fmtRins, fmtUSD } from "../../lib/format";
import { useAuction } from "../../hooks/useAuction";
import { useBuyerProfile } from "../../hooks/useBuyerProfile";
import { endAuction, placeBid } from "../../lib/auctions";
import Countdown from "./Countdown";
import AuctionWinnerOverlay from "./AuctionWinnerOverlay";
import AuctionHandoffDialog from "./AuctionHandoffDialog";
import { cn } from "../../lib/cn";

const BIDDER_KEY = "orin.bidderCompany";

function readStoredBidder(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(BIDDER_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredBidder(v: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BIDDER_KEY, v);
  } catch {
    /* ignore */
  }
}

export interface LiveAuctionPanelProps {
  auctionId: string | null;
  onClose: () => void;
}

function relTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return new Date(t).toLocaleTimeString();
}

export function LiveAuctionPanel({ auctionId, onClose }: LiveAuctionPanelProps) {
  const { profile } = useBuyerProfile();
  const open = !!auctionId;
  const { auction, bids, error } = useAuction(auctionId);

  const [bidAmount, setBidAmount] = useState<string>("");
  const [company, setCompany] = useState<string>(
    profile?.companyName ?? readStoredBidder(),
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Track which auction IDs have already triggered the winner overlay.
  const winnerNotifiedRef = useRef<Set<string>>(new Set());
  const [winnerOverlayOpen, setWinnerOverlayOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);

  // Reset state when the auction changes.
  useEffect(() => {
    setBidAmount("");
    setBidError(null);
    setSubmitting(false);
    setWinnerOverlayOpen(false);
    setHandoffOpen(false);
  }, [auctionId]);

  // Initialize default bid (top + 0.01) when auction loads or top changes.
  useEffect(() => {
    if (!auction) return;
    setBidAmount((prev) => {
      const minNext = Math.round((auction.topBid + 0.01) * 100) / 100;
      if (!prev) return minNext.toFixed(2);
      const numericPrev = Number(prev);
      if (!Number.isFinite(numericPrev) || numericPrev <= auction.topBid) {
        return minNext.toFixed(2);
      }
      return prev;
    });
  }, [auction?.auctionId, auction?.topBid]);

  // Sync company from profile (if user signs in mid-flow).
  useEffect(() => {
    if (profile?.companyName && !company) setCompany(profile.companyName);
  }, [profile?.companyName, company]);

  const now = Date.now();
  const expiresMs = auction ? Date.parse(auction.expiresAt) : 0;
  const isExpired = auction
    ? auction.status === "expired" ||
      auction.status === "ended" ||
      (Number.isFinite(expiresMs) && expiresMs <= now)
    : false;

  const isSeller = useMemo(() => {
    if (!auction || !company.trim()) return false;
    return (
      auction.sellerCompany.trim().toLowerCase() ===
      company.trim().toLowerCase()
    );
  }, [auction, company]);

  // Winner overlay trigger — fires once per auction id when the auction ends.
  useEffect(() => {
    if (!auction) return;
    const exp = Date.parse(auction.expiresAt);
    const isOver =
      auction.status === "ended" ||
      auction.status === "expired" ||
      (Number.isFinite(exp) && exp <= Date.now());
    if (!isOver) return;
    if (winnerNotifiedRef.current.has(auction.auctionId)) return;
    winnerNotifiedRef.current.add(auction.auctionId);
    setWinnerOverlayOpen(true);
  }, [auction?.auctionId, auction?.status, auction?.expiresAt, auction]);

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!auction) return;
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBidError("Enter a valid bid amount.");
      return;
    }
    if (amount <= auction.topBid) {
      setBidError(`Bid must exceed ${fmtUSD(auction.topBid)}.`);
      return;
    }
    if (!company.trim()) {
      setBidError("Enter your company name.");
      return;
    }
    setSubmitting(true);
    setBidError(null);
    try {
      writeStoredBidder(company.trim());
      await placeBid(auction.auctionId, { company: company.trim(), amount });
      toast({
        title: "Bid placed",
        description: `${fmtUSD(amount)}/RIN as ${company.trim()}`,
        variant: "success",
      });
    } catch (err) {
      setBidError((err as Error)?.message ?? "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  }

  async function onEnd() {
    if (!auction) return;
    setSubmitting(true);
    try {
      await endAuction(auction.auctionId, {
        company: auction.sellerCompany,
      });
      toast({ title: "Auction ended", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not end auction",
        description: (err as Error)?.message ?? "",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-amber-300" aria-hidden />
            Live auction
          </DialogTitle>
          <DialogDescription>
            {auction
              ? `${auction.dCode} · ${fmtRins(auction.quantity)} RINs`
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto pr-1">
        {!auction && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
            {error ? `Error: ${error}` : "Loading auction…"}
          </div>
        )}

        {auction && (
          <div className="flex flex-col gap-4">
            {/* Lot summary */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-white">
                    {auction.dCode}
                  </span>
                  <span className="text-sm text-white/70 tabular-nums">
                    {fmtRins(auction.quantity)} RINs
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {auction.auctionId}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60 truncate">
                Seller · {auction.sellerCompany}{" "}
                <span className="text-white/40">(via Crustdata)</span>
              </div>
            </div>

            {/* Countdown + top bid */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col">
                <span className="label-mono">Time remaining</span>
                <Countdown
                  to={auction.expiresAt}
                  size="lg"
                  className="mt-1"
                />
              </div>
              <div className="flex flex-col text-right">
                <span className="label-mono">Top bid</span>
                <span className="mt-1 font-mono text-3xl font-bold tabular-nums text-amber-200">
                  {fmtUSD(auction.topBid)}
                </span>
                <span className="mt-1 text-xs text-white/60 truncate max-w-[220px]">
                  {auction.topBidderCompany ?? "No bids yet"}
                </span>
              </div>
            </div>

            {/* Status banners */}
            {isExpired && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <div className="flex items-start gap-2">
                  <Trophy className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">
                      {auction.winnerCompany
                        ? `${auction.winnerCompany} won the auction at ${fmtUSD(auction.topBid)}/RIN`
                        : "Auction ended without bids."}
                    </div>
                    {auction.winnerCompany && (
                      <p className="mt-1 text-xs text-white/60">
                        {fmtRins(auction.quantity)} {auction.dCode} RINs ·
                        Settle with {auction.sellerCompany} within 24 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bid form */}
            {!isExpired && (
              <form
                onSubmit={submitBid}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bid-company">Your company</Label>
                    <Input
                      id="bid-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Refining"
                      autoComplete="organization"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bid-amount">Bid (USD/RIN)</Label>
                    <Input
                      id="bid-amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={(auction.topBid + 0.01).toFixed(2)}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                  </div>
                </div>

                {bidError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/[0.08] p-2 text-xs text-red-200">
                    {bidError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-white/45">
                    Min next bid {fmtUSD(auction.topBid + 0.01)}
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    disabled={
                      submitting ||
                      !Number.isFinite(Number(bidAmount)) ||
                      Number(bidAmount) <= auction.topBid
                    }
                  >
                    Place bid
                  </Button>
                </div>
              </form>
            )}

            {/* Manual end button — always available while auction is live */}
            {!isExpired && (
              <Button
                type="button"
                variant={isSeller ? "danger" : "ghost"}
                onClick={onEnd}
                disabled={submitting}
              >
                End auction now
              </Button>
            )}

            {/* Recent bids */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-white/60" aria-hidden />
                <span className="label-mono">Recent bids · {auction.bidCount}</span>
              </div>
              {bids.length === 0 ? (
                <p className="text-xs text-white/50">
                  No bids yet. Be the first to bid.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/5">
                  {bids.slice(0, 8).map((b, i) => (
                    <li
                      key={`${b.at}-${i}`}
                      className={cn(
                        "flex items-center justify-between gap-3 py-1.5",
                        i === 0 && "text-amber-200",
                      )}
                    >
                      <span className="truncate text-sm">{b.company}</span>
                      <span className="font-mono text-sm tabular-nums">
                        {fmtUSD(b.amount)}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        {relTime(b.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-[10px] leading-relaxed text-white/40">
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud.
            </p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
    {auction && (
      <AuctionWinnerOverlay
        auction={auction}
        open={winnerOverlayOpen}
        onContinue={() => {
          setWinnerOverlayOpen(false);
          setHandoffOpen(true);
        }}
      />
    )}
    <AuctionHandoffDialog
      auction={auction ?? null}
      open={handoffOpen}
      onOpenChange={setHandoffOpen}
    />
    </>
  );
}

export default LiveAuctionPanel;
