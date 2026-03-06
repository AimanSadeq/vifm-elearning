import PptxGenJS from 'pptxgenjs';
import type { FlowchartSlide, HubSpokeSlide, Matrix2x2Slide } from '../../types';
import type { PptxColors } from '../theme';
import { CONTENT_COL, FONTS, MARGIN, SLIDE } from '../theme';
import { addTitle, addContentChrome, addCard } from '../helpers';

// ── Flowchart ────────────────────────────────────────────────────────
export function renderFlowchart(slide: PptxGenJS.Slide, pres: PptxGenJS, data: FlowchartSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  // Adaptive vertical flowchart layout
  const nodeW = 2.5;
  const startX = CONTENT_COL.X + (CONTENT_COL.W - nodeW) / 2;
  const startY = 0.65;
  const maxContentH = 4.15; // available vertical space (0.65 → ~4.8)
  const n = data.nodes.length;

  // Scale nodeH and vGap to fit all nodes
  let nodeH = 0.45;
  let vGap = 0.25;
  const totalNeeded = n * nodeH + (n - 1) * vGap;
  if (totalNeeded > maxContentH) {
    vGap = 0.08;
    nodeH = Math.max((maxContentH - (n - 1) * vGap) / n, 0.32);
  }

  // Position nodes vertically
  const positions: Map<string, { x: number; y: number }> = new Map();
  data.nodes.forEach((node, i) => {
    const y = startY + i * (nodeH + vGap);
    positions.set(node.id, { x: startX, y });
  });

  // Draw edges (lines between nodes) — use absolute dimensions (negative corrupts PPTX for COM)
  data.edges.forEach((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return;

    const lineX = from.x + nodeW / 2;
    const goingDown = to.y >= from.y;
    const y1 = goingDown ? from.y + nodeH : from.y;
    const y2 = goingDown ? to.y : to.y + nodeH;
    const lineH = Math.abs(y2 - y1);

    slide.addShape(pres.shapes.LINE, {
      x: lineX,
      y: Math.min(y1, y2),
      w: 0,
      h: lineH,
      line: { color: colors.gray, width: 1.5 },
    });

    // Edge label
    if (edge.label) {
      const midY = (y1 + y2) / 2;
      slide.addText(edge.label, {
        x: lineX + 0.15, y: midY - 0.1, w: 1.2, h: 0.2,
        fontSize: 7, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
      });
    }
  });

  // Draw nodes
  data.nodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const isDecision = node.type === 'decision';
    const isStartEnd = node.type === 'start' || node.type === 'end';

    if (isDecision) {
      // Diamond shape (rotated rectangle approximation - use oval for simplicity)
      slide.addShape(pres.shapes.OVAL, {
        x: pos.x + 0.2, y: pos.y, w: nodeW - 0.4, h: nodeH,
        fill: { color: colors.dark },
        line: { color: colors.blue, width: 1 },
      });
    } else {
      const shape = isStartEnd ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE;
      slide.addShape(shape, {
        x: pos.x, y: pos.y, w: nodeW, h: nodeH,
        fill: { color: isStartEnd ? colors.blue : colors.dark },
        line: { color: colors.blue, width: 1 },
        rectRadius: isStartEnd ? 0.15 : undefined,
      });
    }

    // Node label
    const nodeFontSize = nodeH < 0.4 ? 8 : 9;
    slide.addText(node.label, {
      x: pos.x, y: pos.y, w: nodeW, h: nodeH,
      fontSize: nodeFontSize, fontFace: FONTS.BODY,
      color: colors.white,
      bold: isStartEnd, align: 'center', valign: 'middle', margin: 0,
    });
  });
}

// ── Hub & Spoke ──────────────────────────────────────────────────────
export function renderHubSpoke(slide: PptxGenJS.Slide, pres: PptxGenJS, data: HubSpokeSlide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  if (data.description) {
    slide.addText(data.description, {
      x: MARGIN.LEFT, y: 2.2, w: 2.8, h: 1.0,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
    });
  }

  const centerX = CONTENT_COL.X + CONTENT_COL.W / 2;
  const centerY = 2.7;
  const hubR = 0.6;
  const orbitR = 1.65;
  const spokeR = 0.48;
  const spokeCount = data.spokes.length;

  // Hub circle
  slide.addShape(pres.shapes.OVAL, {
    x: centerX - hubR, y: centerY - hubR, w: hubR * 2, h: hubR * 2,
    fill: { color: colors.blue },
  });

  const hubText: PptxGenJS.TextProps[] = [
    { text: data.hub.title, options: { fontSize: 11, fontFace: FONTS.TITLE, color: colors.white, bold: true, breakLine: true, align: 'center' as const } },
  ];
  if (data.hub.subtitle) {
    hubText.push({ text: data.hub.subtitle, options: { fontSize: 7, fontFace: FONTS.BODY, color: colors.white, align: 'center' as const } });
  }
  slide.addText(hubText, {
    x: centerX - hubR, y: centerY - hubR, w: hubR * 2, h: hubR * 2,
    align: 'center', valign: 'middle', margin: 0, autoFit: true,
  });

  // Spoke circles
  data.spokes.forEach((spoke, i) => {
    const angle = (2 * Math.PI * i / spokeCount) - Math.PI / 2;
    const sx = centerX + orbitR * Math.cos(angle);
    const sy = centerY + orbitR * Math.sin(angle);

    // Connecting line — use thin rotated rectangle (LINE shapes can't flip direction without flipH/flipV which corrupts COM)
    const lineLen = orbitR - hubR - spokeR;
    const startX2 = centerX + hubR * Math.cos(angle);
    const startY2 = centerY + hubR * Math.sin(angle);
    const endX2 = startX2 + lineLen * Math.cos(angle);
    const endY2 = startY2 + lineLen * Math.sin(angle);
    const midX = (startX2 + endX2) / 2;
    const midY = (startY2 + endY2) / 2;
    const thickness = 0.015;
    const angleDeg = (angle * 180) / Math.PI;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: midX - lineLen / 2,
      y: midY - thickness / 2,
      w: lineLen,
      h: thickness,
      rotate: angleDeg,
      fill: { color: colors.gray },
      line: { width: 0 },
    });

    // Spoke circle
    slide.addShape(pres.shapes.OVAL, {
      x: sx - spokeR, y: sy - spokeR, w: spokeR * 2, h: spokeR * 2,
      fill: { color: colors.card },
      line: { color: colors.blue, width: 0.75 },
    });

    const spokeText: PptxGenJS.TextProps[] = [
      { text: spoke.title, options: { fontSize: 8, fontFace: FONTS.TITLE, color: colors.white, bold: true, breakLine: !!spoke.subtitle, align: 'center' as const } },
    ];
    if (spoke.subtitle) {
      spokeText.push({ text: spoke.subtitle, options: { fontSize: 6, fontFace: FONTS.BODY, color: colors.gray, align: 'center' as const } });
    }
    slide.addText(spokeText, {
      x: sx - spokeR, y: sy - spokeR, w: spokeR * 2, h: spokeR * 2,
      align: 'center', valign: 'middle', margin: 0, autoFit: true,
    });
  });

  // Detail points below diagram
  if (data.detail_points && data.detail_points.length > 0) {
    const detailItems: PptxGenJS.TextProps[] = data.detail_points.map((pt, i) => ({
      text: pt,
      options: { bullet: true, breakLine: i < data.detail_points!.length - 1, fontSize: 8, fontFace: FONTS.BODY, color: colors.gray },
    }));
    slide.addText(detailItems, {
      x: MARGIN.LEFT, y: 3.5, w: 2.8, h: 1.5,
      valign: 'top', margin: 0,
    });
  }
}

// ── Matrix 2x2 ───────────────────────────────────────────────────────
export function renderMatrix2x2(slide: PptxGenJS.Slide, pres: PptxGenJS, data: Matrix2x2Slide, colors: PptxColors): void {
  addContentChrome(slide, pres, data, colors);
  addTitle(slide, { label: data.label, title: data.title, accent: data.title_accent }, colors);

  if (data.description) {
    slide.addText(data.description, {
      x: MARGIN.LEFT, y: 2.2, w: 2.8, h: 1.0,
      fontSize: 9, fontFace: FONTS.BODY, color: colors.gray, margin: 0,
    });
  }

  // 2x2 grid
  const gridX = CONTENT_COL.X;
  const gridY = 0.7;
  const cellW = (CONTENT_COL.W - 0.1) / 2;
  const cellH = 2.0;
  const gap = 0.1;

  data.quadrants.forEach((quad, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);

    addCard(slide, x, y, cellW, cellH, colors);

    // Quadrant label
    slide.addText(quad.label, {
      x: x + 0.15, y: y + 0.1, w: cellW - 0.3, h: 0.32,
      fontSize: 13, fontFace: FONTS.TITLE, color: quad.highlight ? colors.blue : colors.white,
      bold: true, margin: 0,
    });

    // Items as bullets
    if (quad.items.length > 0) {
      const items: PptxGenJS.TextProps[] = quad.items.map((item, j) => ({
        text: item,
        options: { bullet: true, breakLine: j < quad.items.length - 1, fontSize: 10, fontFace: FONTS.BODY, color: colors.gray },
      }));
      slide.addText(items, {
        x: x + 0.15, y: y + 0.44, w: cellW - 0.3, h: cellH - 0.54,
        valign: 'top', margin: 0, autoFit: true,
      });
    }
  });

  // Axis labels
  slide.addText(data.y_axis, {
    x: gridX, y: gridY + 2 * cellH + gap + 0.05, w: cellW, h: 0.2,
    fontSize: 7, fontFace: FONTS.BODY, color: colors.gray, charSpacing: 1, margin: 0,
  });
  slide.addText(data.x_axis, {
    x: gridX + cellW + gap, y: gridY + 2 * cellH + gap + 0.05, w: cellW, h: 0.2,
    fontSize: 7, fontFace: FONTS.BODY, color: colors.gray, charSpacing: 1,
    align: 'right', margin: 0,
  });
}
