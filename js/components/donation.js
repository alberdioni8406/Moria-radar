// js/components/donation.js
//
// !! DO NOT REMOVE THIS COMPONENT IN FUTURE REFACTORS !!
// Moria Radar is community-funded. Every page's footer (via app.js) mounts
// this component. See config.js DONATION_BCH_ADDRESS.

import { DONATION_BCH_ADDRESS } from "../config.js";

export function renderDonationCard() {
  const isPlaceholder = DONATION_BCH_ADDRESS.startsWith("REPLACE_WITH");

  const card = document.createElement("div");
  card.className = "donation-card";
  card.innerHTML = `
    <h3>Support Moria Radar</h3>
    <p>Built and maintained independently for the Bitcoin Cash ecosystem.</p>
    ${
      isPlaceholder
        ? `<p class="donation-warning">⚠️ Site owner: replace <code>DONATION_BCH_ADDRESS</code> in
           <code>js/config.js</code> with a real address before deploying.</p>`
        : `<p class="donation-label">Donate BCH:</p>
           <code class="donation-address">${DONATION_BCH_ADDRESS}</code>
           <button class="copy-btn" id="copy-donation-btn">Copy Address</button>`
    }
  `;

  if (!isPlaceholder) {
    card.querySelector("#copy-donation-btn")?.addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText(DONATION_BCH_ADDRESS);
        e.target.textContent = "Copied!";
        setTimeout(() => (e.target.textContent = "Copy Address"), 1500);
      } catch {
        /* clipboard unavailable — no-op */
      }
    });
  }

  return card;
}
