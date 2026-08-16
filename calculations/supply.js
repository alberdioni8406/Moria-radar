// js/calculations/supply.js
// Derives MUSD supply figures from indexer history events. Every function
// here is DERIVED classification (see config.js CLASSIFICATION) — it never
// invents a number when the underlying events aren't present.

// history: array of { type: "borrow"|"repay"|"redeem"|"liquidate"|..., amountMusd, timestamp }
export function currentOutstandingSupply(historyEvents) {
  if (!Array.isArray(historyEvents) || historyEvents.length === 0) return null;
  let outstanding = 0;
  for (const ev of historyEvents) {
    const amt = Number(ev.amountMusd ?? ev.amount_musd ?? 0);
    if (!Number.isFinite(amt)) continue;
    if (ev.type === "borrow") outstanding += amt;
    if (ev.type === "repay" || ev.type === "redeem" || ev.type === "liquidate") outstanding -= amt;
  }
  return Math.max(0, outstanding);
}

export function cumulativeRedeemed(historyEvents) {
  if (!Array.isArray(historyEvents) || historyEvents.length === 0) return null;
  return historyEvents
    .filter((ev) => ev.type === "redeem")
    .reduce((sum, ev) => sum + Number(ev.amountMusd ?? ev.amount_musd ?? 0), 0);
}

// Buckets events into a supply-over-time series for charting.
export function supplyHistorySeries(historyEvents) {
  if (!Array.isArray(historyEvents) || historyEvents.length === 0) return [];
  const sorted = [...historyEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let running = 0;
  return sorted.map((ev) => {
    const amt = Number(ev.amountMusd ?? ev.amount_musd ?? 0);
    if (Number.isFinite(amt)) {
      if (ev.type === "borrow") running += amt;
      if (ev.type === "repay" || ev.type === "redeem" || ev.type === "liquidate") running -= amt;
    }
    return { timestamp: ev.timestamp, supply: Math.max(0, running) };
  });
}

export function supplyChange(series, sinceMs) {
  if (!series || series.length === 0) return null;
  const cutoff = Date.now() - sinceMs;
  const before = [...series].reverse().find((p) => new Date(p.timestamp).getTime() <= cutoff);
  const latest = series[series.length - 1];
  if (!latest) return null;
  const baseline = before ? before.supply : series[0].supply;
  return latest.supply - baseline;
}
