import type { FlowchartSlide } from '../../types';

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

export function renderFlowchart(data: FlowchartSlide): string {
  const n = data.nodes.length;
  const nodeWidth = 240;
  const nodeHeight = 40;
  const vGap = 22;
  const svgW = 560;
  const startY = 20;
  const centerX = svgW / 2;

  // Build node position map (simple vertical stack layout)
  const nodePositions: Record<string, { x: number; y: number }> = {};
  data.nodes.forEach((node, i) => {
    nodePositions[node.id] = {
      x: centerX,
      y: startY + i * (nodeHeight + vGap) + nodeHeight / 2,
    };
  });

  const svgH = Math.max(200, startY + n * (nodeHeight + vGap) + 10);

  // Draw edges (arrows between nodes)
  const edgesSvg = data.edges.map((edge, i) => {
    const from = nodePositions[edge.from];
    const to = nodePositions[edge.to];
    if (!from || !to) return '';

    const fromY = from.y + nodeHeight / 2 + 2;
    const toY = to.y - nodeHeight / 2 - 2;
    const midY = (fromY + toY) / 2;
    const delay = (0.2 + i * 0.08).toFixed(2);

    // Determine if this is a straight line or a curved path (for non-adjacent nodes)
    const isStraight = Math.abs(from.x - to.x) < 10;

    let pathD: string;
    if (isStraight) {
      pathD = `M ${from.x} ${fromY} L ${to.x} ${toY}`;
    } else {
      pathD = `M ${from.x} ${fromY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${toY}`;
    }

    return `<g style="opacity:0;animation:fadeIn .4s ${delay}s ease forwards;">
      <path d="${pathD}" fill="none" stroke="var(--blue)" stroke-width="1.5" stroke-opacity="0.5" marker-end="url(#arrowhead)" />
      ${edge.label ? `<text x="${((from.x + to.x) / 2 + 10).toFixed(0)}" y="${midY.toFixed(0)}" fill="var(--blue)" font-size="11" font-family="Barlow,sans-serif" opacity="0.7">${esc(edge.label)}</text>` : ''}
    </g>`;
  }).join('\n      ');

  // Draw nodes
  const nodesSvg = data.nodes.map((node, i) => {
    const pos = nodePositions[node.id];
    const delay = (0.3 + i * 0.12).toFixed(2);
    const x = pos.x;
    const y = pos.y;

    let shape: string;
    const hw = nodeWidth / 2;
    const hh = nodeHeight / 2;

    switch (node.type) {
      case 'start':
      case 'end':
        shape = `<rect x="${x - hw}" y="${y - hh}" width="${nodeWidth}" height="${nodeHeight}" rx="${nodeHeight / 2}" fill="var(--blue)" stroke="none" />
          <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" fill="var(--bg)" font-size="13" font-weight="700" font-family="Barlow,sans-serif">${esc(node.label)}</text>`;
        break;
      case 'decision':
        // Diamond shape approximated with a rotated rect/polygon
        const dw = hw + 14;
        const dh = hh + 8;
        shape = `<polygon points="${x},${y - dh} ${x + dw},${y} ${x},${y + dh} ${x - dw},${y}" fill="var(--card)" stroke="var(--blue)" stroke-width="1.5" />
          <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="12" font-weight="600" font-family="Barlow,sans-serif">${esc(node.label)}</text>`;
        break;
      case 'process':
      default:
        shape = `<rect x="${x - hw}" y="${y - hh}" width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="var(--card)" stroke="rgba(245,240,232,0.08)" stroke-width="1" />
          <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" fill="var(--white)" font-size="13" font-weight="500" font-family="Barlow,sans-serif">${esc(node.label)}</text>`;
        break;
    }

    return `<g style="opacity:0;animation:grow .4s ${delay}s ease forwards;">
        ${shape}
      </g>`;
  }).join('\n      ');

  return `<div class="slide">
  <div class="bg"></div><div class="grid"></div>
  <div class="topbar">
    <div class="crumb">${esc(data.breadcrumb).replace(/›/g, '<span>›</span>')}</div>
    <div class="prog">${renderProgress(data.progress)}</div>
  </div>
  <div class="d14content">
    <div class="d14left" style="opacity:0;animation:fsr .6s .15s ease forwards;">
      ${data.label ? `<div class="s1label">${esc(data.label)}</div>` : ''}
      <div class="s1title">${accentTitle(data.title, data.title_accent)}</div>
    </div>
    <div class="d14right">
      <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--blue)" opacity="0.6" />
          </marker>
        </defs>
        ${edgesSvg}
        ${nodesSvg}
      </svg>
    </div>
  </div>
  <div class="logo"><div class="lbox">VIFM</div></div>
  <div class="bbar"></div>
</div>`;
}
