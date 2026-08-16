// js/pages/market.js
import { mountShell } from "../app.js";
import { DATA_SOURCES, CLASSIFICATION, MORIA_DEPLOYMENTS } from "../config.js";
import {
  fetchMusdRawPrice,
  fetchMusdPriceHistory,
  fetchMusdValueLocked,
  fetchMusdVolume,
  fetchMusdRecentTxs
} from "../api/cauldron.js";
import { fetchBchUsdPrice, txExplorerUrl } from "../api/blockchain.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { renderLineChart } from "../components/charts.js";
import { renderTable } from "../components/tables.js";
import { pegDeviation, pegStatus, PEG_STATUS_LABEL } from "../calculations/peg.js";
import { tokenSatPriceToUsd, satsToUsd, satsToBch } from "../calculations/pricing.js";
import { formatUsd, formatNumber, timeAgo } from "../calculations/statistics.js";

mountShell("market.html");

const statsGrid = document.getElementById("market-stats");
const chartContainer = document.getElementById("peg-chart");
const txContainer = document.getElementById("recent-tx-table");
document.getElementById("cauldron-radar-link").href = DATA_SOURCES.cauldron.externalDashboard;

const DAY = 86400;
const decimals = MORIA_DEPLOYMENTS.v1.tokenDecimals;

async function loadPriceAndPeg(bchUsd) {
  try {
    const { data } = await fetchMusdRawPrice();
    const priceUsd = tokenSatPriceToUsd(data?.price, decimals, bchUsd);
    const { deviation, percent } = pegDeviation(priceUsd) || {};
    const status = pegStatus(percent);
    return [
      renderCard({
        title: "MUSD Price",
        value: typeof priceUsd === "number" ? formatUsd(priceUsd) : undefined,
        state: typeof priceUsd === "number" ? "value" : "unavailable",
        classification: CLASSIFICATION.CURRENT,
        source: "Cauldron indexer /price/current, converted via live BCH/USD"
      }),
      renderCard({
        title: "Peg Deviation",
        value:
          typeof deviation === "number"
            ? `${deviation >= 0 ? "+" : ""}${formatNumber(deviation, 4)} (${percent.toFixed(2)}%)`
            : undefined,
        state: typeof deviation === "number" ? "value" : "unavailable",
        subtext: PEG_STATUS_LABEL[status],
        classification: CLASSIFICATION.DERIVED
      })
    ];
  } catch {
    return [renderCard({ title: "MUSD Price", state: "unavailable" })];
  }
}

async function loadTvl(bchUsd) {
  try {
    const { data } = await fetchMusdValueLocked();
    const usd = satsToUsd(data.satoshis, bchUsd);
    return renderCard({
      title: "MUSD Liquidity (TVL)",
      value: typeof usd === "number" ? formatUsd(usd) : `${formatNumber(satsToBch(data.satoshis), 4)} BCH`,
      subtext: typeof data.token_amount === "number" ? `${formatNumber(data.token_amount)} MUSD in pools` : undefined,
      classification: CLASSIFICATION.CURRENT,
      source: "Cauldron indexer /valuelocked"
    });
  } catch {
    return renderCard({ title: "MUSD Liquidity (TVL)", state: "unavailable" });
  }
}

async function loadVolume(label, startSec, bchUsd) {
  try {
    const { data } = await fetchMusdVolume({ startSec, endSec: Math.floor(Date.now() / 1000) });
    const usd = satsToUsd(data.volume_sats, bchUsd);
    return renderCard({
      title: `${label} Volume`,
      value: typeof usd === "number" ? formatUsd(usd) : undefined,
      state: typeof usd === "number" ? "value" : "unavailable",
      subtext: typeof data.volume_tokens === "number" ? `${formatNumber(data.volume_tokens)} MUSD traded` : undefined,
      classification: CLASSIFICATION.CURRENT,
      source: "Cauldron indexer /volume"
    });
  } catch {
    return renderCard({ title: `${label} Volume`, state: "unavailable" });
  }
}

async function loadChart(bchUsd) {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const { data } = await fetchMusdPriceHistory({ startSec: nowSec - 30 * DAY, endSec: nowSec, stepSize: 3600 });
    const points = (data?.history || []).map((p) => ({
      timestamp: p.time,
      priceUsd: tokenSatPriceToUsd(p.avg, decimals, bchUsd)
    }));
    renderLineChart(
      chartContainer,
      points.map((p, i) => ({ x: i, y: p.priceUsd })),
      { label: "MUSD price — 30D (hourly avg)" }
    );
  } catch {
    chartContainer.innerHTML = `<div class="chart-empty">Peg history temporarily unavailable</div>`;
  }
}

async function loadRecentTx() {
  try {
    const { data } = await fetchMusdRecentTxs({ limit: 15 });
    const rows = (Array.isArray(data) ? data : []).map((tx) => ({
      txid: tx.txid,
      time: tx.timestamp_guess ? timeAgo(new Date(tx.timestamp_guess * 1000).toISOString()) : "—",
      status: tx.blockhash ? "Confirmed" : "Unconfirmed"
    }));
    txContainer.innerHTML = "";
    txContainer.appendChild(
      renderTable({
        columns: [
          { key: "txid", label: "Transaction", render: (r) => `<a href="${txExplorerUrl(r.txid)}" target="_blank" rel="noopener">${r.txid.slice(0, 12)}… ↗</a>` },
          { key: "time", label: "Time" },
          { key: "status", label: "Status" }
        ],
        rows,
        emptyMessage: "No recent MUSD trades indexed"
      })
    );
  } catch {
    txContainer.innerHTML = `<div class="table-empty">Data temporarily unavailable</div>`;
  }
}

async function load() {
  let bchUsd = null;
  try {
    const { data } = await fetchBchUsdPrice();
    bchUsd = data;
  } catch {
    /* price conversions below degrade to "unavailable" without a BCH/USD rate */
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const [priceCards, tvlCard, vol24h, vol7d, vol30d] = await Promise.all([
    loadPriceAndPeg(bchUsd),
    loadTvl(bchUsd),
    loadVolume("24H", nowSec - DAY, bchUsd),
    loadVolume("7D", nowSec - 7 * DAY, bchUsd),
    loadVolume("30D", nowSec - 30 * DAY, bchUsd)
  ]);

  statsGrid.innerHTML = "";
  statsGrid.appendChild(renderCardGrid([...priceCards, tvlCard, vol24h, vol7d, vol30d]));

  await Promise.all([loadChart(bchUsd), loadRecentTx()]);
}

load();
