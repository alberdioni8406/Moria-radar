// js/calculations/recovery.js
import { MORIA_DEPLOYMENTS } from "../config.js";

export function buybackWindow() {
  const start = new Date(MORIA_DEPLOYMENTS.v1.buybackStartDate + "T00:00:00Z");
  const minEnd = new Date(start);
  minEnd.setUTCMonth(minEnd.getUTCMonth() + MORIA_DEPLOYMENTS.v1.buybackMinMonths);
  return { start, minEnd };
}

// conversions: array of { amountMusd, amountBch, address, txid, blockHeight, timestamp }
export function recoveryStats(conversions) {
  if (!Array.isArray(conversions) || conversions.length === 0) return null;

  const totalMusd = conversions.reduce((s, c) => s + Number(c.amountMusd || 0), 0);
  const totalBch = conversions.reduce((s, c) => s + Number(c.amountBch || 0), 0);
  const uniqueAddresses = new Set(conversions.map((c) => c.address).filter(Boolean)).size;
  const largest = conversions.reduce(
    (max, c) => (Number(c.amountMusd || 0) > max ? Number(c.amountMusd) : max),
    0
  );

  return {
    totalMusdConverted: totalMusd,
    totalBchDistributed: totalBch,
    conversionCount: conversions.length,
    uniqueAddresses,
    averageConversion: totalMusd / conversions.length,
    largestConversion: largest
  };
}

export function volumeInWindow(conversions, windowMs) {
  if (!Array.isArray(conversions) || conversions.length === 0) return 0;
  const cutoff = Date.now() - windowMs;
  return conversions
    .filter((c) => new Date(c.timestamp).getTime() >= cutoff)
    .reduce((s, c) => s + Number(c.amountMusd || 0), 0);
}
