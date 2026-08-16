// js/pages/dashboard.js
import { mountShell } from "../app.js";
import { MORIA_DEPLOYMENTS, CLASSIFICATION } from "../config.js";
import { fetchMoriaHistory } from "../api/moria.js";
import { fetchMusdPrice } from "../api/cauldron.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { currentOutstandingSupply, cumulativeRedeemed } from "../calculations/supply.js";
import { formatNumber } from "../calculations/statistics.js";

mountShell("index.html");

const grid = document.getElementById("dashboard-cards");
const cards = {
  outstanding: renderCard({ title: "MUSD Outstanding", state: "loading" }),
  redeemed: renderCard({ title: "MUSD Redeemed", state: "loading" }),
  supply: renderCard({ title: "MUSD Supply", state: "loading" }),
  buyback: renderCard({
    title: "Buyback Status",
    value: "ACTIVE",
    subtext: `Since ${MORIA_DEPLOYMENTS.v1.buybackStartDate}`,
    classification: CLASSIFICATION.CURRENT,
    source: "Riften Labs public commitment — see Buyback page"
  }),
  oracle: renderCard({
    title: "V1 Oracle",
    value: "RETIRED",
    subtext: MORIA_DEPLOYMENTS.v1.oracleName,
    classification: CLASSIFICATION.HISTORICAL,
    source: "docs.riftenlabs.com/moria/d3lphi/"
  }),
  loans: renderCard({ title: "Historical Loans", state: "loading" }),
  recovery: renderCard({
    title: "Recovery Activity",
    value: "See Buyback page",
    classification: CLASSIFICATION.DERIVED
  })
};
grid.appendChild(renderCardGrid(Object.values(cards)));

async function load() {
  try {
    const { data, stale } = await fetchMoriaHistory();
    const events = Array.isArray(data) ? data : data.events || [];

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
        value: `${new Set(events.map((e) => e.borrowerHash || e.borrower_hash)).size || events.length}`,
        classification: CLASSIFICATION.HISTORICAL,
        source: "Riften Labs indexer /moria/history"
      })
    );
  } catch (err) {
    ["outstanding", "redeemed", "loans"].forEach((key) =>
      replaceCard(key, renderCard({ title: cards[key].querySelector(".card-title").textContent, state: "unavailable" }))
    );
    console.warn("Moria history unavailable:", err.message);
  }

  try {
    const { data } = await fetchMusdPrice();
    const price = typeof data === "number" ? data : data.priceUsd ?? data.price_usd;
    replaceCard(
      "supply",
      renderCard({
        title: "MUSD Supply",
        value: typeof price === "number" ? "See Supply page" : undefined,
        state: typeof price === "number" ? "value" : "unavailable",
        classification: CLASSIFICATION.CURRENT,
        source: "On-chain token supply via indexer"
      })
    );
  } catch {
    replaceCard("supply", renderCard({ title: "MUSD Supply", state: "unavailable" }));
  }
}

function replaceCard(key, newEl) {
  cards[key].replaceWith(newEl);
  cards[key] = newEl;
}

load();
