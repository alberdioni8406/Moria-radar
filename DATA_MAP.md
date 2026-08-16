# DATA_MAP.md — Moria Radar

For every metric shown in the app: where it comes from, how it's derived, and where it's rendered.
Classification tags match `CLASSIFICATION` in `js/config.js`.

| Metric | Source | Endpoint | Raw field(s) | Calculation | UI component |
|---|---|---|---|---|---|
| MUSD Outstanding | Riften Labs Moria indexer | `GET /moria/history` | `type`, `amountMusd`, `timestamp` | `currentOutstandingSupply()` — sum(borrow) − sum(repay+redeem+liquidate) | Dashboard card, Supply page |
| MUSD Redeemed (cumulative) | Riften Labs Moria indexer | `GET /moria/history` | `type == "redeem"`, `amountMusd` | `cumulativeRedeemed()` — sum of redeem events | Dashboard card, Supply page |
| MUSD Supply history series | Riften Labs Moria indexer | `GET /moria/history` | as above, sorted by `timestamp` | `supplyHistorySeries()` — running balance | Supply chart |
| 24H/7D/30D supply change | derived from above | — | — | `supplyChange()` — latest minus balance at cutoff | Supply page cards |
| Historical Loans (count) | Riften Labs Moria indexer | `GET /moria/history` | `borrowerHash` | count of unique borrower hashes | Dashboard card |
| Loan Archive rows | Riften Labs Moria indexer | `GET /moria/history` | grouped by `borrowerHash` | first event = origination, last event = final status | History page table |
| Loan detail timeline | Riften Labs Moria indexer | `GET /moria/loan/<borrower_hash>/history` | `type`, `timestamp`, `txid` | rendered in event order | History page loan detail panel |
| Buyback status | Riften Labs public statement | n/a (static, config.js) | `buybackStartDate`, `buybackMinMonths` | `buybackWindow()` computes nominal min end date | Buyback page |
| Recovery metrics (totals, avg, largest, unique addresses) | Riften Labs Moria indexer | `GET /moria/history` filtered to `type == "redeem"` | `amountMusd`, `amountBch`, `address` | `recoveryStats()` | Buyback page cards |
| 7D / 30D recovery volume | as above | as above | `timestamp`, `amountMusd` | `volumeInWindow()` | Buyback page cards |
| Recovery activity feed | Riften Labs Moria indexer | `GET /moria/history` filtered to redeem events | `timestamp`, `amountMusd`, `amountBch`, `txid`, `blockHeight` | sorted descending by time | Buyback page feed |
| MUSD Price (current) | Cauldron indexer | `GET /cauldron/token/<musd_token_id>/price` | `priceUsd` | direct value | Dashboard card, Market page |
| MUSD Price history | Cauldron indexer | `GET /cauldron/token/<musd_token_id>/history?range=` | `priceUsd`, timestamp per point | direct series | Market page chart |
| Peg deviation | derived from MUSD price | — | — | `pegDeviation()` = price − 1.00 | Market page card |
| d3lphi V1 status | static (config.js) + docs | n/a | — | hardcoded `RETIRED` per project brief and docs.riftenlabs.com/moria/d3lphi/ | Oracle page, Dashboard, Protocol page |
| Active/replacement oracle status | oracle indexer | `GET /oracle/<oracle_id>/latest` | `priceUsd`, `timestamp` | freshness = now − timestamp | Oracle page |
| BCH/USD spot price | CoinPaprika | `GET /v1/tickers/bch-bitcoin-cash` | `quotes.USD.price` | direct value | used for BCH-denominated context where needed |
| Transaction / address links | bchexplorer.cash | n/a (URL templates) | `txid`, `address` | — | Activity feed, loan timeline |

## Unverified / assumed items

The following are transcribed from the project brief or public docs but were **not** live-tested against a
running indexer at build time (this build environment had no outbound network access to Riften Labs infrastructure):

- Exact JSON shape of `/moria/history`, `/moria/loan/<hash>/history`, `/moria/loans/active`, `/moria/stats` —
  the parsing code in `js/pages/*.js` accepts a few reasonable field-name variants (`amountMusd`/`amount_musd`,
  etc.) but should be checked against real responses and adjusted.
- Whether the indexer's redeem events distinguish "user self-redeem" from "Riften Labs buyback redeem" — the
  Buyback page currently treats all `redeem` events as recovery activity, which may overcount if both exist.
- The oracle contract naming: the project brief and most secondary sources say "Delphi V1"; Riften Labs' own
  docs (docs.riftenlabs.com/moria/d3lphi/) spell it "d3lphi". Both are shown in the UI rather than silently
  picking one.
- The May 2026 "replacement Delphi infrastructure deployed" incident event — included in `incident.html` per
  the brief, but flagged there as unconfirmed pending source verification.

**Before deploying**, run through the "Verification" checklist in README.md against the live endpoints.
