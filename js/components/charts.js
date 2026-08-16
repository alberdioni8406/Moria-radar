// js/components/charts.js
// A small dependency-free canvas line chart. The project brief allows a
// charting library "only if genuinely useful" — for simple time series a
// ~60-line canvas renderer avoids an extra dependency entirely.

export function renderLineChart(container, points, { color = "#0ac18e", label = "" } = {}) {
  container.innerHTML = "";
  if (!points || points.length < 2) {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = "Not enough data to render a chart";
    container.appendChild(empty);
    return;
  }

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  const width = container.clientWidth || 320;
  const height = 180;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const values = points.map((p) => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 12;

  ctx.beginPath();
  points.forEach((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.y - min) / range) * (height - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // fill under curve
  ctx.lineTo(width - padding, height - padding);
  ctx.lineTo(padding, height - padding);
  ctx.closePath();
  ctx.fillStyle = color + "22";
  ctx.fill();

  if (label) {
    const cap = document.createElement("div");
    cap.className = "chart-label";
    cap.textContent = label;
    container.appendChild(cap);
  }
}

export function renderRangeTabs(container, ranges, activeRange, onChange) {
  container.innerHTML = "";
  container.className = "range-tabs";
  ranges.forEach((r) => {
    const btn = document.createElement("button");
    btn.textContent = r;
    btn.className = "range-tab" + (r === activeRange ? " active" : "");
    btn.addEventListener("click", () => onChange(r));
    container.appendChild(btn);
  });
}
