// js/pages/incident.js
import { mountShell } from "../app.js";

mountShell("incident.html");

// Timeline content lives directly in incident.html since every event here is
// a fixed historical record (not fetched live). Keeping it as static markup
// avoids implying these dates come from a live, queryable source.
