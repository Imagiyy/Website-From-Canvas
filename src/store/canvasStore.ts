import { create } from "zustand";
import { loadCanvasState, saveCanvasState, clearCanvasState } from "../services/editorPersistence";
import { normalizeEditorState, syncPageNodes, DEFAULT_NEXT_NUMBER } from "../services/editorState";
import { sanitizeNodeChildren, isValidNodeMap } from "../utils/editorValidation";
import type {
  NodeId,
  NodesById,
  CanvasNode,
  Viewport,
  ActiveTool,
  Geometry,
  ElementType,
  ImageContent,
  AlignmentGuide,
  Style,
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
  // ---- Multi-Page State ----
  pages: import("../types/canvas").PagesById;
  activePageId: string;

  // ---- Undoable state ----
  nodes: NodesById;
  selectedNodeIds: Set<NodeId>;
  nextNumber: Record<ElementType, number>;

  // ---- Grid & Ruler State ----
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;

  // ---- Non-undoable state ----
  viewport: Viewport;
  activeTool: ActiveTool;
  activeBreakpoint: import("../types/canvas").BreakpointKey;
  pageHeight: Record<import("../types/canvas").BreakpointKey, number>;
  clipboard: CanvasNode[] | null; // Array of nodes (to support copying groups or multi-selections)
  editingNodeId: NodeId | null; // Text node currently being edited inline
  alignmentGuides: AlignmentGuide[];
  imageUploadHandler: (() => void) | null;
  activeColor: string;
  mouseCanvasPos: { x: number; y: number };
  isPreviewMode: boolean;

  // ---- History ----
  past: Snapshot[];
  future: Snapshot[];
}

interface CanvasStoreActions {
  setActiveColor: (color: string) => void;
  togglePreviewMode: () => void;
  setPreviewMode: (preview: boolean) => void;
  // Grid & Ruler Actions
  toggleShowGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  toggleShowRulers: () => void;

  // Multi-Page Actions
  addPage: (name?: string) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  setActivePage: (pageId: string) => void;
  setPages: (pages: import("../types/canvas").PagesById, activePageId?: string) => void;
  setPageBackgroundColor: (color: string, pageId?: string) => void;

  // Breakpoint Switcher & Page Height
  setActiveBreakpoint: (bp: import("../types/canvas").BreakpointKey) => void;
  setPageHeight: (bp: import("../types/canvas").BreakpointKey, height: number) => void;

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
  updateNode: (id: NodeId, partial: Partial<CanvasNode>) => void;
  updateNodeContent: (id: NodeId, content: any, skipUndo?: boolean) => void;
  updateImageFit: (id: NodeId, fit: "cover" | "contain" | "fill") => void;
  toggleNodeVisibility: (id: NodeId) => void;
  toggleNodeLock: (id: NodeId) => void;
  deleteSelected: () => void;
  deleteNode: (id: NodeId) => void;

  // Align & Distribute Actions for Selection
  alignSelected: (type: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => void;
  distributeSelected: (direction: "horizontal" | "vertical") => void;
  updateSelectedNodesStyle: (partial: Partial<import("../types/canvas").Style>) => void;

  // Selection
  selectNode: (id: NodeId | null, multiSelect?: boolean) => void;
  selectMultipleNodes: (ids: NodeId[]) => void;
  setEditingNode: (id: NodeId | null) => void;

  // Z-order & Drag Reordering
  reorderNodes: (draggedId: NodeId, targetId: NodeId, position: "before" | "after" | "inside") => void;
  bringToFront: () => void;
  sendToBack: () => void;
  moveForward: () => void;
  moveBackward: () => void;

  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;
  explodeFeatureNodeToNodes: (id?: NodeId) => void;

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
  zoomTo: (zoom: number) => void;
  resetView: () => void;
  setMouseCanvasPos: (x: number, y: number) => void;

  // Selection
  selectAll: () => void;

  // Canvas management
  clearCanvas: () => void;

  // Tool
  setActiveTool: (tool: ActiveTool) => void;

  // Element creation helpers
  createRectangle: (x: number, y: number, width: number, height: number) => void;
  createText: (x: number, y: number, width?: number, height?: number) => void;
  createImage: (x: number, y: number, width: number, height: number, assetUrl: string) => void;
  createLine: (x1: number, y1: number, x2: number, y2: number) => void;
  createPolygon: (x: number, y: number, width?: number, height?: number, sides?: number) => void;
  createCircle: (x: number, y: number, width?: number, height?: number) => void;
  createCurve: (x: number, y: number, width?: number, height?: number) => void;
  createStar: (x: number, y: number, width?: number, height?: number, points?: number) => void;
  createShape3D: (x: number, y: number, width?: number, height?: number, sides?: number) => void;
  createPathNode: (type: "brush" | "pencil" | "pen", pathData: string, bounds: Geometry, style?: Partial<Style>) => void;
  fillNodeColor: (nodeId: NodeId, color: string) => void;
  loadTemplate: (templateId: string) => void;
  createFormControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
  createNavControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
  createDataControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
  createFeedbackControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
  createLayoutActionControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
  createSectionControl: (type: import("../types/canvas").ElementType, name: string, options?: any) => void;
}

type CanvasStore = CanvasStoreState & CanvasStoreActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HISTORY_LIMIT = 100;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const PASTE_OFFSET = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapshot(state: CanvasStoreState): Snapshot {
  return {
    nodes: structuredClone(state.nodes),
    selectedNodeIds: Array.from(state.selectedNodeIds).filter((id) => state.nodes[id]),
    nextNumber: { ...state.nextNumber },
  };
}

function ensureValidSelection(selection: Set<NodeId>, nodes: NodesById): Set<NodeId> {
  return new Set(Array.from(selection).filter((id) => Boolean(nodes[id])));
}

function hasSelectedAncestor(nodes: NodesById, nodeId: NodeId, selectedIds: Set<NodeId>): boolean {
  let parentId = nodes[nodeId]?.parentId ?? null;
  while (parentId) {
    if (selectedIds.has(parentId)) return true;
    parentId = nodes[parentId]?.parentId ?? null;
  }
  return false;
}

function isValidParentRelationship(nodes: NodesById, childId: NodeId, parentId: NodeId | null): boolean {
  if (parentId === null) return true;
  const parent = nodes[parentId];
  if (!parent || parent.type !== "group") return false;
  if (parentId === childId) return false;
  let cursor: CanvasNode | undefined = parent;
  while (cursor?.parentId) {
    if (cursor.parentId === childId) return false;
    cursor = nodes[cursor.parentId];
  }
  return true;
}

/** Re-normalize order values for siblings sharing the same parentId */
function normalizeOrders(nodes: NodesById, parentId: NodeId | null = null): void {
  const siblings = Object.values(nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  siblings.forEach((node, i) => {
    if (node.order !== i) {
      nodes[node.id] = { ...node, order: i };
    }
  });
}

/**
 * Helper to push an undo snapshot and set new state in one call.
 * Eliminates the 42x repeated undo boilerplate pattern.
 */
function setWithUndo(
  get: () => CanvasStoreState,
  set: (partial: Partial<CanvasStoreState>) => void,
  changes: Partial<CanvasStoreState>
): void {
  const state = get();
  const snap = snapshot(state);
  set({
    ...changes,
    past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
    future: [],
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
// Auto-save helpers
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  });
}

function saveToLocalStorage(state: CanvasStoreState) {
  const safeNodes = sanitizeNodeChildren(isValidNodeMap(state.nodes) ? state.nodes : {});
  saveCanvasState({
    pages: {
      ...state.pages,
      [state.activePageId]: {
        ...state.pages[state.activePageId],
        nodes: safeNodes,
      },
    },
    activePageId: state.activePageId,
    nodes: safeNodes,
    nextNumber: state.nextNumber,
    activeColor: state.activeColor,
    pageHeight: state.pageHeight,
  });
}

function loadFromLocalStorage(): {
  pages: import("../types/canvas").PagesById;
  activePageId: string;
  nodes: NodesById;
  nextNumber: Record<ElementType, number>;
  activeColor: string;
  pageHeight: Record<import("../types/canvas").BreakpointKey, number>;
} | null {
  const saved = loadCanvasState();
  if (!saved) return null;

  const safeNodes = sanitizeNodeChildren(isValidNodeMap(saved.nodes) ? saved.nodes : {});
  return {
    pages: saved.pages,
    activePageId: saved.activePageId,
    nodes: safeNodes,
    nextNumber: saved.nextNumber,
    activeColor: saved.activeColor,
    pageHeight: saved.pageHeight,
  };
}

function scheduleAutoSave(state: CanvasStoreState) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveToLocalStorage(state), 500);
}

const savedState = loadFromLocalStorage();
const normalizedSavedState = savedState ? normalizeEditorState(savedState) : null;

const initialPages = normalizedSavedState?.pages ?? {
  "page-1": {
    id: "page-1",
    name: "Home",
    slug: "index",
    nodes: normalizedSavedState?.nodes ?? {},
  },
};

const initialActivePageId = normalizedSavedState?.activePageId ?? "page-1";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // ---- Initial state (loaded from localStorage if available) ----
  pages: initialPages,
  activePageId: initialActivePageId,
  nodes: initialPages[initialActivePageId]?.nodes ?? normalizedSavedState?.nodes ?? {},
  selectedNodeIds: new Set(),
  nextNumber: normalizedSavedState?.nextNumber ?? { ...DEFAULT_NEXT_NUMBER },
  showGrid: true,
  gridSize: 10,
  snapToGrid: true,
  showRulers: true,
  viewport: { panX: 0, panY: 0, zoom: 1 },
  activeTool: "select",
  activeBreakpoint: "desktop",
  pageHeight: normalizedSavedState?.pageHeight ?? { desktop: 1200, tablet: 1400, mobile: 1600 },
  clipboard: null,
  editingNodeId: null,
  alignmentGuides: [],
  imageUploadHandler: null,
  activeColor: normalizedSavedState?.activeColor ?? "#3B82F6",
  mouseCanvasPos: { x: 0, y: 0 },
  isPreviewMode: false,

  setActiveColor: (color: string) => set({ activeColor: color }),
  togglePreviewMode: () => set((s) => ({ isPreviewMode: !s.isPreviewMode, selectedNodeIds: new Set(), editingNodeId: null })),
  setPreviewMode: (preview) => set({ isPreviewMode: preview, selectedNodeIds: new Set(), editingNodeId: null }),
  past: [],
  future: [],

  // -----------------------------------------------------------------------
  // Grid & Ruler Actions
  // -----------------------------------------------------------------------
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleShowRulers: () => set((s) => ({ showRulers: !s.showRulers })),

  // -----------------------------------------------------------------------
  // Multi-Page Actions
  // -----------------------------------------------------------------------
  addPage: (name) => {
    const state = get();
    const pageCount = Object.keys(state.pages).length + 1;
    const pageName = name ?? `Page ${pageCount}`;
    const slug = pageName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const newPageId = `page-${Date.now()}`;

    const updatedPages = syncPageNodes(state.pages, state.activePageId, state.nodes);
    updatedPages[newPageId] = {
      id: newPageId,
      name: pageName,
      slug: slug || `page-${pageCount}`,
      nodes: {},
    };

    set({
      pages: updatedPages,
      activePageId: newPageId,
      nodes: {},
      selectedNodeIds: new Set(),
      editingNodeId: null,
      past: [],
      future: [],
    });
  },

  deletePage: (pageId) => {
    const state = get();
    if (Object.keys(state.pages).length <= 1) return;

    const updatedPages = { ...state.pages };
    delete updatedPages[pageId];

    let nextActiveId = state.activePageId;
    let nextNodes = state.nodes;

    if (state.activePageId === pageId) {
      const remainingIds = Object.keys(updatedPages);
      nextActiveId = remainingIds[0];
      nextNodes = updatedPages[nextActiveId].nodes;
    }

    set({
      pages: updatedPages,
      activePageId: nextActiveId,
      nodes: nextNodes,
      selectedNodeIds: new Set(),
      editingNodeId: null,
      past: [],
      future: [],
    });
  },

  renamePage: (pageId, name) => {
    const state = get();
    const page = state.pages[pageId];
    if (!page || !name.trim()) return;

    const trimmed = name.trim();
    const slug = pageId === "page-1" ? "index" : trimmed.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    const updatedPages = {
      ...state.pages,
      [pageId]: {
        ...page,
        name: trimmed,
        slug: slug || page.slug,
      },
    };

    set({ pages: updatedPages });
  },

  setPageBackgroundColor: (color, pageId) => {
    const state = get();
    const targetId = pageId || state.activePageId;
    const page = state.pages[targetId];
    if (!page) return;

    const updatedPages = {
      ...state.pages,
      [targetId]: {
        ...page,
        backgroundColor: color,
      },
    };

    set({ pages: updatedPages });
  },

  setActivePage: (pageId) => {
    const state = get();
    if (pageId === state.activePageId || !state.pages[pageId]) return;

    const updatedPages = syncPageNodes(state.pages, state.activePageId, state.nodes);
    const nextPageNodes = updatedPages[pageId]?.nodes ?? {};
    const safePageNodes = sanitizeNodeChildren(isValidNodeMap(nextPageNodes) ? nextPageNodes : {});

    const normalized = normalizeEditorState({
      pages: {
        ...updatedPages,
        [pageId]: {
          ...updatedPages[pageId],
          nodes: safePageNodes,
        },
      },
      activePageId: pageId,
      nodes: safePageNodes,
      nextNumber: state.nextNumber,
      activeColor: state.activeColor,
      pageHeight: state.pageHeight,
    });

    set({
      pages: normalized.pages,
      activePageId: normalized.activePageId,
      nodes: normalized.nodes,
      selectedNodeIds: new Set(),
      editingNodeId: null,
      past: [],
      future: [],
    });
  },

  setPages: (pages, activePageId) => {
    const normalized = normalizeEditorState({ pages, activePageId });
    set({
      pages: normalized.pages,
      activePageId: normalized.activePageId,
      nodes: normalized.nodes,
      selectedNodeIds: new Set(),
      editingNodeId: null,
      past: [],
      future: [],
    });
  },

  // -----------------------------------------------------------------------
  // Breakpoints & Image Upload
  // -----------------------------------------------------------------------
  setActiveBreakpoint: (bp) => {
    set({ activeBreakpoint: bp, editingNodeId: null });
  },

  setPageHeight: (bp, height) => {
    const state = get();
    set({
      pageHeight: {
        ...state.pageHeight,
        [bp]: Math.max(400, height),
      },
    });
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

    const newNodes = { ...state.nodes };
    state.selectedNodeIds.forEach((id) => {
      const node = newNodes[id];
      if (node) {
        newNodes[id] = {
          ...node,
          geometry: {
            ...node.geometry,
            x: node.geometry.x + dx,
            y: node.geometry.y + dy,
          },
        };
      }
    });
    set({ nodes: newNodes });
  },

  // -----------------------------------------------------------------------
  // History helpers
  // -----------------------------------------------------------------------
  pushUndo: () => {
    setWithUndo(get, set, {});
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
    setWithUndo(get, set, {
      nodes: { ...state.nodes, [node.id]: node },
      selectedNodeIds: new Set([node.id]),
    });
  },

  updateNodeName: (id, name) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    setWithUndo(get, set, {
      nodes: {
        ...state.nodes,
        [id]: { ...node, name },
      },
    });
  },

  updateNodeStyle: (id, partial) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;

    if (state.activeBreakpoint !== "desktop") {
      const bp = state.activeBreakpoint;
      const bpOverrides = node.breakpoints ?? {};
      const currentOverride = bpOverrides[bp] ?? {};
      const currentStyle = currentOverride.style ?? {};

      setWithUndo(get, set, {
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            breakpoints: {
              ...bpOverrides,
              [bp]: {
                ...currentOverride,
                style: { ...currentStyle, ...partial },
              },
            },
          },
        },
      });
      return;
    }

    setWithUndo(get, set, {
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          style: { ...node.style, ...partial },
        },
      },
    });
  },

  updateNode: (id, partial) => {
    const state = get();
    const target = state.nodes[id];
    if (!target) return;
    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...target,
          ...partial,
        },
      },
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

  updateImageFit: (id: NodeId, fit: "cover" | "contain" | "fill") => {
    const state = get();
    const node = state.nodes[id];
    if (!node || node.type !== "image" || node.content?.kind !== "image") return;
    const snap = snapshot(state);
    const updatedContent: ImageContent = { ...node.content, fit };
    set({
      nodes: {
        ...state.nodes,
        [id]: {
          ...node,
          content: updatedContent,
        },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  deleteNode: (id: NodeId) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const snap = snapshot(state);
    const newNodes = { ...state.nodes };

    // Remove from parent group's children array
    if (node.parentId && newNodes[node.parentId]) {
      const parent = newNodes[node.parentId];
      if (parent.children) {
        newNodes[node.parentId] = {
          ...parent,
          children: parent.children.filter((cId) => cId !== id),
        };
      }
    }

    // Also delete all children recursively if it's a group
    const subtree = collectSubtreeIds(state.nodes, id);
    subtree.forEach((subId) => delete newNodes[subId]);

    const newSelected = new Set(state.selectedNodeIds);
    subtree.forEach((subId) => newSelected.delete(subId));
    set({
      nodes: newNodes,
      selectedNodeIds: newSelected,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  toggleNodeVisibility: (id) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const snap = snapshot(state);
    set({
      nodes: {
        ...state.nodes,
        [id]: { ...node, visible: node.visible === false ? true : false },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  toggleNodeLock: (id) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const snap = snapshot(state);
    const newLocked = !(node.locked ?? false);
    const newSelected = new Set(state.selectedNodeIds);
    if (newLocked) {
      newSelected.delete(id);
    }
    set({
      nodes: {
        ...state.nodes,
        [id]: { ...node, locked: newLocked },
      },
      selectedNodeIds: newSelected,
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
          newNodes[node.parentId] = {
            ...parent,
            children: parent.children.filter((cId) => cId !== id),
          };
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

    if (!state.nodes[id]) {
      set({ selectedNodeIds: new Set(), editingNodeId: null });
      return;
    }

    if (multiSelect) {
      const newSelection = ensureValidSelection(new Set(state.selectedNodeIds), state.nodes);
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
    const state = get();
    const validIds = ids.filter((id) => Boolean(state.nodes[id]));
    set({ selectedNodeIds: new Set(validIds) });
  },

  setEditingNode: (id) => {
    set({ editingNodeId: id });
  },

  // -----------------------------------------------------------------------
  // Z-order & Drag Reordering
  // -----------------------------------------------------------------------
  reorderNodes: (draggedId, targetId, position) => {
    const state = get();
    if (draggedId === targetId) return;

    const dragged = state.nodes[draggedId];
    const target = state.nodes[targetId];
    if (!dragged || !target) return;

    // Prevent dragging a parent into its own descendant
    let checkParent: CanvasNode | undefined = target;
    while (checkParent) {
      if (checkParent.id === draggedId) return;
      checkParent = checkParent.parentId ? state.nodes[checkParent.parentId] : undefined;
    }

    const snap = snapshot(state);
    const newNodes: NodesById = {};
    for (const key of Object.keys(state.nodes)) {
      newNodes[key] = { ...state.nodes[key] };
    }

    const oldParentId = dragged.parentId;

    // Remove dragged from old parent's children array if applicable
    if (oldParentId && newNodes[oldParentId]?.children) {
      newNodes[oldParentId] = {
        ...newNodes[oldParentId],
        children: newNodes[oldParentId].children!.filter((id) => id !== draggedId),
      };
    }

    if (position === "inside" && target.type === "group") {
      newNodes[draggedId] = { ...newNodes[draggedId], parentId: targetId };
      if (!newNodes[targetId].children) {
        newNodes[targetId] = { ...newNodes[targetId], children: [] };
      }
      if (!newNodes[targetId].children!.includes(draggedId)) {
        newNodes[targetId] = {
          ...newNodes[targetId],
          children: [...newNodes[targetId].children!, draggedId],
        };
      }
      const groupSiblings = Object.values(newNodes).filter((n) => n.parentId === targetId);
      const maxOrd = groupSiblings.length > 0 ? Math.max(...groupSiblings.map((n) => n.order)) : -1;
      newNodes[draggedId] = { ...newNodes[draggedId], order: maxOrd + 1 };
    } else {
      const newParentId = target.parentId;
      newNodes[draggedId] = { ...newNodes[draggedId], parentId: newParentId };

      if (newParentId && newNodes[newParentId]) {
        if (!newNodes[newParentId].children) {
          newNodes[newParentId] = { ...newNodes[newParentId], children: [] };
        }
        if (!newNodes[newParentId].children!.includes(draggedId)) {
          newNodes[newParentId] = {
            ...newNodes[newParentId],
            children: [...newNodes[newParentId].children!, draggedId],
          };
        }
      }

      const siblings = Object.values(newNodes)
        .filter((n) => n.parentId === newParentId && n.id !== draggedId)
        .sort((a, b) => a.order - b.order);

      const targetIdx = siblings.findIndex((n) => n.id === targetId);

      if (targetIdx !== -1) {
        const insertIdx = position === "before" ? targetIdx : targetIdx + 1;
        siblings.splice(insertIdx, 0, newNodes[draggedId]);
      } else {
        siblings.push(newNodes[draggedId]);
      }

      siblings.forEach((n, idx) => {
        newNodes[n.id] = { ...newNodes[n.id], order: idx };
      });
    }

    normalizeOrders(newNodes, oldParentId);
    if (oldParentId !== newNodes[draggedId].parentId) {
      normalizeOrders(newNodes, newNodes[draggedId].parentId);
    }

    set({
      nodes: newNodes,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

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
    const validSelection = ensureValidSelection(state.selectedNodeIds, state.nodes);
    if (validSelection.size < 2) return;

    const selectedNodes = Array.from(validSelection)
      .map((id) => state.nodes[id])
      .filter((n): n is CanvasNode => n !== undefined);

    // Allow grouping groups (nested groups) — only block if a selected node is an ancestor of another selected node

    const parentIds = new Set(selectedNodes.map((n) => n.parentId));
    if (parentIds.size > 1) return;

    const hasNestedSelection = selectedNodes.some((node) => hasSelectedAncestor(state.nodes, node.id, validSelection));
    if (hasNestedSelection) return;

    const commonParentId = selectedNodes.every((n) => n.parentId === selectedNodes[0].parentId)
      ? selectedNodes[0].parentId
      : null;

    const bbox = getNodesBoundingBox(selectedNodes);
    const groupId = crypto.randomUUID();
    const groupNum = state.nextNumber.group;

    const snap = snapshot(state);
    const newNodes = sanitizeNodeChildren({ ...state.nodes });
    const childrenIds = selectedNodes.map((n) => n.id);

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

    const groupParent = commonParentId ? newNodes[commonParentId] : null;
    if (groupParent && groupParent.type !== "group" && commonParentId !== null) {
      return;
    }

    newNodes[groupId] = groupNode;

    childrenIds.forEach((childId) => {
      const child = newNodes[childId];
      if (!child) return;
      if (!isValidParentRelationship(newNodes, childId, groupId)) return;
      newNodes[childId] = {
        ...child,
        parentId: groupId,
      };
    });

    normalizeOrders(newNodes, commonParentId);
    normalizeOrders(newNodes, groupId);

    set({
      nodes: sanitizeNodeChildren(newNodes),
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
          const nextChild = { ...newNodes[childId], parentId };
          if (isValidParentRelationship(newNodes, childId, parentId)) {
            newNodes[childId] = nextChild;
            newSelection.add(childId);
          }
        }
      });

      delete newNodes[groupId];
      normalizeOrders(newNodes, parentId);
    });

    set({
      nodes: newNodes,
      selectedNodeIds: ensureValidSelection(newSelection, newNodes),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  explodeFeatureNodeToNodes: (targetId) => {
    const state = get();
    const id = targetId || Array.from(state.selectedNodeIds)[0];
    if (!id) return;
    const node = state.nodes[id];
    if (!node) return;

    const snap = snapshot(state);
    const newNodes = { ...state.nodes };
    delete newNodes[id];

    const { x, y, width, height } = node.geometry;
    const content = (node.content as any) || {};
    const parentId = node.parentId;
    const generatedChildIds: string[] = [];

    // 1. Create Base Frame Node
    const baseId = crypto.randomUUID();
    newNodes[baseId] = {
      id: baseId,
      parentId,
      type: "rectangle",
      name: `${node.name} (Background Frame)`,
      order: maxOrder(newNodes, parentId) + 1,
      geometry: { x, y, width, height, rotation: node.geometry.rotation },
      style: { ...node.style, fill: node.style.fill || "#181826", cornerRadius: node.style.cornerRadius || 8 },
    };
    generatedChildIds.push(baseId);

    // 2. Extract sub-elements according to node type
    if (node.type === "navHeader") {
      const brandText = content.brand || "CanvasSite";
      const links = content.links || ["Home", "Features", "Pricing", "Docs"];
      const signInText = content.signInText || "Sign In";
      const ctaText = content.ctaText || "Get Started";

      if (content.showLogo !== false) {
        const logoId = crypto.randomUUID();
        newNodes[logoId] = {
          id: logoId,
          parentId,
          type: "text",
          name: "Brand Logo",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + 16, y: y + (height - 24) / 2, width: 140, height: 24, rotation: 0 },
          style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#ffffff", align: "left", lineHeight: 1.4 } },
          content: { kind: "text", text: `⚡ ${brandText}` },
        };
        generatedChildIds.push(logoId);
      }

      if (content.showLinks !== false) {
        links.forEach((link: string, idx: number) => {
          const linkId = crypto.randomUUID();
          newNodes[linkId] = {
            id: linkId,
            parentId,
            type: "text",
            name: `Link - ${link}`,
            order: maxOrder(newNodes, parentId) + 1,
            geometry: { x: x + 200 + idx * 85, y: y + (height - 20) / 2, width: 75, height: 20, rotation: 0 },
            style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: idx === 0 ? 600 : 400, color: idx === 0 ? "#3b82f6" : "#a0a0c0", align: "left", lineHeight: 1.4 } },
            content: { kind: "text", text: link },
          };
          generatedChildIds.push(linkId);
        });
      }

      if (content.showSignIn !== false) {
        const signInId = crypto.randomUUID();
        newNodes[signInId] = {
          id: signInId,
          parentId,
          type: "text",
          name: "Sign In Link",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + width - 210, y: y + (height - 20) / 2, width: 70, height: 20, rotation: 0 },
          style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 400, color: "#a0a0c0", align: "left", lineHeight: 1.4 } },
          content: { kind: "text", text: signInText },
        };
        generatedChildIds.push(signInId);
      }

      if (content.showCta !== false) {
        const ctaId = crypto.randomUUID();
        newNodes[ctaId] = {
          id: ctaId,
          parentId,
          type: "rectangle",
          name: "CTA Button",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + width - 130, y: y + (height - 34) / 2, width: 110, height: 34, rotation: 0 },
          style: { opacity: 1, fill: "#3b82f6", cornerRadius: 6, typography: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#ffffff", align: "center", lineHeight: 1.4 } },
          content: { kind: "text", text: ctaText },
        };
        generatedChildIds.push(ctaId);
      }
    } else {
      // General Feature Node Decomposition (Page Sections, Form Controls, Data Display, Overlays, Layouts)
      if (content.badge) {
        const badgeId = crypto.randomUUID();
        newNodes[badgeId] = {
          id: badgeId,
          parentId,
          type: "rectangle",
          name: "Badge Tag",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + width - 90, y: y + 16, width: 70, height: 22, rotation: 0 },
          style: { opacity: 1, fill: "rgba(59,130,246,0.2)", cornerRadius: 12, border: { color: "#3b82f6", width: 1, style: "solid" }, typography: { fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: "#60a5fa", align: "center", lineHeight: 1.4 } },
          content: { kind: "text", text: content.badge },
        };
        generatedChildIds.push(badgeId);
      }

      if (content.title || content.text || node.name) {
        const titleId = crypto.randomUUID();
        newNodes[titleId] = {
          id: titleId,
          parentId,
          type: "text",
          name: "Heading / Title",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + 20, y: y + 20, width: width - 110, height: 32, rotation: 0 },
          style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: "#ffffff", align: "left", lineHeight: 1.4 } },
          content: { kind: "text", text: content.title || content.text || node.name },
        };
        generatedChildIds.push(titleId);
      }

      if (content.subtitle) {
        const subId = crypto.randomUUID();
        newNodes[subId] = {
          id: subId,
          parentId,
          type: "text",
          name: "Subtitle / Tagline",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + 20, y: y + 56, width: width - 40, height: 24, rotation: 0 },
          style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 400, color: "#94a3b8", align: "left", lineHeight: 1.4 } },
          content: { kind: "text", text: content.subtitle },
        };
        generatedChildIds.push(subId);
      }

      // Arrays (links, columns, items, trail)
      const listItems = content.links || content.columns || content.items || content.trail || content.tabs;
      if (Array.isArray(listItems)) {
        listItems.forEach((item: any, idx: number) => {
          const itemText = typeof item === "string" ? item : item.label || item.title || `Item ${idx + 1}`;
          const itemId = crypto.randomUUID();
          newNodes[itemId] = {
            id: itemId,
            parentId,
            type: "text",
            name: `Item - ${itemText}`,
            order: maxOrder(newNodes, parentId) + 1,
            geometry: { x: x + 20 + (idx % 4) * 120, y: y + 90 + Math.floor(idx / 4) * 28, width: 110, height: 24, rotation: 0 },
            style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: "#cbd5e1", align: "left", lineHeight: 1.4 } },
            content: { kind: "text", text: itemText },
          };
          generatedChildIds.push(itemId);
        });
      }

      // Primary Button
      if (content.primaryButtonText || content.buttonText || content.confirmText) {
        const btnId = crypto.randomUUID();
        newNodes[btnId] = {
          id: btnId,
          parentId,
          type: "rectangle",
          name: "Primary Action Button",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + 20, y: y + height - 52, width: 120, height: 36, rotation: 0 },
          style: { opacity: 1, fill: "#3b82f6", cornerRadius: 6, typography: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#ffffff", align: "center", lineHeight: 1.4 } },
          content: { kind: "text", text: content.primaryButtonText || content.buttonText || content.confirmText || "Button" },
        };
        generatedChildIds.push(btnId);
      }

      // Secondary Button
      if (content.secondaryButtonText || content.cancelText) {
        const secBtnId = crypto.randomUUID();
        newNodes[secBtnId] = {
          id: secBtnId,
          parentId,
          type: "rectangle",
          name: "Secondary Action Button",
          order: maxOrder(newNodes, parentId) + 1,
          geometry: { x: x + 150, y: y + height - 52, width: 120, height: 36, rotation: 0 },
          style: { opacity: 1, fill: "rgba(255,255,255,0.08)", cornerRadius: 6, border: { color: "rgba(255,255,255,0.15)", width: 1, style: "solid" }, typography: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#e2e8f0", align: "center", lineHeight: 1.4 } },
          content: { kind: "text", text: content.secondaryButtonText || content.cancelText || "Cancel" },
        };
        generatedChildIds.push(secBtnId);
      }
    }

    // 3. Create Group Node
    const groupId = crypto.randomUUID();
    newNodes[groupId] = {
      id: groupId,
      parentId,
      type: "group",
      name: `${node.name} (Editable Parts)`,
      order: maxOrder(newNodes, parentId) + 1,
      geometry: { x, y, width, height, rotation: 0 },
      style: { opacity: 1 },
      children: generatedChildIds,
    };

    set({
      nodes: newNodes,
      selectedNodeIds: new Set([groupId, ...generatedChildIds]),
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

      const namePrefixMap: Record<string, string> = {
        rectangle: "Rectangle",
        text: "Text",
        image: "Image",
        line: "Line",
        group: "Group",
        polygon: "Polygon",
        circle: "Circle",
        curve: "Curve",
        star: "Star",
        shape3d: "3D Shape",
        brush: "Brush",
        pencil: "Pencil",
        pen: "Pen Vector",
        component: "Component",
        componentInstance: "Component Instance",
        product: "Product",
      };
      const namePrefix = namePrefixMap[oldNode.type] ?? "Element";

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

  zoomTo: (zoom) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const state = get();
    // Zoom towards center of viewport
    const svgEl = document.querySelector('.canvas') as SVGSVGElement | null;
    const w = svgEl?.clientWidth ?? 800;
    const h = svgEl?.clientHeight ?? 600;
    const centerX = w / 2;
    const centerY = h / 2;
    const { panX, panY, zoom: oldZoom } = state.viewport;
    const canvasX = (centerX - panX) / oldZoom;
    const canvasY = (centerY - panY) / oldZoom;
    const newPanX = centerX - canvasX * clampedZoom;
    const newPanY = centerY - canvasY * clampedZoom;
    set({ viewport: { panX: newPanX, panY: newPanY, zoom: clampedZoom } });
  },

  setMouseCanvasPos: (x, y) => {
    set({ mouseCanvasPos: { x, y } });
  },

  // -----------------------------------------------------------------------
  // Select All
  // -----------------------------------------------------------------------
  selectAll: () => {
    const state = get();
    const topLevelIds = Object.values(state.nodes)
      .filter((n) => n.parentId === null)
      .map((n) => n.id);
    set({ selectedNodeIds: ensureValidSelection(new Set(topLevelIds), state.nodes) });
  },

  // -----------------------------------------------------------------------
  // Clear Canvas
  // -----------------------------------------------------------------------
  clearCanvas: () => {
    const state = get();
    const snap = snapshot(state);
    set({
      nodes: {},
      selectedNodeIds: new Set(),
      nextNumber: { ...DEFAULT_NEXT_NUMBER },
      editingNodeId: null,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
    clearCanvasState();
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

  createText: (x, y, width, height) => {
    const state = get();
    const id = crypto.randomUUID();
    const num = state.nextNumber.text;
    const node: CanvasNode = {
      id,
      parentId: null,
      type: "text",
      name: `Text ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: { x, y, width: (width && width > 10) ? width : 200, height: (height && height > 10) ? height : 40, rotation: 0 },
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

  createPathNode: (type, pathData, bounds, customStyle) => {
    const state = get();
    const id = crypto.randomUUID();
    const isPencil = type === "pencil";
    const isPen = type === "pen";
    const num = state.nextNumber[type] ?? 1;
    const node: CanvasNode = {
      id,
      parentId: null,
      type,
      name: `${isPen ? "Pen Vector" : isPencil ? "Pencil" : "Brush"} ${num}`,
      order: maxOrder(state.nodes) + 1,
      geometry: bounds,
      pathData,
      style: {
        fill: "transparent",
        opacity: 1,
        border: { color: customStyle?.border?.color ?? state.activeColor, width: isPencil || isPen ? 2 : 12, style: "solid" },
        brushSize: isPencil || isPen ? 2 : 12,
        ...customStyle,
      },
    };
    const snap = snapshot(state);
    set({
      nodes: { ...state.nodes, [id]: node },
      selectedNodeIds: new Set([id]),
      nextNumber: { ...state.nextNumber, [type]: num + 1 },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  fillNodeColor: (nodeId, color) => {
    const state = get();
    const target = state.nodes[nodeId];
    if (!target) return;

    const snap = snapshot(state);

    // If node is text, fill typography color; if line/brush/pencil/pen/curve, fill stroke color; else fill background color!
    let updatedStyle = { ...target.style };
    if (target.type === "text" && target.style.typography) {
      updatedStyle.typography = { ...target.style.typography, color };
    } else if (
      target.type === "line" ||
      target.type === "brush" ||
      target.type === "pencil" ||
      target.type === "pen" ||
      target.type === "curve"
    ) {
      const currentWidth = target.style.border?.width ?? target.style.brushSize ?? 2;
      updatedStyle.border = {
        color,
        width: Math.max(1, currentWidth),
        style: target.style.border?.style ?? "solid",
      };
      updatedStyle.fill = color;
    } else {
      updatedStyle.fill = color;
    }

    set({
      nodes: {
        ...state.nodes,
        [nodeId]: {
          ...target,
          style: updatedStyle,
        },
      },
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  loadTemplate: (templateId: string) => {
    const state = get();
    const snap = snapshot(state);

    const templateNodes: Record<string, CanvasNode> = {};

    if (templateId === "saas") {
      const heroId = crypto.randomUUID();
      const titleId = crypto.randomUUID();
      const subId = crypto.randomUUID();
      const btnId = crypto.randomUUID();
      const f1Id = crypto.randomUUID();
      const f2Id = crypto.randomUUID();
      const f3Id = crypto.randomUUID();

      templateNodes[heroId] = {
        id: heroId, parentId: null, type: "rectangle", name: "Hero Banner", order: 1,
        geometry: { x: 100, y: 80, width: 1000, height: 420, rotation: 0 },
        style: { opacity: 1, fill: "#1a1a2e", cornerRadius: 20, border: { color: "rgba(255,255,255,0.1)", width: 1, style: "solid" } },
      };
      templateNodes[titleId] = {
        id: titleId, parentId: heroId, type: "text", name: "Headline", order: 2,
        geometry: { x: 160, y: 140, width: 880, height: 70, rotation: 0 },
        style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 44, fontWeight: 800, color: "#ffffff", align: "left", lineHeight: 1.2 } },
        content: { kind: "text", text: "Build & Publish Websites Visual-First" },
      };
      templateNodes[subId] = {
        id: subId, parentId: heroId, type: "text", name: "Subtitle", order: 3,
        geometry: { x: 160, y: 220, width: 760, height: 50, rotation: 0 },
        style: { opacity: 1, typography: { fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 400, color: "#a0a0c0", align: "left", lineHeight: 1.5 } },
        content: { kind: "text", text: "Transform canvas drawings into production-ready React, Next.js & HTML code." },
      };
      templateNodes[btnId] = {
        id: btnId, parentId: heroId, type: "rectangle", name: "CTA Button", order: 4,
        geometry: { x: 160, y: 300, width: 180, height: 48, rotation: 0 },
        style: { opacity: 1, fill: "#3b82f6", cornerRadius: 10 },
      };
      templateNodes[f1Id] = {
        id: f1Id, parentId: null, type: "rectangle", name: "Feature Card 1", order: 5,
        geometry: { x: 100, y: 530, width: 310, height: 200, rotation: 0 },
        style: { opacity: 1, fill: "#16162a", cornerRadius: 16, border: { color: "rgba(255,255,255,0.08)", width: 1, style: "solid" } },
      };
      templateNodes[f2Id] = {
        id: f2Id, parentId: null, type: "rectangle", name: "Feature Card 2", order: 6,
        geometry: { x: 445, y: 530, width: 310, height: 200, rotation: 0 },
        style: { opacity: 1, fill: "#16162a", cornerRadius: 16, border: { color: "rgba(255,255,255,0.08)", width: 1, style: "solid" } },
      };
      templateNodes[f3Id] = {
        id: f3Id, parentId: null, type: "rectangle", name: "Feature Card 3", order: 7,
        geometry: { x: 790, y: 530, width: 310, height: 200, rotation: 0 },
        style: { opacity: 1, fill: "#16162a", cornerRadius: 16, border: { color: "rgba(255,255,255,0.08)", width: 1, style: "solid" } },
      };
    } else if (templateId === "ecommerce") {
      const bannerId = crypto.randomUUID();
      const p1Id = crypto.randomUUID();
      const p2Id = crypto.randomUUID();
      const p3Id = crypto.randomUUID();

      templateNodes[bannerId] = {
        id: bannerId, parentId: null, type: "rectangle", name: "Store Banner", order: 1,
        geometry: { x: 100, y: 80, width: 1000, height: 240, rotation: 0 },
        style: { opacity: 1, fill: "#1e1b4b", cornerRadius: 16 },
      };
      templateNodes[p1Id] = {
        id: p1Id, parentId: null, type: "product", name: "Product 1", order: 2,
        productId: "prod-1",
        geometry: { x: 100, y: 350, width: 310, height: 280, rotation: 0 },
        style: { opacity: 1, fill: "#1e1e2e", cornerRadius: 12 },
      };
      templateNodes[p2Id] = {
        id: p2Id, parentId: null, type: "product", name: "Product 2", order: 3,
        productId: "prod-2",
        geometry: { x: 445, y: 350, width: 310, height: 280, rotation: 0 },
        style: { opacity: 1, fill: "#1e1e2e", cornerRadius: 12 },
      };
      templateNodes[p3Id] = {
        id: p3Id, parentId: null, type: "product", name: "Product 3", order: 4,
        productId: "prod-3",
        geometry: { x: 790, y: 350, width: 310, height: 280, rotation: 0 },
        style: { opacity: 1, fill: "#1e1e2e", cornerRadius: 12 },
      };
    }

    set({
      nodes: { ...state.nodes, ...templateNodes },
      selectedNodeIds: new Set(Object.keys(templateNodes)),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createFormControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth = type === "formCodeEditor" || type === "formCreditCard" || type === "formGradientPicker" ? 420 : type === "formSignature" || type === "formMap" || type === "formAccordion" ? 340 : type === "formRichText" || type === "formFileInput" ? 400 : 280;
    const defaultHeight = type === "formCodeEditor" ? 220 : type === "formSignature" || type === "formMap" ? 200 : type === "formRichText" ? 180 : type === "formFileInput" ? 140 : type === "formAccordion" ? 120 : type === "formCreditCard" ? 110 : type === "formInput" && options?.inputType === "textarea" ? 120 : 48;

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 200 + Math.random() * 40,
        y: 200 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: "#1e1e2e",
        cornerRadius: 8,
        border: { color: "rgba(255, 255, 255, 0.15)", width: 1, style: "solid" },
      },
      content: {
        kind: "text",
        text: options?.label || name,
        ...options,
      },
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createNavControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth =
      type === "navHeader" ? 900 : type === "navTabs" ? 480 : type === "navPagination" ? 380 : type === "navBreadcrumb" ? 340 : type === "navSidebar" ? 240 : 280;
    const defaultHeight =
      type === "navSidebar" ? 500 : type === "navToc" ? 240 : type === "navHeader" ? 64 : type === "navTabs" ? 48 : type === "navPagination" ? 44 : 40;

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 100 + Math.random() * 40,
        y: 100 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: "#181826",
        cornerRadius: 8,
        border: { color: "rgba(255, 255, 255, 0.15)", width: 1, style: "solid" },
      },
      content: {
        kind: "text",
        text: name,
        ...options,
      },
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createDataControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth =
      type === "dataTable" ? 600 : type === "dataAccordion" ? 380 : type === "dataList" ? 360 : type === "dataCard" ? 340 : type === "dataTooltip" ? 220 : 120;
    const defaultHeight =
      type === "dataCard" ? 260 : type === "dataTable" ? 240 : type === "dataList" ? 220 : type === "dataAccordion" ? 200 : type === "dataTooltip" ? 44 : 32;

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 120 + Math.random() * 40,
        y: 120 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: "#181826",
        cornerRadius: 8,
        border: { color: "rgba(255, 255, 255, 0.15)", width: 1, style: "solid" },
      },
      content: {
        kind: "text",
        text: name,
        ...options,
      },
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createFeedbackControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth =
      type === "feedbackAlert" ? 420 : type === "feedbackModal" || type === "feedbackEmptyState" ? 360 : type === "feedbackToast" || type === "feedbackSkeleton" ? 340 : 320;
    const defaultHeight =
      type === "feedbackEmptyState" ? 240 : type === "feedbackModal" ? 220 : type === "feedbackSkeleton" ? 180 : type === "feedbackAlert" ? 56 : type === "feedbackToast" ? 50 : 48;

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 140 + Math.random() * 40,
        y: 140 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: "#181826",
        cornerRadius: 8,
        border: { color: "rgba(255, 255, 255, 0.15)", width: 1, style: "solid" },
      },
      content: {
        kind: "text",
        text: name,
        ...options,
      },
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createLayoutActionControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth =
      type === "layoutCarousel" ? 540 : type === "layoutContainer" ? 500 : type === "mediaPlayer" ? 480 : type === "layoutDivider" ? 360 : type === "actionMenu" ? 180 : 160;
    const defaultHeight =
      type === "mediaPlayer" ? 270 : type === "layoutCarousel" ? 260 : type === "layoutContainer" ? 180 : type === "actionButton" ? 44 : type === "actionMenu" ? 40 : 24;

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 160 + Math.random() * 40,
        y: 160 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: type === "actionButton" && options?.variant === "primary" ? "#3b82f6" : "#181826",
        cornerRadius: type === "actionButton" && options?.variant === "fab" ? 22 : 8,
        border: { color: "rgba(255, 255, 255, 0.15)", width: 1, style: "solid" },
      },
      content: {
        kind: "text",
        text: name,
        ...options,
      },
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },

  createSectionControl: (type, name, options) => {
    const state = get();
    const snap = snapshot(state);

    const id = crypto.randomUUID();
    const defaultWidth = options?.defaultSize?.w ?? (type === "iconElement" ? 48 : 800);
    const defaultHeight = options?.defaultSize?.h ?? (type === "iconElement" ? 48 : 360);

    const newNode: CanvasNode = {
      id,
      parentId: null,
      type,
      name,
      order: maxOrder(state.nodes) + 1,
      geometry: {
        x: 100 + Math.random() * 40,
        y: 100 + Math.random() * 40,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
      },
      style: {
        opacity: 1,
        fill: "transparent",
      },
      content: {
        kind: "text",
        text: name,
      },
      embedData: options?.embedData,
      iconData: options?.iconData,
    };

    set({
      nodes: { ...state.nodes, [id]: newNode },
      selectedNodeIds: new Set([id]),
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), snap],
      future: [],
    });
  },
}));

// Auto-save: subscribe to DATA changes only (not viewport/mouse/tool/guides)
let _prevNodes: NodesById | null = null;
let _prevPages: import("../types/canvas").PagesById | null = null;
let _prevActivePageId: string | null = null;
let _prevNextNumber: Record<ElementType, number> | null = null;
let _prevActiveColor: string | null = null;
let _prevPageHeight: Record<import("../types/canvas").BreakpointKey, number> | null = null;

useCanvasStore.subscribe((state) => {
  if (
    state.nodes !== _prevNodes ||
    state.pages !== _prevPages ||
    state.activePageId !== _prevActivePageId ||
    state.nextNumber !== _prevNextNumber ||
    state.activeColor !== _prevActiveColor ||
    state.pageHeight !== _prevPageHeight
  ) {
    _prevNodes = state.nodes;
    _prevPages = state.pages;
    _prevActivePageId = state.activePageId;
    _prevNextNumber = state.nextNumber;
    _prevActiveColor = state.activeColor;
    _prevPageHeight = state.pageHeight;
    scheduleAutoSave(state);
  }
});
