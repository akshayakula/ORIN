import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind, AlertTriangle } from "lucide-react";
import type { AirQualityResponse, RinLot } from "../types/rin";
import { fetchAirQuality, aqiStatus } from "../lib/airQuality";
import { cn } from "../lib/cn";

interface AirQualityCardProps {
  lot: RinLot;
  className?: string;
}

export default function AirQualityCard({ lot, className }: AirQualityCardProps) {
  const [data, setData] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchAirQuality(lot.lat, lot.lng, ctrl.signal)
      .then((d) => setData(d))
      .catch((e) => setError(String((e as Error).message ?? e)))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [lot.lat, lot.lng]);

  const universal = data?.indexes.find((i) => i.code === "uaqi") ?? data?.indexes[0];
  const local = data?.indexes.find((i) => i.code !== "uaqi") ?? null;
  const status = universal ? aqiStatus(universal.aqi) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("glass rounded-2xl p-5", className)}
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-white/5 border border-white/10">
            <Wind className="h-3.5 w-3.5 text-steel-400" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              Ambient Air Quality
            </h3>
            <p className="text-[11px] text-white/50">
              Google Air Quality · lat {lot.lat.toFixed(3)}, lng {lot.lng.toFixed(3)}
            </p>
          </div>
        </div>
        {data && (
          <span
            className={cn(
              "pill border text-[10px]",
              data.source === "live"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-white/10 text-white/70 border-white/15",
            )}
          >
            {data.source === "live" ? "LIVE" : "MOCK"}
          </span>
        )}
      </header>

      {loading && (
        <div className="space-y-3" aria-busy>
          <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-14 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-14 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-14 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-medium">Air quality unavailable</div>
            <div className="text-xs text-red-300/80">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && data && universal && status && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4 rounded-xl bg-white/5 border border-white/10 p-4">
            <div>
              <div className="label-mono mb-1">
                {universal.displayName}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-mono tracking-tight">
                  {universal.aqi}
                </span>
                <span className={cn("pill border", status.toneClass)}>
                  {universal.category ?? status.label}
                </span>
              </div>
              {universal.dominantPollutant && (
                <div className="text-xs text-white/60 mt-1">
                  Dominant pollutant: <span className="font-mono uppercase">{universal.dominantPollutant}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {local && (
                <div className="text-[11px] text-white/50">
                  {local.displayName}: <span className="font-mono text-white/80">{local.aqi}</span>
                </div>
              )}
            </div>
          </div>

          {data.pollutants.length > 0 && (
            <div>
              <div className="label-mono mb-2">Pollutants</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {data.pollutants.slice(0, 6).map((p) => (
                  <div
                    key={p.code}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-white/50">
                      {p.displayName}
                    </div>
                    <div className="font-mono text-sm text-white">
                      {p.concentration
                        ? `${p.concentration.value.toFixed(1)} ${abbrevUnits(p.concentration.units)}`
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.healthRecommendations?.generalPopulation && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 italic">
              {data.healthRecommendations.generalPopulation}
            </div>
          )}

          <div className="text-[10px] text-white/40">
            Ambient air quality is one of several ORIN diligence signals. It does
            not independently prove or disprove facility emissions claims.
          </div>
        </div>
      )}
    </motion.div>
  );
}

function abbrevUnits(u: string): string {
  switch (u) {
    case "MICROGRAMS_PER_CUBIC_METER":
      return "µg/m³";
    case "PARTS_PER_BILLION":
      return "ppb";
    case "PARTS_PER_MILLION":
      return "ppm";
    case "NANOGRAMS_PER_CUBIC_METER":
      return "ng/m³";
    default:
      return u.toLowerCase();
  }
}
