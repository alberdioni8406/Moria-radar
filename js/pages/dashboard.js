// js/pages/dashboard.js
import { mountShell } from "../app.js";
import { MORIA_DEPLOYMENTS, ORACLES, CLASSIFICATION } from "../config.js";
import { fetchFullMoriaHistory } from "../api/moria.js";
import { fetchMusdRawPrice, fetchMusdValueLocked, fetchMusdVolume } from "../api/cauldron.js";
import { fetchDelphiV2Latest } from "../api/oracle.js";
import { fetchBchUsdPrice } from "../api/blockchain.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { currentOutstandingSupply, cumulativeRedeemed } from "../calculations/supply.js";
import { tokenSatPriceToUsd, satsToUsd } from "../calculations/pricing.js";
import { formatNumber, formatUsd, timeAgo } from "../calculations/statistics.js";

mountShell("index.html");

const grid = document.getElementById("dashboard-cards");
const decimals = MORIA_DEPLOYMENTS.v1.tokenDecimals;

const cards = {
  outstanding: renderCard({ title: "MUSD Outstanding", state: "loading" }),
  redeemed: renderCard({ title: "MUSD Redeemed", state: "loading" }),
  loans: renderCard({ title: "Historical Loans", state: "loading" }),
  price: renderCard({ title: "MUSD Price", state: "loading" }),
  tvl: renderCard({ title: "MUSD Liquidity (TVL)", state: "loading" }),
  volume24h: renderCard({ title: "24H Volume", state: "loading" }),
  oracle: renderCard({ title: "Delphi Oracle", state: "loading" }),
  buyback: renderCard({
    title: "Buyback Status",
    value: "ACTIVE",
    subtext: `Since ${MORIA_DEPLOYMENTS.v1.buybackStartDate}`,
    classification: CLASSIFICATION.CURRENT,
    source: "Riften Labs public commitment — see Buyback page"
  })
};
grid.appendChild(renderCardGrid(Object.values(cards)));

function replaceCard(key, newEl) {
  cards[key].replaceWith(newEl);
  cards[key] = newEl;
}

async function loadHistoryCards() {
  try {
    const { events, stale } = await fetchFullMoriaHistory();
    const outstanding = currentOutstandingSupply(events);
    const redeemed = cumulativeRedeemed(events);

    replaceCard(
      "outstanding",
      renderCard({
        title: "MUSD Outstanding",
        value: outstanding === null ? undefined : `${formatNumber(outstanding)} MUSD`,
        state: outstanding === null ? "unavailable" : "value",
        classification: CLASSIFICATION.DERIVED,
        subtext: stale ? "Showing stale cached data" : undefined,
        source: "Derived from Riften Labs indexer /moria/history"
      })
    );
    replaceCard(
      "redeemed",
      renderCard({
        title: "MUSD Redeemed",
        value: redeemed === null ? undefined : `${formatNumber(redeemed)} MUSD`,
        state: redeemed === null ? "unavailable" : "value",
        classification: CLASSIFICATION.DERIVED,
        source: "Derived from Riften Labs indexer /moria/history"
      })
    );
    replaceCard(
      "loans",
      renderCard({
        title: "Historical Loans",
        value: `${new Set(events.map((e) => e.borrowerHash || e.borrower_hash)).size}`,
        classification: CLASSIFICATION.HISTORICAL,
        source: "Riften Labs indexer /moria/history"
      })
    );
  } catch (err) {
    ["outstanding", "redeemed", "loans"].forEach((key) => replaceCard(key, renderCard({ title: key, state: "unavailable" })));
    console.warn("Moria history unavailable:", err.message);
  }
}

async function loadMarketCards(bchUsd) {
  try {
    const { data } = await fetchMusdRawPrice();
    const priceUsd = tokenSatPriceToUsd(data?.price, decimals, bchUsd);
    replaceCard(
      "price",
      renderCard({
        title: "MUSD Price",
        value: typeof priceUsd === "number" ? formatUsd(priceUsd) : undefined,
        state: typeof priceUsd === "number" ? "value" : "unavailable",
        classification: CLASSIFICATION.CURRENT,
        source: "Cauldron indexer — see Market page"
      })
    );
  } catch {
    replaceCard("price", renderCard({ title: "MUSD Price", state: "unavailable" }));
  }

  try {
    const { data } = await fetchMusdValueLocked();
    const usd = satsToUsd(data.satoshis, bchUsd);
    replaceCard(
      "tvl",
      renderCard({
        title: "MUSD Liquidity (TVL)",
        value: typeof usd === "number" ? formatUsd(usd) : undefined,
        state: typeof usd === "number" ? "value" : "unavailable",
        classification: CLASSIFICATION.CURRENT,
        source: "Cauldron indexer /valuelocked"
      })
    );
  } catch {
    replaceCard("tvl", renderCard({ title: "MUSD Liquidity (TVL)", state: "unavailable" }));
  }

  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const { data } = await fetchMusdVolume({ startSec: nowSec - 86400, endSec: nowSec });
    const usd = satsToUsd(data.volume_sats, bchUsd);
    replaceCard(
      "volume24h",
      renderCard({
        title: "24H Volume",
        value: typeof usd === "number" ? formatUsd(usd) : undefined,
        state: typeof usd === "number" ? "value" : "unavailable",
        classification: CLASSIFICATION.CURRENT,
        source: "Cauldron indexer /volume"
      })
    );
  } catch {
    replaceCard("volume24h", renderCard({ title: "24H Volume", state: "unavailable" }));
  }
}

async function loadOracleCard() {
  try {
    const { data } = await fetchDelphiV2Latest();
    if (!data) throw new Error("no data");
    replaceCard(
      "oracle",
      renderCard({
        title: "Delphi Oracle",
        value: "V2 ACTIVE",
        subtext: `${ORACLES.delphiV1.name} retired · V2 last update ${timeAgo(data.timestamp)}`,
        classification: CLASSIFICATION.CURRENT,
        source: "docs.riftenlabs.com/cauldron/API/oracle/ — see Oracle page"
      })
    );
  } catch {
    replaceCard(
      "oracle",
      renderCard({
        title: "Delphi Oracle",
        value: "V1 RETIRED",
        subtext: "V2 status unavailable — see Oracle page",
        classification: CLASSIFICATION.HISTORICAL
      })
    );
  }
}

async function load() {
  let bchUsd = null;
  try {
    const { data } = await fetchBchUsdPrice();
    bchUsd = data;
  } catch {
    /* market cards degrade to "unavailable" without a BCH/USD rate */
  }
  await Promise.all([loadHistoryCards(), loadMarketCards(bchUsd), loadOracleCard()]);
}

load();
