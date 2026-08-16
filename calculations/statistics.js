// js/calculations/statistics.js

export function countByType(events, typeField = "type") {
  const counts = {};
  for (const ev of events || []) {
    const t = ev[typeField] ?? "unknown";
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

export function timeAgo(timestamp) {
  const ms = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatNumber(n, decimals = 2) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "N/A";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatUsd(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "N/A";
  return `$${formatNumber(n, 2)}`;
}
