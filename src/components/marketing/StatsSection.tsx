import { useEffect, useState } from "react";
import { NumberTicker, Particles } from "../magic";
import { totals2026, dCode2026Aggregates } from "../../data/epaContext";
import { useSellerListings } from "../../hooks/useSellerListings";
import { useLiveAuctions } from "../../hooks/useLiveAuctions";

// Real numbers, no synthetic deltas. Pulled from:
//   - EPA RFS public reports (epaContext) for 2026 RIN totals
//   - Upstash-backed listings catalog for live lot count
//   - Live auctions hook for active-auction count

interface StatTile {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  source: string;
}

export function StatsSection() {
  const { listings } = useSellerListings();
  const { auctions } = useLiveAuctions();
  const [tiles, setTiles] = useState<StatTile[]>([]);

  useEffect(() => {
    const generatedB = totals2026.generated / 1_000_000_000;
    const availableB = totals2026.available / 1_000_000_000;
    const dCodes = dCode2026Aggregates.length;
    setTiles([
      {
        label: "Verified RIN Lots",
        value: listings.length,
        source: "Live · Upstash",
      },
      {
        label: "RINs Generated · 2026",
        value: generatedB,
        suffix: "B",
        decimals: 2,
        source: "EPA RFS Mar 2026",
      },
      {
        label: "RINs Available · 2026",
        value: availableB,
        suffix: "B",
        decimals: 2,
        source: "EPA RFS Mar 2026",
      },
      {
        label: "Live Auctions",
        value: auctions.length,
        source: dCodes ? "Live · Upstash" : "—",
      },
    ]);
  }, [listings.length, auctions.length]);

  return (
    <section
      id="impact"
      className="relative isolate overflow-hidden py-20 bg-space-800"
    >
      <Particles quantity={28} size={1.1} color="#94a3b8" className="opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">ORIN BY THE NUMBERS</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.01em] text-white">
            Real-time numbers from real public data.
          </h2>
          <p className="mt-3 text-sm text-white/55">
            Lot counts come from our Upstash-backed marketplace. RIN totals come
            from public EPA RFS reports.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-glass transition-colors hover:border-white/15"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                {tile.label}
              </p>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
                  <NumberTicker
                    value={tile.value}
                    decimals={tile.decimals ?? 0}
                    prefix={tile.prefix}
                  />
                </span>
                {tile.suffix && (
                  <span className="text-base md:text-lg font-semibold text-steel-400">
                    {tile.suffix}
                  </span>
                )}
              </div>

              <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                {tile.source}
              </p>

              <div className="mt-4 h-px w-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
