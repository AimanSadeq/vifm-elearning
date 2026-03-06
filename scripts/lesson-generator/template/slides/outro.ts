import type { OutroSlide } from '../../types';
import { renderIcon } from '../icons';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderOutro(data: OutroSlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="sAcontent">
    <div>
      <div style="opacity:0;animation:grow .6s .1s ease forwards;margin-bottom:16px;">${renderIcon('🏆', 'icon-xl')}</div>
      <div style="opacity:0;animation:fsu .6s .3s ease forwards;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:56px;text-transform:uppercase;color:var(--blue);">Module Complete</div>
      <div style="opacity:0;animation:fsu .6s .5s ease forwards;font-size:24px;color:rgba(245,240,232,.6);margin-top:8px;font-weight:300;">Well Done!</div>
      ${data.next_lesson_title ? `<div style="opacity:0;animation:fsu .6s .75s ease forwards;margin-top:32px;padding:12px 24px;background:var(--card);border:1px solid rgba(245,240,232,.08);border-radius:10px;display:inline-block;">
        <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);margin-bottom:4px;">Next Up</div>
        <div style="font-size:16px;font-weight:600;">${esc(data.next_lesson_title)}</div>
      </div>` : ''}
      <div style="opacity:0;animation:fsu .6s 1s ease forwards;margin-top:40px;display:flex;gap:32px;justify-content:center;font-size:11px;color:rgba(245,240,232,.35);font-weight:300;">
        <span>vfriq.edu.sa</span>
        <span>info@vfriq.edu.sa</span>
        <span>+966 11 000 0000</span>
      </div>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
