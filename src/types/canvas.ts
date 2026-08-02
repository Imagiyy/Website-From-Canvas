// CanvasSite data model — Phase 1 Step 1 (Responsive Breakpoints)
// Extended to support rectangle, text, image, line, group + alignment guides + responsive overrides.

export type NodeId = string;

export type ElementType =
  | "rectangle"
  | "text"
  | "image"
  | "line"
  | "group"
  | "polygon"
  | "circle"
  | "curve"
  | "star"
  | "shape3d"
  | "brush"
  | "pencil";

export type BreakpointKey = "desktop" | "tablet" | "mobile";

export const BREAKPOINT_WIDTHS: Record<BreakpointKey, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

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

export interface ShadowStyle {
  color: string;
  x: number;
  y: number;
  blur: number;
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
  shadow?: ShadowStyle;

  // Polygon, Star & Curve shape extensions
  sides?: number; // Number of sides for regular polygon (3-30)
  starPoints?: number; // Number of points for star (3-20)
  innerRadius?: number; // Ratio 0.1-0.9 for star inner radius
  curvature?: number; // Curvature intensity for curve shapes (-100 to 100)

  // 3D Visual Design extensions
  depth3d?: number; // Extrude depth in px (0-100)
  tiltX3d?: number; // 3D Tilt X angle (-60 to 60 deg)
  tiltY3d?: number; // 3D Tilt Y angle (-60 to 60 deg)
  color3d?: string; // Extrude face shadow color

  // Freehand Brush & Pencil extensions
  brushSize?: number; // 1-100px
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

export interface NodeOverride {
  geometry?: Partial<Geometry>;
  style?: Partial<Style>;
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
  breakpoints?: Partial<Record<"tablet" | "mobile", NodeOverride>>;
  pathData?: string; // SVG path data for freehand brush and pencil strokes
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

export type ActiveTool =
  | "select"
  | "rectangle"
  | "text"
  | "image"
  | "line"
  | "polygon"
  | "circle"
  | "curve"
  | "star"
  | "shape3d"
  | "brush"
  | "pencil"
  | "fill"
  | "eraser";

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
