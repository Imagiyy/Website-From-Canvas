// Export to Figma-like JSON Format — 4.1
import type { NodesById, CanvasNode, PagesById } from "../types/canvas";

// Figma Document Structure (simplified schema)
interface FigmaColor {
  r: number; g: number; b: number; a: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  absoluteBoundingBox: { x: number; y: number; width: number; height: number };
  rotation?: number;
  fills: FigmaFill[];
  strokes: FigmaStroke[];
  strokeWeight: number;
  cornerRadius?: number;
  opacity: number;
  effects: FigmaEffect[];
  children?: FigmaNode[];
  characters?: string;
  style?: Record<string, unknown>;
}

interface FigmaFill {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "IMAGE";
  color?: FigmaColor;
  opacity?: number;
  visible: boolean;
}

interface FigmaStroke {
  type: "SOLID";
  color: FigmaColor;
}

interface FigmaEffect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible: boolean;
  radius?: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
}

function hexToFigmaColor(hex: string, alpha = 1): FigmaColor {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r, g, b, a: alpha };
}

function mapNodeType(type: string): string {
  const typeMap: Record<string, string> = {
    rectangle: "RECTANGLE",
    text: "TEXT",
    image: "RECTANGLE",
    line: "LINE",
    group: "GROUP",
    polygon: "REGULAR_POLYGON",
    circle: "ELLIPSE",
    curve: "VECTOR",
    star: "STAR",
    pen: "VECTOR",
    component: "COMPONENT",
    componentInstance: "INSTANCE",
  };
  return typeMap[type] || "RECTANGLE";
}

function canvasNodeToFigma(node: CanvasNode, nodes: NodesById): FigmaNode {
  const fills: FigmaFill[] = [];
  const strokes: FigmaStroke[] = [];
  const effects: FigmaEffect[] = [];

  // Fills
  if (node.style.fill && node.style.fill !== "transparent") {
    fills.push({
      type: "SOLID",
      color: hexToFigmaColor(node.style.fill),
      opacity: 1,
      visible: true,
    });
  }
  if (node.style.gradient) {
    fills.push({
      type: node.style.gradient.type === "radial" ? "GRADIENT_RADIAL" : "GRADIENT_LINEAR",
      opacity: 1,
      visible: true,
    });
  }

  // Multiple fills
  if (node.style.fills) {
    node.style.fills.forEach((f) => {
      if (f.type === "solid" && f.color) {
        fills.push({ type: "SOLID", color: hexToFigmaColor(f.color), opacity: f.opacity, visible: f.visible });
      } else if (f.type === "gradient" && f.gradient) {
        fills.push({ type: f.gradient.type === "radial" ? "GRADIENT_RADIAL" : "GRADIENT_LINEAR", opacity: f.opacity, visible: f.visible });
      }
    });
  }

  // Strokes
  if (node.style.border) {
    strokes.push({
      type: "SOLID",
      color: hexToFigmaColor(node.style.border.color),
    });
  }

  // Effects
  if (node.style.shadow) {
    effects.push({
      type: "DROP_SHADOW",
      visible: true,
      radius: node.style.shadow.blur,
      color: hexToFigmaColor(node.style.shadow.color, 0.5),
      offset: { x: node.style.shadow.x, y: node.style.shadow.y },
    });
  }
  if (node.style.innerShadow) {
    effects.push({
      type: "INNER_SHADOW",
      visible: true,
      radius: node.style.innerShadow.blur,
      color: hexToFigmaColor(node.style.innerShadow.color, 0.5),
      offset: { x: node.style.innerShadow.x, y: node.style.innerShadow.y },
    });
  }
  if (node.style.blur) {
    effects.push({ type: "LAYER_BLUR", visible: true, radius: node.style.blur });
  }
  if (node.style.backgroundBlur) {
    effects.push({ type: "BACKGROUND_BLUR", visible: true, radius: node.style.backgroundBlur });
  }

  const figmaNode: FigmaNode = {
    id: node.id,
    name: node.name,
    type: mapNodeType(node.type),
    visible: node.visible !== false,
    locked: node.locked === true,
    absoluteBoundingBox: {
      x: node.geometry.x,
      y: node.geometry.y,
      width: node.geometry.width,
      height: node.geometry.height,
    },
    rotation: node.geometry.rotation || undefined,
    fills,
    strokes,
    strokeWeight: node.style.border?.width ?? 0,
    cornerRadius: node.style.cornerRadius,
    opacity: node.style.opacity,
    effects,
  };

  // Text content
  if (node.type === "text" && node.content?.kind === "text") {
    figmaNode.characters = node.content.text;
    if (node.style.typography) {
      figmaNode.style = {
        fontFamily: node.style.typography.fontFamily,
        fontSize: node.style.typography.fontSize,
        fontWeight: node.style.typography.fontWeight,
        textAlignHorizontal: node.style.typography.align.toUpperCase(),
        lineHeightPx: node.style.typography.fontSize * node.style.typography.lineHeight,
      };
    }
  }

  // Children (for groups)
  if (node.children && node.children.length > 0) {
    figmaNode.children = node.children
      .map((cId) => nodes[cId])
      .filter((n): n is CanvasNode => !!n)
      .sort((a, b) => a.order - b.order)
      .map((c) => canvasNodeToFigma(c, nodes));
  }

  return figmaNode;
}

export interface FigmaExportData {
  schemaVersion: number;
  name: string;
  document: {
    id: string;
    name: string;
    type: "DOCUMENT";
    children: {
      id: string;
      name: string;
      type: "CANVAS";
      backgroundColor: FigmaColor;
      children: FigmaNode[];
    }[];
  };
}

/** Export the project as a Figma-compatible JSON structure */
export function exportToFigma(
  pages: PagesById,
  activePageId: string,
  currentNodes: NodesById,
  projectName = "CanvasSite Export"
): string {
  const safePages = Object.keys(pages).length > 0 ? pages : { "page-1": { id: "page-1", name: "Home", slug: "index", nodes: currentNodes } };
  const activePage = safePages[activePageId] ?? Object.values(safePages)[0];
  if (!activePage) return JSON.stringify({ schemaVersion: 0, name: projectName, document: { id: projectName, name: projectName, type: "DOCUMENT", children: [] } }, null, 2);

  const allPages = {
    ...safePages,
    [activePage.id]: { ...activePage, nodes: currentNodes },
  };

  const canvasPages = Object.values(allPages).map((page) => {
    const topLevel = Object.values(page.nodes)
      .filter((n) => n.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map((n) => canvasNodeToFigma(n, page.nodes));

    return {
      id: page.id,
      name: page.name,
      type: "CANVAS" as const,
      backgroundColor: { r: 0.059, g: 0.059, b: 0.102, a: 1 },
      children: topLevel,
    };
  });

  const figmaData: FigmaExportData = {
    schemaVersion: 1,
    name: projectName,
    document: {
      id: "document",
      name: projectName,
      type: "DOCUMENT",
      children: canvasPages,
    },
  };

  return JSON.stringify(figmaData, null, 2);
}
