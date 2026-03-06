import type { NumberedListSlide } from '../../types';

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

export function renderNumberedList(data: NumberedListSlide): string {
  const items = data.items.map((item, i) => {
    const delay = (0.3 + i * 0.12).toFixed(2);
    const num = String(i + 1).padStart(2, '0');
    return `<div class="sBitem" style="opacity:0;animation:fsl .5s ${delay}s ease forwards;">
      <div class="sBnum">${num}</div>
      <div>
        <div class="sBtext">${esc(item.text)}</div>
        ${item.detail ? `<div class="sBdetail">${esc(item.detail)}</div>` : ''}
      </div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sBcontent">
    <div class="sBleft" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="sBright">
      ${items}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
