import type { DeepDiveSlide } from '../../types';

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

export function renderDeepDive(data: DeepDiveSlide): string {
  const sections = data.sections.map((sec, i) => {
    const delay = (0.3 + i * 0.15).toFixed(2);
    return `<div class="s8section" style="opacity:0;animation:fsl .5s ${delay}s ease forwards;">
      <div class="s8stitle">${esc(sec.title)}</div>
      <div class="s8stext">${esc(sec.content)}</div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="s8content">
    <div class="s8left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
      ${data.subtitle ? `<div style="font-size:14px;color:rgba(245,240,232,.5);margin-top:4px;font-weight:300;">${esc(data.subtitle)}</div>` : ''}
    </div>
    <div class="s8right">
      ${sections}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
