// js/pages/history.js
import { mountShell } from "../app.js";
import { fetchFullMoriaHistory, fetchLoanHistory } from "../api/moria.js";
import { renderTable, statusBadge } from "../components/tables.js";
import { formatNumber } from "../calculations/statistics.js";

mountShell("history.html");

const tableContainer = document.getElementById("history-table");
const detailContainer = document.getElementById("loan-detail");
tableContainer.innerHTML = `<div class="table-empty">Loading loan archive…</div>`;

const params = new URLSearchParams(window.location.search);
const query = params.get("q");

async function loadArchive() {
  try {
    const { events, stale } = await fetchFullMoriaHistory();

    // Group events into per-loan rows keyed by borrowerHash.
    const byBorrower = new Map();
    for (const ev of events) {
      const key = ev.borrowerHash || ev.borrower_hash || "unknown";
      if (!byBorrower.has(key)) byBorrower.set(key, []);
      byBorrower.get(key).push(ev);
    }

    const rows = [...byBorrower.entries()].map(([borrowerHash, evs]) => {
      const sorted = evs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const finalStatus = inferStatus(last?.type);
      return {
        borrowerHash,
        created: first?.timestamp ? new Date(first.timestamp).toISOString().slice(0, 10) : "—",
        musd: formatNumber(Number(first?.amountMusd ?? first?.amount_musd ?? 0)),
        collateral: formatNumber(Number(first?.amountBch ?? first?.amount_bch ?? 0), 4),
        rate: first?.interestRate ?? first?.interest_rate ?? "—",
        actions: sorted.map((e) => e.type).join(", "),
        finalStatus,
        onClick: () => showLoanDetail(borrowerHash)
      };
    });

    const filtered = query
      ? rows.filter((r) => r.borrowerHash.toLowerCase().includes(query.toLowerCase()))
      : rows;

    tableContainer.innerHTML = "";
    if (stale) {
      const staleNote = document.createElement("div");
      staleNote.className = "stale-note";
      staleNote.textContent = "⚠ Showing stale cached data — the indexer did not respond on the last refresh.";
      tableContainer.appendChild(staleNote);
    }
    tableContainer.appendChild(
      renderTable({
        columns: [
          { key: "borrowerHash", label: "Borrower" },
          { key: "created", label: "Created" },
          { key: "musd", label: "MUSD" },
          { key: "collateral", label: "BCH Collateral" },
          { key: "rate", label: "Interest Rate" },
          { key: "actions", label: "Actions" },
          { key: "finalStatus", label: "Final Status", render: (r) => statusBadge(r.finalStatus) }
        ],
        rows: filtered,
        emptyMessage: query
          ? `No indexed loans match "${query}"`
          : "No indexed loan history available"
      })
    );
  } catch (err) {
    tableContainer.innerHTML = `<div class="table-empty">Data temporarily unavailable — the Moria indexer did not return valid data. Try again later.</div>`;
    console.warn(err);
  }
}

function inferStatus(lastAction) {
  if (lastAction === "redeem") return "redeemed";
  if (lastAction === "repay") return "repaid";
  if (lastAction === "liquidate") return "liquidated";
  return "closed";
}

async function showLoanDetail(borrowerHash) {
  detailContainer.hidden = false;
  detailContainer.innerHTML = `<div class="table-empty">Loading loan detail…</div>`;
  detailContainer.scrollIntoView({ behavior: "smooth" });
  try {
    const data = await fetchLoanHistory(borrowerHash);
    const events = Array.isArray(data) ? data : data.events || [];
    detailContainer.innerHTML = `
      <h3>Loan detail — ${borrowerHash}</h3>
      <div class="loan-timeline">
        ${events
          .map(
            (e, i) => `
          <div class="timeline-step">
            <span class="timeline-type">${e.type}</span>
            <span class="timeline-date">${e.timestamp ? new Date(e.timestamp).toISOString() : "—"}</span>
            ${e.txid ? `<a href="https://bchexplorer.cash/tx/${e.txid}" target="_blank" rel="noopener">tx ↗</a>` : ""}
            ${i < events.length - 1 ? '<div class="timeline-arrow">↓</div>' : ""}
          </div>`
          )
          .join("")}
      </div>
    `;
  } catch (err) {
    detailContainer.innerHTML = `<div class="table-empty">Data temporarily unavailable for this loan. Try again later.</div>`;
  }
}

loadArchive();
