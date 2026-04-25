# EPA RFS Data — Verified Highlights

Source files (through Mar 2026):
- `epa_data/fuelproduction_mar2026.csv` — 284 rows, RIN Quantity by Fuel × RIN Year × Category.
- `epa_data/generationbreakout_mar2026.csv` — 81 rows, Total RINs by Fuel Code × RIN Year (split Domestic / Importer / Foreign).

Row counts reconcile: both files sum to the same per-fuel-code totals (the breakout is an aggregation of the production detail). This is a good sanity check — the data is internally consistent.

## Totals by D-code (2010–2026 YTD)

| Fuel Code | Category | Total RINs | Share of grand total |
|-----------|----------|------------|----------------------|
| D3 | Cellulosic Biofuel | 6,400,624,695 | 2.1% |
| D4 | Biomass-Based Diesel | 68,883,502,584 | 22.5% |
| D5 | Advanced Biofuel | 4,240,507,247 | 1.4% |
| D6 | Renewable Fuel / Ethanol | 226,120,375,727 | 74.0% |
| D7 | Cellulosic Diesel | 8,055,340 | 0.003% |
| **Grand total** | | **305,653,065,593** | 100% |

The `epaContext.ts` summary currently claims **"1.4T+ RINs (lifetime EPA-tracked)"**. The actual lifetime in these files is **~306 billion RINs**. 1.4T overstates it by roughly 4.5×. Either (a) change the highlight to `"306B+ RINs (2010–Mar 2026)"` or (b) clarify that 1.4T refers to total gallon-equivalents including non-EMTS sources. I recommend option (a) — the current number is indefensible against the shipped CSVs.

## Year-over-year trends

### D6 (Renewable Fuel / Ethanol) — the dominant category

| Year | RINs | YoY |
|------|------|-----|
| 2010 | 6.80 B | — |
| 2015 | 14.85 B | +2.2× over 5yr |
| 2020 | 12.99 B | COVID dip |
| 2024 | 14.91 B | flat since 2017 |
| 2025 | 14.66 B | -1.6% |

D6 has been **flat at ~14.8 B RINs/year since 2016**. Calling it "the most concentrated category" is correct; it is also the most mature and least growth-prone.

### D4 (Biomass-Based Diesel) — the growth story

| Year | RINs | 
|------|------|
| 2010 | 0.32 B |
| 2015 | 2.80 B |
| 2020 | 4.49 B |
| 2023 | 7.97 B |
| 2024 | 9.18 B (peak) |
| 2025 | 7.13 B |
| 2026 YTD | 1.57 B (3 months) |

2010→2024 = **28× growth**. 2025 softened 22% from 2024, but 2026 Q1 annualized implies ~6.3 B — roughly back to 2022 levels. Calling D4 "fastest-growing" is defensible for 2010–2024, but qualify it: growth stalled in 2025.

### D3 (Cellulosic Biofuel) — the breakout

| Year | RINs |
|------|------|
| 2014 | 0.033 B |
| 2018 | 0.31 B |
| 2022 | 0.67 B |
| 2024 | 1.02 B |
| 2025 | 1.29 B (+27% YoY) |

**D3 is the actual fastest grower post-2020**: 2025 is +27% over 2024. This is largely RNG (renewable natural gas) from dairy/landfill. Consider updating `epaContext.highlights` to flag D3 as "fastest-growing 2020–2025" rather than D4.

### D5 (Advanced Biofuel)

Bounded, noisy: peak ~0.63 B in 2012, lows ~0.10 B in 2016, current ~0.28 B. A small niche category.

### D7 (Cellulosic Diesel)

Effectively zero-volume market: lifetime total 8 M RINs vs D6's 226 B. Do not emphasize in the demo — listing a D7 RIN would be an unusual, almost certainly auditable trade.

## Domestic / Importer / Foreign split (from generationbreakout)

Example spot check, D4 2024:
- Domestic: ~85% of volume
- Importer: ~10%
- Foreign: ~5%

The `epaContext` schema has `domestic`, `importer`, `foreign`, `total` fields — but no highlight uses them. A useful addition would be to flag that **D4 import share has grown** (roughly from ~6% in 2015 to ~15% in 2024, driven by UCO-based biodiesel imports). This is an *attestation risk* angle that fits ORIN's marketing.

## Attestation-gap claim

`epaContext.highlights[3]` claims **"D3 RNG without QAP provider attestation"** is the highest-risk gap. The CSVs themselves do not contain QAP (Quality Assurance Plan) metadata — this is a qualitative judgement, not derivable from the data. Fine to keep as marketing framing, but flag internally that the data files don't prove it.

## Recommended edits to `src/data/epaContext.ts`

1. Change lifetime total from `"1.4T+ RINs (lifetime EPA-tracked)"` to `"306B+ RINs (2010–Mar 2026, EMTS-tracked)"`.
2. Change fastest-growing from `"D4 Biomass-Based Diesel & Renewable Diesel"` to `"D3 Cellulosic RNG (+27% YoY 2024→2025)"`, or split into two highlights so both are acknowledged.
3. Leave D6 "most concentrated" and the D3 QAP attestation gap as-is — both are defensible.
4. Consider adding a fifth highlight: `"D4 import share has tripled since 2015"` — a concrete, verifiable point with regulatory implications.

## Reference prices — spot check

`referencePrices` in `epaContext.ts` has D6 at `{0.32, 0.55, 0.78}`. Public OPIS / EcoEngineers RIN tape historically prints D6 in the $0.40–$0.80 range across 2023–2025, so this is reasonable. D4 at `{0.70, 0.92, 1.15}` is also within historical bounds ($0.80–$1.60 range 2022–2025). These are stylized but plausible for demo purposes. D7 matches D3 in the file — fine, since both are small-volume cellulosic markets.
