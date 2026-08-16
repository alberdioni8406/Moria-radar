// js/components/activity.js
import { timeAgo, formatNumber } from "../calculations/statistics.js";
import { txExplorerUrl } from "../api/blockchain.js";

// events: [{ timestamp, amountMusd, amountBch, txid, blockHeight }]
export function renderActivityFeed(events, { emptyMessage = "No recovery activity indexed yet" } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "activity-feed";

  if (!events || events.length === 0) {
    wrap.innerHTML = `<div class="table-empty">${emptyMessage}</div>`;
    return wrap;
  }

  events
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((ev) => {
      const row = document.createElement("div");
      row.className = "activity-row";
      const time = new Date(ev.timestamp);
      const hh = String(time.getUTCHours()).padStart(2, "0");
      const mm = String(time.getUTCMinutes()).padStart(2, "0");
      row.innerHTML = `
        <div class="activity-time" title="${timeAgo(ev.timestamp)}">${hh}:${mm}</div>
        <div class="activity-main">
          <span class="activity-arrow">MUSD → BCH</span>
          <span class="activity-amount">${formatNumber(ev.amountMusd)} MUSD</span>
          ${ev.amountBch ? `<span class="activity-bch">≈ ${formatNumber(ev.amountBch, 4)} BCH</span>` : ""}
        </div>
        <div class="activity-meta">
          ${ev.blockHeight ? `<span>Block ${ev.blockHeight}</span>` : ""}
          ${ev.txid ? `<a href="${txExplorerUrl(ev.txid)}" target="_blank" rel="noopener">View tx ↗</a>` : ""}
        </div>
      `;
      wrap.appendChild(row);
    });

  return wrap;
}
