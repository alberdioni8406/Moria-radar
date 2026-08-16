// js/pages/supply.js
import { mountShell } from "../app.js";
import { CLASSIFICATION } from "../config.js";
import { fetchFullMoriaHistory } from "../api/moria.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { renderLineChart, renderRangeTabs } from "../components/charts.js";
import { currentOutstandingSupply, cumulativeRedeemed, supplyHistorySeries, supplyChange } from "../calculations/supply.js";
import { formatNumber } from "../calculations/statistics.js";

mountShell("supply.html");

const statsGrid = document.getElementById("supply-stats");
const chartContainer = document.getElementById("supply-chart");
const tabsContainer = document.getElementById("supply-range-tabs");

let series = [];
let range = "30D";
const RANGE_DAYS = { "24H": 1, "7D": 7, "30D": 30, "90D": 90, ALL: Infinity };

function draw() {
  const days = RANGE_DAYS[range];
  const cutoff = Date.now() - days * 86400_000;
  const filtered = Number.isFinite(days) ? series.filter((p) => new Date(p.timestamp).getTime() >= cutoff) : series;
  renderLineChart(
    chartContainer,
    filtered.map((p, i) => ({ x: i, y: p.supply })),
    { label: `MUSD outstanding supply — ${range}` }
  );
}

async function load() {
  try {
    const { events, stale } = await fetchFullMoriaHistory();
    series = supplyHistorySeries(events);

    const outstanding = currentOutstandingSupply(events);
    const redeemed = cumulativeRedeemed(events);
    const change24h = supplyChange(series, 86400_000);
    const change7d = supplyChange(series, 7 * 86400_000);
    const change30d = supplyChange(series, 30 * 86400_000);

    statsGrid.innerHTML = "";
    statsGrid.appendChild(
      renderCardGrid([
        renderCard({
          title: "Current Outstanding MUSD",
          value: outstanding === null ? undefined : `${formatNumber(outstanding)} MUSD`,
          state: outstanding === null ? "unavailable" : "value",
          classification: CLASSIFICATION.CURRENT,
          subtext: stale ? "Stale cached data" : "Not the same as historical V1 total supply — see note below"
        }),
        renderCard({
          title: "Redeemed Supply",
          value: redeemed === null ? undefined : `${formatNumber(redeemed)} MUSD`,
          state: redeemed === null ? "unavailable" : "value",
          classification: CLASSIFICATION.DERIVED
        }),
        renderCard({
          title: "24H Change",
          value: change24h === null ? undefined : `${formatNumber(change24h)} MUSD`,
          state: change24h === null ? "unavailable" : "value",
          classification: CLASSIFICATION.DERIVED
        }),
        renderCard({
          title: "7D Change",
          value: change7d === null ? undefined : `${formatNumber(change7d)} MUSD`,
          state: change7d === null ? "unavailable" : "value",
          classification: CLASSIFICATION.DERIVED
        }),
        renderCard({
          title: "30D Change",
          value: change30d === null ? undefined : `${formatNumber(change30d)} MUSD`,
          state: change30d === null ? "unavailable" : "value",
          classification: CLASSIFICATION.DERIVED
        })
      ])
    );

    const onRangeChange = (r) => {
      range = r;
      renderRangeTabs(tabsContainer, Object.keys(RANGE_DAYS), range, onRangeChange);
      draw();
    };
    renderRangeTabs(tabsContainer, Object.keys(RANGE_DAYS), range, onRangeChange);
    draw();
  } catch (err) {
    statsGrid.innerHTML = "";
    statsGrid.appendChild(renderCardGrid([renderCard({ title: "MUSD Supply", state: "unavailable" })]));
    chartContainer.innerHTML = `<div class="chart-empty">Data temporarily unavailable</div>`;
    console.warn(err);
  }
}

load();
