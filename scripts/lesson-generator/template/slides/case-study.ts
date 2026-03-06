import type { CaseStudySlide } from '../../types';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function accentCompany(company: string, accent?: string): string {
  if (!accent) return esc(company);
  const escaped = esc(company);
  const escapedAccent = esc(accent);
  return escaped.replace(escapedAccent, `<span class="acc">${escapedAccent}</span>`);
}

function renderProgress(progress: number[]): string {
  return progress.map(v => {
    const cls = v === 2 ? 'pd now' : v === 1 ? 'pd done' : 'pd';
    return `<div class="${cls}"></div>`;
  }).join('');
}

export function renderCaseStudy(data: CaseStudySlide): string {
  const results = data.results.map((r, i) => {
    const delay = (0.45 + i * 0.12).toFixed(2);
    return `<div class="s7ri" style="opacity:0;animation:fsl .5s ${delay}s ease forwards;">
      <div class="s7rval">${esc(r.value)}</div>
      <div class="s7rtxt">${esc(r.description)}</div>
    </div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="s7label" style="opacity:0;animation:fsd .5s .1s ease forwards;">Case Study &middot; Real-World Application</div>
  <div class="s7content">
    <div class="s7left" style="opacity:0;animation:fsr .6s .2s ease forwards;">
      <div class="s7title">${accentCompany(data.company, data.company_accent)}</div>
      <div class="s7ctx">
        <div class="s7ctxlabel">Background</div>
        <div class="s7ctxtxt">${esc(data.background)}</div>
      </div>
      <div class="s7chal">
        <div class="s7challabel">Challenge</div>
        <div class="s7chaltxt">${esc(data.challenge)}</div>
      </div>
    </div>
    <div class="s7right">
      <div class="s7restitle" style="opacity:0;animation:fsd .5s .35s ease forwards;">Results</div>
      <div class="s7result">
        ${results}
      </div>
      ${data.source ? `<div class="s7source" style="opacity:0;animation:fsu .4s ${(0.45 + data.results.length * 0.12 + 0.15).toFixed(2)}s ease forwards;">${esc(data.source)}</div>` : ''}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
