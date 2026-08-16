// js/pages/market.js
import { mountShell } from "../app.js";
import { DATA_SOURCES, CLASSIFICATION } from "../config.js";
import { fetchMusdPrice, fetchMusdHistory } from "../api/cauldron.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { renderLineChart } from "../components/charts.js";
import { pegDeviation, pegStatus, PEG_STATUS_LABEL } from "../calculations/peg.js";
import { formatUsd, formatNumber } from "../calculations/statistics.js";

mountShell("market.html");

const statsGrid = document.getElementById("market-stats");
const chartContainer = document.getElementById("peg-chart");

async function load() {
  try {
    const { data } = await fetchMusdPrice();
    const price = typeof data === "number" ? data : data.priceUsd ?? data.price_usd;
    const { deviation, percent } = pegDeviation(price) || {};
    const status = pegStatus(percent);

    statsGrid.innerHTML = "";
    statsGrid.appendChild(
      renderCardGrid([
        renderCard({
          title: "MUSD Price",
          value: typeof price === "number" ? formatUsd(price) : undefined,
          state: typeof price === "number" ? "value" : "unavailable",
          classification: CLASSIFICATION.CURRENT,
          source: "Cauldron indexer"
        }),
        renderCard({
          title: "Peg Deviation",
          value: typeof deviation === "number" ? `${deviation >= 0 ? "+" : ""}${formatNumber(deviation, 4)} (${percent.toFixed(2)}%)` : undefined,
          state: typeof deviation === "number" ? "value" : "unavailable",
          subtext: PEG_STATUS_LABEL[status],
          classification: CLASSIFICATION.DERIVED
        })
      ])
    );
  } catch (err) {
    statsGrid.innerHTML = "";
    statsGrid.appendChild(renderCardGrid([renderCard({ title: "MUSD Market", state: "unavailable" })]));
    console.warn(err);
  }

  try {
    const { data: hist } = await fetchMusdHistory("30d");
    const points = Array.isArray(hist) ? hist : hist.points || [];
    renderLineChart(
      chartContainer,
      points.map((p, i) => ({ x: i, y: Number(p.priceUsd ?? p.price_usd ?? p.price) })),
      { label: "MUSD price — 30D" }
    );
  } catch {
    chartContainer.innerHTML = `<div class="chart-empty">Peg history temporarily unavailable</div>`;
  }
}

document.getElementById("cauldron-radar-link").href = DATA_SOURCES.cauldron.externalDashboard;

load();
