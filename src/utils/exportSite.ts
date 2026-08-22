import type { NodesById, CanvasNode, Style, Geometry } from "../types/canvas";
import { getEffectiveNode } from "./breakpoint";
import { getPolygonPoints } from "../components/nodes/PolygonNode";
import { getStarPoints } from "../components/nodes/StarNode";
import { getPolygonVertices } from "../components/nodes/Shape3DNode";

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
function generateNodeCSSRules(node: CanvasNode, nodes: NodesById, geom?: Partial<Geometry>, style?: Partial<Style>, nodeType?: string): string {
  const rules: string[] = [];

  let effectiveGeom = geom;
  if (node.parentId && nodes[node.parentId] && geom) {
    const parentGeom = nodes[node.parentId].geometry;
    effectiveGeom = {
      ...geom,
      x: (geom.x ?? 0) - parentGeom.x,
      y: (geom.y ?? 0) - parentGeom.y,
    };
  }

  if (effectiveGeom) {
    if (effectiveGeom.x !== undefined) rules.push(`  left: ${Math.round(effectiveGeom.x)}px;`);
    if (effectiveGeom.y !== undefined) rules.push(`  top: ${Math.round(effectiveGeom.y)}px;`);
    if (effectiveGeom.width !== undefined) rules.push(`  width: ${Math.round(effectiveGeom.width)}px;`);
    if (effectiveGeom.height !== undefined) rules.push(`  height: ${Math.round(effectiveGeom.height)}px;`);
    if (effectiveGeom.rotation !== undefined && effectiveGeom.rotation !== 0) {
      rules.push(`  transform: rotate(${Math.round(effectiveGeom.rotation)}deg);`);
    }
  }

  const isBoxElement = !nodeType || nodeType === "rectangle" || nodeType === "text" || nodeType === "image" || nodeType === "product";

  if (style) {
    if (isBoxElement) {
      if (style.gradient) {
        const g = style.gradient;
        rules.push(`  background: linear-gradient(${g.angle ?? 135}deg, ${g.startColor}, ${g.endColor});`);
      } else if (style.fill !== undefined && style.fill !== "transparent") {
        rules.push(`  background-color: ${style.fill};`);
      }
      if (style.cornerRadius !== undefined && style.cornerRadius > 0) {
        rules.push(`  border-radius: ${style.cornerRadius}px;`);
      }
      if (style.border && style.border.width > 0) {
        rules.push(`  border: ${style.border.width}px ${style.border.style} ${style.border.color};`);
      }
    }

    if (style.opacity !== undefined && style.opacity !== 1) {
      rules.push(`  opacity: ${style.opacity};`);
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
      if (t.letterSpacing) rules.push(`  letter-spacing: ${t.letterSpacing}px;`);
      if (t.textTransform && t.textTransform !== "none") rules.push(`  text-transform: ${t.textTransform};`);
      if (t.textDecoration && t.textDecoration !== "none") rules.push(`  text-decoration: ${t.textDecoration};`);
    }
  }

  return rules.join("\n");
}

/** Recursively renders HTML for a node with pure SVG for vector & 3D shapes */
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
      const imageSrc =
        src ||
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%232a2a4a'><rect width='100' height='100'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%238888a8' font-size='12'>Image</text></svg>";
      return `${indent}<div id="node-${nid}" class="canvas-element img-node">\n${indent}  <img src="${imageSrc}" alt="${escapeHtml(node.name)}" style="object-fit: ${fit}; width: 100%; height: 100%; display: block;" />\n${indent}</div>`;
    }

    case "line": {
      const strokeColor = node.style.border?.color ?? "#2563EB";
      const strokeWidth = node.style.border?.width ?? 2;
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      return `${indent}<div id="node-${nid}" class="canvas-element line-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    <line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
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
      const fill = node.style.fill ?? "#3B82F6";
      const stroke = node.style.border?.color ?? "none";
      const strokeWidth = node.style.border?.width ?? 0;
      const strokeDash =
        node.style.border?.style === "dashed"
          ? 'stroke-dasharray="6,6"'
          : node.style.border?.style === "dotted"
          ? 'stroke-dasharray="2,2"'
          : "";
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      const pts = getPolygonPoints(w, h, sides);
      const depth3d = node.style.depth3d ?? 0;
      const color3d = node.style.color3d ?? "#1E40AF";

      const shadow3d =
        depth3d > 0
          ? `\n${indent}    <polygon points="${pts}" transform="translate(${depth3d * 0.5}, ${depth3d * 0.5})" fill="${color3d}" opacity="0.8" />`
          : "";
      const mainPolygon = `<polygon points="${pts}" fill="${fill}" ${
        stroke !== "none" ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""
      } ${strokeDash} />`;

      return `${indent}<div id="node-${nid}" class="canvas-element polygon-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainPolygon}\n${indent}  </svg>\n${indent}</div>`;
    }

    case "circle": {
      const fill = node.style.fill ?? "#10B981";
      const stroke = node.style.border?.color ?? "none";
      const strokeWidth = node.style.border?.width ?? 0;
      const strokeDash =
        node.style.border?.style === "dashed"
          ? 'stroke-dasharray="6,6"'
          : node.style.border?.style === "dotted"
          ? 'stroke-dasharray="2,2"'
          : "";
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      const rx = w / 2;
      const ry = h / 2;
      const depth3d = node.style.depth3d ?? 0;
      const color3d = node.style.color3d ?? "#065F46";

      const shadow3d =
        depth3d > 0
          ? `\n${indent}    <ellipse cx="${rx + depth3d * 0.4}" cy="${ry + depth3d * 0.4}" rx="${rx}" ry="${ry}" fill="${color3d}" opacity="0.8" />`
          : "";
      const mainEllipse = `<ellipse cx="${rx}" cy="${ry}" rx="${rx}" ry="${ry}" fill="${fill}" ${
        stroke !== "none" ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""
      } ${strokeDash} />`;

      return `${indent}<div id="node-${nid}" class="canvas-element circle-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainEllipse}\n${indent}  </svg>\n${indent}</div>`;
    }

    case "curve": {
      const curvature = node.style.curvature ?? 50;
      const strokeColor = node.style.border?.color ?? node.style.fill ?? "#EC4899";
      const strokeWidth = Math.max(2, node.style.border?.width ?? 4);
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      const curveDepth = (curvature / 100) * (h / 2);
      const pathD = `M 0,${h / 2} C ${w * 0.25},${h / 2 - curveDepth} ${w * 0.75},${h / 2 + curveDepth} ${w},${h / 2}`;
      return `${indent}<div id="node-${nid}" class="canvas-element curve-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
    }

    case "star": {
      const pointsCount = node.style.starPoints ?? 5;
      const innerRatio = node.style.innerRadius ?? 0.5;
      const fill = node.style.fill ?? "#F59E0B";
      const stroke = node.style.border?.color ?? "none";
      const strokeWidth = node.style.border?.width ?? 0;
      const strokeDash =
        node.style.border?.style === "dashed"
          ? 'stroke-dasharray="6,6"'
          : node.style.border?.style === "dotted"
          ? 'stroke-dasharray="2,2"'
          : "";
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      const pts = getStarPoints(w, h, pointsCount, innerRatio);
      const depth3d = node.style.depth3d ?? 0;
      const color3d = node.style.color3d ?? "#B45309";

      const shadow3d =
        depth3d > 0
          ? `\n${indent}    <polygon points="${pts}" transform="translate(${depth3d * 0.4}, ${depth3d * 0.4})" fill="${color3d}" opacity="0.8" />`
          : "";
      const mainStar = `<polygon points="${pts}" fill="${fill}" ${
        stroke !== "none" ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""
      } ${strokeDash} />`;

      return `${indent}<div id="node-${nid}" class="canvas-element star-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainStar}\n${indent}  </svg>\n${indent}</div>`;
    }

    case "shape3d": {
      const sides = node.style.sides ?? 4;
      const mainColor = node.style.fill ?? "#8B5CF6";
      const depth = node.style.depth3d ?? 30;
      const sideColor = node.style.color3d ?? "#6D28D9";
      const stroke = node.style.border?.color ?? "none";
      const strokeWidth = node.style.border?.width ?? 0;
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));

      const dOffset = Math.max(8, depth * 0.35);
      const faceW = Math.max(20, w - dOffset);
      const faceH = Math.max(20, h - dOffset);

      const vertices = getPolygonVertices(faceW, faceH, sides);
      const topPolygonPoints = vertices.map((v) => `${v.x},${v.y}`).join(" ");

      const n = vertices.length;
      const sidePolygons = vertices
        .map((vA, i) => {
          const vB = vertices[(i + 1) % n];
          const quadPoints = `${vA.x},${vA.y} ${vB.x},${vB.y} ${vB.x + dOffset},${vB.y + dOffset} ${vA.x + dOffset},${vA.y + dOffset}`;
          const angle = (i * 2 * Math.PI) / n;
          const shadeFactor = (0.5 + 0.4 * Math.sin(angle)).toFixed(2);
          return `<polygon points="${quadPoints}" fill="${sideColor}" style="filter: brightness(${shadeFactor});" />`;
        })
        .join(`\n${indent}    `);

      const backPolygon = `<polygon points="${topPolygonPoints}" transform="translate(${dOffset}, ${dOffset})" fill="${sideColor}" opacity="0.7" />`;
      const frontPolygon = `<polygon points="${topPolygonPoints}" fill="${mainColor}" ${
        stroke !== "none" ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""
      } />`;

      return `${indent}<div id="node-${nid}" class="canvas-element shape3d-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    ${sidePolygons}\n${indent}    ${backPolygon}\n${indent}    ${frontPolygon}\n${indent}  </svg>\n${indent}</div>`;
    }

    case "brush":
    case "pencil": {
      const strokeColor = node.style.border?.color ?? node.style.fill ?? "#3B82F6";
      const strokeWidth = node.style.brushSize ?? (node.type === "pencil" ? 2 : 12);
      const pathData = node.pathData ?? "";
      const depth3d = node.style.depth3d ?? 0;
      const color3d = node.style.color3d ?? "#1E40AF";
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));

      const shadow3d =
        depth3d > 0
          ? `\n${indent}    <path d="${pathData}" transform="translate(${depth3d * 0.4}, ${depth3d * 0.4})" fill="none" stroke="${color3d}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />`
          : "";
      const mainPath = `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;

      return `${indent}<div id="node-${nid}" class="canvas-element path-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainPath}\n${indent}  </svg>\n${indent}</div>`;
    }

    default:
      return `${indent}<div id="node-${nid}" class="canvas-element"></div>`;
  }
}

/**
 * Compiles a CanvasSite data model into standalone, production-ready HTML5 & CSS3 files
 * with media queries for tablet (768px) and mobile (375px) overrides.
 */
export interface ExportedPageFile {
  id: string;
  name: string;
  filename: string;
  html: string;
}

export interface ExportedMultiPageSiteCode {
  pageFiles: ExportedPageFile[];
  css: string;
}

/**
 * Compiles a multi-page CanvasSite project into standalone HTML files (e.g. index.html, about.html)
 * and a combined style.css file with responsive media query overrides.
 */
export function generateMultiPageSiteCode(
  pages: import("../types/canvas").PagesById,
  activePageId: string,
  currentNodes: NodesById
): ExportedMultiPageSiteCode {
  const safePages = Object.keys(pages).length > 0 ? pages : { "page-1": { id: "page-1", name: "Home", slug: "index", nodes: currentNodes } };
  const activePage = safePages[activePageId] ?? Object.values(safePages)[0];
  if (!activePage) {
    return { pageFiles: [], css: "" };
  }

  const allPagesMap = {
    ...safePages,
    [activePage.id]: {
      ...activePage,
      nodes: currentNodes,
    },
  };

  const pageFiles: ExportedPageFile[] = [];
  const allNodes: CanvasNode[] = [];

  Object.values(allPagesMap).forEach((page) => {
    const filename = `${page.slug || "page"}.html`;
    const topLevel = Object.values(page.nodes)
      .filter((n) => n.parentId === null)
      .sort((a, b) => a.order - b.order);

    const bodyHTML = topLevel.map((n) => renderNodeHTML(n, page.nodes)).join("\n");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.name)} — CanvasSite</title>
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

    pageFiles.push({
      id: page.id,
      name: page.name,
      filename,
      html,
    });

    Object.values(page.nodes).forEach((n) => allNodes.push(n));
  });

  const cssRules: string[] = [];

  cssRules.push(`/* CanvasSite Exported Stylesheet — Multi-Page Site */
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

.canvas-element svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
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

  const allNodesMap: NodesById = {};
  allNodes.forEach((n) => {
    allNodesMap[n.id] = n;
  });

  cssRules.push(`/* Base Desktop Styles */`);
  allNodes.forEach((node) => {
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, node.geometry, node.style, node.type);
    cssRules.push(`#node-${nid} {\n  z-index: ${node.order};\n${rules}\n}`);
  });

  const tabletRules: string[] = [];
  allNodes.forEach((node) => {
    const effectiveTablet = getEffectiveNode(node, "tablet");
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, effectiveTablet.geometry, effectiveTablet.style, node.type);
    tabletRules.push(`#node-${nid} {\n${rules}\n}`);
  });

  if (tabletRules.length > 0) {
    cssRules.push(`/* Tablet Responsive View (768px) */\n@media (max-width: 768px) {\n${tabletRules.join("\n\n")}\n}`);
  }

  const mobileRules: string[] = [];
  allNodes.forEach((node) => {
    const effectiveMobile = getEffectiveNode(node, "mobile");
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, effectiveMobile.geometry, effectiveMobile.style, node.type);
    mobileRules.push(`#node-${nid} {\n${rules}\n}`);
  });

  if (mobileRules.length > 0) {
    cssRules.push(`/* Mobile Responsive View (375px) */\n@media (max-width: 375px) {\n${mobileRules.join("\n\n")}\n}`);
  }

  return {
    pageFiles,
    css: cssRules.join("\n\n"),
  };
}
