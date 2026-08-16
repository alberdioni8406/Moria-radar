// js/api/cauldron.js
// MUSD market data from the Cauldron DEX indexer. Verified against
// docs.riftenlabs.com/cauldron/API/cauldron/. Kept intentionally scoped to
// MUSD — full multi-token depth belongs in Cauldron Radar, linked from here.
//
// IMPORTANT: price endpoints return a value denominated in BCH satoshis PER
// SMALLEST UNIT of the token, not USD and not per whole token. Use
// js/calculations/pricing.js:tokenSatPriceToUsd() to convert, which needs
// both the token's decimals and a BCH/USD rate (see api/blockchain.js).

import { DATA_SOURCES, CACHE_TTL_MS, MORIA_DEPLOYMENTS } from "../config.js";
import { cachedFetch } from "./cache.js";

const BASE = DATA_SOURCES.cauldron.baseUrl;
const MUSD_ID = MORIA_DEPLOYMENTS.v1.tokenId;

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Cauldron indexer ${path} returned HTTP ${res.status}`);
  return res.json();
}

// GET /cauldron/price/<token>/current — Stable. Response: { price: <sats/unit> }
export async function fetchMusdRawPrice() {
  const result = await cachedFetch("cauldron:musd:price:current", CACHE_TTL_MS.livePrice, () =>
    getJson(DATA_SOURCES.cauldron.endpoints.priceCurrent(MUSD_ID))
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/price/<token>/history?start=&end=&stepsize= — Unstable.
// Response: { history: [{avg,min,max,time}] } in sats/unit.
export async function fetchMusdPriceHistory({ startSec, endSec, stepSize } = {}) {
  const params = new URLSearchParams();
  if (startSec) params.set("start", String(startSec));
  if (endSec) params.set("end", String(endSec));
  if (stepSize) params.set("stepsize", String(stepSize));
  const path = `${DATA_SOURCES.cauldron.endpoints.priceHistory(MUSD_ID)}?${params.toString()}`;
  const result = await cachedFetch(`cauldron:musd:price:history:${params.toString()}`, CACHE_TTL_MS.historical, () =>
    getJson(path)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/price/<token>/candlesticks?start=&end=&stepsize= — Unstable.
export async function fetchMusdCandlesticks({ startSec, endSec, stepSize } = {}) {
  const params = new URLSearchParams();
  if (startSec) params.set("start", String(startSec));
  if (endSec) params.set("end", String(endSec));
  if (stepSize) params.set("stepsize", String(stepSize));
  const path = `${DATA_SOURCES.cauldron.endpoints.priceCandlesticks(MUSD_ID)}?${params.toString()}`;
  const result = await cachedFetch(`cauldron:musd:candlesticks:${params.toString()}`, CACHE_TTL_MS.historical, () =>
    getJson(path)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/valuelocked/<token> — Stable. Response: { satoshis, token_amount, token_id }
export async function fetchMusdValueLocked() {
  const result = await cachedFetch("cauldron:musd:tvl", CACHE_TTL_MS.protocolStats, () =>
    getJson(DATA_SOURCES.cauldron.endpoints.valueLocked(MUSD_ID))
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/volume/<token>?start=&end= — Stable.
// Response: { volume_sats, volume_tokens, token_id, period_start, period_end }
export async function fetchMusdVolume({ startSec, endSec } = {}) {
  const params = new URLSearchParams();
  if (startSec) params.set("start", String(startSec));
  if (endSec) params.set("end", String(endSec));
  const path = `${DATA_SOURCES.cauldron.endpoints.volume(MUSD_ID)}?${params.toString()}`;
  const result = await cachedFetch(`cauldron:musd:volume:${params.toString()}`, CACHE_TTL_MS.protocolStats, () =>
    getJson(path)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/tx/latest?limit=&offset=&token= — Stable.
export async function fetchMusdRecentTxs({ limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), token: MUSD_ID });
  const result = await cachedFetch(`cauldron:musd:tx:latest:${limit}`, CACHE_TTL_MS.livePrice, () =>
    getJson(`${DATA_SOURCES.cauldron.endpoints.txLatest}?${params.toString()}`)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/pool/active?token_a=&token_b= — Unstable. Requires both tokens;
// callers should pass a BCH placeholder token id if pairing against BCH — left
// to the caller since the docs don't specify BCH's own token id convention.
export async function fetchMusdActivePools(pairedTokenId) {
  if (!pairedTokenId) throw new Error("fetchMusdActivePools requires a paired token id");
  const params = new URLSearchParams({ token_a: MUSD_ID, token_b: pairedTokenId });
  const result = await cachedFetch(`cauldron:musd:pools:${pairedTokenId}`, CACHE_TTL_MS.protocolStats, () =>
    getJson(`${DATA_SOURCES.cauldron.endpoints.poolActive}?${params.toString()}`)
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

// GET /cauldron/contract/count/<token> — Stable. { active, ended }
export async function fetchMusdContractCount() {
  const result = await cachedFetch("cauldron:musd:contractcount", CACHE_TTL_MS.protocolStats, () =>
    getJson(DATA_SOURCES.cauldron.endpoints.contractCount(MUSD_ID))
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}
