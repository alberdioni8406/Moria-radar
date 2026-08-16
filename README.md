# Moria Radar

**Moria Radar — Live MUSD & Moria Analytics on Bitcoin Cash**
Independent analytics, recovery monitoring and historical intelligence for Moria Protocol.

Moria Radar is **not** the official Moria interface. It is an independent, non-custodial analytics dashboard
for Moria Protocol / MUSD on Bitcoin Cash, built in the same style as [Cauldron Radar](https://cauldronradar.cash).

## ⚠️ Current status: Moria V1 is disabled

Moria V1 experienced a security incident on **April 23, 2026**. The V1 deployment has been disabled and the
original oracle ("Delphi V1" / `d3lphi` in Riften Labs' own docs) is retired. This app is built around that
reality — it does **not** present V1 as an active lending protocol anywhere. See `incident.html` for the
timeline and `oracle.html` / `protocol.html` for current status.

## What this app does

1. Moria V1 historical explorer (`history.html`)
2. MUSD recovery/buyback monitor (`buyback.html`)
3. Incident timeline (`incident.html`)
4. MUSD supply/redemption analytics (`supply.html`)
5. Oracle status monitor (`oracle.html`)
6. MUSD market/peg monitor (`market.html`)
7. Protocol/deployment information page (`protocol.html`)
8. Future-ready architecture for a possible Moria V2 (see `MORIA_DEPLOYMENTS` in `js/config.js`)

## Architecture

Static HTML + vanilla JS (ES modules). No framework, no build step, no backend beyond what Vercel provides
for static hosting.

```
moria-radar/
├── index.html / history.html / buyback.html / supply.html / market.html / oracle.html / incident.html / protocol.html
├── css/style.css
├── js/
│   ├── config.js          ← single source of truth: endpoints, token IDs, deployment registry
│   ├── app.js              ← shell: header, footer, donation card, search
│   ├── api/                ← one file per external data source (moria.js, cauldron.js, oracle.js, blockchain.js, cache.js)
│   ├── calculations/       ← pure functions: supply.js, peg.js, recovery.js, statistics.js
│   ├── components/         ← cards.js, charts.js, tables.js, status.js, activity.js, donation.js
│   └── pages/               ← one controller per page, imported by that page's <script type="module">
├── DATA_MAP.md              ← every metric → source → endpoint → calculation → UI component
└── vercel.json
```

## Data sources

All external endpoints live in `js/config.js` under `DATA_SOURCES` — nothing else in the app should hardcode
a URL. See `DATA_MAP.md` for the full metric-by-metric mapping.

- **Riften Labs Moria indexer** (`indexer.riften.net/moria`) — loan history, active loans, stats. Documented
  by the project brief as *unstable*; every call is wrapped so failures render "Data temporarily unavailable"
  rather than fabricated numbers.
- **Riften Labs Cauldron indexer** (`indexer.riften.net/cauldron`) — MUSD market price/history.
- **d3lphi oracle indexer** — V1 (retired) metadata only; a confirmed replacement oracle can be wired in via
  `MORIA_DEPLOYMENTS.v2.oracleId`.
- **Haskoin Store** (`api.haskoin.com/bch`) — raw BCH chain lookups.
- **CoinPaprika** — BCH/USD spot price.
- **bchexplorer.cash** — transaction/address explorer links.

## ⚠️ Verification before deployment

The endpoint paths above are transcribed from the project brief / `docs.riftenlabs.com` and were **not**
live-tested from this build environment (no outbound network access at build time). Before deploying:

- [ ] Hit each `moriaIndexer` endpoint directly and confirm it returns 200 with the expected JSON shape
- [ ] Adjust field-name parsing in `js/pages/*.js` if the real response uses different key names
- [ ] Confirm the MUSD token ID and decimals against on-chain/CashToken metadata
- [ ] Confirm whether `redeem` events in `/moria/history` distinguish buyback redemptions from ordinary ones
- [ ] Test direct navigation to every page (not just via nav links) on the deployed Vercel URL
- [ ] Test on narrow mobile width and confirm no horizontal overflow
- [ ] Confirm no CORS errors from `indexer.riften.net`, `api.haskoin.com`, or `api.coinpaprika.com`

If any endpoint doesn't behave as documented, **do not invent a replacement** — update `DATA_MAP.md` to note
the discrepancy and have the affected UI fall back to "Data temporarily unavailable".

## Local development

No build step. Serve the directory with any static file server, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or the port shown). Because pages use ES modules loaded via `fetch` under
the hood in some browsers, serve over `http://`/`https://`, not `file://`.

## Deployment (Vercel)

1. Push this directory to a GitHub repo.
2. Import the repo in Vercel as a static project (no build command needed).
3. **Before going live**, replace `DONATION_BCH_ADDRESS` in `js/config.js` with your real BCH address.
4. Deploy.

## Adding Moria V2

When a V2 deployment is confirmed with real, verified identifiers, add them to `MORIA_DEPLOYMENTS.v2` in
`js/config.js` (token ID, oracle ID, status). Do not invent addresses — leave fields `null` until confirmed.
The rest of the app (oracle page, protocol page, dashboard) already reads from this object and needs no
rewrite once real values are supplied.

## Limitations

- Client-side only: all data fetching happens in the visitor's browser, so availability depends entirely on
  the upstream indexer/API being CORS-open and online at request time.
- The Moria indexer routes are documented as unstable; expect "Data temporarily unavailable" states.
- This is an analytics tool only. It never connects a wallet, requests keys/seed phrases, signs transactions,
  or initiates loans/redemptions/conversions.

## Disclaimer

Moria Radar is an independent analytics project. It is not affiliated with or operated by Riften Labs. Data
is provided for informational purposes and may be delayed, incomplete, or affected by upstream API
availability. Always verify important information on-chain and through official Moria documentation
(https://docs.riftenlabs.com/moria/).

## Donation

This is a community-funded project. See the footer on any page, or `js/components/donation.js` — do not
remove this component in future refactors.
