import type { BigStatementSlide } from '../../types';

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

export function renderBigStatement(data: BigStatementSlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sAcontent">
    ${data.label ? `<div class="sAlabel" style="opacity:0;animation:fsd .5s .15s ease forwards;">${esc(data.label)}</div>` : ''}
    <div class="sAtext" style="opacity:0;animation:grow .7s .3s ease forwards;">${accentTitle(data.statement, data.statement_accent)}</div>
    ${data.sub_text ? `<div class="sAsub" style="opacity:0;animation:fsu .5s .6s ease forwards;">${esc(data.sub_text)}</div>` : ''}
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
