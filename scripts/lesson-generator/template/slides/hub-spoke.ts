import type { HubSpokeSlide } from '../../types';

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

export function renderHubSpoke(data: HubSpokeSlide): string {
  const cx = 240;
  const cy = 240;
  const hubR = 64;
  const spokeR = 44;
  const orbitR = 170;
  const n = data.spokes.length;

  // Hub center
  const hubTitle = esc(data.hub.title);
  const hubSubtitle = data.hub.subtitle ? esc(data.hub.subtitle) : '';

  const hubSvg = `<g style="opacity:0;animation:grow .5s .2s ease forwards;">
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="var(--blue)" opacity="0.18" />
    <circle cx="${cx}" cy="${cy}" r="${hubR - 3}" fill="none" stroke="var(--blue)" stroke-width="2.5" />
    <text x="${cx}" y="${hubSubtitle ? cy - 7 : cy + 1}" text-anchor="middle" dominant-baseline="middle" fill="var(--blue)" font-size="15" font-weight="700" font-family="Barlow Condensed,sans-serif" letter-spacing="0.05em">${hubTitle}</text>
    ${hubSubtitle ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" dominant-baseline="middle" fill="var(--blue)" font-size="11" font-weight="400" font-family="Barlow,sans-serif" opacity="0.7">${hubSubtitle}</text>` : ''}
  </g>`;

  // Spokes
  const spokesSvg = data.spokes.map((spoke, i) => {
    const angle = ((2 * Math.PI) / n) * i - Math.PI / 2;
    const x = cx + orbitR * Math.cos(angle);
    const y = cy + orbitR * Math.sin(angle);
    const delay = (0.4 + i * 0.1).toFixed(2);

    const spokeTitle = esc(spoke.title);
    const spokeSubtitle = spoke.subtitle ? esc(spoke.subtitle) : '';

    // Split title if long
    const words = spokeTitle.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if (line1.length + w.length < 13 && !line2) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }

    const textY = line2 ? y - 6 : (spokeSubtitle ? y - 4 : y + 1);

    return `<g style="opacity:0;animation:grow .4s ${delay}s ease forwards;">
      <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--blue)" stroke-width="1.5" stroke-opacity="0.2" />
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${spokeR}" fill="var(--card)" stroke="var(--blue)" stroke-width="1.5" stroke-opacity="0.5" />
      <text x="${x.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="11" font-weight="600" font-family="Barlow,sans-serif">${line1}</text>
      ${line2 ? `<text x="${x.toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="11" font-weight="600" font-family="Barlow,sans-serif">${line2}</text>` : ''}
      ${spokeSubtitle ? `<text x="${x.toFixed(1)}" y="${(line2 ? y + 21 : y + 13).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="rgba(245,240,232,0.5)" font-size="9" font-weight="400" font-family="Barlow,sans-serif">${spokeSubtitle}</text>` : ''}
    </g>`;
  }).join('\n      ');

  // Detail points on the left
  const detailPointsHtml = (data.detail_points || []).map((pt, i) => {
    const delay = (0.5 + i * 0.1).toFixed(2);
    return `<div style="font-size:14px;color:rgba(245,240,232,.6);padding:8px 14px;background:var(--card);border-radius:6px;border-left:2px solid var(--blue);opacity:0;animation:fsr .4s ${delay}s ease forwards;line-height:1.5;">${esc(pt)}</div>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d15content">
    <div class="d15left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
      ${data.description ? `<div style="font-size:16px;color:rgba(245,240,232,.55);line-height:1.6;font-weight:300;margin-top:6px;">${esc(data.description)}</div>` : ''}
      ${detailPointsHtml ? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">${detailPointsHtml}</div>` : ''}
    </div>
    <div class="d15right">
      <svg viewBox="0 0 480 480" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        ${hubSvg}
        ${spokesSvg}
      </svg>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
