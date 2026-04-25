import {
  Sparkles,
  Satellite,
  FileCheck2,
  FileText,
  BarChart3,
  Globe2,
  type LucideIcon,
} from "lucide-react";
import { MagicCard } from "../magic";
import { ChromeBackground } from "./ChromeBackground";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  glow: string;
}

const features: Feature[] = [
  {
    title: "ORIN Integrity Audit",
    description:
      "Scores every lot from QAP status, feedstock plausibility, and satellite signals.",
    icon: Sparkles,
    color: "#94a3b8",
    glow: "shadow-glowCyan",
  },
  {
    title: "Satellite Intelligence",
    description:
      "NASA FIRMS thermal checks + methane mismatch analysis for high-risk D3 RNG.",
    icon: Satellite,
    color: "#94a3b8",
    glow: "shadow-glowCyan",
  },
  {
    title: "QAP Cross-Check",
    description:
      "Matches uploaded attestations against the EPA's approved provider list in seconds.",
    icon: FileCheck2,
    color: "#94a3b8",
    glow: "shadow-glowCyan",
  },
  {
    title: "Diligence Packet",
    description:
      "One-click institutional-grade packet with evidence, flags, and risk analytics.",
    icon: FileText,
    color: "#d97706",
    glow: "shadow-glowAmber",
  },
  {
    title: "Purchase Analytics",
    description:
      "Market percentile, risk-adjusted value, replacement-risk exposure.",
    icon: BarChart3,
    color: "#94a3b8",
    glow: "shadow-glowCyan",
  },
  {
    title: "3D Site Inspection",
    description:
      "Photorealistic 3D map inspection of claimed facility locations.",
    icon: Globe2,
    color: "#94a3b8",
    glow: "shadow-glowCyan",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden py-24 bg-space-900"
    >
      <ChromeBackground intensity="low" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">PLATFORM</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.01em] text-white">
            The cheapest RIN is not always the safest RIN.
          </h2>
          <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
            ORIN layers quality scoring, QAP verification, satellite
            intelligence, and diligence packets on every listing.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <MagicCard
                key={feature.title}
                gradientColor={feature.color}
                gradientOpacity={0.10}
                gradientSize={280}
                className="group p-6 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                  >
                    <Icon
                      className="h-4 w-4 text-steel-400"
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/65 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
