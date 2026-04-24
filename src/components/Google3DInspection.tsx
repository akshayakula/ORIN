import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "@googlemaps/js-api-loader";
import { Globe2, Satellite, MapPin, AlertTriangle, ExternalLink } from "lucide-react";
import type { RinLot } from "../types/rin";
import { cn } from "../lib/cn";

interface Google3DInspectionProps {
  lot: RinLot;
}

type LoadState = "idle" | "loading" | "ready" | "error";

function satelliteToneClasses(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("mismatch")) {
    return "bg-rose-500/15 text-rose-200 border-rose-400/30";
  }
  if (s.includes("review") || s.includes("pending") || s.includes("partial")) {
    return "bg-amber-500/15 text-amber-200 border-amber-400/30";
  }
  return "bg-cyan-400/15 text-cyan-200 border-cyan-300/30";
}

function satelliteDotClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("mismatch")) return "bg-rose-400 shadow-[0_0_12px_rgba(255,92,122,0.8)]";
  if (s.includes("review") || s.includes("pending") || s.includes("partial"))
    return "bg-amber-300 shadow-[0_0_12px_rgba(255,181,71,0.8)]";
  return "bg-cyan-300 shadow-[0_0_12px_rgba(34,224,255,0.8)]";
}

export default function Google3DInspection({ lot }: Google3DInspectionProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [state, setState] = useState<LoadState>("idle");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps SDK (once per lot.id mount)
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!apiKey || !container) {
      setState("error");
      return () => {
        cancelled = true;
      };
    }

    setState("loading");

    const loader = new Loader({
      apiKey,
      version: "alpha",
      libraries: ["maps3d"] as any,
    });

    (async () => {
      try {
        await loader.importLibrary("maps3d" as any);
        if (cancelled) return;

        // Clear previous children if effect re-runs
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        try {
          const map3d = document.createElement("gmp-map-3d") as any;
          map3d.setAttribute("center", `${lot.lat},${lot.lng},150`);
          map3d.setAttribute("tilt", "65");
          map3d.setAttribute("heading", "0");
          map3d.setAttribute("range", "900");
          try {
            map3d.setAttribute("mode", "hybrid");
          } catch {
            // attribute not supported in this version — ignore silently
          }
          map3d.style.width = "100%";
          map3d.style.height = "100%";
          map3d.style.display = "block";

          // Optional 3D marker at facility
          try {
            const marker = document.createElement("gmp-marker-3d") as any;
            marker.setAttribute("position", `${lot.lat},${lot.lng}`);
            marker.setAttribute("altitude-mode", "ABSOLUTE");
            marker.setAttribute("altitude", "80");
            marker.setAttribute("label", lot.facility);
            map3d.appendChild(marker);
          } catch {
            // marker element not registered — ignore
          }

          container.appendChild(map3d);
          if (!cancelled) setState("ready");
        } catch (mountErr) {
          if (!cancelled) setState("error");
          // eslint-disable-next-line no-console
          console.warn("gmp-map-3d mount failed", mountErr);
        }
      } catch (err) {
        if (!cancelled) setState("error");
        // eslint-disable-next-line no-console
        console.warn("Google Maps 3D load failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, [apiKey, lot.id, lot.lat, lot.lng, lot.facility]);

  const earthUrl = `https://earth.google.com/web/@${lot.lat},${lot.lng},150a,1200d,35y,0h,65t,0r`;
  const showFallback = state === "error" || !apiKey;

  return (
    <motion.div
      key={lot.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "glass-dark relative overflow-hidden w-full",
        "aspect-[16/10] min-h-[320px]",
      )}
    >
      {/* Live 3D map container */}
      {!showFallback && (
        <div ref={containerRef} className="absolute inset-0" />
      )}

      {/* Fallback stylized background */}
      {showFallback && (
        <div className="absolute inset-0 gmp-3d-fallback">
          {/* subtle grid */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.18] mix-blend-screen"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="g3d-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="0.5"
                />
              </pattern>
              <radialGradient id="g3d-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(34,224,255,0.25)" />
                <stop offset="100%" stopColor="rgba(34,224,255,0)" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g3d-grid)" />
            <circle cx="50%" cy="50%" r="30%" fill="url(#g3d-glow)" />
          </svg>

          {/* Pulsing pin at center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-10 w-10 rounded-full bg-cyan-300/20 animate-pulse-ring" />
              </div>
              <MapPin className="relative h-7 w-7 text-white/80 drop-shadow-[0_0_10px_rgba(34,224,255,0.6)]" />
            </div>
          </div>

          {/* Centered tooltip card */}
          <div className="absolute inset-x-0 bottom-[18%] flex justify-center pointer-events-none">
            <div className="glass px-4 py-3 max-w-[320px] text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                <div className="label-mono text-amber-200">
                  3D site inspection unavailable
                </div>
              </div>
              <div className="text-[11px] text-white/70 leading-snug">
                Connect Google Maps API key or enable Maps JavaScript API / 3D
                Maps.
              </div>
            </div>
          </div>

          {/* Coords bottom-left */}
          <div className="absolute bottom-3 left-3 font-mono text-[10px] text-white/50 tracking-wide">
            {lot.lat.toFixed(4)}°, {lot.lng.toFixed(4)}°
          </div>
        </div>
      )}

      {/* Loading shimmer */}
      {state === "loading" && !showFallback && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-space-800/60 to-space-700/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass px-4 py-2 label-mono flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-cyan-300 animate-spin-slow" />
              Loading 3D terrain…
            </div>
          </div>
        </div>
      )}

      {/* Top-left overlay: site identity */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="glass-dark px-3.5 py-2.5 rounded-xl backdrop-blur-xl max-w-[260px]">
          <div className="flex items-center gap-2 mb-1">
            <Satellite className="h-3 w-3 text-cyan-300" />
            <span className="label-mono">3D Site Inspection</span>
          </div>
          <div className="text-white text-sm font-semibold leading-tight">
            {lot.city}
          </div>
          <div className="text-white/70 text-[11px] leading-tight truncate">
            {lot.facility}
          </div>
          <div
            className={cn(
              "pill mt-2 border",
              satelliteToneClasses(lot.satelliteStatus),
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                satelliteDotClass(lot.satelliteStatus),
              )}
            />
            {lot.satelliteStatus}
          </div>
        </div>
      </div>

      {/* Top-right: open in Google Earth */}
      <a
        href={earthUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "absolute top-3 right-3 z-10",
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
          "bg-black/35 hover:bg-black/55 border border-white/10",
          "backdrop-blur-md transition-colors",
          "text-[10px] font-mono uppercase tracking-wider text-white/75 hover:text-white",
        )}
      >
        <Globe2 className="h-3 w-3" />
        Open in Google Earth
        <ExternalLink className="h-2.5 w-2.5" />
      </a>

      {/* Subtle inner ring border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
    </motion.div>
  );
}
