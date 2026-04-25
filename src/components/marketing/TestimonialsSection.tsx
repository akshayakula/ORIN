import { Quote } from "lucide-react";
import { ChromeBackground } from "./ChromeBackground";

interface Testimonial {
  quote: string;
  attribution: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "We can't afford to hold a RIN that later gets invalidated. ORIN's audit flow is exactly the kind of pre-purchase check our compliance desk needed.",
    attribution: "Head of Compliance",
    role: "Obligated party (anonymized)",
  },
  {
    quote:
      "The 3D site inspection and NASA thermal check saved us from a sketchy D3 listing. The price was too good to be true.",
    attribution: "RIN Trader",
    role: "Regional refiner",
  },
  {
    quote:
      "QAP status in seconds instead of hours of back-and-forth. The diligence packet is my favorite feature.",
    attribution: "Sustainability Program Manager",
    role: "Fuel generator",
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative isolate overflow-hidden py-24 bg-space-900"
    >
      <ChromeBackground intensity="low" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">CUSTOMER VOICES</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.01em] text-white">
            ORIN replaces the pre-purchase panic.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, idx) => (
            <figure
              key={idx}
              className="relative flex flex-col rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl p-7 shadow-glass overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            >
              <Quote
                className="absolute -top-2 right-4 h-16 w-16 text-white/[0.04]"
                aria-hidden
              />
              <blockquote className="relative text-base text-white/85 leading-relaxed flex-1">
                <span aria-hidden className="text-steel-400 text-3xl leading-none mr-1">
                  &ldquo;
                </span>
                {t.quote}
                <span aria-hidden className="text-steel-400 text-3xl leading-none ml-1">
                  &rdquo;
                </span>
              </blockquote>

              <figcaption className="mt-6 pt-5 border-t border-white/10">
                <div className="text-sm font-semibold text-white">
                  {t.attribution}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-white/50">
                  {t.role}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
