import { ArrowRight } from "lucide-react";
import { Button } from "../ui";
import { BorderBeam, ShimmerButton } from "../magic";

export interface CTASectionProps {
  onBrowse: () => void;
}

export function CTASection({ onBrowse }: CTASectionProps) {
  const scrollToContact = () => {
    const el = document.querySelector("#contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-space-800/80 via-space-900/60 to-space-800/80 p-10 md:p-16 text-center shadow-glass backdrop-blur-xl">
          <BorderBeam size={260} duration={14} colorFrom="#22e0ff" colorTo="#a78bfa" />
          <p className="label-mono">DILIGENCE FIRST</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-white">
            Verify origin before purchase.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-white/65 leading-relaxed">
            Every lot on ORIN is scored against QAP status, feedstock
            plausibility, and satellite intelligence. Audit before you pay.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton onClick={onBrowse} className="!py-3">
              Browse the marketplace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ShimmerButton>
            <Button variant="ghost" size="lg" onClick={scrollToContact}>
              Talk to Sales
            </Button>
          </div>
          <p className="mt-6 text-[11px] text-white/45">
            ORIN does not accuse sellers of fraud. ORIN does not certify EPA
            validity. ORIN does not process EMTS transfers.
          </p>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
