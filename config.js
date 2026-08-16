// js/config.js
// Single source of truth for endpoints, identifiers, and deployment state.
// Do NOT scatter endpoint URLs elsewhere in the app — import from here.

// ---------------------------------------------------------------------------
// DATA SOURCE REGISTRY
// ---------------------------------------------------------------------------
// NOTE ON VERIFICATION: These endpoints are transcribed from the Moria Radar
// project brief and public Riften Labs documentation (docs.riftenlabs.com).
// They have NOT been live-tested from this build environment (no outbound
// network access at build time). Before deploying, run the checks in
// DATA_MAP.md / README.md "Verification" section against the real endpoints,
// since the brief itself flags the Moria indexer routes as unstable.
export const DATA_SOURCES = {
  moriaIndexer: {
    label: "Riften Labs Indexer — Moria",
    baseUrl: "https://indexer.riften.net/moria",
    endpoints: {
      history: "/history",
      loanHistory: (borrowerHash) => `/loan/${borrowerHash}/history`,
      activeLoans: "/loans/active",
      stats: "/stats"
    },
    auth: "none",
    stability: "documented as unstable — always handle non-200 and malformed responses",
    docs: "https://docs.riftenlabs.com/moria/"
  },
  cauldron: {
    label: "Riften Labs Indexer — Cauldron",
    baseUrl: "https://indexer.riften.net/cauldron",
    endpoints: {
      tokenPrice: (tokenId) => `/token/${tokenId}/price`,
      tokenHistory: (tokenId) => `/token/${tokenId}/history`,
      pools: "/pools"
    },
    auth: "none",
    docs: "https://docs.riftenlabs.com/cauldron/",
    externalDashboard: "https://cauldron-radar.vercel.app"
  },
  oracle: {
    label: "d3lphi Oracle",
    // The project brief and most community references spell this "Delphi";
    // Riften Labs' own docs (docs.riftenlabs.com/moria/d3lphi/) spell the
    // contract/oracle "d3lphi". Both names are shown in the UI so the
    // discrepancy is visible rather than silently "corrected".
    baseUrl: "https://indexer.riften.net/oracle",
    endpoints: {
      latest: (oracleId) => `/${oracleId}/latest`,
      history: (oracleId) => `/${oracleId}/history`
    },
    auth: "none",
    docs: "https://docs.riftenlabs.com/moria/d3lphi/"
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
// deployment (e.g. Moria V2) is confirmed with real, verified identifiers.
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
    oracleId: "d0d46f5cbd82188acede0d3e49c75700c19cb8331a30101f0bb6a260066ac972",
    oracleName: "d3lphi V1 (\"Delphi V1\")",
    oracleStatus: "retired",
    incidentDate: "2026-04-23",
    buybackStartDate: "2026-04-23",
    buybackMinMonths: 6
  },
  v2: {
    name: "Moria V2",
    status: "not_deployed",
    statusLabel: "NOT CURRENTLY DEPLOYED",
    tokenId: null,
    tokenSymbol: null,
    oracleId: null,
    oracleStatus: null
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
export const DONATION_BCH_ADDRESS = "REPLACE_WITH_YOUR_BCH_DONATION_ADDRESS";

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
