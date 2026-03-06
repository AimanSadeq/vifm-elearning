import type { TwoColumnSlide } from '../../types';

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

export function renderTwoColumn(data: TwoColumnSlide): string {
  const leftItems = data.left_items.map((item, i) => {
    const delay = (0.35 + i * 0.1).toFixed(2);
    return `<div class="sCitem" style="opacity:0;animation:fsu .4s ${delay}s ease forwards;">${esc(item)}</div>`;
  }).join('\n        ');

  const rightItems = data.right_items.map((item, i) => {
    const delay = (0.45 + i * 0.1).toFixed(2);
    return `<div class="sCitem" style="opacity:0;animation:fsu .4s ${delay}s ease forwards;">${esc(item)}</div>`;
  }).join('\n        ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sCcontent">
    <div class="sCleft-info" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="sCcols">
      <div class="sCcol">
        <div class="sCcoltitle" style="opacity:0;animation:fsd .4s .25s ease forwards;">${esc(data.left_title)}</div>
        ${leftItems}
      </div>
      <div class="sCcol">
        <div class="sCcoltitle" style="opacity:0;animation:fsd .4s .35s ease forwards;">${esc(data.right_title)}</div>
        ${rightItems}
      </div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
