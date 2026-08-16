// js/api/blockchain.js
// Raw BCH chain data (address/tx lookups) and BCH/USD spot price, used to
// convert MUSD<->BCH recovery amounts into USD context where needed.

import { DATA_SOURCES, CACHE_TTL_MS } from "../config.js";
import { cachedFetch } from "./cache.js";

export async function fetchBchUsdPrice() {
  const result = await cachedFetch("blockchain:bch:usd", CACHE_TTL_MS.livePrice, async () => {
    const res = await fetch(`${DATA_SOURCES.pricing.baseUrl}/tickers/bch-bitcoin-cash`);
    if (!res.ok) throw new Error(`Pricing API returned HTTP ${res.status}`);
    const json = await res.json();
    const usd = json?.quotes?.USD?.price;
    if (typeof usd !== "number") throw new Error("Pricing API returned unexpected shape");
    return usd;
  });
  if (!result.ok) throw new Error(result.error);
  return result;
}

export async function fetchTransaction(txid) {
  const res = await fetch(`${DATA_SOURCES.blockchain.baseUrl}/transaction/${txid}`);
  if (!res.ok) throw new Error(`Haskoin returned HTTP ${res.status} for tx ${txid}`);
  return res.json();
}

export async function fetchAddress(address) {
  const res = await fetch(`${DATA_SOURCES.blockchain.baseUrl}/address/${address}/balance`);
  if (!res.ok) throw new Error(`Haskoin returned HTTP ${res.status} for address ${address}`);
  return res.json();
}

export function txExplorerUrl(txid) {
  return DATA_SOURCES.explorer.txUrl(txid);
}

export function addressExplorerUrl(address) {
  return DATA_SOURCES.explorer.addressUrl(address);
}
