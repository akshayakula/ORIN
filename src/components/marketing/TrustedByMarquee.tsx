import { Marquee } from "../magic";

const partners = [
  "ECOENGINEERS",
  "CHRISTIANSON PLLP",
  "WEAVER & TIDWELL",
  "SCS GLOBAL",
  "RSB",
  "ISCC+",
  "RSF",
  "NRG",
  "GREEN VALLEY RNG",
  "NORTHSTAR FUELS",
  "MIDWEST BIOFUELS",
  "SUMMIT ENV",
  "HEARTLAND EXCHANGE",
];

export function TrustedByMarquee() {
  return (
    <section
      id="integrations"
      className="relative isolate overflow-hidden py-16 bg-space-900"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="label-mono text-center">
          TRUSTED BY QAP PROVIDERS, OBLIGATED PARTIES, AND FUEL GENERATORS
        </p>

        <div className="mt-8">
          <Marquee speed={40} fade pauseOnHover>
            {partners.map((name) => (
              <span
                key={name}
                className="px-8 whitespace-nowrap text-lg font-semibold uppercase tracking-[0.2em] text-white/45 hover:text-white/75 transition-colors"
              >
                {name}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

export default TrustedByMarquee;
