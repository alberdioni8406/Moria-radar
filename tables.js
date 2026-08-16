// js/components/tables.js

export function renderTable({ columns, rows, emptyMessage = "No data available" }) {
  const wrap = document.createElement("div");
  wrap.className = "table-scroll";

  if (!rows || rows.length === 0) {
    wrap.innerHTML = `<div class="table-empty">${emptyMessage}</div>`;
    return wrap;
  }

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = columns.map((c) => `<td>${c.render ? c.render(row) : row[c.key] ?? ""}</td>`).join("");
    if (row.onClick) {
      tr.classList.add("row-clickable");
      tr.addEventListener("click", row.onClick);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  wrap.appendChild(table);
  return wrap;
}

export function statusBadge(status) {
  const map = {
    redeemed: ["REDEEMED", "badge-neutral"],
    repaid: ["REPAID", "badge-good"],
    closed: ["CLOSED", "badge-neutral"],
    liquidated: ["LIQUIDATED", "badge-bad"],
    active: ["ACTIVE", "badge-good"]
  };
  const [text, cls] = map[status?.toLowerCase()] || [status || "UNKNOWN", "badge-neutral"];
  return `<span class="badge ${cls}">${text}</span>`;
}
