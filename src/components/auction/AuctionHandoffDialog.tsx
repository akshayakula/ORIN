import { Check, Mail, FileLock2, ShieldCheck, FileSignature } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "../ui";
import type { AuctionRecord } from "../../types/auction";
import { fmtRins, fmtUSD, fmtUSDCompact } from "../../lib/format";

export interface AuctionHandoffDialogProps {
  auction: AuctionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: FileSignature,
    title: "EMTS filing",
    body: "We submit the RIN transfer with EPA Moderated Transactions.",
  },
  {
    icon: Check,
    title: "Settlement docs",
    body: "We email signed settlement, attestations, and QAP letters to buyer + seller.",
  },
  {
    icon: FileLock2,
    title: "Compliance vault",
    body: "Diligence packet stored to your compliance vault.",
  },
  {
    icon: Mail,
    title: "Notifications",
    body: "All parties receive an email confirmation within 5 minutes.",
  },
];

export function AuctionHandoffDialog({
  auction,
  open,
  onOpenChange,
}: AuctionHandoffDialogProps) {
  if (!auction) return null;
  const winner = auction.winnerCompany ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden />
            We'll take it from here.
          </DialogTitle>
          <DialogDescription>
            ORIN will file your EMTS transfer with the EPA, route legal
            documents, and email all parties involved.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-white/40">
                      0{i + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/65">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div className="text-white/50">Auction ID</div>
            <div className="text-right font-mono text-white/80">
              {auction.auctionId}
            </div>
            <div className="text-white/50">Buyer</div>
            <div className="text-right text-white/85 truncate">{winner}</div>
            <div className="text-white/50">Seller</div>
            <div className="text-right text-white/85 truncate">
              {auction.sellerCompany}
            </div>
            <div className="text-white/50">Lot</div>
            <div className="text-right font-mono text-white/85 tabular-nums">
              {fmtRins(auction.quantity)} {auction.dCode}
            </div>
            <div className="text-white/50">Winning price</div>
            <div className="text-right font-mono text-amber-200 tabular-nums">
              {fmtUSD(auction.topBid)} / RIN
            </div>
            <div className="text-white/50">Est. total</div>
            <div className="text-right font-mono text-emerald-300 tabular-nums">
              {fmtUSDCompact(auction.quantity * auction.topBid)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            onClick={() => onOpenChange(false)}
          >
            Got it — close
          </Button>
        </DialogFooter>

        <p className="mt-3 text-[10px] leading-relaxed text-white/40">
          ORIN flags diligence risk before purchase. EMTS, EPA, and NASA names
          are used for informational context. ORIN is not affiliated with these
          agencies.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default AuctionHandoffDialog;
