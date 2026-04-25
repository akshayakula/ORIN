import { NumberTicker, Particles } from "../magic";

interface StatTile {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delta: string;
}

const tiles: StatTile[] = [
  {
    label: "Verified RIN Lots",
    value: 1248,
    suffix: "+",
    delta: "+12.8% MoM",
  },
  {
    label: "Total Volume Tracked",
    value: 47.3,
    suffix: "B RINs",
    decimals: 1,
    delta: "+8.4% MoM",
  },
  {
    label: "QAP Cross-Checks",
    value: 9800,
    suffix: "+",
    delta: "+22.1% MoM",
  },
  {
    label: "Satellite Scans",
    value: 312000,
    delta: "+34.5% MoM",
  },
];

export function StatsSection() {
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
            Audit-first RIN trading at scale.
          </h2>
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

              <p className="mt-3 text-[11px] font-mono tracking-wider text-white/40">
                {tile.delta}
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
