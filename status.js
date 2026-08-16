// js/components/status.js
import { MORIA_DEPLOYMENTS } from "../config.js";

const NAV_ITEMS = [
  { href: "index.html", label: "Dashboard" },
  { href: "history.html", label: "History" },
  { href: "buyback.html", label: "Buyback" },
  { href: "supply.html", label: "Supply" },
  { href: "market.html", label: "Market" },
  { href: "oracle.html", label: "Oracle" },
  { href: "incident.html", label: "Incident" },
  { href: "protocol.html", label: "Protocol" }
];

export function renderHeader(activePage) {
  const header = document.getElementById("site-header");
  if (!header) return;

  const navHtml = NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="nav-link${item.href === activePage ? " active" : ""}">${item.label}</a>`
  ).join("");

  header.innerHTML = `
    <div class="header-top">
      <a href="index.html" class="brand">
        <span class="brand-mark">◈</span> Moria Radar
      </a>
      <div class="v1-status-pill" title="Moria V1 is disabled following the April 2026 incident">
        🔴 Moria V1 Disabled
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">☰</button>
    </div>
    <nav class="site-nav" id="site-nav">${navHtml}</nav>
  `;

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle?.addEventListener("click", () => nav.classList.toggle("open"));
}

export function renderFooterDisclaimer(container, text) {
  const el = document.createElement("p");
  el.className = "disclaimer";
  el.textContent = text;
  container.appendChild(el);
}

export function statusPillHtml() {
  return `<span class="v1-status-pill-inline">🔴 ${MORIA_DEPLOYMENTS.v1.statusLabel}</span>`;
}
