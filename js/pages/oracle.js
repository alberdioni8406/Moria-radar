// js/pages/oracle.js
import { mountShell } from "../app.js";
import { ORACLES, CLASSIFICATION } from "../config.js";
import { fetchDelphiV1Meta, fetchDelphiV2Latest } from "../api/oracle.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { formatUsd, timeAgo } from "../calculations/statistics.js";

mountShell("oracle.html");

document.getElementById("oracle-v1-id").textContent = ORACLES.delphiV1.tokenId;
document.getElementById("oracle-v2-id").textContent = ORACLES.delphiV2.tokenId;

const grid = document.getElementById("oracle-stats");

async function load() {
  let v1Card;
  try {
    const { data } = await fetchDelphiV1Meta();
    v1Card = renderCard({
      title: "Delphi V1",
      value: "RETIRED",
      subtext: data ? `Last recorded price: ${formatUsd(data.priceUsd)} (${timeAgo(data.timestamp)})` : "No longer updated",
      classification: CLASSIFICATION.HISTORICAL,
      source: "Riften Labs oracle indexer /delphi/closest"
    });
  } catch {
    v1Card = renderCard({
      title: "Delphi V1",
      value: "RETIRED",
      subtext: "No longer a valid current price source",
      classification: CLASSIFICATION.HISTORICAL
    });
  }

  let v2Card;
  try {
    const { data } = await fetchDelphiV2Latest();
    if (!data) throw new Error("no data");
    const ageMs = data.timestamp ? Date.now() - new Date(data.timestamp).getTime() : null;
    const fresh = ageMs !== null && ageMs < 5 * 60_000;
    v2Card = renderCard({
      title: "Delphi V2 — BCH/USD",
      value: typeof data.priceUsd === "number" ? formatUsd(data.priceUsd) : undefined,
      state: typeof data.priceUsd === "number" ? "value" : "unavailable",
      subtext: data.timestamp ? `${fresh ? "🟢 FRESH" : "🟡 STALE"} — Last update: ${timeAgo(data.timestamp)}` : undefined,
      classification: CLASSIFICATION.CURRENT,
      source: "Riften Labs oracle indexer /delphi/closest"
    });
  } catch {
    v2Card = renderCard({ title: "Delphi V2 — BCH/USD", state: "unavailable" });
  }

  grid.innerHTML = "";
  grid.appendChild(renderCardGrid([v1Card, v2Card]));
}

load();
