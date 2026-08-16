// js/api/oracle.js
// d3lphi oracle status. V1 is retired by definition (config.js) — this module
// only ever queries it, if at all, for historical/labeling purposes. It never
// presents V1 oracle data as a live price.

import { DATA_SOURCES, CACHE_TTL_MS, MORIA_DEPLOYMENTS } from "../config.js";
import { cachedFetch } from "./cache.js";

const BASE = DATA_SOURCES.oracle.baseUrl;

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Oracle indexer ${path} returned HTTP ${res.status}`);
  return res.json();
}

// Explicitly does NOT fetch a "latest" price for the retired V1 oracle.
export async function fetchOracleV1Meta() {
  const oracleId = MORIA_DEPLOYMENTS.v1.oracleId;
  const result = await cachedFetch("oracle:v1:meta", CACHE_TTL_MS.staticMeta, () =>
    getJson(DATA_SOURCES.oracle.endpoints.history(oracleId) + "?limit=1")
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// Placeholder for a confirmed V2/replacement oracle. Returns null until the
// deployment registry (config.js MORIA_DEPLOYMENTS.v2) carries a real oracleId.
export async function fetchActiveOracleStatus() {
  const v2Oracle = MORIA_DEPLOYMENTS.v2.oracleId;
  if (!v2Oracle) {
    return { ok: false, notDeployed: true };
  }
  const result = await cachedFetch("oracle:v2:latest", CACHE_TTL_MS.livePrice, () =>
    getJson(DATA_SOURCES.oracle.endpoints.latest(v2Oracle))
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}
