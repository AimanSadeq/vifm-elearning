import type { ComparisonSlide } from '../../types';

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

export function renderComparison(data: ComparisonSlide): string {
  const rows = data.rows.map((row, i) => {
    const delay = (0.35 + i * 0.1).toFixed(2);
    return `<div class="s3row" style="opacity:0;animation:fsu .5s ${delay}s ease forwards;">
      <div class="s3aspect">${esc(row.aspect)}</div>
      <div class="s3cell">${esc(row.left)}</div>
      <div class="s3cell">${esc(row.right)}</div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="s3content">
    <div class="s3left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="s3right">
      <div class="s3header" style="opacity:0;animation:fsd .5s .2s ease forwards;">
        <div></div>
        <div>${esc(data.left_label)}</div>
        <div>${esc(data.right_label)}</div>
      </div>
      ${rows}
      ${data.verdict ? `<div class="s3verdict" style="opacity:0;animation:fsu .5s ${(0.35 + data.rows.length * 0.1 + 0.15).toFixed(2)}s ease forwards;">${esc(data.verdict)}</div>` : ''}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
