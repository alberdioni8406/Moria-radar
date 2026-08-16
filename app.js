// js/app.js
// Shared shell logic run on every page: header/nav, footer, donation card,
// disclaimer, and the global search box.

import { SITE, MORIA_DEPLOYMENTS } from "./config.js";
import { renderHeader, renderFooterDisclaimer } from "./components/status.js";
import { renderDonationCard } from "./components/donation.js";

export function mountShell(activePage) {
  renderHeader(activePage);
  mountFooter();
  mountSearch();
}

function mountFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  footer.innerHTML = "";

  const links = document.createElement("div");
  links.className = "footer-links";
  links.innerHTML = `
    <a href="${SITE.officialSite}" target="_blank" rel="noopener">Official Moria site ↗</a>
    <a href="${SITE.officialDocs}" target="_blank" rel="noopener">Riften Labs docs ↗</a>
    <a href="${SITE.sourceRepo}" target="_blank" rel="noopener">Moria source (GitLab) ↗</a>
  `;
  footer.appendChild(links);

  footer.appendChild(renderDonationCard());
  renderFooterDisclaimer(footer, SITE.disclaimer);

  const meta = document.createElement("p");
  meta.className = "footer-meta";
  meta.textContent = `Not the official Moria interface. ${MORIA_DEPLOYMENTS.v1.name}: ${MORIA_DEPLOYMENTS.v1.statusLabel}.`;
  footer.appendChild(meta);
}

function mountSearch() {
  const form = document.getElementById("global-search-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("global-search-input");
    const query = input.value.trim();
    if (!query) return;
    // Loan NFT hash / tx id / token id / address all resolve through the
    // history page's lookup — it queries the indexer and reports what it
    // actually supports rather than pretending every identifier type works.
    window.location.href = `history.html?q=${encodeURIComponent(query)}`;
  });
}

export function showFatalError(container, message) {
  container.innerHTML = `<div class="fatal-error">⚠️ ${message}</div>`;
}
