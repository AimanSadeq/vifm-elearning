import type { DoDontSlide } from '../../types';

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

export function renderDoDont(data: DoDontSlide): string {
  const doItems = data.dos.map((d, i) => {
    const delay = (0.4 + i * 0.1).toFixed(2);
    return `<div class="sEitem sEitem-do" style="opacity:0;animation:fsu .4s ${delay}s ease forwards;">${esc(d.text)}</div>`;
  }).join('\n          ');

  const dontItems = data.donts.map((d, i) => {
    const delay = (0.5 + i * 0.1).toFixed(2);
    return `<div class="sEitem sEitem-dont" style="opacity:0;animation:fsu .4s ${delay}s ease forwards;">${esc(d.text)}</div>`;
  }).join('\n          ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sEcontent">
    <div class="sEleft" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="sEcols">
      <div class="sEcol">
        <div class="sEheader sEdo-header" style="opacity:0;animation:fsd .4s .25s ease forwards;">Do</div>
          ${doItems}
      </div>
      <div class="sEcol">
        <div class="sEheader sEdont-header" style="opacity:0;animation:fsd .4s .35s ease forwards;">Don&rsquo;t</div>
          ${dontItems}
      </div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
