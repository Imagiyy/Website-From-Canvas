import { create } from "zustand";
import type {
  NodeId,
  NodesById,
  CanvasNode,
  Viewport,
  ActiveTool,
  Geometry,
  ElementType,
  TextContent,
  ImageContent,
  AlignmentGuide,
  BreakpointKey,
} from "../types/canvas";

// ---------------------------------------------------------------------------
// Undo/redo snapshot — only the data that should be undoable
// ---------------------------------------------------------------------------
interface Snapshot {
  nodes: NodesById;
  selectedNodeIds: NodeId[];
  nextNumber: Record<ElementType, number>;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
interface CanvasStoreState {
  // ---- Undoable state ----
  nodes: NodesById;
  selectedNodeIds: Set<NodeId>;
  nextNumber: Record<ElementType, number>;

  // ---- Non-undoable state ----
  viewport: Viewport;
  activeTool: ActiveTool;
  activeBreakpoint: import("../types/canvas").BreakpointKey;
  clipboard: CanvasNode[] | null; // Array of nodes (to support copying groups or multi-selections)
  editingNodeId: NodeId | null; // Text node currently being edited inline
  alignmentGuides: AlignmentGuide[];
  imageUploadHandler: (() => void) | null;

  // ---- History ----
  past: Snapshot[];
  future: Snapshot[];
}

interface CanvasStoreActions {
  // Breakpoint Switcher
  setActiveBreakpoint: (bp: import("../types/canvas").BreakpointKey) => void;

  // Image Upload Trigger
  setImageUploadHandler: (fn: (() => void) | null) => void;
  triggerImageUpload: () => void;

  // Alignment Guides
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  clearAlignmentGuides: () => void;

  // Nudge
  nudgeSelected: (dx: number, dy: number) => void;

  // Nodes
  addNode: (node: CanvasNode) => void;
  updateNodeName: (id: NodeId, name: string) => void;
  updateNodeGeometry: (id: NodeId, partial: Partial<Geometry>) => void;
  updateNodeStyle: (id: NodeId, partial: Partial<import("../types/canvas").Style>) => void;
  updateNodeContent: (id: NodeId, content: TextContent | ImageContent, skipUndo?: boolean) => void;
  updateImageFit: (id: NodeId, fit: "cover" | "contain" | "fill") => void;
  deleteSelected: () => void;

  // Align & Distribute Actions for Selection
  alignSelected: (type: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => void;
  distributeSelected: (direction: "horizontal" | "vertical") => void;
  updateSelectedNodesStyle: (partial: Partial<import("../types/canvas").Style>) => void;

  // Selection
  selectNode: (id: NodeId | null, multiSelect?: boolean) => void;
  selectMultipleNodes: (ids: NodeId[]) => void;
  setEditingNode: (id: NodeId | null) => void;

  // Z-order
  bringToFront: () => void;
  sendToBack: () => void;
  moveForward: () => void;
  moveBackward: () => void;

  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Clipboard
  copySelected: () => void;
  paste: () => void;
  duplicate: () => void;

  // Undo/redo
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // Viewport (non-undoable)
  pan: (dx: number, dy: number) => void;
  zoomAtPoint: (newZoom: number, screenX: number, screenY: number) => void;
  resetView: () => void;

  // Tool
  setActiveTool: (tool: ActiveTool) => void;

  // Element creation helpers
  createRectangle: (x: number, y: number, width: number, height: number) => void;
  createText: (x: number, y: number) => void;
  createImage: (x: number, y: number, width: number, height: number, assetUrl: string) => void;
  createLine: (x1: number, y1: number, x2: number, y2: number) => void;
  createPolygon: (x: number, y: number, width?: number, height?: number, sides?: number) => void;
  createCircle: (x: number, y: number, width?: number, height?: number) => void;
  createCurve: (x: number, y: number, width?: number, height?: number) => void;
  createStar: (x: number, y: number, width?: number, height?: number, points?: number) => void;
  createShape3D: (x: number, y: number, width?: number, height?: number, sides?: number) => void;
}

type CanvasStore = CanvasStoreState & CanvasStoreActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HISTORY_LIMIT = 100;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const PASTE_OFFSET = 10;

const DEFAULT_NEXT_NUMBER: Record<ElementType, number> = {
  rectangle: 1,
  text: 1,
  image: 1,
  line: 1,
  group: 1,
  polygon: 1,
  circle: 1,
  curve: 1,
  star: 1,
  shape3d: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapshot(state: CanvasStoreState): Snapshot {
  return {
    nodes: structuredClone(state.nodes),
    selectedNodeIds: Array.from(state.selectedNodeIds),
    nextNumber: { ...state.nextNumber },
  };
}

/** Re-normalize order values for siblings sharing the same parentId */
function normalizeOrders(nodes: NodesById, parentId: NodeId | null = null): void {
  const siblings = Object.values(nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  siblings.forEach((node, i) => {
    node.order = i;
  });
}

/** Get the max order among siblings sharing parentId */
function maxOrder(nodes: NodesById, parentId: NodeId | null = null): number {
  const siblings = Object.values(nodes).filter((n) => n.parentId === parentId);
  if (siblings.length === 0) return -1;
  return Math.max(...siblings.map((n) => n.order));
}

/** Get full bounding box for a set of nodes in world space */
function getNodesBoundingBox(nodes: CanvasNode[]): Geometry {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    let x1 = n.geometry.x;
    let y1 = n.geometry.y;
    let x2 = n.geometry.x + n.geometry.width;
    let y2 = n.geometry.y + n.geometry.height;

    if (n.type === "line") {
      x2 = n.geometry.x + n.geometry.width;
      y2 = n.geometry.y + n.geometry.height;
      if (x1 > x2) [x1, x2] = [x2, x1];
      if (y1 > y2) [y1, y2] = [y2, y1];
    }

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return {
    x: minX,
    y: minY,
    width: Math.max(10, maxX - minX),
    height: Math.max(10, maxY - minY),
    rotation: 0,
  };
}

/** Collect node and all its nested children IDs */
function collectSubtreeIds(nodes: NodesById, rootId: NodeId): Set<NodeId> {
  const result = new Set<NodeId>();
  function recurse(id: NodeId) {
    result.add(id);
    const node = nodes[id];
    if (node?.type === "group" && node.children) {
      node.children.forEach(recurse);
    }
  }
  recurse(rootId);
  return result;
}

// Module-level timestamp to group rapid arrow key nudges into 1 undo step
let lastNudgeTime = 0;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // ---- Initial state ----
  nodes: {},
  selectedNodeIds: new Set(),
  nextNumber: { ...DEFAULT_NEXT_NUMBER },
  viewport: { panX: 0, panY: 0, zoom: 1 },
  activeTool: "select",
  activeBreakpoint: "desktop",
  clipboard: null,
  editingNodeId: null,
  alignmentGuides: [],
  imageUploadHandler: null,
  past: [],
  future: [],

  // -----------------------------------------------------------------------
  // Breakpoints & Image Upload
  // -----------------------------------------------------------------------
  setActiveBreakpoint: (bp) => {
    set({ activeBreakpoint: bp, editingNodeId: null });
  },

  setImageUploadHandler: (fn) => {
    set({ imageUploadHandler: fn });
  },

  triggerImageUpload: () => {
    const handler = get().imageUploadHandler;
    if (handler) {
      handler();
    }
  },

  // -----------------------------------------------------------------------
  // Alignment Guides & Nudge
  // -----------------------------------------------------------------------
  setAlignmentGuides: (guides) => {
    set({ alignmentGuides: guides });
  },

  clearAlignmentGuides: () => {
    set({ alignmentGuides: [] });
  },

  nudgeSelected: (dx, dy) => {
    const state = get();
    if (state.selectedNodeIds.size === 0) return;

    const now = Date.now();
    if (now - lastNudgeTime > 500) {
      state.pushUndo();
    }
    lastNudgeTime = now;

    state.selectedNodeIds.forEach((id) => {
      const node = state.nodes[id];
      if (node) {
        state.updateNodeGeometry(id, {
          x: node.geometry.x + dx,
          y: node.geometry.y + dy,
        });
      }
    });
  },

  // -----------------------------------------------------------------------
  // History helpers
  // -----------------------------------------------------------------------
  pushUndo: () => {
    const state = get();
    const snap = snapshot(state);
    set({
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    const currentSnap = snapshot(state);
    set({
      nodes: prev.nodes,
      selectedNodeIds: new Set(prev.selectedNodeIds),
      nextNumber: prev.nextNumber,
      editingNodeId: null,
      past: state.past.slice(0, -1),
      future: [currentSnap, ...state.future],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    const currentSnap = snapshot(state);
    set({
      nodes: next.nodes,
      selectedNodeIds: new Set(next.selectedNodeIds),
      nextNumber: next.nextNumber,
      editingNodeId: null,
      past: [...state.past, currentSnap],
      future: state.future.slice(1),
    });
  },

  // -----------------------------------------------------------------------
  // Node mutations
  // -----------------------------------------------------------------------
  addNode: (node) => {
    const state = get();
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [node.id]: node },
      selectedNodeIds: new Set([node.id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  updateNodeName: (id, name) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const snap = snapshot(state);
    set({
      nodes: {
        ...state.nodes,
        [id]: { ...node, name },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  updateNodeStyle: (id, partial) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const snap = snapshot(state);

    if (state.activeBreakpoint !== "desktop") {
      const bp = state.activeBreakpoint;
      const bpOverrides = node.breakpoints ?? {};
      const currentOverride = bpOverrides[bp] ?? {};
      const currentStyle = currentOverride.style ?? {};

      set({
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            breakpoints: {
              ...bpOverrides,
              [bp]: {
                ...currentOverride,
                style: {
                  ...currentStyle,
                  ...partial,
                  border: partial.border
                    ? { ...currentStyle.border, ...partial.border }
                    : currentStyle.border,
                  typography: partial.typography
                    ? { ...currentStyle.typography, ...partial.typography }
                    : currentStyle.typography,
                  shadow: partial.shadow
                    ? { ...currentStyle.shadow, ...partial.shadow }
                    : currentStyle.shadow,
                },
              },
            },
          },
        },
        past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
        future: [],
      });
      return;
    }

    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          style: {
            ...node.style,
            ...partial,
            border: partial.border
              ? { ...node.style.border, ...partial.border }
              : node.style.border,
            typography: partial.typography
              ? { ...node.style.typography, ...partial.typography }
              : node.style.typography,
            shadow: partial.shadow
              ? { ...node.style.shadow, ...partial.shadow }
              : node.style.shadow,
          },
        },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  alignSelected: (type) => {
    const state = get();
    if (state.selectedNodeIds.size < 2) return;

    const selectedNodes = Array.from(state.selectedNodeIds)
      .map((id) => state.nodes[id])
      .filter((n): n is CanvasNode => n !== undefined);

    if (selectedNodes.length < 2) return;

    const bbox = getNodesBoundingBox(selectedNodes);
    const snap = snapshot(state);
    const newNodes = { ...state.nodes };

    selectedNodes.forEach((node) => {
      let newX = node.geometry.x;
      let newY = node.geometry.y;

      switch (type) {
        case "left":
          newX = bbox.x;
          break;
        case "centerX":
          newX = bbox.x + bbox.width / 2 - node.geometry.width / 2;
          break;
        case "right":
          newX = bbox.x + bbox.width - node.geometry.width;
          break;
        case "top":
          newY = bbox.y;
          break;
        case "centerY":
          newY = bbox.y + bbox.height / 2 - node.geometry.height / 2;
          break;
        case "bottom":
          newY = bbox.y + bbox.height - node.geometry.height;
          break;
      }

      newNodes[node.id] = {
        ...node,
        geometry: { ...node.geometry, x: newX, y: newY },
      };
    });

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  distributeSelected: (direction) => {
    const state = get();
    if (state.selectedNodeIds.size < 3) return;

    const selectedNodes = Array.from(state.selectedNodeIds)
      .map((id) => state.nodes[id])
      .filter((n): n is CanvasNode => n !== undefined);

    if (selectedNodes.length < 3) return;

    const snap = snapshot(state);
    const newNodes = { ...state.nodes };

    if (direction === "horizontal") {
      const sorted = [...selectedNodes].sort((a, b) => a.geometry.x - b.geometry.x);
      const minX = sorted[0].geometry.x;
      const maxRight = sorted[sorted.length - 1].geometry.x + sorted[sorted.length - 1].geometry.width;
      const totalItemWidth = sorted.reduce((sum, n) => sum + n.geometry.width, 0);
      const totalGap = (maxRight - minX) - totalItemWidth;
      const gap = totalGap / (sorted.length - 1);

      let currentX = minX;
      sorted.forEach((node) => {
        newNodes[node.id] = {
          ...node,
          geometry: { ...node.geometry, x: currentX },
        };
        currentX += node.geometry.width + gap;
      });
    } else {
      const sorted = [...selectedNodes].sort((a, b) => a.geometry.y - b.geometry.y);
      const minY = sorted[0].geometry.y;
      const maxBottom = sorted[sorted.length - 1].geometry.y + sorted[sorted.length - 1].geometry.height;
      const totalItemHeight = sorted.reduce((sum, n) => sum + n.geometry.height, 0);
      const totalGap = (maxBottom - minY) - totalItemHeight;
      const gap = totalGap / (sorted.length - 1);

      let currentY = minY;
      sorted.forEach((node) => {
        newNodes[node.id] = {
          ...node,
          geometry: { ...node.geometry, y: currentY },
        };
        currentY += node.geometry.height + gap;
      });
    }

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  updateSelectedNodesStyle: (partial) => {
    const state = get();
    if (state.selectedNodeIds.size === 0) return;

    const snap = snapshot(state);
    const newNodes = { ...state.nodes };

    state.selectedNodeIds.forEach((id) => {
      const node = newNodes[id];
      if (!node) return;
      newNodes[id] = {
        ...node,
        style: {
          ...node.style,
          ...partial,
          border: partial.border
            ? { ...node.style.border, ...partial.border }
            : node.style.border,
          typography: partial.typography
            ? { ...node.style.typography, ...partial.typography }
            : node.style.typography,
          shadow: partial.shadow
            ? { ...node.style.shadow, ...partial.shadow }
            : node.style.shadow,
        },
      };
    });

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  updateNodeGeometry: (id, partial) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;

    if (state.activeBreakpoint !== "desktop") {
      const bp = state.activeBreakpoint;
      const bpOverrides = node.breakpoints ?? {};
      const currentOverride = bpOverrides[bp] ?? {};
      const currentGeom = currentOverride.geometry ?? {};

      set({
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            breakpoints: {
              ...bpOverrides,
              [bp]: {
                ...currentOverride,
                geometry: {
                  ...currentGeom,
                  ...partial,
                },
              },
            },
          },
        },
      });
      return;
    }

    const newNodes = { ...state.nodes };

    // If node is a group, moving/resizing it shifts/scales all child nodes proportionally
    if (node.type === "group" && node.children && (partial.x !== undefined || partial.y !== undefined || partial.width !== undefined || partial.height !== undefined)) {
      const oldX = node.geometry.x;
      const oldY = node.geometry.y;
      const oldW = node.geometry.width || 1;
      const oldH = node.geometry.height || 1;

      const newX = partial.x ?? oldX;
      const newY = partial.y ?? oldY;
      const newW = partial.width ?? oldW;
      const newH = partial.height ?? oldH;

      const dx = newX - oldX;
      const dy = newY - oldY;
      const scaleX = newW / oldW;
      const scaleY = newH / oldH;

      // Update group itself
      newNodes[id] = {
        ...node,
        geometry: { ...node.geometry, ...partial },
      };

      // Recursively transform all descendants
      const allChildIds = collectSubtreeIds(state.nodes, id);
      allChildIds.delete(id);

      allChildIds.forEach((childId) => {
        const child = newNodes[childId];
        if (!child) return;

        // Position relative to group top-left
        const relX = child.geometry.x - oldX;
        const relY = child.geometry.y - oldY;

        const updatedChildGeom: Geometry = {
          ...child.geometry,
          x: newX + relX * scaleX,
          y: newY + relY * scaleY,
          width: child.geometry.width * scaleX,
          height: child.geometry.height * scaleY,
        };

        newNodes[childId] = {
          ...child,
          geometry: updatedChildGeom,
        };
      });

      set({ nodes: newNodes });
      return;
    }

    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          geometry: { ...node.geometry, ...partial },
        },
      },
    });
  },

  updateNodeContent: (id, content, skipUndo = false) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;

    if (skipUndo) {
      set({
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            content,
          },
        },
      });
      return;
    }

    const snap = snapshot(state);
    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          content,
        },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  updateImageFit: (id, fit) => {
    const state = get();
    const node = state.nodes[id];
    if (!node || node.type !== "image" || !node.content || node.content.kind !== "image") return;
    const snap = snapshot(state);
    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          content: { ...node.content, fit },
        },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  deleteSelected: () => {
    const state = get();
    if (state.selectedNodeIds.size === 0) return;
    const snap = snapshot(state);

    const newNodes = { ...state.nodes };
    const idsToDelete = new Set<NodeId>();

    // Collect all selected nodes and their subtrees
    state.selectedNodeIds.forEach((id) => {
      const subtree = collectSubtreeIds(state.nodes, id);
      subtree.forEach((subId) => idsToDelete.add(subId));
    });

    // Remove references from parent groups
    idsToDelete.forEach((id) => {
      const node = newNodes[id];
      if (node?.parentId && newNodes[node.parentId]) {
        const parent = newNodes[node.parentId];
        if (parent.children) {
          parent.children = parent.children.filter((cId) => cId !== id);
        }
      }
      delete newNodes[id];
    });

    normalizeOrders(newNodes);

    set({
      nodes: newNodes,
      selectedNodeIds: new Set(),
      editingNodeId: null,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------
  selectNode: (id, multiSelect = false) => {
    const state = get();
    if (id === null) {
      set({ selectedNodeIds: new Set(), editingNodeId: null });
      return;
    }

    if (multiSelect) {
      const newSelection = new Set(state.selectedNodeIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      set({ selectedNodeIds: newSelection });
    } else {
      set({ selectedNodeIds: new Set([id]) });
    }
  },

  selectMultipleNodes: (ids) => {
    set({ selectedNodeIds: new Set(ids) });
  },

  setEditingNode: (id) => {
    set({ editingNodeId: id });
  },

  // -----------------------------------------------------------------------
  // Z-order
  // -----------------------------------------------------------------------
  bringToFront: () => {
    const state = get();
    if (state.selectedNodeIds.size !== 1) return;
    const selectedId = Array.from(state.selectedNodeIds)[0];
    const node = state.nodes[selectedId];
    if (!node) return;
    const snap = snapshot(state);

    const newNodes = { ...state.nodes };
    newNodes[node.id] = { ...node, order: maxOrder(newNodes, node.parentId) + 1 };
    normalizeOrders(newNodes, node.parentId);
    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  sendToBack: () => {
    const state = get();
    if (state.selectedNodeIds.size !== 1) return;
    const selectedId = Array.from(state.selectedNodeIds)[0];
    const node = state.nodes[selectedId];
    if (!node) return;
    const snap = snapshot(state);

    const newNodes = { ...state.nodes };
    newNodes[node.id] = { ...node, order: -1 };
    normalizeOrders(newNodes, node.parentId);
    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  moveForward: () => {
    const state = get();
    if (state.selectedNodeIds.size !== 1) return;
    const selectedId = Array.from(state.selectedNodeIds)[0];
    const node = state.nodes[selectedId];
    if (!node) return;

    const siblings = Object.values(state.nodes)
      .filter((n) => n.parentId === node.parentId)
      .sort((a, b) => a.order - b.order);

    const idx = siblings.findIndex((n) => n.id === node.id);
    if (idx === siblings.length - 1) return;

    const snap = snapshot(state);
    const swapTarget = siblings[idx + 1];
    const newNodes = { ...state.nodes };
    newNodes[node.id] = { ...node, order: swapTarget.order };
    newNodes[swapTarget.id] = { ...swapTarget, order: node.order };

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  moveBackward: () => {
    const state = get();
    if (state.selectedNodeIds.size !== 1) return;
    const selectedId = Array.from(state.selectedNodeIds)[0];
    const node = state.nodes[selectedId];
    if (!node) return;

    const siblings = Object.values(state.nodes)
      .filter((n) => n.parentId === node.parentId)
      .sort((a, b) => a.order - b.order);

    const idx = siblings.findIndex((n) => n.id === node.id);
    if (idx <= 0) return;

    const snap = snapshot(state);
    const swapTarget = siblings[idx - 1];
    const newNodes = { ...state.nodes };
    newNodes[node.id] = { ...node, order: swapTarget.order };
    newNodes[swapTarget.id] = { ...swapTarget, order: node.order };

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  // -----------------------------------------------------------------------
  // Grouping
  // -----------------------------------------------------------------------
  groupSelected: () => {
    const state = get();
    if (state.selectedNodeIds.size < 2) return;

    const selectedNodes = Array.from(state.selectedNodeIds)
      .map((id) => state.nodes[id])
      .filter((n): n is CanvasNode => n !== undefined);

    if (selectedNodes.length < 2) return;

    // Check parentId consistency — group items under their common parent if possible, else top-level
    const commonParentId = selectedNodes.every((n) => n.parentId === selectedNodes[0].parentId)
      ? selectedNodes[0].parentId
      : null;

    const bbox = getNodesBoundingBox(selectedNodes);
    const groupId = crypto.randomUUID();
    const groupNum = state.nextNumber.group;

    const snap = snapshot(state);
    const newNodes = { ...state.nodes };

    const childrenIds = selectedNodes.map((n) => n.id);

    // Create group node
    const groupNode: CanvasNode = {
      id: groupId,
      parentId: commonParentId,
      type: "group",
      name: `Group ${groupNum}`,
      order: maxOrder(newNodes, commonParentId) + 1,
      geometry: bbox,
      style: { opacity: 1 },
      children: childrenIds,
    };

    newNodes[groupId] = groupNode;

    // Update children parentId
    childrenIds.forEach((childId) => {
      newNodes[childId] = {
        ...newNodes[childId],
        parentId: groupId,
      };
    });

    normalizeOrders(newNodes, commonParentId);
    normalizeOrders(newNodes, groupId);

    set({
      nodes: newNodes,
      selectedNodeIds: new Set([groupId]),
      nextNumber: { ...state.nextNumber, group: groupNum + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  ungroupSelected: () => {
    const state = get();
    const selectedGroupIds = Array.from(state.selectedNodeIds).filter(
      (id) => state.nodes[id]?.type === "group"
    );

    if (selectedGroupIds.length === 0) return;

    const snap = snapshot(state);
    const newNodes = { ...state.nodes };
    const newSelection = new Set<NodeId>();

    selectedGroupIds.forEach((groupId) => {
      const groupNode = newNodes[groupId];
      if (!groupNode || !groupNode.children) return;

      const parentId = groupNode.parentId;

      groupNode.children.forEach((childId) => {
        if (newNodes[childId]) {
          newNodes[childId] = {
            ...newNodes[childId],
            parentId: parentId,
          };
          newSelection.add(childId);
        }
      });

      delete newNodes[groupId];
      normalizeOrders(newNodes, parentId);
    });

    set({
      nodes: newNodes,
      selectedNodeIds: newSelection,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  // -----------------------------------------------------------------------
  // Clipboard
  // -----------------------------------------------------------------------
  copySelected: () => {
    const state = get();
    if (state.selectedNodeIds.size === 0) return;

    const copiedNodes: CanvasNode[] = [];

    state.selectedNodeIds.forEach((id) => {
      const subtreeIds = collectSubtreeIds(state.nodes, id);
      subtreeIds.forEach((subId) => {
        const node = state.nodes[subId];
        if (node) {
          copiedNodes.push(structuredClone(node));
        }
      });
    });

    set({ clipboard: copiedNodes });
  },

  paste: () => {
    const state = get();
    if (!state.clipboard || state.clipboard.length === 0) return;

    const snap = snapshot(state);
    const idMap = new Map<NodeId, NodeId>();

    // Map old IDs to new IDs
    state.clipboard.forEach((node) => {
      idMap.set(node.id, crypto.randomUUID());
    });

    const newNodes = { ...state.nodes };
    const topLevelPastedIds: NodeId[] = [];
    const updatedNextNumber = { ...state.nextNumber };

    state.clipboard.forEach((oldNode) => {
      const newId = idMap.get(oldNode.id)!;
      const isTopLevelInPaste = !oldNode.parentId || !idMap.has(oldNode.parentId);

      const typeNum = updatedNextNumber[oldNode.type] || 1;
      updatedNextNumber[oldNode.type] = typeNum + 1;

      const namePrefix =
        oldNode.type === "rectangle"
          ? "Rectangle"
          : oldNode.type === "text"
          ? "Text"
          : oldNode.type === "image"
          ? "Image"
          : oldNode.type === "line"
          ? "Line"
          : "Group";

      const newNode: CanvasNode = {
        ...structuredClone(oldNode),
        id: newId,
        name: `${namePrefix} ${typeNum}`,
        parentId: isTopLevelInPaste ? null : idMap.get(oldNode.parentId!) || null,
        order: isTopLevelInPaste ? maxOrder(newNodes, null) + 1 : oldNode.order,
        geometry: {
          ...oldNode.geometry,
          x: isTopLevelInPaste ? oldNode.geometry.x + PASTE_OFFSET : oldNode.geometry.x,
          y: isTopLevelInPaste ? oldNode.geometry.y + PASTE_OFFSET : oldNode.geometry.y,
        },
      };

      if (newNode.type === "group" && newNode.children) {
        newNode.children = newNode.children
          .map((childId) => idMap.get(childId))
          .filter((cId): cId is NodeId => cId !== undefined);
      }

      newNodes[newId] = newNode;

      if (isTopLevelInPaste) {
        topLevelPastedIds.push(newId);
      }
    });

    normalizeOrders(newNodes, null);

    set({
      nodes: newNodes,
      selectedNodeIds: new Set(topLevelPastedIds),
      nextNumber: updatedNextNumber,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  duplicate: () => {
    const state = get();
    state.copySelected();
    get().paste();
  },

  // -----------------------------------------------------------------------
  // Viewport (non-undoable)
  // -----------------------------------------------------------------------
  pan: (dx, dy) => {
    const state = get();
    set({
      viewport: {
        ...state.viewport,
        panX: state.viewport.panX + dx,
        panY: state.viewport.panY + dy,
      },
    });
  },

  zoomAtPoint: (newZoom, screenX, screenY) => {
    const state = get();
    const { panX, panY, zoom } = state.viewport;
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    const canvasX = (screenX - panX) / zoom;
    const canvasY = (screenY - panY) / zoom;
    const newPanX = screenX - canvasX * clampedZoom;
    const newPanY = screenY - canvasY * clampedZoom;

    set({
      viewport: { panX: newPanX, panY: newPanY, zoom: clampedZoom },
    });
  },

  resetView: () => {
    set({ viewport: { panX: 0, panY: 0, zoom: 1 } });
  },

  // -----------------------------------------------------------------------
  // Tool
  // -----------------------------------------------------------------------
  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  // -----------------------------------------------------------------------
  // Element Creation Helpers
  // -----------------------------------------------------------------------
  createRectangle: (x, y, width, height) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.rectangle;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "rectangle",
      name: `Rectangle ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width, height, rotation: 0 },
      style: {
        fill: "#E5E7EB",
        opacity: 1,
        border: { color: "#6B7280", width: 1, style: "solid" },
        cornerRadius: 0,
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, rectangle: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createText: (x, y) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.text;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "text",
      name: `Text ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: 200, height: 40, rotation: 0 },
      style: {
        opacity: 1,
        typography: {
          fontFamily: "Inter, sans-serif",
          fontSize: 18,
          fontWeight: 400,
          color: "#E4E4F0",
          align: "left",
          lineHeight: 1.4,
        },
      },
      content: {
        kind: "text",
        text: "Text",
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      editingNodeId: id,
      nextNumber: { ...state.nextNumber, text: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createImage: (x, y, width, height, assetUrl) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.image;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "image",
      name: `Image ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width, height, rotation: 0 },
      style: { opacity: 1 },
      content: {
        kind: "image",
        assetUrl,
        fit: "cover",
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, image: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createLine: (x1, y1, x2, y2) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.line;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "line",
      name: `Line ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        rotation: 0,
      },
      style: {
        opacity: 1,
        border: {
          color: "#2563EB",
          width: 2,
          style: "solid",
        },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, line: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createPolygon: (x, y, width = 120, height = 120, sides = 5) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.polygon ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "polygon",
      name: `Polygon ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: width > 0 ? width : 120, height: height > 0 ? height : 120, rotation: 0 },
      style: {
        fill: "#3B82F6",
        opacity: 1,
        sides,
        border: { color: "#1D4ED8", width: 1, style: "solid" },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, polygon: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createCircle: (x, y, width = 120, height = 120) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.circle ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "circle",
      name: `Circle ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: width > 0 ? width : 120, height: height > 0 ? height : 120, rotation: 0 },
      style: {
        fill: "#10B981",
        opacity: 1,
        border: { color: "#047857", width: 1, style: "solid" },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, circle: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createCurve: (x, y, width = 160, height = 80) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.curve ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "curve",
      name: `Curve ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: width > 0 ? width : 160, height: height > 0 ? height : 80, rotation: 0 },
      style: {
        opacity: 1,
        curvature: 50,
        border: { color: "#EC4899", width: 4, style: "solid" },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, curve: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createStar: (x, y, width = 120, height = 120, starPoints = 5) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.star ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "star",
      name: `Star ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: width > 0 ? width : 120, height: height > 0 ? height : 120, rotation: 0 },
      style: {
        fill: "#F59E0B",
        opacity: 1,
        starPoints,
        innerRadius: 0.5,
        border: { color: "#B45309", width: 1, style: "solid" },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, star: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createShape3D: (x, y, width = 140, height = 140, sides = 4) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.shape3d ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "shape3d",
      name: `3D Shape ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: width > 0 ? width : 140, height: height > 0 ? height : 140, rotation: 0 },
      style: {
        fill: "#8B5CF6",
        opacity: 1,
        sides,
        depth3d: 30,
        color3d: "#6D28D9",
        border: { color: "#5B21B6", width: 1, style: "solid" },
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, shape3d: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },
}));
