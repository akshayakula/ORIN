import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import type { AuctionRecord } from "../../types/auction";
import { fmtRins, fmtUSD, fmtUSDCompact } from "../../lib/format";
import { Button, Badge } from "../ui";
import {
  Particles,
  GlowOrb,
  SparklesText,
  AnimatedGradientText,
} from "../magic";
import { useBuyerProfile } from "../../hooks/useBuyerProfile";
import { cn } from "../../lib/cn";

export interface AuctionWinnerOverlayProps {
  auction: AuctionRecord;
  onContinue: () => void;
  open: boolean;
}

const CONFETTI_COLORS = ["#f59e0b", "#94a3b8", "#10b981", "#cbd5e1"];

function Confetti({ count = 30 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: 2.4 + Math.random() * 1.6,
        delay: i * 0.04,
        rotate: Math.random() * 360,
        rotateEnd: Math.random() * 720 - 360,
        drift: -40 + Math.random() * 80,
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-10 h-40 overflow-visible"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 0, rotate: p.rotate }}
          animate={{
            y: [-20, 360],
            x: [0, p.drift],
            opacity: [0, 1, 1, 0],
            rotate: [p.rotate, p.rotate + p.rotateEnd],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}

export function AuctionWinnerOverlay({
  auction,
  onContinue,
  open,
}: AuctionWinnerOverlayProps) {
  const { profile } = useBuyerProfile();
  const viewerCompany = profile?.companyName?.trim().toLowerCase() ?? "";
  const winnerCompany = auction.winnerCompany;
  const noBids = !winnerCompany && auction.bidCount === 0;
  const youWon =
    !!winnerCompany &&
    !!viewerCompany &&
    winnerCompany.toLowerCase() === viewerCompany;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="winner-overlay"
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-space-900/85 backdrop-blur-xl"
            aria-hidden
          />
          <Particles
            quantity={80}
            color="#cbd5e1"
            className="!inset-0 !-z-0"
          />
          <GlowOrb
            color="#f59e0b"
            size={520}
            intensity={0.35}
            pulse
            className="left-[10%] top-[15%]"
          />
          <GlowOrb
            color="#64748b"
            size={520}
            intensity={0.3}
            pulse
            className="right-[5%] bottom-[10%]"
          />

          {/* Card */}
          <motion.div
            key="winner-card"
            className={cn(
              "relative z-10 w-full max-w-xl mx-4 rounded-2xl border bg-space-800/80 backdrop-blur-2xl p-8 shadow-2xl text-white overflow-hidden",
              youWon
                ? "border-amber-500/40 shadow-glowAmber"
                : "border-white/15",
            )}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            {!noBids && <Confetti count={30} />}

            {youWon && !noBids && (
              <div className="mb-4 flex justify-center">
                <Badge
                  variant="warning"
                  className="!text-[10px] tracking-[0.18em]"
                >
                  <Sparkles className="h-3 w-3" aria-hidden /> You won this lot
                </Badge>
              </div>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 18,
                delay: 0.05,
              }}
              className="text-center"
            >
              {noBids ? (
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Auction Closed
                </h2>
              ) : (
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
                  <SparklesText
                    sparklesCount={14}
                    colors={["#f59e0b", "#fbbf24", "#cbd5e1"]}
                  >
                    <AnimatedGradientText
                      from="#cbd5e1"
                      via="#f59e0b"
                      to="#cbd5e1"
                    >
                      AUCTION WON
                    </AnimatedGradientText>
                  </SparklesText>
                </h2>
              )}
            </motion.div>

            {noBids ? (
              <p className="mt-6 text-center text-sm text-white/70">
                No bids were placed before the auction ended.
              </p>
            ) : (
              <>
                <p className="mt-3 text-center text-3xl md:text-4xl font-bold text-white">
                  {winnerCompany ?? "No bids placed"}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      Winning bid
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-200">
                      {fmtUSD(auction.topBid)}
                      <span className="ml-1 text-xs text-white/50">/ RIN</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      Lot size
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                      {fmtRins(auction.quantity)}
                      <span className="ml-1 text-xs text-white/50">RINs</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      Estimated total
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-300">
                      {fmtUSDCompact(auction.quantity * auction.topBid)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      D-code · Seller
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">{auction.dCode}</Badge>
                      <span className="truncate text-xs text-white/70">
                        {auction.sellerCompany}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-7 flex justify-center">
              <Button
                type="button"
                variant="primary"
                onClick={onContinue}
                size="lg"
              >
                {noBids ? (
                  "Close"
                ) : (
                  <>
                    <Trophy className="h-4 w-4" aria-hidden />
                    Continue
                  </>
                )}
              </Button>
            </div>

            <p className="mt-4 text-center text-[10px] text-white/40">
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AuctionWinnerOverlay;
