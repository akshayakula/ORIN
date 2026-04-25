import { useMemo } from "react";
import { Radio } from "lucide-react";
import { cn } from "../../lib/cn";
import { useLiveAuctions } from "../../hooks/useLiveAuctions";

export interface AuctionTickerNavProps {
  onClick?: () => void;
  className?: string;
}

export function AuctionTickerNav({ onClick, className }: AuctionTickerNavProps) {
  const { auctions } = useLiveAuctions();

  const closeToExpiry = useMemo(() => {
    const now = Date.now();
    return auctions.some((a) => {
      const exp = Date.parse(a.expiresAt);
      return Number.isFinite(exp) && exp - now < 60_000 && exp > now;
    });
  }, [auctions]);

  if (auctions.length === 0) return null;

  const label =
    auctions.length === 1
      ? "LIVE · 1 auction"
      : `LIVE · ${auctions.length} auctions`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      aria-label={`${auctions.length} live auction${auctions.length === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[11px] font-mono uppercase tracking-[0.16em] transition",
        closeToExpiry
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
          : "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/15",
        className,
      )}
    >
      <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden>
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            closeToExpiry ? "bg-amber-400" : "bg-red-400",
          )}
        />
        <span
          className={cn(
            "relative inline-block h-1.5 w-1.5 rounded-full",
            closeToExpiry ? "bg-amber-400" : "bg-red-400",
          )}
        />
      </span>
      <Radio className="h-3 w-3" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export default AuctionTickerNav;
