# DATA_MAP.md — Moria Radar

For every metric shown in the app: where it comes from, how it's derived, and where it's rendered.
Classification tags match `CLASSIFICATION` in `js/config.js`.

**Verification status:** the endpoints below are transcribed from the real Riften Labs Indexer API docs at
`docs.riftenlabs.com/cauldron/API/` (pages `/cauldron/`, `/moria/`, `/oracle/`), fetched 2026-08-16. Field
names, param names, and Stable/Unstable status come directly from that documentation. They have **not** been
live-tested from this build environment (no outbound network access at build time) — see "Unverified /
assumed items" below for what specifically still needs a live check.

## Moria (loan history)

| Metric | Endpoint | Status | Raw field(s) | Calculation | UI |
|---|---|---|---|---|---|
| MUSD Outstanding | `GET /moria/history?offset=&limit=&nfth=` (paged via `fetchFullMoriaHistory`) | Unstable | `type`, `amountMusd`, `timestamp` | `currentOutstandingSupply()` — sum(borrow) − sum(repay+redeem+liquidate) | Dashboard, Supply |
| MUSD Redeemed (cumulative) | as above | Unstable | `type == "redeem"`, `amountMusd` | `cumulativeRedeemed()` | Dashboard, Supply |
| Supply history series | as above | Unstable | sorted by `timestamp` | `supplyHistorySeries()` running balance | Supply chart |
| Historical Loans (count) | as above | Unstable | `borrowerHash` | count of unique hashes | Dashboard |
| Loan Archive rows | as above | Unstable | grouped by `borrowerHash` | first event = origination, last = final status | History table |
| Loan detail timeline | `GET /moria/loan/<borrower_hash>/history` | Unstable | `type`, `timestamp`, `txid` | event order | History loan detail |
| Buyback status / dates | static (config.js) | n/a | `buybackStartDate`, `buybackMinMonths` | `buybackWindow()` | Buyback page |
| Recovery metrics | `/moria/history` filtered `type == "redeem"` | Unstable | `amountMusd`, `amountBch`, `address` | `recoveryStats()` | Buyback cards |
| 7D/30D recovery volume | as above | Unstable | `timestamp`, `amountMusd` | `volumeInWindow()` | Buyback cards |
| Recovery activity feed | as above | Unstable | `timestamp`, `amountMusd`, `amountBch`, `txid`, `blockHeight` | sorted descending | Buyback feed |

**Note:** the `/moria/history` and `/moria/loan/<hash>/history` docs page does not publish an example JSON
response, so the exact field names (`amountMusd` vs `amount_musd`, `borrowerHash` vs `borrower_hash`, etc.)
are a best guess pending a live check — the parsing code in `js/pages/*.js` and `js/calculations/supply.js`
accepts both common casing variants defensively.

## Cauldron (MUSD market data)

Verified against `docs.riftenlabs.com/cauldron/API/cauldron/`. **Price values are in BCH satoshis per
smallest unit of the token — not USD, not per whole token.** Convert with
`js/calculations/pricing.js:tokenSatPriceToUsd(apiPrice, decimals, bchUsdRate)`.

| Metric | Endpoint | Status | Raw shape | Calculation | UI |
|---|---|---|---|---|---|
| MUSD Price (current) | `GET /cauldron/price/<musd_id>/current` | Stable | `{price}` (sats/unit) | `tokenSatPriceToUsd()` | Dashboard, Market |
| MUSD Price history | `GET /cauldron/price/<musd_id>/history?start=&end=&stepsize=` | Unstable | `{history:[{avg,min,max,time}]}` | converted per point | Market chart |
| MUSD Candlesticks | `GET /cauldron/price/<musd_id>/candlesticks?start=&end=&stepsize=` | Unstable | `{candlesticks:[{open,high,low,close,time,volume_sats,volume_tokens,transaction_count}]}` | available for future OHLC chart | (not yet wired into a chart) |
| MUSD Liquidity (TVL) | `GET /cauldron/valuelocked/<musd_id>` | Stable | `{satoshis, token_amount, token_id}` | `satsToUsd()` | Dashboard, Market |
| MUSD Volume (24H/7D/30D) | `GET /cauldron/volume/<musd_id>?start=&end=` | Stable | `{volume_sats, volume_tokens, period_start, period_end}` | `satsToUsd()` per window | Dashboard, Market |
| Recent MUSD trades | `GET /cauldron/tx/latest?limit=&token=<musd_id>` | Stable | `[{txid, blockhash, timestamp_guess}]` | sorted by indexer, rendered as-is | Market recent-trades table |
| Active MUSD pools | `GET /cauldron/pool/active?token_a=<musd_id>&token_b=<paired>` | Unstable | pool list, requires a specific paired token | not yet wired into a page (needs a paired-token decision — see note below) | — |
| Contract count | `GET /cauldron/contract/count/<musd_id>` | Stable | `{active, ended}` | direct | (available, not yet on a page) |

**Note on `/pool/active`:** this endpoint requires both `token_a` and `token_b` — there's no "give me all
MUSD pools regardless of pair" mode documented. `fetchMusdActivePools(pairedTokenId)` in `js/api/cauldron.js`
takes the paired token as a parameter; the app doesn't currently know BCH's own token-id convention for this
endpoint, so this function isn't called from any page yet. Confirm the right `token_b` value against the live
API before wiring it up.

## Oracle (Delphi BCH/USD feed)

Verified against `docs.riftenlabs.com/cauldron/API/oracle/`. **This is a general BCH/USD feed, not an
MUSD-specific price** — it's what Moria reads collateral prices from, separate from MUSD's own market price
(which comes from Cauldron above).

| Metric | Endpoint | Status | Raw shape | Calculation | UI |
|---|---|---|---|---|---|
| Delphi V1 (retired) last price | `GET /oracle/delphi/closest?token_id=d0d46f5c...` | Stable | `{oracle_timestamp, oracle_price (cents), oracle_sequence, txid, blockhash}` or `null` | `oracleCentsToUsd()` | Dashboard, Oracle |
| Delphi V2 (live) current price | `GET /oracle/delphi/closest?token_id=be0d0d83...` | Stable | as above | `oracleCentsToUsd()`; freshness = now − timestamp | Dashboard, Oracle |
| Delphi price history | `GET /oracle/delphi/<token>/history?start=&end=&stepsize=` | Unstable | `[{time, price (cents), txid, blockhash, sequence}]` | `oracleCentsToUsd()` per point | available via `fetchDelphiHistory()`, not yet charted |
| BCH/USD (general, any oracle) | `GET /oracle/cash/closest?timestamp=` | Unstable | not yet wired into the app — `fetchBchUsdPrice()` currently uses CoinPaprika instead | — | — |

**Known token IDs (from docs):**
- Delphi V1 (legacy, no longer updated): `d0d46f5cbd82188acede0d3e49c75700c19cb8331a30101f0bb6a260066ac972`
- Delphi V2 (current, live): `be0d0d8324e8cda41d34b85bd203ce2482256eb337a0ad0fea82c2ddd7306c88`

## Blockchain / misc

| Metric | Source | Calculation | UI |
|---|---|---|---|
| BCH/USD spot (used for sats→USD conversion) | CoinPaprika `GET /v1/tickers/bch-bitcoin-cash` | direct `quotes.USD.price` | used across Dashboard/Market/Supply for USD conversion |
| Transaction / address links | bchexplorer.cash (URL templates) | — | Activity feed, loan timeline, recent trades |

## Unverified / assumed items — check before relying on this in production

- **`/moria/*` response schemas are undocumented.** The docs page lists params (`offset`, `limit`, `nfth`)
  and marks all four `/moria` endpoints "Unstable" but publishes no example JSON. Field-name guesses in the
  parsing code should be checked against a real response and corrected.
- **Whether `/moria/history` redeem events distinguish buyback redemptions from ordinary user redemptions** —
  the Buyback page currently treats all `redeem` events as recovery activity, which may overcount if both
  exist in the same stream.
- **`/cauldron/pool/active` paired-token requirement** — not yet resolved (see note above); the function
  exists but isn't called from any page.
- **`/oracle/cash/closest`** as a BCH/USD source — documented and would let the app get BCH/USD from Riften
  Labs directly rather than a third party (CoinPaprika); not yet switched over.
- Whether MUSD price on Cauldron reliably tracks $1 post-incident, or trades at a discount/premium given V1
  is disabled — this is exactly what the Market page's peg-deviation card is for, and it should be read with
  the understanding that V1 being disabled may itself be a driver of any deviation shown.

**Before deploying**, run through the "Verification" checklist in README.md against the live endpoints.
