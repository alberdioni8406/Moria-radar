// js/pages/buyback.js
import { mountShell } from "../app.js";
import { MORIA_DEPLOYMENTS, CLASSIFICATION } from "../config.js";
import { fetchMoriaHistory } from "../api/moria.js";
import { renderCard, renderCardGrid } from "../components/cards.js";
import { renderActivityFeed } from "../components/activity.js";
import { recoveryStats, buybackWindow, volumeInWindow } from "../calculations/recovery.js";
import { formatNumber } from "../calculations/statistics.js";

mountShell("buyback.html");

const { start, minEnd } = buybackWindow();
document.getElementById("buyback-start").textContent = start.toISOString().slice(0, 10);
document.getElementById("buyback-min-end").textContent = minEnd.toISOString().slice(0, 10);

const statsGrid = document.getElementById("recovery-stats");
const feedContainer = document.getElementById("recovery-feed");
feedContainer.innerHTML = `<div class="table-empty">Loading recovery activity…</div>`;

async function load() {
  try {
    const { data, stale } = await fetchMoriaHistory();
    const events = Array.isArray(data) ? data : data.events || [];
    const conversions = events.filter((e) => e.type === "redeem");

    const stats = recoveryStats(conversions);
    const vol7d = volumeInWindow(conversions, 7 * 86400_000);
    const vol30d = volumeInWindow(conversions, 30 * 86400_000);

    const cards = stats
      ? [
          renderCard({ title: "Total MUSD Converted", value: `${formatNumber(stats.totalMusdConverted)} MUSD`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "BCH Distributed", value: `${formatNumber(stats.totalBchDistributed, 4)} BCH`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "Conversions", value: `${stats.conversionCount}`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "Unique Addresses", value: `${stats.uniqueAddresses}`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "Average Conversion", value: `${formatNumber(stats.averageConversion)} MUSD`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "Largest Conversion", value: `${formatNumber(stats.largestConversion)} MUSD`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "7D Volume", value: `${formatNumber(vol7d)} MUSD`, classification: CLASSIFICATION.DERIVED }),
          renderCard({ title: "30D Volume", value: `${formatNumber(vol30d)} MUSD`, classification: CLASSIFICATION.DERIVED })
        ]
      : [renderCard({ title: "Recovery Metrics", value: "Not currently available from indexed data", state: "unavailable" })];

    statsGrid.innerHTML = "";
    statsGrid.appendChild(renderCardGrid(cards));

    feedContainer.innerHTML = "";
    if (stale) {
      const note = document.createElement("div");
      note.className = "stale-note";
      note.textContent = "⚠ Showing stale cached data.";
      feedContainer.appendChild(note);
    }
    feedContainer.appendChild(
      renderActivityFeed(
        conversions.map((c) => ({
          timestamp: c.timestamp,
          amountMusd: Number(c.amountMusd ?? c.amount_musd ?? 0),
          amountBch: Number(c.amountBch ?? c.amount_bch ?? 0),
          txid: c.txid,
          blockHeight: c.blockHeight ?? c.block_height
        }))
      )
    );
  } catch (err) {
    statsGrid.innerHTML = "";
    statsGrid.appendChild(
      renderCardGrid([renderCard({ title: "Recovery Metrics", state: "unavailable" })])
    );
    feedContainer.innerHTML = `<div class="table-empty">Data temporarily unavailable — the Moria indexer did not return valid data. Try again later.</div>`;
    console.warn(err);
  }
}

load();
