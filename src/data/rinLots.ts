import type { RinLot } from "../types/rin";

export const rinLots: RinLot[] = [
  {
    id: "ORIN-D3-001",
    lat: 44.9778,
    lng: -93.265,
    city: "Minneapolis, MN",
    dCode: "D3",
    type: "Cellulosic / RNG",
    quantity: 250000,
    vintage: 2025,
    price: 0.92,
    seller: "Green Valley RNG LLC",
    facility: "Green Valley Landfill RNG",
    qapProvider: "EcoEngineers",
    qapStatus: "Verified",
    orinGrade: "A",
    riskScore: 18,
    satelliteStatus: "No major mismatch",
    recommendation: "Suitable for purchase after standard review",
  },
  {
    id: "ORIN-D4-002",
    lat: 41.8781,
    lng: -87.6298,
    city: "Chicago, IL",
    dCode: "D4",
    type: "Biomass-based Diesel",
    quantity: 500000,
    vintage: 2025,
    price: 0.84,
    seller: "Midwest Biofuels Trading",
    facility: "Prairie Renewable Diesel",
    qapProvider: "Christianson PLLP",
    qapStatus: "Verified",
    orinGrade: "B",
    riskScore: 46,
    satelliteStatus: "No satellite mismatch; document review needed",
    recommendation: "Purchase only after targeted document review",
  },
  {
    id: "ORIN-D3-003",
    lat: 39.7392,
    lng: -104.9903,
    city: "Denver, CO",
    dCode: "D3",
    type: "Cellulosic / RNG",
    quantity: 400000,
    vintage: 2025,
    price: 0.71,
    seller: "Summit Environmental Credits",
    facility: "Summit Landfill Gas Project",
    qapProvider: "Not verified",
    qapStatus: "Missing",
    orinGrade: "C",
    riskScore: 82,
    satelliteStatus: "Methane mismatch detected",
    recommendation: "Do not purchase without enhanced diligence",
  },
  {
    id: "ORIN-D5-004",
    lat: 29.7604,
    lng: -95.3698,
    city: "Houston, TX",
    dCode: "D5",
    type: "Advanced Biofuel",
    quantity: 150000,
    vintage: 2024,
    price: 0.63,
    seller: "Atlantic Credit Desk",
    facility: "Coastal Bioenergy Import Terminal",
    qapProvider: "Partial docs",
    qapStatus: "Partial",
    orinGrade: "C",
    riskScore: 76,
    satelliteStatus: "Supply-chain review needed",
    recommendation: "Enhanced review required",
  },
  {
    id: "ORIN-D4-005",
    lat: 37.7749,
    lng: -122.4194,
    city: "San Francisco, CA",
    dCode: "D4",
    type: "Renewable Diesel",
    quantity: 750000,
    vintage: 2025,
    price: 0.98,
    seller: "NorthStar Renewable Fuels",
    facility: "NorthStar RD Facility",
    qapProvider: "Weaver and Tidwell",
    qapStatus: "Verified",
    orinGrade: "A+",
    riskScore: 9,
    satelliteStatus: "No major mismatch",
    recommendation: "Premium verified lot",
  },
  {
    id: "ORIN-D6-006",
    lat: 41.2565,
    lng: -95.9345,
    city: "Omaha, NE",
    dCode: "D6",
    type: "Renewable Fuel / Ethanol",
    quantity: 300000,
    vintage: 2025,
    price: 0.39,
    seller: "Heartland Ethanol Exchange",
    facility: "Heartland Ethanol Plant",
    qapProvider: "Missing",
    qapStatus: "Missing",
    orinGrade: "B-",
    riskScore: 58,
    satelliteStatus: "No satellite mismatch; missing docs",
    recommendation: "Needs additional documentation",
  },
];

export const getLotById = (id: string): RinLot | undefined =>
  rinLots.find((l) => l.id === id);

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
