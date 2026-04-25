// Curated demo companies that auto-fill Crustdata-friendly names + sensible
// default lot values. Each suggestion includes a domain so the lookup hits a
// real Crustdata record. Defaults are realistic per-D-code anchors, not real
// quotes.

import type { DCode, QAPStatus } from "../types/rin";

export interface BuyerSuggestion {
  name: string;
  domain: string;
  hint: string;
}

export interface SellerSuggestion {
  name: string;
  domain: string;
  city: string;
  facility: string;
  dCode: DCode;
  type: string;
  quantity: number;
  vintage: number;
  price: number;
  qapProvider: string;
  qapStatus: QAPStatus;
  hint: string;
}

// RIN BUYERS — obligated parties (refiners + importers under RFS).
export const buyerSuggestions: BuyerSuggestion[] = [
  {
    name: "Phillips 66",
    domain: "p66.com",
    hint: "Major refiner",
  },
  {
    name: "Marathon Petroleum",
    domain: "marathonpetroleum.com",
    hint: "Largest US refiner",
  },
  {
    name: "Valero Energy",
    domain: "valero.com",
    hint: "Refining + renewable diesel",
  },
  {
    name: "Chevron",
    domain: "chevron.com",
    hint: "Integrated major",
  },
  {
    name: "HF Sinclair",
    domain: "hfsinclair.com",
    hint: "Mid-continent refiner",
  },
  {
    name: "PBF Energy",
    domain: "pbfenergy.com",
    hint: "East/West coast refiner",
  },
];

// RIN SELLERS — generators + RNG operators.
export const sellerSuggestions: SellerSuggestion[] = [
  {
    name: "Green Plains",
    domain: "gpreinc.com",
    city: "Omaha, NE",
    facility: "Green Plains Madison",
    dCode: "D6",
    type: "Renewable Fuel / Ethanol",
    quantity: 500_000,
    vintage: 2026,
    price: 0.39,
    qapProvider: "EcoEngineers",
    qapStatus: "Verified",
    hint: "Ethanol producer",
  },
  {
    name: "POET",
    domain: "poet.com",
    city: "Sioux Falls, SD",
    facility: "POET Bioprocessing — Chancellor",
    dCode: "D6",
    type: "Renewable Fuel / Ethanol",
    quantity: 750_000,
    vintage: 2026,
    price: 0.42,
    qapProvider: "EcoEngineers",
    qapStatus: "Verified",
    hint: "Largest US ethanol producer",
  },
  {
    name: "Diamond Green Diesel",
    domain: "diamondgreendiesel.com",
    city: "Norco, LA",
    facility: "Diamond Green Diesel — Norco",
    dCode: "D4",
    type: "Renewable Diesel",
    quantity: 850_000,
    vintage: 2026,
    price: 1.02,
    qapProvider: "Weaver and Tidwell",
    qapStatus: "Verified",
    hint: "Renewable diesel JV",
  },
  {
    name: "Montauk Renewables",
    domain: "montaukenergy.com",
    city: "Pittsburgh, PA",
    facility: "Montauk RNG — Rumpke",
    dCode: "D3",
    type: "Cellulosic / RNG",
    quantity: 240_000,
    vintage: 2026,
    price: 0.92,
    qapProvider: "EcoEngineers",
    qapStatus: "Verified",
    hint: "Landfill gas / RNG",
  },
  {
    name: "Clean Energy Fuels",
    domain: "cleanenergyfuels.com",
    city: "Newport Beach, CA",
    facility: "CEF Dairy RNG — Tulare",
    dCode: "D3",
    type: "Cellulosic / RNG",
    quantity: 180_000,
    vintage: 2026,
    price: 0.95,
    qapProvider: "EcoEngineers",
    qapStatus: "Verified",
    hint: "Dairy RNG operator",
  },
  {
    name: "Aemetis",
    domain: "aemetis.com",
    city: "Cupertino, CA",
    facility: "Aemetis Keyes",
    dCode: "D5",
    type: "Advanced Biofuel",
    quantity: 320_000,
    vintage: 2026,
    price: 0.78,
    qapProvider: "Weaver and Tidwell",
    qapStatus: "Verified",
    hint: "Advanced biofuels",
  },
];
