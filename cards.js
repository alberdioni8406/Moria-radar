// js/components/cards.js
// Every card can be in one of three render states: loading, value, unavailable.
// This is deliberate — see project rule "no fake data".

export function renderCard({ title, value, subtext, classification, source, state = "value" }) {
  const el = document.createElement("div");
  el.className = "card";

  const body =
    state === "loading"
      ? `<div class="card-value card-loading">Loading…</div>`
      : state === "unavailable"
      ? `<div class="card-value card-unavailable">N/A</div>
         <div class="card-subtext">Data temporarily unavailable</div>`
      : `<div class="card-value">${value}</div>
         ${subtext ? `<div class="card-subtext">${subtext}</div>` : ""}`;

  el.innerHTML = `
    <div class="card-header">
      <span class="card-title">${title}</span>
      ${classification ? `<span class="tag tag-${classification.toLowerCase()}">${classification}</span>` : ""}
    </div>
    ${body}
    ${source ? `<div class="card-source" title="Data source"><span class="info-dot">ⓘ</span> ${source}</div>` : ""}
  `;
  return el;
}

export function renderCardGrid(cards) {
  const grid = document.createElement("div");
  grid.className = "card-grid";
  cards.forEach((c) => grid.appendChild(c));
  return grid;
}
