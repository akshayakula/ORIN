import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import type { RinLot } from "../types/rin";
import { getMarkerColor, getMarkerColorRgba } from "../lib/lotStyles";

interface GlobeMarketplaceProps {
  selectedLot: RinLot | null;
  hoveredLot: RinLot | null;
  onHover: (lot: RinLot | null) => void;
  onSelect: (lot: RinLot | null) => void;
  auditing?: boolean;
  lots?: RinLot[];
  onGlobeClick?: (coords: { lat: number; lng: number }) => void;
}

const US_VIEW = { lat: 39.8, lng: -98.5, altitude: 2.2 } as const;

const GLOBE_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-night.jpg";
const BUMP_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-topology.png";
const BACKGROUND_IMAGE =
  "https://unpkg.com/three-globe/example/img/night-sky.png";

interface AuditRing {
  lat: number;
  lng: number;
  intense: boolean;
  riskScore: number;
  id: string;
}

export default function GlobeMarketplace({
  selectedLot,
  hoveredLot,
  onHover,
  onSelect,
  auditing = false,
  lots,
  onGlobeClick,
}: GlobeMarketplaceProps) {
  const rinLots = lots ?? [];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof window === "undefined") return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mounted]);

  const ringsData = useMemo<AuditRing[]>(() => {
    const base: AuditRing[] = rinLots.map((l) => ({
      id: `${l.id}-ring`,
      lat: l.lat,
      lng: l.lng,
      intense: false,
      riskScore: l.riskScore,
    }));
    if (auditing && selectedLot) {
      base.push({
        id: `${selectedLot.id}-ring-intense`,
        lat: selectedLot.lat,
        lng: selectedLot.lng,
        intense: true,
        riskScore: selectedLot.riskScore,
      });
    }
    return base;
  }, [auditing, selectedLot, rinLots]);

  const labelsData = useMemo(() => rinLots, [rinLots]);

  useEffect(() => {
    if (!mounted) return;
    const g = globeRef.current;
    if (!g) return;

    const controls = g.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.enableZoom = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 180;
      controls.maxDistance = 650;
    }

    g.pointOfView?.(US_VIEW, 1600);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls?.();
    if (!controls) return;

    if (auditing) {
      controls.autoRotateSpeed = 1.6;
    } else if (selectedLot) {
      controls.autoRotateSpeed = 0.1;
    } else {
      controls.autoRotateSpeed = 0.4;
    }
  }, [auditing, selectedLot, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const g = globeRef.current;
    if (!g) return;

    if (selectedLot) {
      g.pointOfView?.(
        { lat: selectedLot.lat, lng: selectedLot.lng, altitude: 1.4 },
        1200,
      );
    } else {
      g.pointOfView?.(US_VIEW, 1200);
    }
  }, [selectedLot, mounted]);

  const ringColorAccessor = (d: any) => {
    if (d.intense) {
      return (t: number) => `rgba(230, 250, 255, ${0.85 * (1 - t)})`;
    }
    const score = d.riskScore as number;
    return (t: number) => getMarkerColorRgba(score, 0.7 * (1 - t));
  };

  return (
    <div
      ref={wrapperRef}
      className="scene absolute inset-0 overflow-hidden"
    >
      {!mounted || size.width === 0 || size.height === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass px-5 py-3 label-mono">
            Loading orbital systems…
          </div>
        </div>
      ) : (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          globeImageUrl={GLOBE_IMAGE}
          bumpImageUrl={BUMP_IMAGE}
          backgroundImageUrl={BACKGROUND_IMAGE}
          showAtmosphere
          atmosphereColor="#94a3b8"
          atmosphereAltitude={0.18}
          animateIn
          onGlobeClick={(c: { lat: number; lng: number }) => {
            onGlobeClick?.({ lat: c.lat, lng: c.lng });
          }}
          pointsData={rinLots}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={() => 0.02}
          pointRadius={(d: any) =>
            selectedLot?.id === d.id
              ? 0.9
              : hoveredLot?.id === d.id
                ? 0.75
                : 0.55
          }
          pointColor={(d: any) => getMarkerColor(d.riskScore)}
          pointResolution={16}
          pointsTransitionDuration={600}
          pointLabel={() => ""}
          onPointHover={(pt) => onHover((pt as RinLot) ?? null)}
          onPointClick={(pt) => {
            const lot = pt as RinLot;
            onSelect(lot);
            globeRef.current?.pointOfView?.(
              { lat: lot.lat, lng: lot.lng, altitude: 1.4 },
              1200,
            );
          }}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringAltitude={0.005}
          ringMaxRadius={(d: any) =>
            d.intense
              ? 5
              : d.riskScore > 60
                ? 4
                : d.riskScore > 25
                  ? 3
                  : 2.4
          }
          ringPropagationSpeed={(d: any) =>
            d.intense ? 5 : d.riskScore > 60 ? 4 : 2.5
          }
          ringRepeatPeriod={(d: any) => (d.intense ? 700 : 1100)}
          ringColor={ringColorAccessor}
          ringResolution={64}
          labelsData={labelsData}
          labelLat="lat"
          labelLng="lng"
          labelAltitude={0.03}
          labelText={(d: any) => `${d.dCode} · ${d.orinGrade}`}
          labelSize={0.4}
          labelDotRadius={0}
          labelColor={() => "rgba(255,255,255,0.85)"}
          labelResolution={2}
        />
      )}
    </div>
  );
}
