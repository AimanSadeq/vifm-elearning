import type { CircularSlide } from '../../types';

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

export function renderCircular(data: CircularSlide): string {
  const cx = 200;
  const cy = 200;
  const outerR = 140;
  const nodeR = 30;
  const centerR = 52;
  const n = data.steps.length;

  // Build SVG circles + connecting arcs
  const nodes: string[] = [];
  const lines: string[] = [];

  for (let i = 0; i < n; i++) {
    const angle = ((2 * Math.PI) / n) * i - Math.PI / 2; // start from top
    const x = cx + outerR * Math.cos(angle);
    const y = cy + outerR * Math.sin(angle);
    const delay = (0.4 + i * 0.12).toFixed(2);

    // Line from center to node
    lines.push(
      `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--blue)" stroke-width="1.5" stroke-opacity="0.25" />`
    );

    // Arrow arc from this node to next (small curved arrow between nodes)
    if (n > 1) {
      const nextAngle = ((2 * Math.PI) / n) * ((i + 1) % n) - Math.PI / 2;
      const midAngle = (angle + nextAngle + (nextAngle <= angle ? 2 * Math.PI : 0)) / 2;
      const arcR = outerR + 18;
      const ax1 = cx + (outerR + 6) * Math.cos(angle + 0.15);
      const ay1 = cy + (outerR + 6) * Math.sin(angle + 0.15);
      const ax2 = cx + (outerR + 6) * Math.cos(nextAngle - 0.15);
      const ay2 = cy + (outerR + 6) * Math.sin(nextAngle - 0.15);
      lines.push(
        `<path d="M ${ax1.toFixed(1)} ${ay1.toFixed(1)} A ${arcR.toFixed(0)} ${arcR.toFixed(0)} 0 0 1 ${ax2.toFixed(1)} ${ay2.toFixed(1)}" fill="none" stroke="var(--blue)" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4 3" />`
      );
    }

    // Outer node circle + label
    // Split title into lines if needed (max ~12 chars per line)
    const title = esc(data.steps[i].title);
    const words = title.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if (line1.length + w.length < 13 && !line2) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }

    const textY = line2 ? y - 4 : y + 1;

    nodes.push(
      `<g style="opacity:0;animation:grow .4s ${delay}s ease forwards;">
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nodeR}" fill="var(--card)" stroke="var(--blue)" stroke-width="1.5" />
        <text x="${x.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="8" font-weight="600" font-family="Barlow,sans-serif">${line1}</text>
        ${line2 ? `<text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="8" font-weight="600" font-family="Barlow,sans-serif">${line2}</text>` : ''}
      </g>`
    );
  }

  // Center circle with step number
  const centerLabel = esc(data.center_label);
  const centerWords = centerLabel.split(' ');
  let cLine1 = '';
  let cLine2 = '';
  for (const w of centerWords) {
    if (cLine1.length + w.length < 12 && !cLine2) {
      cLine1 += (cLine1 ? ' ' : '') + w;
    } else {
      cLine2 += (cLine2 ? ' ' : '') + w;
    }
  }

  const centerSvg = `<g style="opacity:0;animation:grow .5s .2s ease forwards;">
    <circle cx="${cx}" cy="${cy}" r="${centerR}" fill="var(--blue)" opacity="0.15" />
    <circle cx="${cx}" cy="${cy}" r="${centerR - 4}" fill="none" stroke="var(--blue)" stroke-width="2" />
    <text x="${cx}" y="${cLine2 ? cy - 5 : cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--blue)" font-size="11" font-weight="700" font-family="Barlow Condensed,sans-serif" text-transform="uppercase">${cLine1}</text>
    ${cLine2 ? `<text x="${cx}" y="${cy + 10}" text-anchor="middle" dominant-baseline="middle" fill="var(--blue)" font-size="11" font-weight="700" font-family="Barlow Condensed,sans-serif">${cLine2}</text>` : ''}
  </g>`;

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d11content">
    <div class="d11left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="d11right">
      <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        ${lines.join('\n        ')}
        ${centerSvg}
        ${nodes.join('\n        ')}
      </svg>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
