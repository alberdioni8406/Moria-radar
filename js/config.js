// js/config.js
// Single source of truth for endpoints, identifiers, and deployment state.
// Do NOT scatter endpoint URLs elsewhere in the app — import from here.

// ---------------------------------------------------------------------------
// DATA SOURCE REGISTRY
// ---------------------------------------------------------------------------
// Verified against the real Riften Labs Indexer API docs at
// https://docs.riftenlabs.com/cauldron/API/ (pages: /cauldron/, /moria/,
// /oracle/) on 2026-08-16. All three live under one host, indexer.riften.net,
// split by path prefix — not separate hosts. Endpoint shapes, param names,
// and "Stable"/"Unstable" status below are taken directly from that page;
// where a JSON shape wasn't documented (most /moria endpoints), the code
// still treats the response defensively rather than assuming a schema.
export const DATA_SOURCES = {
  moriaIndexer: {
    label: "Riften Labs Indexer — Moria",
    baseUrl: "https://indexer.riften.net/moria",
    endpoints: {
      // GET /history?offset=&limit=&nfth=  (Unstable, no documented response schema)
      history: "/history",
      // GET /loan/<borrower_hash>/history — array of {borrow,repay,redeem,refinance,add_collateral} actions
      loanHistory: (borrowerHash) => `/loan/${borrowerHash}/history`,
      activeLoans: "/loans/active", // Unstable
      stats: "/stats" // Unstable
    },
    auth: "none",
    stability: "All /moria endpoints are documented as Unstable — always handle non-200 and malformed responses",
    docs: "https://docs.riftenlabs.com/cauldron/API/moria/"
  },
  cauldron: {
    label: "Riften Labs Indexer — Cauldron",
    baseUrl: "https://indexer.riften.net/cauldron",
    endpoints: {
      // Price is returned per SMALLEST UNIT of the token (e.g. cents-equivalent
      // for a 2-decimal token), denominated in BCH satoshis. Convert with
      // js/calculations/pricing.js:tokenSatPriceToUsd().
      priceCurrent: (tokenId) => `/price/${tokenId}/current`, // Stable
      priceAt: (tokenId, timestamp) => `/price/${tokenId}/at/${timestamp}`, // Stable
      priceHistory: (tokenId) => `/price/${tokenId}/history`, // Unstable — {avg,min,max,time}[]
      priceCandlesticks: (tokenId) => `/price/${tokenId}/candlesticks`, // Unstable — OHLC in sats
      valueLocked: (tokenId) => `/valuelocked/${tokenId}`, // Stable — {satoshis, token_amount, token_id}
      volume: (tokenId) => `/volume/${tokenId}`, // Stable — {volume_sats, volume_tokens, period_start, period_end}
      txLatest: "/tx/latest", // Stable — ?limit=&offset=&token=
      poolActive: "/pool/active", // Unstable — ?token_a=&token_b=
      contractCount: (tokenId) => `/contract/count/${tokenId}`, // Stable
      tokenFirstPool: (tokenId) => `/token/${tokenId}/first_pool` // Unstable
    },
    auth: "none",
    docs: "https://docs.riftenlabs.com/cauldron/API/cauldron/",
    externalDashboard: "https://cauldron-radar.vercel.app"
  },
  oracle: {
    label: "Delphi Oracle",
    // Correction: the project brief called this "d3lphi"; Riften Labs' current
    // API docs and product naming consistently use "Delphi". The underlying
    // GitLab contract repo (gitlab.com/riftenlabs/moria/oracle-contract) is
    // internally named "d3lphi-oracle", but the live product/API surface is
    // "Delphi" — that's what's used throughout this app now.
    baseUrl: "https://indexer.riften.net/oracle",
    endpoints: {
      // BCH/USD spot feed, independent of any specific token
      cashClosest: "/cash/closest", // Unstable — ?timestamp=
      cashHistory: "/cash/history", // Unstable — ?start=&end=&stepsize=
      // Per-oracle-contract feed (used for both the retired V1 and live V2
      // BCH/USD contracts, and could be reused for a future MUSD-specific
      // oracle if Riften Labs ever ships one)
      delphiHistory: (oracleTokenId) => `/delphi/${oracleTokenId}/history`, // Unstable — ?start=&end=&stepsize=
      delphiClosest: "/delphi/closest" // Stable — ?token_id=&timestamp=
    },
    auth: "none",
    docs: "https://docs.riftenlabs.com/cauldron/API/oracle/"
  },
  blockchain: {
    label: "Haskoin Store (BCH)",
    baseUrl: "https://api.haskoin.com/bch",
    docs: "https://api.haskoin.com/docs"
  },
  pricing: {
    label: "CoinPaprika (BCH/USD)",
    baseUrl: "https://api.coinpaprika.com/v1",
    docs: "https://api.coinpaprika.com/"
  },
  explorer: {
    label: "bchexplorer.cash",
    txUrl: (txid) => `https://bchexplorer.cash/tx/${txid}`,
    addressUrl: (addr) => `https://bchexplorer.cash/address/${addr}`
  }
};

// ---------------------------------------------------------------------------
// MORIA DEPLOYMENTS — extend this object (never rewrite the app) when a new
// LENDING deployment (e.g. Moria V2) is confirmed with real, verified
// identifiers. Do not conflate this with oracle versioning below — a live
// Delphi V2 price feed does not imply a Moria V2 lending protocol exists.
// ---------------------------------------------------------------------------
export const MORIA_DEPLOYMENTS = {
  v1: {
    name: "Moria V1",
    status: "disabled", // "disabled" | "active" | "not_deployed"
    statusLabel: "DISABLED",
    tokenId: "b38a33f750f84c5c169a6f23cb873e6e79605021585d4f3408789689ed87f366",
    tokenSymbol: "MUSD",
    tokenName: "Moria USD",
    tokenDecimals: 2,
    incidentDate: "2026-04-23",
    buybackStartDate: "2026-04-23",
    buybackMinMonths: 6
  },
  v2: {
    name: "Moria V2",
    status: "not_deployed",
    statusLabel: "NOT CURRENTLY DEPLOYED",
    tokenId: null,
    tokenSymbol: null
  }
};

// ---------------------------------------------------------------------------
// ORACLES — Delphi BCH/USD price-feed contracts. Verified against
// https://docs.riftenlabs.com/cauldron/API/oracle/ (2026-08-16). This is a
// separate axis from MORIA_DEPLOYMENTS: Delphi V2 being live and current does
// NOT mean a Moria V2 lending protocol is deployed — it's the general-purpose
// BCH/USD feed Moria (and other Riften Labs products) read collateral prices
// from. MUSD's own market price (what it trades for) is a different number,
// sourced from Cauldron via DATA_SOURCES.cauldron, not from this oracle.
// ---------------------------------------------------------------------------
export const ORACLES = {
  delphiV1: {
    name: "Delphi V1",
    tokenId: "d0d46f5cbd82188acede0d3e49c75700c19cb8331a30101f0bb6a260066ac972",
    status: "retired",
    statusLabel: "RETIRED",
    note: "Legacy BCH/USD feed — no longer updated. Was the oracle Moria V1 read collateral prices from until the April 2026 incident."
  },
  delphiV2: {
    name: "Delphi V2",
    tokenId: "be0d0d8324e8cda41d34b85bd203ce2482256eb337a0ad0fea82c2ddd7306c88",
    status: "active",
    statusLabel: "ACTIVE",
    note: "Current, live BCH/USD feed. Confirmed via docs.riftenlabs.com — this is the general Delphi price oracle, not a Moria-specific or MUSD-specific price."
  }
};

export const CLASSIFICATION = {
  CURRENT: "CURRENT",
  HISTORICAL: "HISTORICAL",
  DERIVED: "DERIVED",
  ESTIMATED: "ESTIMATED",
  UNAVAILABLE: "UNAVAILABLE"
};

// Replace with the real project donation address before deploying.
// NEVER invent a real-looking address — this placeholder must be visibly
// a placeholder until the owner supplies the real one.
export const DONATION_BCH_ADDRESS = "bitcoincash:qrtv37u522gz8a5lezfqk5vukly93cu7gc8tn09040";

export const CACHE_TTL_MS = {
  livePrice: 20_000,
  protocolStats: 120_000,
  historical: 900_000,
  staticMeta: 1000 * 60 * 60 * 12
};

export const SITE = {
  name: "Moria Radar",
  tagline: "Moria Radar — Live MUSD & Moria Analytics on Bitcoin Cash",
  description: "Independent analytics, recovery monitoring and historical intelligence for Moria Protocol.",
  disclaimer:
    "Moria Radar is an independent analytics project. It is not affiliated with or operated by Riften Labs. " +
    "Data is provided for informational purposes and may be delayed, incomplete, or affected by upstream API " +
    "availability. Always verify important information on-chain and through official Moria documentation.",
  officialSite: "https://www.moria.money/",
  officialDocs: "https://docs.riftenlabs.com/moria/",
  sourceRepo: "https://gitlab.com/riftenlabs/moria"
};
