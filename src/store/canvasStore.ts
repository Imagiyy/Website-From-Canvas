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
  clipboard: CanvasNode[] | null; // Array of nodes (to support copying groups or multi-selections)
  editingNodeId: NodeId | null; // Text node currently being edited inline

  // ---- History ----
  past: Snapshot[];
  future: Snapshot[];
}

interface CanvasStoreActions {
  // Nodes
  addNode: (node: CanvasNode) => void;
  updateNodeGeometry: (id: NodeId, partial: Partial<Geometry>) => void;
  updateNodeContent: (id: NodeId, content: TextContent | ImageContent) => void;
  updateImageFit: (id: NodeId, fit: "cover" | "contain" | "fill") => void;
  deleteSelected: () => void;

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
  clipboard: null,
  editingNodeId: null,
  past: [],
  future: [],

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

  updateNodeGeometry: (id, partial) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;

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

  updateNodeContent: (id, content) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
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
}));
