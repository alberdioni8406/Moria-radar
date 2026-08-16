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
// GET /moria/history?offset=&limit=&nfth= — per docs.riftenlabs.com, max
// limit is documented for other endpoints as 200; /moria/history doesn't
// state a max explicitly, so we page conservatively at 200 per request.
export async function fetchMoriaHistory({ offset = 0, limit = 200, nfth } = {}) {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (nfth) params.set("nfth", Array.isArray(nfth) ? nfth.join(",") : nfth);
  const cacheKey = `moria:history:${params.toString()}`;
  const result = await cachedFetch(cacheKey, CACHE_TTL_MS.historical, () =>
    getJson(`${DATA_SOURCES.moriaIndexer.endpoints.history}?${params.toString()}`)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// Fetches the full history across all pages, up to a safety cap, since the
// dashboard/history/buyback/supply pages need the complete picture rather
// than one page at a time. Stops early if a page returns fewer than `limit`
// rows (end of data) or the cap is hit.
export async function fetchFullMoriaHistory({ pageSize = 200, maxPages = 25 } = {}) {
  let all = [];
  let offset = 0;
  let anyStale = false;
  for (let page = 0; page < maxPages; page++) {
    const { data, stale } = await fetchMoriaHistory({ offset, limit: pageSize });
    anyStale = anyStale || !!stale;
    const events = Array.isArray(data) ? data : data.events || data.history || [];
    all = all.concat(events);
    if (events.length < pageSize) break;
    offset += pageSize;
  }
  return { events: all, stale: anyStale };
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
