// js/api/moria.js
// All calls to the Riften Labs Moria indexer live here. Nowhere else in the
// app should reference these endpoint paths directly.
//
// Every exported function returns either the parsed data, or throws — callers
// (js/pages/*) are responsible for catching and rendering "Data temporarily
// unavailable" per the project's no-fake-data requirement.

import { DATA_SOURCES, CACHE_TTL_MS } from "../config.js";
import { cachedFetch } from "./cache.js";

const BASE = DATA_SOURCES.moriaIndexer.baseUrl;

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Moria indexer ${path} returned HTTP ${res.status}`);
  const json = await res.json();
  return json;
}

// Full protocol activity history (loan events across all borrowers).
// Used to derive: historical loan counts, recovery/redemption events.
export async function fetchMoriaHistory() {
  const result = await cachedFetch("moria:history", CACHE_TTL_MS.historical, () =>
    getJson(DATA_SOURCES.moriaIndexer.endpoints.history)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// Per-borrower loan history (borrow/repay/redeem/refinance/add-collateral).
export async function fetchLoanHistory(borrowerHash) {
  if (!borrowerHash) throw new Error("borrowerHash is required");
  const path = DATA_SOURCES.moriaIndexer.endpoints.loanHistory(borrowerHash);
  // Not cached long-term — a specific loan lookup is a targeted query, not a
  // dashboard-wide stat, so we bypass the shared cache TTL here.
  return getJson(path);
}

// Currently-open loans (expected to be empty/irrelevant post-shutdown, but
// we still surface exactly what the indexer reports rather than assuming).
export async function fetchActiveLoans() {
  const result = await cachedFetch("moria:activeLoans", CACHE_TTL_MS.protocolStats, () =>
    getJson(DATA_SOURCES.moriaIndexer.endpoints.activeLoans)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// Aggregate protocol stats, if/when the indexer exposes them reliably.
export async function fetchMoriaStats() {
  const result = await cachedFetch("moria:stats", CACHE_TTL_MS.protocolStats, () =>
    getJson(DATA_SOURCES.moriaIndexer.endpoints.stats)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}
