import type { RoadmapSlide } from '../../types';

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

export function renderRoadmap(data: RoadmapSlide): string {
  const phases = data.phases.map((phase, i) => {
    const delay = (0.3 + i * 0.15).toFixed(2);
    const phaseItems = phase.items.map(item =>
      `<div class="d10pitem">${esc(item)}</div>`
    ).join('\n          ');

    return `<div class="d10phase" style="opacity:0;animation:fsu .5s ${delay}s ease forwards;">
        <div class="d10plabel">${esc(phase.phase)}</div>
        <div class="d10ptitle">${esc(phase.title)}</div>
        ${phaseItems}
      </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d10content">
    <div class="d10title-area" style="opacity:0;animation:fsd .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="d10phases">
      ${phases}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
