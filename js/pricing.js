// js/calculations/pricing.js
// The Cauldron /price endpoints return price denominated in BCH satoshis PER
// SMALLEST UNIT of the token (not per whole token, not in USD). Converting to
// a human USD price requires both the token's decimals and a BCH/USD rate.
//
// Per docs.riftenlabs.com/cauldron/API/cauldron/:
//   price_per_whole_token_in_sats = api_price * (10 ** decimals)
// Then convert sats -> BCH -> USD using the BCH/USD spot price.

const SATS_PER_BCH = 100_000_000;

// apiPrice: raw "price" field from /price/<token>/current or /price/.../at/...
// decimals: token decimals (MUSD = 2)
// bchUsd: current BCH/USD spot price
export function tokenSatPriceToUsd(apiPrice, decimals, bchUsd) {
  if (
    typeof apiPrice !== "number" ||
    typeof decimals !== "number" ||
    typeof bchUsd !== "number" ||
    !Number.isFinite(apiPrice) ||
    !Number.isFinite(bchUsd)
  ) {
    return null;
  }
  const satsPerWholeToken = apiPrice * Math.pow(10, decimals);
  const bchPerWholeToken = satsPerWholeToken / SATS_PER_BCH;
  return bchPerWholeToken * bchUsd;
}

// Delphi oracle prices are documented in CENTS. Divide by 100 for USD.
export function oracleCentsToUsd(cents) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return cents / 100;
}

export function satsToUsd(sats, bchUsd) {
  if (typeof sats !== "number" || typeof bchUsd !== "number") return null;
  return (sats / SATS_PER_BCH) * bchUsd;
}

export function satsToBch(sats) {
  if (typeof sats !== "number" || !Number.isFinite(sats)) return null;
  return sats / SATS_PER_BCH;
}
