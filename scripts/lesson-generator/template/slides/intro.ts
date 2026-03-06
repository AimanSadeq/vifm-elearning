import type { IntroSlide } from '../../types';

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderIntro(data: IntroSlide): string {
  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="sAcontent">
    <div>
      <div style="opacity:0;animation:fsd .6s .1s ease forwards;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--blue);margin-bottom:16px;">${esc(data.course_code)}</div>
      <div style="opacity:0;animation:fsu .7s .25s ease forwards;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:64px;line-height:1.05;text-transform:uppercase;max-width:900px;">${esc(data.course_title)}</div>
      ${data.subtitle ? `<div style="opacity:0;animation:fsu .6s .5s ease forwards;font-size:18px;color:rgba(245,240,232,.5);margin-top:18px;font-weight:300;max-width:600px;margin-left:auto;margin-right:auto;">${esc(data.subtitle)}</div>` : ''}
      ${data.lesson_number ? `<div style="opacity:0;animation:fsu .6s .7s ease forwards;margin-top:28px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue);padding:6px 18px;border:1px solid var(--blue);border-radius:20px;display:inline-block;">${esc(data.lesson_number)}</div>` : ''}
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
