import type { PyramidSlide } from '../../types';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function accentTitle(title: string, accent?: string): string {
  if (!accent) return esc(title);
  const escaped = esc(title);
  const escapedAccent = esc(accent);
  return escaped.replace(escapedAccent, `<span class="acc">${escapedAccent}</span>`);
}

function renderProgress(progress: number[]): string {
  return progress.map(v => {
    const cls = v === 2 ? 'pd now' : v === 1 ? 'pd done' : 'pd';
    return `<div class="${cls}"></div>`;
  }).join('');
}

export function renderPyramid(data: PyramidSlide): string {
  const n = data.levels.length;
  const levels = data.levels.map((level, i) => {
    const delay = (0.3 + i * 0.12).toFixed(2);
    // Top of pyramid is narrowest, bottom is widest
    // levels[0] = top, levels[n-1] = bottom
    const minWidth = 25;
    const maxWidth = 100;
    const widthPct = Math.round(minWidth + ((maxWidth - minWidth) * i) / Math.max(n - 1, 1));
    // Color intensity decreases toward the bottom
    const blueIntensity = Math.round(80 - (i * 40) / Math.max(n - 1, 1));
    const blue2Intensity = Math.round(60 - (i * 30) / Math.max(n - 1, 1));
    return `<div class="d13level" style="opacity:0;animation:fsd .5s ${delay}s ease forwards;width:${widthPct}%;background:linear-gradient(135deg,color-mix(in srgb,var(--blue) ${blueIntensity}%,transparent),color-mix(in srgb,var(--blue2) ${blue2Intensity}%,transparent));min-height:${Math.round(280 / n)}px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:12px;font-weight:700;">${esc(level.label)}</div>
        <div style="font-size:10px;opacity:.6;font-weight:300;text-align:center;">${esc(level.description)}</div>
      </div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d13content">
    <div class="d13left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="d13right">
      ${levels}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
