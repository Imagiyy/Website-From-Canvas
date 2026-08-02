import type { NodesById, CanvasNode, Style, Geometry } from "../types/canvas";

export interface ExportedSiteCode {
  html: string;
  css: string;
}

/** Sanitizes strings for CSS class names and HTML output */
function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Escape HTML entities for text content */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Generates CSS rules for a node's geometry & style */
function generateNodeCSSRules(geom?: Partial<Geometry>, style?: Partial<Style>): string {
  const rules: string[] = [];

  if (geom) {
    if (geom.x !== undefined) rules.push(`  left: ${Math.round(geom.x)}px;`);
    if (geom.y !== undefined) rules.push(`  top: ${Math.round(geom.y)}px;`);
    if (geom.width !== undefined) rules.push(`  width: ${Math.round(geom.width)}px;`);
    if (geom.height !== undefined) rules.push(`  height: ${Math.round(geom.height)}px;`);
    if (geom.rotation !== undefined && geom.rotation !== 0) {
      rules.push(`  transform: rotate(${Math.round(geom.rotation)}deg);`);
    }
  }

  if (style) {
    if (style.fill !== undefined) {
      rules.push(`  background-color: ${style.fill};`);
    }
    if (style.opacity !== undefined) {
      rules.push(`  opacity: ${style.opacity};`);
    }
    if (style.cornerRadius !== undefined && style.cornerRadius > 0) {
      rules.push(`  border-radius: ${style.cornerRadius}px;`);
    }
    if (style.border) {
      rules.push(`  border: ${style.border.width}px ${style.border.style} ${style.border.color};`);
    }
    if (style.shadow) {
      rules.push(
        `  filter: drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color});`
      );
    }
    if (style.typography) {
      const t = style.typography;
      if (t.fontFamily) rules.push(`  font-family: ${t.fontFamily};`);
      if (t.fontSize) rules.push(`  font-size: ${t.fontSize}px;`);
      if (t.fontWeight) rules.push(`  font-weight: ${t.fontWeight};`);
      if (t.color) rules.push(`  color: ${t.color};`);
      if (t.align) rules.push(`  text-align: ${t.align};`);
      if (t.lineHeight) rules.push(`  line-height: ${t.lineHeight};`);
    }
  }

  return rules.join("\n");
}

/** Recursively renders HTML for a node */
function renderNodeHTML(node: CanvasNode, nodes: NodesById, indent: string = "    "): string {
  const nid = safeId(node.id);

  switch (node.type) {
    case "rectangle":
      return `${indent}<div id="node-${nid}" class="canvas-element rect-node"></div>`;

    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      return `${indent}<div id="node-${nid}" class="canvas-element text-node">\n${indent}  <p>${escapeHtml(text)}</p>\n${indent}</div>`;
    }

    case "image": {
      const img = node.content?.kind === "image" ? node.content : null;
      const fit = img?.fit ?? "cover";
      const src = img?.assetUrl ?? "";
      return `${indent}<div id="node-${nid}" class="canvas-element img-node">\n${indent}  <img src="${src}" alt="${escapeHtml(node.name)}" style="object-fit: ${fit};" />\n${indent}</div>`;
    }

    case "line": {
      const strokeColor = node.style.border?.color ?? "#2563EB";
      const strokeWidth = node.style.border?.width ?? 2;
      return `${indent}<div id="node-${nid}" class="canvas-element line-node">\n${indent}  <svg width="100%" height="100%" overflow="visible">\n${indent}    <line x1="0" y1="0" x2="${node.geometry.width}" y2="${node.geometry.height}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
    }

    case "group": {
      const childrenHTML = (node.children ?? [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => n !== undefined)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeHTML(c, nodes, indent + "  "))
        .join("\n");
      return `${indent}<div id="node-${nid}" class="canvas-element group-node">\n${childrenHTML}\n${indent}</div>`;
    }

    case "polygon": {
      const sides = node.style.sides ?? 5;
      const pts: string[] = [];
      const n = Math.max(3, Math.min(30, sides));
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const px = (50 + 50 * Math.cos(angle)).toFixed(1);
        const py = (50 + 50 * Math.sin(angle)).toFixed(1);
        pts.push(`${px}% ${py}%`);
      }
      return `${indent}<div id="node-${nid}" class="canvas-element polygon-node" style="clip-path: polygon(${pts.join(", ")});"></div>`;
    }

    case "circle":
      return `${indent}<div id="node-${nid}" class="canvas-element circle-node" style="border-radius: 50%;"></div>`;

    case "curve": {
      const curvature = node.style.curvature ?? 50;
      const strokeColor = node.style.border?.color ?? node.style.fill ?? "#EC4899";
      const strokeWidth = Math.max(2, node.style.border?.width ?? 4);
      const w = Math.abs(node.geometry.width);
      const h = Math.abs(node.geometry.height);
      const curveDepth = (curvature / 100) * (h / 2);
      const pathD = `M 0,${h / 2} C ${w * 0.25},${h / 2 - curveDepth} ${w * 0.75},${h / 2 + curveDepth} ${w},${h / 2}`;
      return `${indent}<div id="node-${nid}" class="canvas-element curve-node">\n${indent}  <svg width="100%" height="100%" overflow="visible">\n${indent}    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
    }

    case "star": {
      const pointsCount = node.style.starPoints ?? 5;
      const innerRatio = node.style.innerRadius ?? 0.5;
      const pts: string[] = [];
      const total = pointsCount * 2;
      for (let i = 0; i < total; i++) {
        const angle = (i * Math.PI) / pointsCount - Math.PI / 2;
        const isOuter = i % 2 === 0;
        const r = isOuter ? 50 : 50 * innerRatio;
        const px = (50 + r * Math.cos(angle)).toFixed(1);
        const py = (50 + r * Math.sin(angle)).toFixed(1);
        pts.push(`${px}% ${py}%`);
      }
      return `${indent}<div id="node-${nid}" class="canvas-element star-node" style="clip-path: polygon(${pts.join(", ")});"></div>`;
    }

    case "shape3d": {
      const depth = node.style.depth3d ?? 30;
      const mainColor = node.style.fill ?? "#8B5CF6";
      const sideColor = node.style.color3d ?? "#6D28D9";
      return `${indent}<div id="node-${nid}" class="canvas-element shape3d-node" style="box-shadow: ${depth * 0.4}px ${depth * 0.4}px 0px ${sideColor}; background: ${mainColor};"></div>`;
    }
  }
}

/**
 * Compiles a CanvasSite data model into standalone, production-ready HTML5 & CSS3 files
 * with media queries for tablet (768px) and mobile (375px) overrides.
 */
export function generateSiteCode(nodes: NodesById): ExportedSiteCode {
  const topLevelNodes = Object.values(nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.order - b.order);

  // 1. Generate HTML
  const bodyHTML = topLevelNodes.map((n) => renderNodeHTML(n, nodes)).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CanvasSite Published Web App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="canvas-site">
${bodyHTML}
  </div>
</body>
</html>`;

  // 2. Generate CSS
  const cssRules: string[] = [];

  cssRules.push(`/* CanvasSite Exported Stylesheet */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0f0f1a;
  color: #e4e4f0;
  min-height: 100vh;
}

.canvas-site {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

.canvas-element {
  position: absolute;
  box-sizing: border-box;
}

.text-node p {
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
  height: 100%;
}

.img-node img {
  width: 100%;
  height: 100%;
  display: block;
}
`);

  // Base Desktop Styles
  cssRules.push(`/* Base Desktop Styles */`);
  Object.values(nodes).forEach((node) => {
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node.geometry, node.style);
    cssRules.push(`#node-${nid} {\n  z-index: ${node.order};\n${rules}\n}`);
  });

  // Tablet Overrides Media Query (@media (max-width: 768px))
  const tabletRules: string[] = [];
  Object.values(nodes).forEach((node) => {
    const override = node.breakpoints?.tablet;
    if (override && (override.geometry || override.style)) {
      const nid = safeId(node.id);
      const rules = generateNodeCSSRules(override.geometry, override.style);
      tabletRules.push(`#node-${nid} {\n${rules}\n}`);
    }
  });

  if (tabletRules.length > 0) {
    cssRules.push(`\n/* Tablet Overrides (768px) */\n@media (max-width: 768px) {\n${tabletRules.join("\n\n")}\n}`);
  }

  // Mobile Overrides Media Query (@media (max-width: 375px))
  const mobileRules: string[] = [];
  Object.values(nodes).forEach((node) => {
    const override = node.breakpoints?.mobile;
    if (override && (override.geometry || override.style)) {
      const nid = safeId(node.id);
      const rules = generateNodeCSSRules(override.geometry, override.style);
      mobileRules.push(`#node-${nid} {\n${rules}\n}`);
    }
  });

  if (mobileRules.length > 0) {
    cssRules.push(`\n/* Mobile Overrides (375px) */\n@media (max-width: 375px) {\n${mobileRules.join("\n\n")}\n}`);
  }

  return {
    html,
    css: cssRules.join("\n\n"),
  };
}
