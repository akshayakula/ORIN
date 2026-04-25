import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Upload,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { Particles } from "../magic";
import { cn } from "../../lib/cn";
import type { UserRole } from "../../hooks/useUserRole";

interface RoleSplashProps {
  open: boolean;
  onPick: (role: UserRole) => void;
  /** When provided, shows a close button so the user can dismiss the splash without picking a role. */
  onDismiss?: () => void;
}

export default function RoleSplash({ open, onPick, onDismiss }: RoleSplashProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="role-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[70] grid place-items-center overflow-hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-space-900/85 backdrop-blur-xl"
            onClick={onDismiss}
          />
          <Particles quantity={32} className="absolute inset-0" />

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="absolute top-5 right-5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 w-[min(1080px,94vw)] px-6"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/60 mb-5">
                Welcome to ORIN
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.01em] text-white mb-4">
                Are you{" "}
                <span className="text-steel-300 underline decoration-steel-500/40 underline-offset-[6px]">
                  buying
                </span>{" "}
                or{" "}
                <span className="text-amber-400 underline decoration-amber-500/40 underline-offset-[6px]">
                  selling
                </span>{" "}
                RINs?
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
                ORIN is an origin-verified marketplace for Renewable Identification
                Numbers. Pick your side — we'll personalize the experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <RoleCard
                role="buyer"
                title="I'm Buying RINs"
                subtitle="Obligated party, trading desk, or compliance team"
                accent="steel"
                icon={<ShoppingCart className="h-7 w-7" />}
                bullets={[
                  "Browse verified lots on the 3D marketplace",
                  "Run the ORIN Integrity Audit before purchase",
                  "Download institutional diligence packets",
                ]}
                cta="Browse marketplace"
                onPick={() => onPick("buyer")}
              />

              <RoleCard
                role="seller"
                title="I'm Selling RINs"
                subtitle="Fuel generator, RNG producer, or broker"
                accent="amber"
                icon={<Upload className="h-7 w-7" />}
                bullets={[
                  "List verified RIN lots in minutes",
                  "Drop your facility pin on the ORIN globe",
                  "Publish with an ORIN Integrity score",
                ]}
                cta="List a RIN lot"
                onPick={() => onPick("seller")}
              />
            </div>

            <div className="mt-8 text-center text-[11px] text-white/40">
              ORIN flags diligence risk before purchase. ORIN does not accuse
              sellers of fraud and does not certify EPA validity.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RoleCardProps {
  role: UserRole;
  title: string;
  subtitle: string;
  accent: "steel" | "amber";
  icon: React.ReactNode;
  bullets: string[];
  cta: string;
  onPick: () => void;
}

function RoleCard({
  title,
  subtitle,
  accent,
  icon,
  bullets,
  cta,
  onPick,
}: RoleCardProps) {
  const accentClasses =
    accent === "steel"
      ? {
          badge: "bg-white/[0.08] border-white/15 text-steel-300",
          ring: "hover:border-white/25",
          chevron: "text-white/60",
          ctaPill: "bg-white/[0.08] text-white border-white/15 group-hover:bg-white/[0.12]",
        }
      : {
          badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          ring: "hover:border-amber-500/40 hover:shadow-glowAmber",
          chevron: "text-amber-300",
          ctaPill: "bg-white/[0.08] text-white border-white/15 group-hover:bg-white/[0.12]",
        };

  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group relative text-left rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7 transition-all",
        "hover:bg-white/[0.06] hover:-translate-y-1",
        accentClasses.ring,
      )}
    >
      <div className="flex items-start justify-between mb-5">
        <span
          className={cn(
            "grid place-items-center h-14 w-14 rounded-2xl border",
            accentClasses.badge,
          )}
        >
          {icon}
        </span>
        <ArrowRight
          className={cn(
            "h-5 w-5 transition-transform duration-300 group-hover:translate-x-1",
            accentClasses.chevron,
          )}
        />
      </div>

      <h3 className="text-2xl font-semibold tracking-tight text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-white/60 mb-5">{subtitle}</p>

      <ul className="space-y-2.5 mb-6">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-white/80">
            <span className="h-1 w-1 rounded-full bg-white/40 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition",
          accentClasses.ctaPill,
        )}
      >
        <Check className="h-4 w-4" />
        {cta}
      </div>
    </button>
  );
}
