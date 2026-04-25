import { Check } from "lucide-react";
import { Button, Separator } from "../ui";
import { BorderBeam, ShimmerButton } from "../magic";
import { cn } from "../../lib/cn";

interface Tier {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  ctaVariant?: "primary" | "ghost";
}

const tiers: Tier[] = [
  {
    name: "Observer",
    price: "$0",
    cadence: "/ month",
    description:
      "Browse the verified marketplace and run up to 3 audits per month.",
    features: ["Marketplace access", "3 audits / month", "Public risk signals"],
    cta: "Start Free",
    ctaVariant: "ghost",
  },
  {
    name: "Desk",
    price: "$499",
    cadence: "/ month",
    description: "For trading desks and compliance teams.",
    features: [
      "Unlimited audits",
      "Full diligence packets",
      "QAP provider matching",
      "Satellite intelligence",
      "Google 3D inspection",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlight: true,
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For obligated parties and large generators.",
    features: [
      "API access",
      "EMTS-ready packet format",
      "SLA",
      "Dedicated diligence analyst",
      "SSO/SAML",
      "On-prem deployment",
    ],
    cta: "Talk to Sales",
    ctaVariant: "ghost",
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative isolate overflow-hidden py-24 bg-space-900"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">PRICING</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.01em] text-white">
            Straightforward. Audit-first.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white/[0.04] backdrop-blur-xl p-7 shadow-glass overflow-hidden transition-transform duration-300",
                tier.highlight
                  ? "border-amber-500/40 shadow-glowAmber md:scale-[1.02]"
                  : "border-white/10 hover:-translate-y-1",
              )}
            >
              {tier.highlight && (
                <>
                  <BorderBeam
                    duration={12}
                    size={220}
                    colorFrom="#94a3b8"
                    colorTo="#64748b"
                  />
                  <div className="absolute right-5 top-5 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Most popular
                  </div>
                </>
              )}

              {/* Header */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-white/50">{tier.cadence}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-white/65 leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-white/80"
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        tier.highlight
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-white/[0.08] text-steel-300",
                      )}
                    >
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-7">
                {tier.ctaVariant === "primary" ? (
                  <ShimmerButton className="w-full !py-2.5 !text-sm">
                    {tier.cta}
                  </ShimmerButton>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          All plans include the ORIN Integrity Audit baseline. EMTS filing
          handled by ORIN as a managed service.
        </p>
      </div>
    </section>
  );
}

export default PricingSection;
