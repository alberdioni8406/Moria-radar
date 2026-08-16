// js/pages/protocol.js
import { mountShell } from "../app.js";
import { MORIA_DEPLOYMENTS, ORACLES, DATA_SOURCES, SITE } from "../config.js";

mountShell("protocol.html");

document.getElementById("v1-token-id").textContent = MORIA_DEPLOYMENTS.v1.tokenId;
document.getElementById("v1-decimals").textContent = MORIA_DEPLOYMENTS.v1.tokenDecimals;
document.getElementById("v1-status").textContent = MORIA_DEPLOYMENTS.v1.statusLabel;
document.getElementById("v2-status").textContent = MORIA_DEPLOYMENTS.v2.statusLabel;
document.getElementById("oracle-v1-id").textContent = ORACLES.delphiV1.tokenId;
document.getElementById("oracle-v1-status").textContent = ORACLES.delphiV1.statusLabel;
document.getElementById("oracle-v2-id").textContent = ORACLES.delphiV2.tokenId;
document.getElementById("oracle-v2-status").textContent = ORACLES.delphiV2.statusLabel;

const sourcesList = document.getElementById("data-sources-list");
sourcesList.innerHTML = Object.entries(DATA_SOURCES)
  .map(
    ([key, src]) =>
      `<li><strong>${src.label || key}</strong> — <code>${src.baseUrl || "n/a"}</code>${
        src.docs ? ` — <a href="${src.docs}" target="_blank" rel="noopener">docs ↗</a>` : ""
      }</li>`
  )
  .join("");

document.getElementById("source-repo-link").href = SITE.sourceRepo;
document.getElementById("official-docs-link").href = SITE.officialDocs;
