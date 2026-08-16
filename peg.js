// js/calculations/peg.js

export const PEG_TARGET_USD = 1.0;

export function pegDeviation(marketPriceUsd) {
  if (typeof marketPriceUsd !== "number" || !Number.isFinite(marketPriceUsd)) return null;
  const deviation = marketPriceUsd - PEG_TARGET_USD;
  const percent = (deviation / PEG_TARGET_USD) * 100;
  return { deviation, percent };
}

// Thresholds are intentionally conservative and documented, not hidden.
export function pegStatus(percentDeviation) {
  if (percentDeviation === null || percentDeviation === undefined) return "unknown";
  const abs = Math.abs(percentDeviation);
  if (abs <= 1) return "near-peg"; // 🟢
  if (abs <= 5) return "deviation"; // 🟡
  return "significant"; // 🔴
}

export const PEG_STATUS_LABEL = {
  "near-peg": "🟢 Near Peg",
  deviation: "🟡 Deviation",
  significant: "🔴 Significant Deviation",
  unknown: "⚪ Unknown"
};
