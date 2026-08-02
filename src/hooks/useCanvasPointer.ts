import { useRef, useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { computeSnapping } from "../utils/snapping";
import { getEffectiveNode, getEffectiveNodesMap } from "../utils/breakpoint";

// ---------------------------------------------------------------------------
// Interaction Modes
// ---------------------------------------------------------------------------
type InteractionMode =
  | { type: "idle" }
  | { type: "pan"; startScreenX: number; startScreenY: number }
  | { type: "draw-rect"; startCanvasX: number; startCanvasY: number }
  | { type: "draw-line"; startCanvasX: number; startCanvasY: number }
  | {
      type: "move";
      nodeId: string;
      startCanvasX: number;
      startCanvasY: number;
      startNodeX: number;
      startNodeY: number;
    }
  | {
      type: "resize";
      nodeId: string;
      handle: ResizeHandle;
      anchorLocalX: number;
      anchorLocalY: number;
      nodeCenterX: number;
      nodeCenterY: number;
      nodeRotation: number;
    }
  | {
      type: "line-endpoint";
      nodeId: string;
      endpoint: LineEndpointHandle;
    }
  | {
      type: "rotate";
      nodeId: string;
      nodeCenterX: number;
      nodeCenterY: number;
      startAngle: number;
      startRotation: number;
    };

export interface CanvasPointerHandlers {
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
}

export interface DrawPreview {
  kind: "rect" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_SIZE = 4;
const DEG = 180 / Math.PI;

export function useCanvasPointer(
  onDrawPreviewUpdate: () => void,
  fileInputRef?: React.RefObject<HTMLInputElement | null>
): {
  handlers: CanvasPointerHandlers;
  drawPreviewRef: React.RefObject<DrawPreview | null>;
} {
  const modeRef = useRef<InteractionMode>({ type: "idle" });
  const drawPreviewRef = useRef<DrawPreview | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickNodeIdRef = useRef<string | null>(null);

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): [number, number] => {
      const { panX, panY, zoom } = useCanvasStore.getState().viewport;
      return [(screenX - panX) / zoom, (screenY - panY) / zoom];
    },
    []
  );

  const rotatePoint = useCallback(
    (
      px: number,
      py: number,
      cx: number,
      cy: number,
      angleDeg: number
    ): [number, number] => {
      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = px - cx;
      const dy = py - cy;
      return [cx + dx * cos + dy * sin, cy - dx * sin + dy * cos];
    },
    []
  );

  // -----------------------------------------------------------------------
  // Pointer down
  // -----------------------------------------------------------------------
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;

      const svg = e.currentTarget;
      const target = e.target as SVGElement;
      const store = useCanvasStore.getState();

      const rect = svg.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const [canvasX, canvasY] = screenToCanvas(screenX, screenY);

      // 0. Check Text Node Double Click (timestamp-based) BEFORE setting pointer capture
      const targetEl = target as HTMLElement;
      const closestNodeEl = targetEl.closest?.("[data-node-id]");
      const hitNodeId = closestNodeEl?.getAttribute("data-node-id") ?? target.getAttribute("data-node-id");
      const now = Date.now();

      if (hitNodeId && store.nodes[hitNodeId]) {
        const hitNode = getEffectiveNode(store.nodes[hitNodeId], store.activeBreakpoint);
        const isAlreadySelected = store.selectedNodeIds.has(hitNode.id) && store.selectedNodeIds.size === 1;
        const isDoubleClick =
          lastClickNodeIdRef.current === hitNode.id && now - lastClickTimeRef.current < 450;

        lastClickTimeRef.current = now;
        lastClickNodeIdRef.current = hitNode.id;

        if (hitNode.type === "text" && (isDoubleClick || isAlreadySelected)) {
          store.selectNode(hitNode.id);
          store.setEditingNode(hitNode.id);
          return; // DO NOT setPointerCapture on SVG!
        }
      } else {
        lastClickTimeRef.current = 0;
        lastClickNodeIdRef.current = null;
      }

      // If user is currently editing a text node and clicks outside, exit edit mode
      if (store.editingNodeId) {
        store.setEditingNode(null);
      }

      // Set pointer capture for standard canvas drag operations
      svg.setPointerCapture(e.pointerId);

      // 1. Check Line endpoint handles
      const handleAttr = target.getAttribute("data-handle");
      if (handleAttr === "line-start" || handleAttr === "line-end") {
        const selectedId = Array.from(store.selectedNodeIds)[0];
        if (selectedId && store.nodes[selectedId]?.type === "line") {
          store.pushUndo();
          modeRef.current = {
            type: "line-endpoint",
            nodeId: selectedId,
            endpoint: handleAttr === "line-start" ? "start" : "end",
          };
          return;
        }
      }

      // 2. Check Selection Overlay Handles (Rotate / Resize)
      if (handleAttr && store.selectedNodeIds.size > 0) {
        const selectedId = Array.from(store.selectedNodeIds)[0];
        const rawNode = store.nodes[selectedId];
        const node = rawNode ? getEffectiveNode(rawNode, store.activeBreakpoint) : null;

        if (handleAttr === "rotate" && node) {
          const cx = node.geometry.x + node.geometry.width / 2;
          const cy = node.geometry.y + node.geometry.height / 2;
          const startAngle = Math.atan2(canvasY - cy, canvasX - cx) * DEG;
          store.pushUndo();
          modeRef.current = {
            type: "rotate",
            nodeId: selectedId,
            nodeCenterX: cx,
            nodeCenterY: cy,
            startAngle,
            startRotation: node.geometry.rotation,
          };
          return;
        }

        if (node && handleAttr !== "rotate") {
          const handle = handleAttr as import("../types/canvas").ResizeHandle;
          const { x, y, width, height, rotation } = node.geometry;
          const cx = x + width / 2;
          const cy = y + height / 2;

          let anchorLocalX = x;
          let anchorLocalY = y;
          if (handle.includes("w")) anchorLocalX = x + width;
          if (handle.includes("e")) anchorLocalX = x;
          if (handle.includes("n")) anchorLocalY = y + height;
          if (handle.includes("s")) anchorLocalY = y;
          if (handle === "n" || handle === "s") anchorLocalX = x;
          if (handle === "e" || handle === "w") anchorLocalY = y;

          store.pushUndo();
          modeRef.current = {
            type: "resize",
            nodeId: selectedId,
            handle,
            anchorLocalX,
            anchorLocalY,
            nodeCenterX: cx,
            nodeCenterY: cy,
            nodeRotation: rotation,
          };
          return;
        }
      }

      // 3. Check Node Hit
      const nodeId = hitNodeId;
      if (nodeId && store.nodes[nodeId]) {
        let targetNode = getEffectiveNode(store.nodes[nodeId], store.activeBreakpoint);

        // Double-click interaction logic:
        if (e.detail === 2) {
          if (targetNode.type === "text") {
            store.setEditingNode(targetNode.id);
            return;
          }
          // If double-clicking a group (or node in group), select the child directly
          if (targetNode.type === "group" && targetNode.children && targetNode.children.length > 0) {
            store.selectNode(targetNode.children[0]);
            return;
          }
        }

        // If node is inside a group and the group is not yet selected, select top parent group
        let parentToSelect = targetNode;
        while (parentToSelect.parentId && store.nodes[parentToSelect.parentId]) {
          const parentGroup = getEffectiveNode(store.nodes[parentToSelect.parentId], store.activeBreakpoint);
          // If the group is already selected, allow selecting the child directly
          if (store.selectedNodeIds.has(parentGroup.id)) {
            break;
          }
          parentToSelect = parentGroup;
        }

        store.selectNode(parentToSelect.id, e.shiftKey);

        const effectiveParent = getEffectiveNode(parentToSelect, store.activeBreakpoint);

        store.pushUndo();
        modeRef.current = {
          type: "move",
          nodeId: effectiveParent.id,
          startCanvasX: canvasX,
          startCanvasY: canvasY,
          startNodeX: effectiveParent.geometry.x,
          startNodeY: effectiveParent.geometry.y,
        };
        return;
      }

      // 4. Hit Empty Canvas Space — Branch on Active Tool
      switch (store.activeTool) {
        case "polygon":
        case "circle":
        case "curve":
        case "star":
        case "shape3d":
        case "rectangle": {
          modeRef.current = {
            type: "draw-rect",
            startCanvasX: canvasX,
            startCanvasY: canvasY,
          };
          drawPreviewRef.current = {
            kind: "rect",
            x: canvasX,
            y: canvasY,
            width: 0,
            height: 0,
          };
          break;
        }

        case "line": {
          modeRef.current = {
            type: "draw-line",
            startCanvasX: canvasX,
            startCanvasY: canvasY,
          };
          drawPreviewRef.current = {
            kind: "line",
            x: canvasX,
            y: canvasY,
            width: 0,
            height: 0,
          };
          break;
        }

        case "text": {
          store.createText(canvasX, canvasY);
          store.setActiveTool("select");
          break;
        }

        case "image": {
          if (fileInputRef?.current) {
            fileInputRef.current.dataset.clickX = String(canvasX);
            fileInputRef.current.dataset.clickY = String(canvasY);
            fileInputRef.current.click();
          }
          store.setActiveTool("select");
          break;
        }

        case "select":
        default: {
          if (!e.shiftKey) {
            store.selectNode(null);
          }
          modeRef.current = {
            type: "pan",
            startScreenX: screenX,
            startScreenY: screenY,
          };
          break;
        }
      }
    },
    [screenToCanvas, fileInputRef]
  );

  // -----------------------------------------------------------------------
  // Pointer move
  // -----------------------------------------------------------------------
  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const mode = modeRef.current;
      if (mode.type === "idle") return;

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const [canvasX, canvasY] = screenToCanvas(screenX, screenY);
      const store = useCanvasStore.getState();

      switch (mode.type) {
        case "pan": {
          const dx = screenX - mode.startScreenX;
          const dy = screenY - mode.startScreenY;
          store.pan(dx, dy);
          mode.startScreenX = screenX;
          mode.startScreenY = screenY;
          break;
        }

        case "draw-rect": {
          const x = Math.min(mode.startCanvasX, canvasX);
          const y = Math.min(mode.startCanvasY, canvasY);
          const w = Math.abs(canvasX - mode.startCanvasX);
          const h = Math.abs(canvasY - mode.startCanvasY);
          drawPreviewRef.current = { kind: "rect", x, y, width: w, height: h };
          onDrawPreviewUpdate();
          break;
        }

        case "draw-line": {
          const w = canvasX - mode.startCanvasX;
          const h = canvasY - mode.startCanvasY;
          drawPreviewRef.current = {
            kind: "line",
            x: mode.startCanvasX,
            y: mode.startCanvasY,
            width: w,
            height: h,
          };
          onDrawPreviewUpdate();
          break;
        }

        case "line-endpoint": {
          const node = store.nodes[mode.nodeId];
          if (!node || node.type !== "line") break;

          if (mode.endpoint === "start") {
            const endX = node.geometry.x + node.geometry.width;
            const endY = node.geometry.y + node.geometry.height;
            store.updateNodeGeometry(mode.nodeId, {
              x: canvasX,
              y: canvasY,
              width: endX - canvasX,
              height: endY - canvasY,
            });
          } else {
            store.updateNodeGeometry(mode.nodeId, {
              width: canvasX - node.geometry.x,
              height: canvasY - node.geometry.y,
            });
          }
          break;
        }

        case "move": {
          const dx = canvasX - mode.startCanvasX;
          const dy = canvasY - mode.startCanvasY;
          const rawTarget = store.nodes[mode.nodeId];
          if (!rawTarget) break;
          const targetNode = getEffectiveNode(rawTarget, store.activeBreakpoint);

          const rawX = mode.startNodeX + dx;
          const rawY = mode.startNodeY + dy;

          const effectiveNodesMap = getEffectiveNodesMap(store.nodes, store.activeBreakpoint);

          const snapRes = computeSnapping(
            {
              x: rawX,
              y: rawY,
              width: targetNode.geometry.width,
              height: targetNode.geometry.height,
              rotation: targetNode.geometry.rotation,
            },
            store.selectedNodeIds,
            effectiveNodesMap,
            store.viewport.zoom,
            e.altKey
          );

          store.updateNodeGeometry(mode.nodeId, {
            x: snapRes.snappedX,
            y: snapRes.snappedY,
          });
          store.setAlignmentGuides(snapRes.guides);
          break;
        }

        case "resize": {
          const [localMouseX, localMouseY] = rotatePoint(
            canvasX,
            canvasY,
            mode.nodeCenterX,
            mode.nodeCenterY,
            -mode.nodeRotation
          );

          let newX: number, newY: number, newW: number, newH: number;
          const node = store.nodes[mode.nodeId];
          if (!node) break;

          const handle = mode.handle;

          if (
            handle === "nw" ||
            handle === "ne" ||
            handle === "sw" ||
            handle === "se"
          ) {
            if (handle.includes("w")) {
              newX = Math.min(localMouseX, mode.anchorLocalX - MIN_SIZE);
              newW = mode.anchorLocalX - newX;
            } else {
              newX = mode.anchorLocalX;
              newW = Math.max(MIN_SIZE, localMouseX - mode.anchorLocalX);
            }
            if (handle.includes("n")) {
              newY = Math.min(localMouseY, mode.anchorLocalY - MIN_SIZE);
              newH = mode.anchorLocalY - newY;
            } else {
              newY = mode.anchorLocalY;
              newH = Math.max(MIN_SIZE, localMouseY - mode.anchorLocalY);
            }

            // If Shift key is held during corner resize on an image, enforce aspect ratio
            if (e.shiftKey && node.type === "image") {
              const originalRatio = node.geometry.width / (node.geometry.height || 1);
              if (newW / newH > originalRatio) {
                newW = newH * originalRatio;
              } else {
                newH = newW / originalRatio;
              }
            }
          } else if (handle === "n" || handle === "s") {
            newX = node.geometry.x;
            newW = node.geometry.width;
            if (handle === "n") {
              newY = Math.min(localMouseY, mode.anchorLocalY - MIN_SIZE);
              newH = mode.anchorLocalY - newY;
            } else {
              newY = mode.anchorLocalY;
              newH = Math.max(MIN_SIZE, localMouseY - mode.anchorLocalY);
            }
          } else {
            newY = node.geometry.y;
            newH = node.geometry.height;
            if (handle === "w") {
              newX = Math.min(localMouseX, mode.anchorLocalX - MIN_SIZE);
              newW = mode.anchorLocalX - newX;
            } else {
              newX = mode.anchorLocalX;
              newW = Math.max(MIN_SIZE, localMouseX - mode.anchorLocalX);
            }
          }

          const newCx = newX + newW / 2;
          const newCy = newY + newH / 2;
          const rad = (mode.nodeRotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const dlx = newCx - mode.nodeCenterX;
          const dly = newCy - mode.nodeCenterY;
          const worldCx = mode.nodeCenterX + dlx * cos - dly * sin;
          const worldCy = mode.nodeCenterY + dlx * sin + dly * cos;

          const finalX = worldCx - newW / 2;
          const finalY = worldCy - newH / 2;

          store.updateNodeGeometry(mode.nodeId, {
            x: finalX,
            y: finalY,
            width: newW,
            height: newH,
          });

          mode.nodeCenterX = worldCx;
          mode.nodeCenterY = worldCy;
          break;
        }

        case "rotate": {
          const angle =
            Math.atan2(canvasY - mode.nodeCenterY, canvasX - mode.nodeCenterX) *
            DEG;
          const delta = angle - mode.startAngle;
          let newRotation = mode.startRotation + delta;
          newRotation = ((newRotation % 360) + 360) % 360;
          store.updateNodeGeometry(mode.nodeId, { rotation: newRotation });
          break;
        }
      }
    },
    [screenToCanvas, rotatePoint, onDrawPreviewUpdate]
  );

  // -----------------------------------------------------------------------
  // Pointer up
  // -----------------------------------------------------------------------
  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      svg.releasePointerCapture(e.pointerId);

      const mode = modeRef.current;
      const store = useCanvasStore.getState();

      if (mode.type === "draw-rect") {
        const preview = drawPreviewRef.current;
        if (preview && preview.kind === "rect") {
          const MIN = 10;
          const w = preview.width < MIN ? 120 : preview.width;
          const h = preview.height < MIN ? 120 : preview.height;
          const px = preview.width < MIN ? mode.startCanvasX - 60 : preview.x;
          const py = preview.height < MIN ? mode.startCanvasY - 60 : preview.y;

          switch (store.activeTool) {
            case "polygon":
              store.createPolygon(px, py, w, h);
              break;
            case "circle":
              store.createCircle(px, py, w, h);
              break;
            case "curve":
              store.createCurve(px, py, w, h);
              break;
            case "star":
              store.createStar(px, py, w, h);
              break;
            case "shape3d":
              store.createShape3D(px, py, w, h);
              break;
            case "rectangle":
            default:
              store.createRectangle(px, py, w, h);
              break;
          }
          store.setActiveTool("select");
        }
        drawPreviewRef.current = null;
      } else if (mode.type === "draw-line") {
        const preview = drawPreviewRef.current;
        if (preview && (Math.abs(preview.width) >= MIN_SIZE || Math.abs(preview.height) >= MIN_SIZE)) {
          store.createLine(
            preview.x,
            preview.y,
            preview.x + preview.width,
            preview.y + preview.height
          );
          store.setActiveTool("select");
        }
        drawPreviewRef.current = null;
      }

      store.clearAlignmentGuides();
      modeRef.current = { type: "idle" };
    },
    []
  );

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    drawPreviewRef,
  };
}
