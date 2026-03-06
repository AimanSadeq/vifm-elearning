import type { QuoteSlide } from '../../types';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderProgress(progress: number[]): string {
  return progress.map(v => {
    const cls = v === 2 ? 'pd now' : v === 1 ? 'pd done' : 'pd';
    return `<div class="${cls}"></div>`;
  }).join('');
}

export function renderQuote(data: QuoteSlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="s6content">
    <div class="s6inner">
      <div class="s6mark" style="opacity:0;animation:grow .5s .15s ease forwards;">&ldquo;</div>
      <div class="s6text" style="opacity:0;animation:fsu .6s .3s ease forwards;">${esc(data.quote_text)}</div>
      <div class="s6attr" style="opacity:0;animation:fsu .5s .55s ease forwards;">${esc(data.attribution)}</div>
      ${data.attribution_role ? `<div class="s6role" style="opacity:0;animation:fsu .5s .65s ease forwards;">${esc(data.attribution_role)}</div>` : ''}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
