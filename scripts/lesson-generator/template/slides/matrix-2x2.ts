import type { Matrix2x2Slide } from '../../types';

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

export function renderMatrix2x2(data: Matrix2x2Slide): string {
  // Render the 4 quadrants (top-left, top-right, bottom-left, bottom-right)
  const cells = data.quadrants.map((q, i) => {
    const delay = (0.3 + i * 0.12).toFixed(2);
    const highlightClass = q.highlight ? ' d16cell-highlight' : '';
    const items = q.items.map(item =>
      `<div class="d16item">${esc(item)}</div>`
    ).join('\n          ');

    return `<div class="d16cell${highlightClass}" style="opacity:0;animation:grow .4s ${delay}s ease forwards;">
        <div class="d16clabel">${esc(q.label)}</div>
        <div class="d16items">
          ${items}
        </div>
      </div>`;
  }).join('\n      ');

  // Legend items
  const legendArr = Array.isArray(data.legend) ? data.legend : [];
  const legendHtml = legendArr.map((item, i) => {
    const delay = (0.6 + i * 0.1).toFixed(2);
    return `<div class="mxlegend" style="opacity:0;animation:fsu .4s ${delay}s ease forwards;">
      <div class="mxldot" style="background:${esc(item.color_key)};"></div>
      <div>
        <div class="mxltitle">${esc(item.title)}</div>
        <div class="mxlsub">${esc(item.description)}</div>
      </div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d16content">
    <div class="d16left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
      ${data.description ? `<div style="font-size:16px;color:rgba(245,240,232,.55);line-height:1.6;font-weight:300;margin-top:6px;">${esc(data.description)}</div>` : ''}
      ${legendHtml ? `<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">${legendHtml}</div>` : ''}
    </div>
    <div class="d16right">
      <div class="d16grid">
        ${cells}
      </div>
      <div class="d16axes" style="opacity:0;animation:fsu .4s .7s ease forwards;">
        <div class="d16axis">${esc(data.y_axis)}</div>
        <div class="d16axis">${esc(data.x_axis)}</div>
      </div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
