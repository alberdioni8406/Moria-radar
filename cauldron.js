// js/api/cauldron.js
// MUSD market data sourced from the Cauldron DEX indexer (same Riften Labs
// indexer family used by Cauldron Radar). Kept intentionally thin here —
// full market depth belongs in Cauldron Radar, not duplicated in this app.

import { DATA_SOURCES, CACHE_TTL_MS, MORIA_DEPLOYMENTS } from "../config.js";
import { cachedFetch } from "./cache.js";

const BASE = DATA_SOURCES.cauldron.baseUrl;

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Cauldron indexer ${path} returned HTTP ${res.status}`);
  return res.json();
}

export async function fetchMusdPrice() {
  const tokenId = MORIA_DEPLOYMENTS.v1.tokenId;
  const result = await cachedFetch("cauldron:musd:price", CACHE_TTL_MS.livePrice, () =>
    getJson(DATA_SOURCES.cauldron.endpoints.tokenPrice(tokenId))
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

export async function fetchMusdHistory(range = "30d") {
  const tokenId = MORIA_DEPLOYMENTS.v1.tokenId;
  const result = await cachedFetch(`cauldron:musd:history:${range}`, CACHE_TTL_MS.historical, () =>
    getJson(`${DATA_SOURCES.cauldron.endpoints.tokenHistory(tokenId)}?range=${range}`)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}
