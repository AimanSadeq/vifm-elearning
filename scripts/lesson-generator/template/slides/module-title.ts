import type { ModuleTitleSlide } from '../../types';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderModuleTitle(data: ModuleTitleSlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
  </div>
  <div class="sAcontent">
    <div>
      <div style="opacity:0;animation:fsd .6s .1s ease forwards;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--blue);margin-bottom:12px;">Module ${esc(data.module_number)}</div>
      <div style="opacity:0;animation:fsu .7s .25s ease forwards;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:52px;line-height:1.05;text-transform:uppercase;max-width:900px;">${esc(data.module_title)}</div>
      <div style="opacity:0;animation:fsu .6s .5s ease forwards;font-size:18px;color:rgba(245,240,232,.5);margin-top:18px;font-weight:300;max-width:600px;margin-left:auto;margin-right:auto;">${esc(data.topic_title)}</div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
