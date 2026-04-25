// Marker / risk styling helpers shared by globe + marketplace UI.
// Previously colocated with the demo lot data; now standalone since all
// marketplace lots are loaded from Upstash.

export const getMarkerColor = (riskScore: number): string => {
  if (riskScore <= 25) return "#22e0ff";
  if (riskScore <= 60) return "#ffb547";
  return "#ff5c7a";
};

export const getMarkerColorRgba = (
  riskScore: number,
  alpha = 1,
): string => {
  if (riskScore <= 25) return `rgba(34, 224, 255, ${alpha})`;
  if (riskScore <= 60) return `rgba(255, 181, 71, ${alpha})`;
  return `rgba(255, 92, 122, ${alpha})`;
};

export const getRiskTier = (
  riskScore: number,
): "low" | "medium" | "high" => {
  if (riskScore <= 25) return "low";
  if (riskScore <= 60) return "medium";
  return "high";
};
