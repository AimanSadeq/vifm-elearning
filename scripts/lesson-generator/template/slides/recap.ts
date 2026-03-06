import type { RecapSlide } from '../../types';
import { renderIcon } from '../icons';

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

export function renderRecap(data: RecapSlide): string {
  const points = data.points.map((p, i) => {
    const delay = (0.3 + i * 0.12).toFixed(2);
    return `<div class="sFpoint" style="opacity:0;animation:fsl .5s ${delay}s ease forwards;">
      <div class="sFicon">${p.icon ? renderIcon(p.icon, 'icon-md') : '<i data-lucide="circle-check" class="icon-md"></i>'}</div>
      <div class="sFtext">${esc(p.text)}</div>
    </div>`;
  }).join('\n      ');

  const displayTitle = data.title || 'Key Takeaways';

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sFcontent">
    <div class="sFleft" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      <div class="s1label">Recap</div>
      <div class="s1title">${esc(displayTitle)}</div>
    </div>
    <div class="sFright">
      ${points}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
