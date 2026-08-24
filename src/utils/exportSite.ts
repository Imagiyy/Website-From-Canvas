import type { NodesById, CanvasNode } from "../types/canvas";
import { getPolygonPoints } from "../components/nodes/PolygonNode";
import { getStarPoints } from "../components/nodes/StarNode";
import { getPolygonVertices } from "../components/nodes/Shape3DNode";
import { useInteractionStore } from "../store/interactionStore";
import { resolveNodeBox, resolveNodeStyle, resolveNodeContent, getRenderTree } from "./nodeResolver";

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

/** Helper to merge interaction store data into node */
function getNodeWithInteractions(node: CanvasNode): CanvasNode {
  const storeInteractions = useInteractionStore.getState().interactions[node.id];
  if (storeInteractions) {
    return { ...node, interactions: { ...node.interactions, ...storeInteractions } };
  }
  return node;
}

/** Generates CSS rules for a node's geometry & style using Single Source of Truth nodeResolver */
function generateNodeCSSRules(node: CanvasNode, nodes: NodesById, breakpoint: import("../types/canvas").BreakpointId = "desktop"): string {
  const box = resolveNodeBox(node, nodes, breakpoint);
  const style = resolveNodeStyle(node, breakpoint);
  const rules: string[] = [];

  rules.push(`  left: ${Math.round(box.relativeX)}px;`);
  rules.push(`  top: ${Math.round(box.relativeY)}px;`);
  rules.push(`  width: ${Math.round(box.width)}px;`);
  rules.push(`  height: ${Math.round(box.height)}px;`);
  if (box.rotation !== undefined && box.rotation !== 0) {
    rules.push(`  transform: rotate(${Math.round(box.rotation)}deg);`);
  }

  if (!style.isVectorShape) {
    if (style.gradient) {
      const g = style.gradient;
      rules.push(`  background: linear-gradient(${g.angle ?? 135}deg, ${g.startColor}, ${g.endColor});`);
    } else if (style.fill && style.fill !== "transparent") {
      rules.push(`  background-color: ${style.fill};`);
    }
    if (style.cornerRadius && style.cornerRadius > 0) {
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

  // Entrance animation rule
  const entrance = node.interactions?.entrance;
  if (entrance && entrance.type && entrance.type !== "none") {
    rules.push(`  animation: ${entrance.type} ${entrance.duration || 500}ms ${entrance.easing || "ease"} ${entrance.delay || 0}ms both;`);
  }

  // Hover transition rule
  const hover = node.interactions?.hover;
  if (hover) {
    rules.push(`  transition: all ${hover.transition || 200}ms ease;`);
  }

  return rules.join("\n");
}

/** Generates hover CSS rule for a node */
function generateNodeHoverCSS(node: CanvasNode): string | null {
  const hover = node.interactions?.hover;
  if (!hover?.style) return null;

  const nid = safeId(node.id);
  const hoverRules: string[] = [];

  if (hover.style.fill) hoverRules.push(`  background-color: ${hover.style.fill};`);
  if (hover.style.opacity !== undefined) hoverRules.push(`  opacity: ${hover.style.opacity};`);

  if (hoverRules.length === 0) return null;
  return `#node-${nid}:hover {\n${hoverRules.join("\n")}\n}`;
}

/** Recursively renders HTML for a node with hyperlink wrappers & onclick handlers */
function renderNodeHTML(nodeRaw: CanvasNode, nodes: NodesById, indent: string = "    "): string {
  const node = getNodeWithInteractions(nodeRaw);
  const nid = safeId(node.id);

  let elementHTML = "";

  switch (node.type) {
    case "rectangle":
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element rect-node"></div>`;
      break;

    case "text": {
      const text = node.content?.kind === "text" ? node.content.text : "Text";
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element text-node">\n${indent}  <p>${escapeHtml(text)}</p>\n${indent}</div>`;
      break;
    }

    case "image": {
      const img = node.content?.kind === "image" ? node.content : null;
      const fit = img?.fit ?? "cover";
      const src = img?.assetUrl ?? "";
      const imageSrc =
        src ||
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%232a2a4a'><rect width='100' height='100'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%238888a8' font-size='12'>Image</text></svg>";
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element img-node">\n${indent}  <img src="${imageSrc}" alt="${escapeHtml(node.name)}" style="object-fit: ${fit}; width: 100%; height: 100%; display: block;" />\n${indent}</div>`;
      break;
    }

    case "line": {
      const strokeColor = node.style.border?.color ?? "#2563EB";
      const strokeWidth = node.style.border?.width ?? 2;
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element line-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    <line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
      break;
    }

    case "group": {
      const childrenHTML = (node.children ?? [])
        .map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => n !== undefined)
        .sort((a, b) => a.order - b.order)
        .map((c) => renderNodeHTML(c, nodes, indent + "  "))
        .join("\n");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element group-node">\n${childrenHTML}\n${indent}</div>`;
      break;
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

      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element polygon-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainPolygon}\n${indent}  </svg>\n${indent}</div>`;
      break;
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

      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element circle-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainEllipse}\n${indent}  </svg>\n${indent}</div>`;
      break;
    }

    case "curve": {
      const curvature = node.style.curvature ?? 50;
      const strokeColor = node.style.border?.color ?? node.style.fill ?? "#EC4899";
      const strokeWidth = Math.max(2, node.style.border?.width ?? 4);
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));
      const curveDepth = (curvature / 100) * (h / 2);
      const pathD = `M 0,${h / 2} C ${w * 0.25},${h / 2 - curveDepth} ${w * 0.75},${h / 2 + curveDepth} ${w},${h / 2}`;
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element curve-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n${indent}  </svg>\n${indent}</div>`;
      break;
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

      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element star-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">${shadow3d}\n${indent}    ${mainStar}\n${indent}  </svg>\n${indent}</div>`;
      break;
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
          return `${indent}    <polygon points="${quadPoints}" fill="${sideColor}" opacity="1" style="filter: brightness(${shadeFactor});" />`;
        })
        .join("\n");

      const backBasePolygon = `${indent}    <polygon points="${topPolygonPoints}" transform="translate(${dOffset}, ${dOffset})" fill="${sideColor}" opacity="0.7" />`;
      const frontTopPolygon = `${indent}    <polygon points="${topPolygonPoints}" fill="${mainColor}" ${
        stroke !== "none" ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : ""
      } />`;

      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element shape3d-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${sidePolygons}\n${backBasePolygon}\n${frontTopPolygon}\n${indent}  </svg>\n${indent}</div>`;
      break;
    }

    case "brush":
    case "pencil":
    case "pen": {
      const pathData = node.pathData ?? "";
      const isPencil = node.type === "pencil";
      const isPen = node.type === "pen";
      const strokeColor = node.style.border?.color ?? node.style.fill ?? "#3B82F6";
      const strokeWidth = node.style.brushSize ?? node.style.border?.width ?? (isPencil || isPen ? 2 : 12);
      const w = Math.max(1, Math.abs(node.geometry.width));
      const h = Math.max(1, Math.abs(node.geometry.height));

      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element path-node">\n${indent}  <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" overflow="visible">\n${indent}    <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n${indent}  </svg>\n${indent}</div>`;
      break;
    }

    case "product": {
      const title = node.name || "Product";
      const price = "$49.99";
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element product-node" style="background: #1e1e2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; color: #e4e4f0;">\n${indent}  <div style="font-size: 12px; font-weight: 600;">${escapeHtml(title)}</div>\n${indent}  <div style="font-size: 14px; font-weight: 700; color: #10b981;">${price}</div>\n${indent}  <button style="padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Add to Cart</button>\n${indent}</div>`;
      break;
    }

    case "formInput": {
      const content = resolveNodeContent(node);
      const inputType = content.inputType || "text";
      if (inputType === "textarea") {
        elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-input-node" style="display: flex; flex-direction: column; padding: 8px;">\n${indent}  <label style="font-size: 11px; color: #8888a8; margin-bottom: 4px;">${escapeHtml(content.text || "Label")}</label>\n${indent}  <textarea style="width: 100%; flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 8px;" placeholder="${escapeHtml(content.placeholder || "")}"></textarea>\n${indent}</div>`;
      } else {
        elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-input-node" style="display: flex; align-items: center; padding: 0 10px;">\n${indent}  <input type="${inputType}" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 8px;" placeholder="${escapeHtml(content.placeholder || content.text || "")}" />\n${indent}</div>`;
      }
      break;
    }

    case "formSelect": {
      const content = resolveNodeContent(node);
      const optHtml = content.options.map((opt: string) => `<option>${escapeHtml(opt)}</option>`).join("\n" + indent + "    ");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-select-node" style="display:flex; align-items:center; padding:0 8px;">\n${indent}  <select style="width:100%; background:#1e1e2e; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:8px;">\n${indent}    ${optHtml}\n${indent}  </select>\n${indent}</div>`;
      break;
    }

    case "formCheckbox": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-checkbox-node" style="display: flex; align-items: center; gap: 8px; padding: 0 8px; color: #fff;">\n${indent}  <input type="checkbox" id="cb-${nid}" checked />\n${indent}  <label for="cb-${nid}">${escapeHtml(content.text || "Checkbox")}</label>\n${indent}</div>`;
      break;
    }

    case "formRadio": {
      const content = resolveNodeContent(node);
      const optHtml = content.options.map((opt: string, i: number) => `<label style="display:inline-flex; align-items:center; gap:6px; margin-right:12px; cursor:pointer;"><input type="radio" name="radio-${nid}" ${i === 0 ? 'checked' : ''} /><span>${escapeHtml(opt)}</span></label>`).join("");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-radio-node" style="display:flex; align-items:center; flex-wrap:wrap; padding:0 8px; color:#fff;">\n${indent}  ${optHtml}\n${indent}</div>`;
      break;
    }

    case "formSlider": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-slider-node" style="display: flex; flex-direction: column; justify-content: center; padding: 8px; color: #fff;">\n${indent}  <label style="font-size: 11px; color: #8888a8;">${escapeHtml(content.text || "Slider")}</label>\n${indent}  <input type="range" min="${content.minValue}" max="${content.maxValue}" value="${content.value}" style="width: 100%; accent-color: #3b82f6;" />\n${indent}</div>`;
      break;
    }

    case "formDatePicker": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-date-node" style="display: flex; align-items: center; padding: 0 8px;">\n${indent}  <input type="date" value="${content.date}" style="width: 100%; background: #1e1e2e; color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px;" />\n${indent}</div>`;
      break;
    }

    case "formColorPicker": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-color-node" style="display: flex; align-items: center; gap: 8px; padding: 0 8px; color: #fff;">\n${indent}  <input type="color" value="${content.color}" style="border: none; background: transparent; width: 32px; height: 32px; cursor: pointer;" />\n${indent}  <span>${escapeHtml(content.text || "Color")}</span>\n${indent}</div>`;
      break;
    }

    case "formFileInput": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-file-node" style="display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; color: #a0a0c0; text-align: center;">\n${indent}  <input type="file" style="display: none;" id="file-${nid}" />\n${indent}  <label for="file-${nid}" style="cursor: pointer; font-size: 12px; font-weight: 600;">📁 Upload Files or Drag Here</label>\n${indent}</div>`;
      break;
    }

    case "formRating": {
      const content = resolveNodeContent(node);
      const stars = "★ ".repeat(content.rating) + "☆ ".repeat(Math.max(0, 5 - content.rating));
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-rating-node" style="display: flex; align-items: center; gap: 4px; padding: 0 8px; color: #f59e0b; font-size: 18px;">\n${indent}  ${stars.trim()}\n${indent}</div>`;
      break;
    }

    case "formSignature": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-signature-node" style="border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between;">\n${indent}  <span style="font-size: 11px; color: #8888a8;">Sign Here</span>\n${indent}  <canvas style="width: 100%; height: 80px; border-bottom: 1px dashed rgba(255,255,255,0.2);"></canvas>\n${indent}</div>`;
      break;
    }

    case "formMap": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-map-node" style="background: #111827; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-weight: 600; font-size: 13px;">\n${indent}  📍 ${escapeHtml(content.text || "Location Map")}\n${indent}</div>`;
      break;
    }

    case "formCodeEditor": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-code-node" style="background: #1e1e2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; font-family: monospace; font-size: 12px; color: #67e8f9; padding: 8px;">\n${indent}  <code>${escapeHtml(content.code)}</code>\n${indent}</div>`;
      break;
    }

    case "formOtpPin": {
      const content = resolveNodeContent(node);
      const inputs = Array.from({ length: content.pinLength }).map(() => `<input type="text" maxlength="1" value="•" style="width: 32px; height: 36px; text-align: center; background: #1e1e2e; border: 1px solid #3b82f6; border-radius: 6px; color: #fff;" />`).join("\n" + indent + "  ");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-otp-node" style="display: flex; gap: 6px;">\n${indent}  ${inputs}\n${indent}</div>`;
      break;
    }

    case "formCreditCard": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-card-node" style="background: #1e1e2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px; color: #fff;">\n${indent}  <div style="font-size: 11px; color: #8888a8;">${escapeHtml(content.cardHolder)}</div>\n${indent}  <input type="text" value="${escapeHtml(content.cardNumber)}" style="width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.2); color: #fff; font-family: monospace;" />\n${indent}</div>`;
      break;
    }

    case "formTagInput": {
      const content = resolveNodeContent(node);
      const tagHtml = content.tags.map((t: string) => `<span style="background: #3b82f622; border: 1px solid #3b82f6; color: #93c5fd; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${escapeHtml(t)} ✕</span>`).join("\n" + indent + "  ");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-tag-node" style="display: flex; gap: 6px; flex-wrap: wrap;">\n${indent}  ${tagHtml}\n${indent}</div>`;
      break;
    }

    case "formDualSlider": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-dualslider-node" style="padding: 8px; color: #fff; display: flex; flex-direction: column; gap: 4px;">\n${indent}  <div style="display: flex; justify-content: space-between; font-size: 11px; color: #8888a8;"><span>Range</span><span>${content.dualValues[0]} - ${content.dualValues[1]}</span></div>\n${indent}  <input type="range" min="${content.minValue}" max="${content.maxValue}" value="${content.dualValues[1]}" style="width: 100%; accent-color: #8b5cf6;" />\n${indent}</div>`;
      break;
    }

    case "formVoiceRecorder": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-voice-node" style="display: flex; align-items: center; gap: 8px; background: #1e1e2e; padding: 8px; border-radius: 8px; color: #ef4444;">\n${indent}  🎤 <span>00:14 Recording...</span>\n${indent}</div>`;
      break;
    }

    case "formAvatarUpload": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-avatar-node" style="width: 60px; height: 60px; border-radius: 50%; background: #312e81; display: flex; align-items: center; justify-content: center; color: #a5b4fc;">\n${indent}  👤\n${indent}</div>`;
      break;
    }

    case "formEmojiPicker": {
      const content = resolveNodeContent(node);
      const emojiHtml = content.emojis.join(" ");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-emoji-node" style="display: flex; gap: 8px; font-size: 18px;">\n${indent}  ${emojiHtml}\n${indent}</div>`;
      break;
    }

    case "formStepper": {
      const content = resolveNodeContent(node);
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-stepper-node" style="display: flex; align-items: center; gap: 8px; background: #1e1e2e; padding: 4px 10px; border-radius: 6px; color: #fff;">\n${indent}  <button>-</button> <span>${content.value}</span> <button>+</button>\n${indent}</div>`;
      break;
    }

    case "formSegmented":
    case "formToggleGroup": {
      const content = resolveNodeContent(node);
      const optHtml = content.options.map((opt: string, i: number) => `<button style="background:${i === 0 ? '#3b82f6' : 'transparent'}; color:${i === 0 ? '#fff' : '#aaa'}; border:none; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">${escapeHtml(opt)}</button>`).join("");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-toggle-node" style="display:flex; gap:4px; background:#1e1e2e; padding:4px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">\n${indent}  ${optHtml}\n${indent}</div>`;
      break;
    }

    case "formAccordion": {
      const content = resolveNodeContent(node);
      const optHtml = content.accordions.map((acc: any, i: number) => `
        <details ${i === 0 ? 'open' : ''} style="background:#1e1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:8px 12px; margin-bottom:6px; color:#fff;">
          <summary style="cursor:pointer; font-weight:600;">${escapeHtml(acc.title)}</summary>
          <p style="font-size:12px; color:#a0a0c0; margin-top:6px;">${escapeHtml(acc.content)}</p>
        </details>
      `).join("");
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-accordion-container" style="display:flex; flex-direction:column;">\n${indent}  ${optHtml}\n${indent}</div>`;
      break;
    }

    case "formCaptcha": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-captcha-node" style="background: #181824; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 10px; color: #fff;">\n${indent}  <input type="checkbox" /> <span>I'm not a robot</span>\n${indent}</div>`;
      break;
    }

    case "formGradientPicker": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-gradient-node" style="height: 20px; border-radius: 4px; background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);"></div>`;
      break;
    }

    case "formCurrency": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-currency-node" style="display: flex; align-items: center; gap: 8px; background: #1e1e2e; padding: 8px; border-radius: 6px; color: #10b981; font-weight: 700;">\n${indent}  $ <input type="text" value="1,250.00" style="background: transparent; border: none; color: #fff;" />\n${indent}</div>`;
      break;
    }

    case "formTimeRange": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element form-timerange-node" style="display: flex; align-items: center; justify-content: space-between; background: #1e1e2e; padding: 8px; border-radius: 6px; color: #3b82f6;">\n${indent}  <span>09:00 AM - 05:00 PM</span>\n${indent}</div>`;
      break;
    }

    case "navHeader": {
      const content = resolveNodeContent(node);
      const brandText = content.brand || "CanvasSite";
      const links = content.links;
      const signInText = content.signInText;
      const ctaText = content.ctaText;

      const logoHtml = content.showLogo ? `<div style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:15px; color:#fff;"><div style="width:28px; height:28px; border-radius:6px; background:linear-gradient(135deg, #3b82f6, #8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800;">⚡</div><span>${escapeHtml(brandText)}</span></div>` : '';
      const linksHtml = content.showLinks ? `<nav style="display:flex; gap:20px; font-size:13px;">${links.map((l: string, i: number) => `<a href="#" style="color:${i === 0 ? '#3b82f6' : '#a0a0c0'}; text-decoration:none; font-weight:${i === 0 ? '600' : '400'};">${escapeHtml(l)}</a>`).join('')}</nav>` : '';
      const signInHtml = content.showSignIn ? `<a href="#" style="font-size:12px; color:#a0a0c0; text-decoration:none;">${escapeHtml(signInText)}</a>` : '';
      const ctaHtml = content.showCta ? `<button style="padding:6px 14px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-weight:600; font-size:12px; cursor:pointer;">${escapeHtml(ctaText)}</button>` : '';

      elementHTML = `${indent}<header id="node-${nid}" class="canvas-element nav-header-node" style="display:flex; align-items:center; justify-content:space-between; padding:0 16px; background:#181826; border-radius:8px; color:#fff;">\n${indent}  ${logoHtml}\n${indent}  ${linksHtml}\n${indent}  <div style="display:flex; align-items:center; gap:10px;">${signInHtml}${ctaHtml}</div>\n${indent}</header>`;
      break;
    }

    case "navSidebar": {
      const content = resolveNodeContent(node);
      const itemsHtml = content.items.map((it: any, i: number) => {
        const lbl = typeof it === "string" ? it : it.label;
        const icn = typeof it === "object" ? it.icon || "📁" : "📁";
        return `<a href="#" style="color:${i === 0 ? '#a78bfa' : '#a0a0c0'}; padding:8px 10px; background:${i === 0 ? 'rgba(139,92,246,0.15)' : 'transparent'}; border-radius:6px; text-decoration:none; display:flex; align-items:center; gap:10px;"><span>${icn}</span><span>${escapeHtml(lbl)}</span></a>`;
      }).join("\n" + indent + "    ");

      elementHTML = `${indent}<aside id="node-${nid}" class="canvas-element nav-sidebar-node" style="display:flex; flex-direction:column; gap:16px; padding:12px; background:#181826; border-radius:8px; color:#fff;">\n${indent}  <div style="display:flex; align-items:center; gap:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); font-weight:700; font-size:13px;">🚀 ${escapeHtml(content.workspaceTitle || "Workspace")}</div>\n${indent}  <nav style="display:flex; flex-direction:column; gap:4px; font-size:13px;">\n${indent}    ${itemsHtml}\n${indent}  </nav>\n${indent}</aside>`;
      break;
    }

    case "navBreadcrumb": {
      const content = resolveNodeContent(node);
      const trailHtml = content.trail.map((crumb: string, idx: number) => idx === content.trail.length - 1 ? `<span style="color:#fff; font-weight:600;">${escapeHtml(crumb)}</span>` : `<a href="#" style="color:#8888a8; text-decoration:none;">${escapeHtml(crumb)}</a>`).join(" / ");
      elementHTML = `${indent}<nav id="node-${nid}" class="canvas-element nav-breadcrumb-node" aria-label="Breadcrumb" style="display:flex; align-items:center; gap:8px; font-size:12px; color:#8888a8;">\n${indent}  ${trailHtml}\n${indent}</nav>`;
      break;
    }

    case "navPagination": {
      elementHTML = `${indent}<nav id="node-${nid}" class="canvas-element nav-pagination-node" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #181826; border-radius: 8px; color: #fff; font-size: 12px;">\n${indent}  <span>Page 2 of 5</span>\n${indent}  <div style="display: flex; gap: 4px;"><button style="padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">Prev</button><button style="width: 24px; height: 24px; background: #3b82f6; border: none; color: #fff; border-radius: 4px;">2</button><button style="padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">Next</button></div>\n${indent}</nav>`;
      break;
    }

    case "navTabs": {
      const content = resolveNodeContent(node);
      const tabsHtml = content.tabs.map((tab: string, i: number) => `<a href="#" style="color:${i === 0 ? '#3b82f6' : '#8888a8'}; font-weight:${i === 0 ? '600' : '400'}; border-bottom:${i === 0 ? '2px solid #3b82f6' : 'none'}; padding:8px 12px; text-decoration:none;">${escapeHtml(tab)}</a>`).join("");
      elementHTML = `${indent}<nav id="node-${nid}" class="canvas-element nav-tabs-node" style="display:flex; gap:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding:0 12px;">\n${indent}  ${tabsHtml}\n${indent}</nav>`;
      break;
    }

    case "navToc": {
      const content = resolveNodeContent(node);
      const sectionsHtml = content.sections.map((sec: string, i: number) => `<a href="#" style="color:${i === 0 ? '#3b82f6' : '#a0a0c0'}; text-decoration:none;">${escapeHtml(sec)}</a>`).join("\n" + indent + "  ");
      elementHTML = `${indent}<nav id="node-${nid}" class="canvas-element nav-toc-node" style="display:flex; flex-direction:column; gap:6px; padding:12px; background:#181826; border-radius:8px; font-size:12px;">\n${indent}  <div style="font-size:11px; font-weight:700; color:#8888a8; text-transform:uppercase;">Table of Contents</div>\n${indent}  ${sectionsHtml}\n${indent}</nav>`;
      break;
    }

    case "dataCard": {
      const content = (node.content as any) || {};
      const title = content.title || "Feature Card";
      const subtitle = content.subtitle || "Productivity Module";
      const badge = content.badge || "PRO";
      const text = content.text || "Self-contained card container grouping related content and actions.";
      const buttonText = content.buttonText || "Learn More →";

      const showTitle = content.showTitle !== false;
      const showSubtitle = content.showSubtitle !== false;
      const showBadge = content.showBadge !== false;
      const showText = content.showText !== false;
      const showButton = content.showButton !== false;

      const titleHtml = showTitle ? `<div style="font-weight:700; font-size:15px; color:#fff;">${escapeHtml(title)}</div>` : '';
      const subHtml = showSubtitle ? `<div style="font-size:11px; color:#8888a8; margin-top:2px;">${escapeHtml(subtitle)}</div>` : '';
      const badgeHtml = showBadge ? `<span style="padding:2px 8px; border-radius:12px; background:rgba(59,130,246,0.2); border:1px solid #3b82f6; color:#60a5fa; font-size:10px; font-weight:700;">${escapeHtml(badge)}</span>` : '';
      const textHtml = showText ? `<div style="font-size:12px; color:#a0a0c0; margin:8px 0; line-height:1.4;">${escapeHtml(text)}</div>` : '';
      const btnHtml = showButton ? `<div style="display:flex; justify-content:flex-end;"><button style="padding:6px 14px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-weight:600; font-size:12px; cursor:pointer;">${escapeHtml(buttonText)}</button></div>` : '';

      elementHTML = `${indent}<article id="node-${nid}" class="canvas-element data-card-node" style="display:flex; flex-direction:column; justify-content:space-between; padding:16px; background:#181826; border-radius:8px; color:#fff;">\n${indent}  <div style="display:flex; justify-content:space-between; align-items:flex-start;"><div>${titleHtml}${subHtml}</div>${badgeHtml}</div>\n${indent}  ${textHtml}\n${indent}  ${btnHtml}\n${indent}</article>`;
      break;
    }

    case "dataTable": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element data-table-node" style="background: #181826; border-radius: 8px; overflow: hidden; font-size: 12px;">\n${indent}  <table style="width: 100%; border-collapse: collapse; text-align: left; color: #fff;">\n${indent}    <thead><tr style="background: rgba(255,255,255,0.05); color: #8888a8;"><th style="padding: 8px 12px;">USER</th><th style="padding: 8px 12px;">ROLE</th><th style="padding: 8px 12px;">STATUS</th></tr></thead>\n${indent}    <tbody>\n${indent}      <tr style="border-top: 1px solid rgba(255,255,255,0.05);"><td style="padding: 8px 12px; font-weight: 600;">Alex Rivera</td><td style="padding: 8px 12px; color: #a0a0c0;">Frontend Lead</td><td style="padding: 8px 12px;"><span style="color: #34d399;">● Active</span></td></tr>\n${indent}      <tr style="border-top: 1px solid rgba(255,255,255,0.05);"><td style="padding: 8px 12px; font-weight: 600;">Sarah Chen</td><td style="padding: 8px 12px; color: #a0a0c0;">Product Designer</td><td style="padding: 8px 12px;"><span style="color: #34d399;">● Active</span></td></tr>\n${indent}    </tbody>\n${indent}  </table>\n${indent}</div>`;
      break;
    }

    case "dataList": {
      elementHTML = `${indent}<ul id="node-${nid}" class="canvas-element data-list-node" style="display: flex; flex-direction: column; gap: 6px; padding: 10px; background: #181826; border-radius: 8px; list-style: none; margin: 0;">\n${indent}  <li style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; color: #fff; font-size: 12px;"><span>👤 New deployment pushed</span><span style="color: #666688; font-size: 10px;">2m ago</span></li>\n${indent}  <li style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; color: #fff; font-size: 12px;"><span>💬 New comment on Navbar</span><span style="color: #666688; font-size: 10px;">15m ago</span></li>\n${indent}</ul>`;
      break;
    }

    case "dataBadge": {
      elementHTML = `${indent}<span id="node-${nid}" class="canvas-element data-badge-node" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; background: #10b98122; border: 1px solid #10b981; color: #34d399; font-weight: 700; border-radius: 16px; font-size: 12px;">● Live Badge</span>`;
      break;
    }

    case "dataAccordion": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element data-accordion-node" style="display: flex; flex-direction: column; gap: 6px; padding: 10px; background: #181826; border-radius: 8px; color: #fff; font-size: 12px;">\n${indent}  <details style="border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px;"><summary style="cursor: pointer; font-weight: 600;">What is CanvasSite Engine?</summary><p style="margin-top: 6px; color: #a0a0c0;">Visual web app canvas builder with multi-framework code exporters.</p></details>\n${indent}</div>`;
      break;
    }

    case "dataTooltip": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element data-tooltip-node" style="position: relative; display: inline-flex; align-items: center; gap: 6px; color: #93c5fd; font-size: 12px;">\n${indent}  <span>💡 Hover for Details</span>\n${indent}</div>`;
      break;
    }

    case "feedbackModal": {
      const content = (node.content as any) || {};
      const title = content.title || "Confirm Deletion";
      const text = content.text || "Are you sure you want to proceed? This action will permanently remove the item.";
      const confirmText = content.confirmText || "Confirm";
      const cancelText = content.cancelText || "Cancel";

      const showTitle = content.showTitle !== false;
      const showText = content.showText !== false;
      const showConfirmBtn = content.showConfirmBtn !== false;
      const showCancelBtn = content.showCancelBtn !== false;

      const titleHtml = showTitle ? `<div style="font-weight:700; font-size:14px; color:#fff;">${escapeHtml(title)}</div>` : '';
      const textHtml = showText ? `<div style="font-size:12px; color:#a0a0c0; margin:8px 0; line-height:1.4;">${escapeHtml(text)}</div>` : '';
      const cancelHtml = showCancelBtn ? `<button style="padding:6px 12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#a0a0c0; border-radius:6px; font-size:11px; cursor:pointer;">${escapeHtml(cancelText)}</button>` : '';
      const confirmHtml = showConfirmBtn ? `<button style="padding:6px 12px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer;">${escapeHtml(confirmText)}</button>` : '';

      elementHTML = `${indent}<dialog id="node-${nid}" class="canvas-element feedback-modal-node" open style="padding:16px; background:#181826; border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; max-width:360px; display:flex; flex-direction:column; justify-content:space-between;">\n${indent}  <div style="display:flex; justify-content:space-between; align-items:center;">${titleHtml}<span style="cursor:pointer; color:#8888a8;">✕</span></div>\n${indent}  ${textHtml}\n${indent}  <div style="display:flex; justify-content:flex-end; gap:8px;">${cancelHtml}${confirmHtml}</div>\n${indent}</dialog>`;
      break;
    }

    case "feedbackToast": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element feedback-toast-node" role="status" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #10b98122; border: 1px solid #10b981; border-radius: 8px; color: #fff; font-size: 12px;">\n${indent}  <span>✓ Changes saved successfully!</span>\n${indent}</div>`;
      break;
    }

    case "feedbackAlert": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element feedback-alert-node" role="alert" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f59e0b22; border: 1px solid #f59e0b; border-radius: 8px; color: #fff; font-size: 12px;">\n${indent}  <span>⚠️ System Alert: API rate limit at 85%.</span>\n${indent}</div>`;
      break;
    }

    case "feedbackProgress": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element feedback-progress-node" style="display: flex; flex-direction: column; gap: 6px; padding: 10px; background: #181826; border-radius: 8px; color: #fff; font-size: 11px;">\n${indent}  <div style="display: flex; justify-content: space-between;"><span>Processing Upload...</span><span>68%</span></div>\n${indent}  <progress value="68" max="100" style="width: 100%; accent-color: #3b82f6;"></progress>\n${indent}</div>`;
      break;
    }

    case "feedbackSkeleton": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element feedback-skeleton-node" style="padding: 12px; background: #161626; border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">\n${indent}  <div style="width: 100%; height: 12px; background: rgba(255,255,255,0.06); border-radius: 4px;"></div>\n${indent}  <div style="width: 80%; height: 12px; background: rgba(255,255,255,0.04); border-radius: 4px;"></div>\n${indent}</div>`;
      break;
    }

    case "feedbackEmptyState": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element feedback-empty-node" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 16px; background: #181826; border-radius: 8px; color: #fff;">\n${indent}  <div style="font-size: 28px;">📭</div>\n${indent}  <div style="font-weight: 700; font-size: 14px; margin-top: 4px;">No Results Found</div>\n${indent}  <p style="font-size: 11px; color: #8888a8; margin: 4px 0 12px;">Get started by creating a new entry.</p>\n${indent}  <button style="padding: 6px 14px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: 12px;">+ Create New Entry</button>\n${indent}</div>`;
      break;
    }

    case "layoutContainer": {
      elementHTML = `${indent}<section id="node-${nid}" class="canvas-element layout-container-node" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px; background: #181826; border-radius: 8px; color: #fff;">\n${indent}  <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px;">Column A</div>\n${indent}  <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px;">Column B</div>\n${indent}  <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px;">Column C</div>\n${indent}</section>`;
      break;
    }

    case "layoutCarousel": {
      elementHTML = `${indent}<figure id="node-${nid}" class="canvas-element layout-carousel-node" style="position: relative; display: flex; align-items: center; justify-content: center; padding: 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; color: #fff; text-align: center;">\n${indent}  <div style="font-weight: 800; font-size: 16px;">Slide 1: Vision</div>\n${indent}</figure>`;
      break;
    }

    case "mediaPlayer": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element media-player-node" style="position: relative; background: #09090e; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; color: #fff;">\n${indent}  <button style="width: 44px; height: 44px; border-radius: 50%; background: #3b82f6; color: #fff; border: none; font-size: 18px;">▶</button>\n${indent}</div>`;
      break;
    }

    case "layoutDivider": {
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element layout-divider-node" style="display: flex; align-items: center; gap: 12px; margin: 12px 0;">\n${indent}  <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.15);" />\n${indent}  <span style="font-size: 10px; font-weight: 700; color: #666688; text-transform: uppercase;">SECTION DIVIDER</span>\n${indent}  <hr style="flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.15);" />\n${indent}</div>`;
      break;
    }

    case "actionButton": {
      const content = (node.content as any) || {};
      const btnText = content.title || content.text || "Primary Action";
      elementHTML = `${indent}<button id="node-${nid}" class="canvas-element action-button-node" style="padding: 10px 20px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">${escapeHtml(btnText)}</button>`;
      break;
    }

    case "actionMenu": {
      elementHTML = `${indent}<menu id="node-${nid}" class="canvas-element action-menu-node" style="position: relative; padding: 8px 12px; background: #181826; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 13px;">\n${indent}  <span>••• Actions</span>\n${indent}</menu>`;
      break;
    }

    case "sectionHero": {
      const content = (node.content as any) || {};
      const title = content.title || content.text || "Build Something Amazing";
      const subtitle = content.subtitle || "Create stunning websites with our intuitive builder.";
      const primaryText = content.primaryButtonText || "Get Started";
      const secondaryText = content.secondaryButtonText || "Learn More";

      elementHTML = `${indent}<section id="node-${nid}" class="canvas-element section-hero" style="width:100%; background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding:48px 24px; text-align:center; color:#fff; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:16px; box-sizing:border-box;">\n${indent}  <h1 style="font-size:32px; font-weight:800; line-height:1.1; margin:0;">${escapeHtml(title)}</h1>\n${indent}  <p style="color:#94a3b8; font-size:16px; max-width:80%; line-height:1.5; margin:0;">${escapeHtml(subtitle)}</p>\n${indent}  <div style="display:flex; gap:12px; margin-top:8px;">\n${indent}    <a href="#" style="padding:12px 28px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; border-radius:8px; font-weight:700; font-size:14px;">${escapeHtml(primaryText)}</a>\n${indent}    <a href="#" style="padding:12px 28px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#e2e8f0; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px;">${escapeHtml(secondaryText)}</a>\n${indent}  </div>\n${indent}</section>`;
      break;
    }

    case "sectionPricing": {
      const content = (node.content as any) || {};
      const title = content.title || content.text || "Choose Your Plan";
      const tiers = content.tiers || [
        { name: "Starter", price: "$9", period: "/mo", cta: "Choose Starter", popular: false },
        { name: "Pro", price: "$29", period: "/mo", cta: "Get Started", popular: true },
        { name: "Enterprise", price: "$99", period: "/mo", cta: "Contact Sales", popular: false },
      ];

      const tiersHtml = tiers.map((tier: any) => `
        <div style="flex:1; background:${tier.popular ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${tier.popular ? '#6366f1' : 'rgba(255,255,255,0.1)'}; padding:20px; border-radius:8px; text-align:left;">
          <h3 style="font-size:18px; font-weight:700; margin:0;">${escapeHtml(tier.name)}</h3>
          <div style="font-size:28px; font-weight:800; margin:12px 0;">${escapeHtml(tier.price)}<span style="font-size:12px; color:#94a3b8;">${escapeHtml(tier.period || "/mo")}</span></div>
          <button style="width:100%; padding:10px; background:${tier.popular ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#334155'}; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">${escapeHtml(tier.cta || "Choose Plan")}</button>
        </div>
      `).join("");

      elementHTML = `${indent}<section id="node-${nid}" class="canvas-element section-pricing" style="width:100%; background:#0f172a; padding:32px 24px; color:#fff; border-radius:12px;">\n${indent}  <h2 style="text-align:center; font-size:24px; font-weight:700; margin-bottom:24px;">${escapeHtml(title)}</h2>\n${indent}  <div style="display:flex; gap:16px; justify-content:center;">${tiersHtml}</div>\n${indent}</section>`;
      break;
    }

    case "sectionTestimonials":
    case "sectionTeam":
    case "sectionFeatures":
    case "sectionCTA":
    case "sectionFooter": {
      const content = (node.content as any) || {};
      const title = content.title || content.text || content.brand || node.name;
      const subtitle = content.subtitle || "";
      const copyright = content.copyright || "© 2024 CanvasSite. All rights reserved.";

      if (node.type === "sectionFooter") {
        elementHTML = `${indent}<footer id="node-${nid}" class="canvas-element section-footer" style="width:100%; background:#0f172a; padding:32px 24px; color:#fff; border-radius:12px; display:flex; flex-direction:column; gap:16px; text-align:center;">\n${indent}  <div style="font-size:18px; font-weight:700;">${escapeHtml(title)}</div>\n${indent}  ${subtitle ? `<div style="font-size:13px; color:#94a3b8;">${escapeHtml(subtitle)}</div>` : ''}\n${indent}  <div style="font-size:12px; color:#64748b; margin-top:8px;">${escapeHtml(copyright)}</div>\n${indent}</footer>`;
      } else {
        elementHTML = `${indent}<section id="node-${nid}" class="canvas-element section-block" style="width:100%; background:#0f172a; padding:32px 24px; color:#fff; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px;">\n${indent}  <h2 style="font-size:24px; font-weight:700; margin:0;">${escapeHtml(title)}</h2>\n${indent}  ${subtitle ? `<p style="color:#94a3b8; font-size:14px; margin:0;">${escapeHtml(subtitle)}</p>` : ''}\n${indent}</section>`;
      }
      break;
    }

    case "embedCode": {
      const htmlCode = node.embedData?.code || '<div class="custom-embed">Custom Code Block</div>';
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element embed-code-block">\n${indent}  ${htmlCode}\n${indent}</div>`;
      break;
    }

    case "embedIframe": {
      const src = node.embedData?.iframeSrc || "";
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element embed-iframe-block" style="width:100%; height:100%;">\n${indent}  <iframe src="${src}" style="width:100%; height:100%; border:none; border-radius:8px;" allowfullscreen></iframe>\n${indent}</div>`;
      break;
    }

    case "iconElement": {
      const path = node.iconData?.svgPath || "M12 2L2 7l10 5 10-5-10-5z";
      const color = node.iconData?.iconColor || "#6366f1";
      elementHTML = `${indent}<span id="node-${nid}" class="canvas-element icon-node" style="display:inline-flex; align-items:center; justify-content:center;">\n${indent}  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="${color}" stroke-width="2"><path d="${path}" /></svg>\n${indent}</span>`;
      break;
    }

    default:
      elementHTML = `${indent}<div id="node-${nid}" class="canvas-element"></div>`;
      break;
  }

  // Wrap interactive hyperlinks if click action is defined
  const click = node.interactions?.click;
  if (click && click.type && click.type !== "none") {
    if (click.type === "navigateTo" && click.target) {
      return `${indent}<a href="${click.target}.html" style="display: block; text-decoration: none; color: inherit;">\n${elementHTML}\n${indent}</a>`;
    }
    if (click.type === "openUrl" && click.target) {
      const targetAttr = click.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `${indent}<a href="${click.target}"${targetAttr} style="display: block; text-decoration: none; color: inherit;">\n${elementHTML}\n${indent}</a>`;
    }
    if (click.type === "scrollTo" && click.target) {
      return `${indent}<a href="#node-${safeId(click.target)}" style="display: block; text-decoration: none; color: inherit;">\n${elementHTML}\n${indent}</a>`;
    }
    if (click.type === "toggleVisibility" && click.target) {
      return `${indent}<div onclick="toggleVisibility('node-${safeId(click.target)}')" style="cursor: pointer;">\n${elementHTML}\n${indent}</div>`;
    }
  }

  return elementHTML;
}

/** Generates HTML/CSS code bundle for all pages */
export function exportSite(
  pages: import("../types/canvas").PagesById,
  _activePageId: string
): {
  pageFiles: Record<string, string>;
  css: string;
} {
  const pageFiles: Record<string, string> = {};

  Object.values(pages).forEach((page) => {
    const pageNodes = page.nodes;

    const topLevelNodes = getRenderTree(pageNodes);

    const bodyHTML = topLevelNodes.map((n) => renderNodeHTML(n, pageNodes, "      ")).join("\n");

    const pageBg = page.backgroundColor && page.backgroundColor !== "transparent" ? page.backgroundColor : "#0f0f1a";
    const htmlContent = `<!DOCTYPE html>
<!-- Generated & Published by CanvasSite Builder at ${new Date().toLocaleString()} -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.seo?.title || page.name)}</title>
  <meta name="description" content="${escapeHtml(page.seo?.description || `${page.name} page created with CanvasSite`)}">
  <link rel="stylesheet" href="styles.css">
  <script>
    function toggleVisibility(id) {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = (el.style.display === 'none') ? 'block' : 'none';
      }
    }
  </script>
</head>
<body style="background-color: ${pageBg};">
  <div class="canvas-site">
    <main id="page-${safeId(page.id)}" class="canvas-page" style="background-color: ${pageBg};">
${bodyHTML}
    </main>
  </div>
</body>
</html>`;

    const filename = `${page.slug}.html`;
    pageFiles[filename] = htmlContent;
  });

  const allNodes: CanvasNode[] = [];
  Object.values(pages).forEach((page) => {
    Object.values(page.nodes).forEach((n) => {
      allNodes.push(getNodeWithInteractions(n));
    });
  });

  const cssRules: string[] = [];

  const fontFamilies = new Set<string>();
  allNodes.forEach((n) => {
    if (n.style?.typography?.fontFamily) {
      const familyName = n.style.typography.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      if (familyName && familyName !== "sans-serif" && familyName !== "serif" && familyName !== "monospace") {
        fontFamilies.add(familyName);
      }
    }
  });

  if (fontFamilies.size > 0) {
    const fontParams = Array.from(fontFamilies).map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join("&");
    cssRules.push(`@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`);
  }

  cssRules.push(`/* Reset & Base Layout */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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

/* Keyframe Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideInLeft { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideInUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideInDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes rotateIn { from { transform: rotate(-15deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
@keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
`);

  const allNodesMap: NodesById = {};
  allNodes.forEach((n) => {
    allNodesMap[n.id] = n;
  });

  cssRules.push(`/* Base Desktop Styles */`);
  allNodes.forEach((node) => {
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, "desktop");
    cssRules.push(`#node-${nid} {\n  z-index: ${node.order};\n${rules}\n}`);

    const hoverCSS = generateNodeHoverCSS(node);
    if (hoverCSS) {
      cssRules.push(hoverCSS);
    }
  });

  const tabletRules: string[] = [];
  allNodes.forEach((node) => {
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, "tablet");
    tabletRules.push(`#node-${nid} {\n${rules}\n}`);
  });

  if (tabletRules.length > 0) {
    cssRules.push(`/* Tablet Responsive View (768px) */\n@media (max-width: 768px) {\n${tabletRules.join("\n\n")}\n}`);
  }

  const mobileRules: string[] = [];
  allNodes.forEach((node) => {
    const nid = safeId(node.id);
    const rules = generateNodeCSSRules(node, allNodesMap, "mobile");
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

export interface ExportedPageFile {
  id: string;
  name: string;
  filename: string;
  html: string;
}

export function generateMultiPageSiteCode(
  pages: import("../types/canvas").PagesById,
  activePageId: string,
  _currentNodes?: NodesById
): {
  pageFiles: ExportedPageFile[];
  css: string;
} {
  const mergedPages = { ...pages };
  if (mergedPages[activePageId] && _currentNodes) {
    mergedPages[activePageId] = {
      ...mergedPages[activePageId],
      nodes: _currentNodes,
    };
  }

  const { pageFiles, css } = exportSite(mergedPages, activePageId);
  const formattedPageFiles = Object.entries(pageFiles).map(([filename, html]) => {
    const pageObj = Object.values(mergedPages).find((p) => `${p.slug}.html` === filename);
    return {
      id: pageObj?.id || filename,
      name: pageObj?.name || filename,
      filename,
      html,
    };
  });

  return {
    pageFiles: formattedPageFiles,
    css,
  };
}
