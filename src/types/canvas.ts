// CanvasSite data model — Phase 0 Step 3
// Extended to support rectangle, text, image, line, group element types + alignment guides.

export type NodeId = string;

export type ElementType = "rectangle" | "text" | "image" | "line" | "group";

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
}

export interface Style {
  fill?: string; // hex or "transparent"
  opacity: number; // 0-1
  border?: {
    color: string;
    width: number;
    style: "solid" | "dashed" | "dotted";
  };
  cornerRadius?: number;
  typography?: TypographyStyle;
}

export interface TextContent {
  kind: "text";
  text: string;
}

export interface ImageContent {
  kind: "image";
  assetUrl: string; // plain image URL / data-URL
  fit: "cover" | "contain" | "fill";
}

export interface CanvasNode {
  id: NodeId;
  parentId: NodeId | null; // null = top-level; non-null = inside a group
  type: ElementType;
  name: string; // layer name, e.g. "Rectangle 1", "Text 2", "Group 1"
  order: number; // stacking order among siblings, lower = further back
  geometry: Geometry;
  style: Style;
  content?: TextContent | ImageContent;
  children?: NodeId[]; // only present if type === "group"
}

// The canvas holds a flat map of nodes, not a nested tree:
export type NodesById = Record<NodeId, CanvasNode>;

// ---------- Alignment & Snapping Types ----------

export interface AlignmentGuide {
  id: string;
  type: "vertical" | "horizontal";
  position: number; // X coordinate for vertical, Y coordinate for horizontal
  start: number; // Start extent on perpendicular axis
  end: number; // End extent on perpendicular axis
}

// ---------- Editor-only types (not part of the persisted schema) ----------

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number; // 1.0 = 100%
}

export type ActiveTool = "select" | "rectangle" | "text" | "image" | "line";

/** Which resize handle is being dragged */
export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

/** For line endpoint dragging */
export type LineEndpointHandle = "start" | "end";
