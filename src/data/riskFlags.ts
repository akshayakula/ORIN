import type { RinLot, RiskFlag } from "../types/rin";

const HIGH_RISK_FLAGS: RiskFlag[] = [
  {
    severity: "high",
    title: "QAP documentation missing",
    description:
      "Seller claims verified RIN status, but no QAP attestation was uploaded.",
    recommendedAction: "Request QAP report and provider attestation.",
  },
  {
    severity: "high",
    title: "Satellite methane mismatch",
    description:
      "Methane plume observations were found near the claimed RNG facility during the production window.",
    recommendedAction:
      "Request downtime logs, leak detection records, and gas capture maintenance records.",
  },
  {
    severity: "medium",
    title: "Production volume anomaly",
    description:
      "Claimed RIN volume is materially higher than the facility's historical baseline.",
    recommendedAction:
      "Request meter calibration records and pipeline injection statements.",
  },
  {
    severity: "medium",
    title: "Facility identity mismatch",
    description:
      "Uploaded seller documents use a facility name that does not exactly match the registered facility profile.",
    recommendedAction:
      "Request facility registration confirmation and responsible corporate officer attestation.",
  },
];

const MEDIUM_RISK_FLAGS: RiskFlag[] = [
  {
    severity: "medium",
    title: "QAP attestation partially complete",
    description:
      "QAP provider letter is present but missing the production window attestation page.",
    recommendedAction:
      "Request the missing attestation page from the QAP provider.",
  },
  {
    severity: "medium",
    title: "Document completeness below threshold",
    description:
      "Required transfer documentation is below the 90% completeness threshold ORIN recommends for institutional buyers.",
    recommendedAction:
      "Request the remaining transfer documents before settlement.",
  },
  {
    severity: "low",
    title: "Facility identity matched",
    description:
      "Seller, facility, and project metadata are consistent across uploaded documentation.",
    recommendedAction: "Proceed with standard review.",
  },
  {
    severity: "low",
    title: "No satellite mismatch detected",
    description:
      "No major methane or thermal anomaly was found during the reviewed window.",
    recommendedAction: "Proceed with standard review.",
  },
];

const LOW_RISK_FLAGS: RiskFlag[] = [
  {
    severity: "low",
    title: "QAP provider verified",
    description:
      "Uploaded QAP provider name matches the approved provider list.",
    recommendedAction: "No enhanced action required.",
  },
  {
    severity: "low",
    title: "Facility identity matched",
    description:
      "Seller, facility, and project metadata are consistent across uploaded documentation.",
    recommendedAction: "Proceed with standard review.",
  },
  {
    severity: "low",
    title: "No satellite mismatch detected",
    description:
      "No major methane or thermal anomaly was found during the reviewed window.",
    recommendedAction: "Proceed with standard review.",
  },
];

export const getRiskFlagsForLot = (lot: RinLot): RiskFlag[] => {
  if (lot.id === "ORIN-D3-003") {
    return HIGH_RISK_FLAGS;
  }
  if (lot.riskScore > 60) {
    return HIGH_RISK_FLAGS;
  }
  if (lot.riskScore > 25) {
    return MEDIUM_RISK_FLAGS;
  }
  return LOW_RISK_FLAGS;
};

export const evidenceChecklist = (lot: RinLot) => {
  const isRng = lot.type.toLowerCase().includes("rng") || lot.dCode === "D3";
  const isLiquidBio =
    lot.type.toLowerCase().includes("diesel") ||
    lot.type.toLowerCase().includes("biofuel") ||
    lot.type.toLowerCase().includes("ethanol");
  const verified = lot.qapStatus === "Verified";
  const noSatMismatch =
    !lot.satelliteStatus.toLowerCase().includes("mismatch") &&
    !lot.satelliteStatus.toLowerCase().includes("review");

  return [
    { label: "Seller attestation", present: true },
    { label: "QAP provider attestation", present: verified },
    { label: "RIN lot metadata", present: true },
    { label: "Transfer documentation", present: lot.riskScore < 70 },
    { label: "Production logs", present: lot.riskScore < 60 },
    { label: "Meter calibration records", present: lot.riskScore < 50 },
    {
      label: "Pipeline injection statement",
      present: isRng ? verified : false,
      hidden: !isRng,
    },
    {
      label: "Feedstock documentation",
      present: isLiquidBio ? verified : false,
      hidden: !isLiquidBio,
    },
    { label: "Facility registration evidence", present: lot.riskScore < 70 },
    { label: "Prior transaction history", present: true },
    { label: "Satellite methane check", present: noSatMismatch },
    { label: "NASA FIRMS thermal / flare check", present: noSatMismatch },
  ].filter((x) => !("hidden" in x && x.hidden));
};

export const buildAnalytics = (lot: RinLot) => {
  const docCompleteness =
    lot.qapStatus === "Verified"
      ? 95 - Math.min(20, lot.riskScore / 4)
      : lot.qapStatus === "Partial"
        ? 62
        : 38;
  const satelliteMismatch =
    lot.satelliteStatus.toLowerCase().includes("mismatch") ||
    lot.satelliteStatus.toLowerCase().includes("review");
  const marketPercentile = Math.round(
    Math.max(5, Math.min(98, 100 - lot.riskScore - (lot.price - 0.5) * 30)),
  );
  const riskAdjustedValue =
    lot.quantity * lot.price * (1 - lot.riskScore / 200);
  const replacementRiskExposure = (lot.riskScore / 100) * lot.quantity * lot.price;

  let recommendation = lot.recommendation;
  if (lot.riskScore > 70) {
    recommendation =
      "ORIN flags diligence risk before purchase — do not proceed without enhanced review.";
  } else if (lot.riskScore > 40) {
    recommendation = "Proceed only after targeted document review.";
  } else {
    recommendation = "Proceed with standard institutional review.";
  }

  return {
    marketPercentile,
    riskAdjustedValue,
    documentCompleteness: Math.round(docCompleteness),
    satelliteMismatch,
    replacementRiskExposure,
    recommendation,
  };
};
