import type { FunnelSlide } from '../../types';

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

export function renderFunnel(data: FunnelSlide): string {
  const n = data.stages.length;
  const stages = data.stages.map((stage, i) => {
    const delay = (0.3 + i * 0.12).toFixed(2);
    // Width decreases from 100% to a minimum proportionally
    const widthPct = Math.max(30, Math.round(100 - (i * 70) / Math.max(n - 1, 1)));
    // Gradient opacity decreases for lower stages
    const opacity = (1 - i * 0.15).toFixed(2);
    return `<div class="d12stage" style="opacity:0;animation:fsu .5s ${delay}s ease forwards;width:${widthPct}%;background:linear-gradient(135deg,color-mix(in srgb,var(--blue) ${Math.round(80 - i * 12)}%,transparent),color-mix(in srgb,var(--blue2) ${Math.round(60 - i * 10)}%,transparent));min-height:${Math.round(280 / n)}px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:13px;font-weight:700;">${esc(stage.label)}</div>
        ${stage.value ? `<div style="font-size:10px;opacity:.7;">${esc(stage.value)}</div>` : ''}
        <div style="font-size:10px;opacity:.55;font-weight:300;">${esc(stage.description)}</div>
      </div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d12content">
    <div class="d12left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="d12right">
      ${stages}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
