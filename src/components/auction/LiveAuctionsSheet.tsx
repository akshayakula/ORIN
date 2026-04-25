import { Radio } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui";
import { fmtRins, fmtUSD } from "../../lib/format";
import { useLiveAuctions } from "../../hooks/useLiveAuctions";
import Countdown from "./Countdown";

export interface LiveAuctionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onView: (auctionId: string) => void;
}

export function LiveAuctionsSheet({
  open,
  onOpenChange,
  onView,
}: LiveAuctionsSheetProps) {
  const { auctions, loading } = useLiveAuctions();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-[460px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-300" aria-hidden />
            Live auctions
          </SheetTitle>
          <SheetDescription>
            Auctions run for 5 minutes. Click View to place a bid.
          </SheetDescription>
        </SheetHeader>

        {auctions.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
            {loading ? "Loading…" : "No live auctions right now."}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {auctions.map((a) => {
            const total = a.quantity * a.topBid;
            return (
              <button
                key={a.auctionId}
                type="button"
                onClick={() => onView(a.auctionId)}
                className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {a.auctionId}
                  </span>
                  <Countdown to={a.expiresAt} size="sm" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-white">
                      {a.dCode}
                    </span>
                    <span className="text-sm text-white/70 tabular-nums">
                      {fmtRins(a.quantity)} RINs
                    </span>
                  </div>
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-red-300">
                    Live
                  </span>
                </div>
                <div className="text-xs text-white/60 truncate" title={a.sellerCompany}>
                  Seller · {a.sellerCompany}
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/5 pt-2">
                  <div className="flex flex-col">
                    <span className="label-mono">Top bid</span>
                    <span className="font-mono text-base font-semibold tabular-nums text-amber-200">
                      {fmtUSD(a.topBid)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="label-mono">Est. value</span>
                    <span className="font-mono text-sm tabular-nums text-white/80">
                      {fmtUSD(total)}
                    </span>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white group-hover:border-amber-500/40 group-hover:text-amber-200">
                    View
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-white/40">
          ORIN flags diligence risk before purchase. ORIN does not accuse sellers of fraud.
        </p>
      </SheetContent>
    </Sheet>
  );
}

export default LiveAuctionsSheet;
