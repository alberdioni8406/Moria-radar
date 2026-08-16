// js/pages/oracle.js
import { mountShell } from "../app.js";
import { MORIA_DEPLOYMENTS, CLASSIFICATION } from "../config.js";
import { fetchActiveOracleStatus } from "../api/oracle.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { timeAgo } from "../calculations/statistics.js";

mountShell("oracle.html");

document.getElementById("oracle-v1-id").textContent = MORIA_DEPLOYMENTS.v1.oracleId;
document.getElementById("oracle-v1-name").textContent = MORIA_DEPLOYMENTS.v1.oracleName;

const grid = document.getElementById("oracle-stats");

async function load() {
  const v1Card = renderCard({
    title: "d3lphi V1 (\"Delphi V1\")",
    value: "RETIRED",
    subtext: "No longer a valid current price source",
    classification: CLASSIFICATION.HISTORICAL,
    source: "docs.riftenlabs.com/moria/d3lphi/"
  });

  let v2Card;
  try {
    const result = await fetchActiveOracleStatus();
    if (result.notDeployed) {
      v2Card = renderCard({
        title: "Replacement Oracle",
        value: "NOT CONFIRMED",
        subtext: "No verified V2/replacement oracle identifier is configured yet",
        classification: CLASSIFICATION.UNAVAILABLE
      });
    } else {
      const { data } = result;
      const price = data.priceUsd ?? data.price_usd;
      const updatedAt = data.timestamp;
      const ageMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : null;
      const fresh = ageMs !== null && ageMs < 5 * 60_000;
      v2Card = renderCard({
        title: "Active Oracle",
        value: typeof price === "number" ? `BCH/USD ${price}` : undefined,
        state: typeof price === "number" ? "value" : "unavailable",
        subtext: updatedAt ? `${fresh ? "🟢 FRESH" : "🟡 STALE"} — Last update: ${timeAgo(updatedAt)}` : undefined,
        classification: CLASSIFICATION.CURRENT
      });
    }
  } catch {
    v2Card = renderCard({ title: "Replacement Oracle", state: "unavailable" });
  }

  grid.innerHTML = "";
  grid.appendChild(renderCardGrid([v1Card, v2Card]));
}

load();
