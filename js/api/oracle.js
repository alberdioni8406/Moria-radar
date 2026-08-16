// js/api/oracle.js
// Delphi BCH/USD oracle. Verified against docs.riftenlabs.com/cauldron/API/oracle/.
// V1 (config.js ORACLES.delphiV1) is legacy/no-longer-updated — this module
// only ever queries it for historical reference, never presents it as live.
// V2 (ORACLES.delphiV2) is the current, live feed.

import { DATA_SOURCES, CACHE_TTL_MS, ORACLES } from "../config.js";
import { cachedFetch } from "./cache.js";
import { oracleCentsToUsd } from "../calculations/pricing.js";

const BASE = DATA_SOURCES.oracle.baseUrl;

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Oracle indexer ${path} returned HTTP ${res.status}`);
  return res.json();
}

// GET /oracle/delphi/closest?token_id=<id> — returns null if no data.
// Response: { oracle_timestamp, oracle_price (cents), oracle_sequence, token_id, txid, blockhash }
async function fetchDelphiClosest(tokenId) {
  const params = new URLSearchParams({ token_id: tokenId });
  const data = await getJson(`${DATA_SOURCES.oracle.endpoints.delphiClosest}?${params.toString()}`);
  if (!data) return null;
  return {
    priceUsd: oracleCentsToUsd(data.oracle_price),
    timestamp: data.oracle_timestamp ? new Date(data.oracle_timestamp * 1000).toISOString() : null,
    sequence: data.oracle_sequence,
    txid: data.txid
  };
}

export async function fetchDelphiV1Meta() {
  const result = await cachedFetch("oracle:v1:closest", CACHE_TTL_MS.staticMeta, () =>
    fetchDelphiClosest(ORACLES.delphiV1.tokenId)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// The live BCH/USD feed. This is a general price feed, not an MUSD-specific
// or Moria-V2-specific number — see the note in config.js ORACLES.delphiV2.
export async function fetchDelphiV2Latest() {
  const result = await cachedFetch("oracle:v2:closest", CACHE_TTL_MS.livePrice, () =>
    fetchDelphiClosest(ORACLES.delphiV2.tokenId)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /oracle/delphi/<token>/history?start=&end=&stepsize=
export async function fetchDelphiHistory(oracleTokenId, { startSec, endSec, stepSize } = {}) {
  const params = new URLSearchParams();
  if (startSec) params.set("start", String(startSec));
  if (endSec) params.set("end", String(endSec));
  if (stepSize) params.set("stepsize", String(stepSize));
  const path = `${DATA_SOURCES.oracle.endpoints.delphiHistory(oracleTokenId)}?${params.toString()}`;
  const result = await cachedFetch(`oracle:history:${oracleTokenId}:${params.toString()}`, CACHE_TTL_MS.historical, () =>
    getJson(path)
  );
  if (!result.ok) throw new Error(result.error);
  const raw = Array.isArray(result.data) ? result.data : [];
  return {
    ...result,
    data: raw.map((p) => ({
      timestamp: new Date(p.time * 1000).toISOString(),
      priceUsd: oracleCentsToUsd(p.price)
    }))
  };
}
