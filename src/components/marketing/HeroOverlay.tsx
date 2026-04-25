import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Activity } from "lucide-react";
import CrustdataBadge from "./CrustdataBadge";
import { Button } from "../ui";
import {
  ShimmerButton,
  SparklesText,
  NumberTicker,
} from "../magic";

export interface HeroOverlayProps {
  onGetStarted: () => void;
  onBrowse: () => void;
  onListRins: () => void;
  stats?: { lots: number; avgRisk: number; coverage: string };
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function HeroOverlay({
  onGetStarted,
  onBrowse,
  onListRins,
  stats = { lots: 1248, avgRisk: 18, coverage: "47.3B" },
}: HeroOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4 md:px-8">
        <motion.div
          className="pointer-events-auto max-w-xl"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.1, delayChildren: 0.05 }}
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200 shadow-glowCyan"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-glow/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-glow" />
            </span>
            <Activity className="h-3 w-3" aria-hidden />
            LIVE BETA · Mar 2026 RFS data
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]"
          >
            Buy RINs with{" "}
            <SparklesText
              className="text-cyan-glow"
              colors={["#22e0ff", "#a78bfa", "#ffb547"]}
              sparklesCount={12}
            >
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-glow to-violet-300 bg-clip-text text-transparent">
                confidence
              </span>
            </SparklesText>
            .
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-5 text-base md:text-lg text-white/70 leading-relaxed max-w-lg"
          >
            ORIN is an origin-verified marketplace for Renewable Identification
            Numbers with built-in quality scoring, QAP checks, satellite
            intelligence, and audit-ready diligence packets.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <ShimmerButton onClick={onGetStarted} className="!py-3">
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ShimmerButton>
            <Button
              variant="ghost"
              size="lg"
              onClick={onBrowse}
              className="!rounded-full"
            >
              Browse Verified RINs
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onListRins}
              className="!rounded-full"
            >
              List Your RINs
            </Button>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center gap-2.5"
          >
            <div className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow shadow-glowCyan" />
              <span className="font-semibold text-white">
                <NumberTicker value={stats.lots} startOnMount />
              </span>
              <span className="text-white/55">verified lots</span>
            </div>
            <div className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-glow shadow-glowAmber" />
              <span className="text-white/55">{"<"}</span>
              <span className="font-semibold text-white">
                <NumberTicker value={stats.avgRisk} startOnMount />
              </span>
              <span className="text-white/55">risk score · ORIN grade A</span>
            </div>
            <div className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.6)]" />
              <span className="font-semibold text-white">{stats.coverage}</span>
              <span className="text-white/55">tracked volume</span>
            </div>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-6 inline-flex items-center gap-2 text-[11px] text-white/45 max-w-md leading-relaxed"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-glow/80" aria-hidden />
            <span>
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud.
            </span>
          </motion.p>

          {/* Data partner badge */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-4"
          >
            <CrustdataBadge />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default HeroOverlay;
