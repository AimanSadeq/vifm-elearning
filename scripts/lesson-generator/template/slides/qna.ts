import type { QnASlide } from '../../types';

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

export function renderQnA(data: QnASlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sHcontent">
    <div class="sHinner">
      ${data.label ? `<div class="s1label" style="opacity:0;animation:fsd .4s .15s ease forwards;margin-bottom:16px;">${esc(data.label)}</div>` : ''}
      <div class="sHq" style="opacity:0;animation:fsr .6s .25s ease forwards;">${esc(data.question)}</div>
      <div class="sHa" style="opacity:0;animation:fsu .6s .5s ease forwards;">${esc(data.answer)}</div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
