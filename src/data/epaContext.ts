// Lightweight EPA RFS context distilled from epa_data/ CSVs.
// These are precomputed snapshots so the demo bundle does not have to ship
// the raw CSVs to the client.

export interface EpaProductionRow {
  rinYear: number;
  fuel: string;
  fuelCode: string;
  rinQuantity: number;
}

export interface EpaGenerationRow {
  rinYear: number;
  fuelCode: string;
  domestic: number;
  importer: number;
  foreign: number;
  total: number;
}

export const epaSummary = {
  fileWindow: "EPA RFS public moderated reports — through Mar 2026",
  fuelCodeMap: {
    "3": "Cellulosic Biofuel (D3)",
    "4": "Biomass-Based Diesel (D4)",
    "5": "Advanced Biofuel (D5)",
    "6": "Renewable Fuel / Ethanol (D6)",
    "7": "Cellulosic Diesel (D7)",
  },
  highlights: [
    {
      label: "Total RIN volume tracked across reports",
      value: "1.4T+ RINs (lifetime EPA-tracked)",
    },
    {
      label: "Most concentrated category",
      value: "D6 (Renewable Fuel / Ethanol)",
    },
    {
      label: "Fastest-growing category",
      value: "D4 Biomass-Based Diesel & Renewable Diesel",
    },
    {
      label: "Highest-risk attestation gap",
      value: "D3 RNG without QAP provider attestation",
    },
  ],
};

// Approximate market reference prices used for percentile context.
// These are stylized for the demo and do not reflect live broker prices.
export const referencePrices: Record<string, { low: number; mid: number; high: number }> = {
  D3: { low: 0.6, mid: 0.85, high: 1.05 },
  D4: { low: 0.7, mid: 0.92, high: 1.15 },
  D5: { low: 0.55, mid: 0.78, high: 0.95 },
  D6: { low: 0.32, mid: 0.55, high: 0.78 },
  D7: { low: 0.6, mid: 0.85, high: 1.05 },
};
