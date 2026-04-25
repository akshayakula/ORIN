// EPA RFS context distilled from /epa_data/ CSVs on the main_data branch.
// Monthly fuel production + generation breakout reports from Jan 2025 through
// Mar 2026, plus the Mar 2026 available-RINs snapshot (available_RINS.csv).
// Numbers are rounded; precise figures live in the CSVs themselves.

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

export interface EpaAvailableRow {
  rinYear: number;
  dCode: string;
  assignmentType: "Assigned" | "Separated";
  totalGenerated: number;
  totalRetired: number;
  availableLocked: number;
  availableUnlocked: number;
}

// 2026 RIN availability snapshot — source: epa_data/available_RINS.csv
// Values are RINs available as of the Mar 2026 EPA report.
export const available2026: EpaAvailableRow[] = [
  {
    rinYear: 2026,
    dCode: "D3",
    assignmentType: "Assigned",
    totalGenerated: 230_794_254,
    totalRetired: 7_921_117,
    availableLocked: 1_581_180,
    availableUnlocked: 87_336_116,
  },
  {
    rinYear: 2026,
    dCode: "D3",
    assignmentType: "Separated",
    totalGenerated: 0,
    totalRetired: 124_966,
    availableLocked: 217_324,
    availableUnlocked: 133_613_551,
  },
  {
    rinYear: 2026,
    dCode: "D4",
    assignmentType: "Assigned",
    totalGenerated: 1_570_531_758,
    totalRetired: 16_143,
    availableLocked: 53_935,
    availableUnlocked: 420_769_305,
  },
  {
    rinYear: 2026,
    dCode: "D4",
    assignmentType: "Separated",
    totalGenerated: 0,
    totalRetired: 130_150_770,
    availableLocked: 2_294_048,
    availableUnlocked: 1_017_247_557,
  },
  {
    rinYear: 2026,
    dCode: "D5",
    assignmentType: "Assigned",
    totalGenerated: 65_235_107,
    totalRetired: 8_062,
    availableLocked: 0,
    availableUnlocked: 21_633_515,
  },
  {
    rinYear: 2026,
    dCode: "D5",
    assignmentType: "Separated",
    totalGenerated: 0,
    totalRetired: 8_913_816,
    availableLocked: 716_185,
    availableUnlocked: 33_963_529,
  },
  {
    rinYear: 2026,
    dCode: "D6",
    assignmentType: "Assigned",
    totalGenerated: 3_599_401_535,
    totalRetired: 1_864_652,
    availableLocked: 656_420,
    availableUnlocked: 770_308_912,
  },
  {
    rinYear: 2026,
    dCode: "D6",
    assignmentType: "Separated",
    totalGenerated: 0,
    totalRetired: 96_240_182,
    availableLocked: 5_255_641,
    availableUnlocked: 2_725_075_728,
  },
  {
    rinYear: 2026,
    dCode: "D7",
    assignmentType: "Assigned",
    totalGenerated: 9_226,
    totalRetired: 0,
    availableLocked: 0,
    availableUnlocked: 0,
  },
  {
    rinYear: 2026,
    dCode: "D7",
    assignmentType: "Separated",
    totalGenerated: 0,
    totalRetired: 0,
    availableLocked: 0,
    availableUnlocked: 9_226,
  },
];

// Aggregated 2026 totals per D-code (generated / retired / available).
export interface DCodeAggregate {
  dCode: string;
  generated: number;
  retired: number;
  available: number; // locked + unlocked, assigned + separated
}

export const dCode2026Aggregates: DCodeAggregate[] = (() => {
  const map = new Map<string, DCodeAggregate>();
  for (const row of available2026) {
    const key = row.dCode;
    const prev = map.get(key) ?? { dCode: key, generated: 0, retired: 0, available: 0 };
    prev.generated += row.totalGenerated;
    prev.retired += row.totalRetired;
    prev.available += row.availableLocked + row.availableUnlocked;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) => a.dCode.localeCompare(b.dCode));
})();

export const totals2026 = {
  generated: dCode2026Aggregates.reduce((s, d) => s + d.generated, 0),
  retired: dCode2026Aggregates.reduce((s, d) => s + d.retired, 0),
  available: dCode2026Aggregates.reduce((s, d) => s + d.available, 0),
};

export const epaSummary = {
  fileWindow: "EPA RFS public moderated reports — Jan 2025 through Mar 2026",
  sources: {
    fuelProduction: "epa_data/fuelproduction_*.csv (15 monthly files)",
    generationBreakout: "epa_data/generationbreakout_*.csv (15 monthly files)",
    availability: "epa_data/available_RINS.csv (2026 snapshot)",
  },
  fuelCodeMap: {
    D3: "Cellulosic Biofuel",
    D4: "Biomass-Based Diesel",
    D5: "Advanced Biofuel",
    D6: "Renewable Fuel / Ethanol",
    D7: "Cellulosic Diesel",
  },
  highlights: [
    {
      label: "2026 RINs generated to date",
      value: `${(totals2026.generated / 1_000_000_000).toFixed(2)}B RINs`,
    },
    {
      label: "2026 RINs currently available",
      value: `${(totals2026.available / 1_000_000_000).toFixed(2)}B RINs`,
    },
    {
      label: "Most concentrated category (2026)",
      value: "D6 Renewable Fuel / Ethanol (~3.5B available)",
    },
    {
      label: "Fastest-growing category",
      value: "D4 Biomass-Based / Renewable Diesel",
    },
    {
      label: "Highest-risk attestation gap",
      value: "D3 RNG without QAP provider attestation",
    },
  ],
};

// Market reference prices per D-code — stylized demo anchors (not live broker quotes).
export const referencePrices: Record<
  string,
  { low: number; mid: number; high: number }
> = {
  D3: { low: 0.6, mid: 0.85, high: 1.05 },
  D4: { low: 0.7, mid: 0.92, high: 1.15 },
  D5: { low: 0.55, mid: 0.78, high: 0.95 },
  D6: { low: 0.32, mid: 0.55, high: 0.78 },
  D7: { low: 0.6, mid: 0.85, high: 1.05 },
};
