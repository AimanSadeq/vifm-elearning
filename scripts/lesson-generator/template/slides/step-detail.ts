import type { StepDetailSlide } from '../../types';

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

export function renderStepDetail(data: StepDetailSlide): string {
  const subSteps = (data.sub_steps || []).map((s, i) => {
    const delay = (0.55 + i * 0.1).toFixed(2);
    return `<div class="sGsub" style="opacity:0;animation:fsl .4s ${delay}s ease forwards;">&bull; ${esc(s)}</div>`;
  }).join('\n        ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="sGcontent">
    <div class="sGleft" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="sGright">
      <div class="sGstep-num" style="opacity:0;animation:fsd .5s .2s ease forwards;">${esc(data.step_number)}</div>
      <div class="sGstep-title" style="opacity:0;animation:fsl .5s .3s ease forwards;">${esc(data.step_title)}</div>
      <div class="sGdesc" style="opacity:0;animation:fsu .5s .4s ease forwards;">${esc(data.description)}</div>
      ${subSteps ? `<div class="sGsubs">
        ${subSteps}
      </div>` : ''}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
