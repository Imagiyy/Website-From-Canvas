import React, { useCallback, useRef, useState } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useCanvasPointer } from "../hooks/useCanvasPointer";
import { NodeRenderer } from "./nodes/NodeRenderer";
import SelectionOverlay from "./SelectionOverlay";
import AlignmentGuides from "./AlignmentGuides";
import BreakpointFrame from "./BreakpointFrame";
import Rulers from "./Rulers";
import { useKeyboard } from "../hooks/useKeyboard";
import { getEffectiveNodesMap } from "../utils/breakpoint";
import "./Canvas.css";

const ZOOM_FACTOR = 1.1;

function isNodeInViewport(
  node: import("../types/canvas").CanvasNode,
  viewport: { panX: number; panY: number; zoom: number },
  svgRect: DOMRect | null,
  selectedNodeIds: Set<string>,
  editingNodeId: string | null
): boolean {
  if (selectedNodeIds.has(node.id) || editingNodeId === node.id) return true;
  if (!svgRect || svgRect.width === 0 || svgRect.height === 0) return true;

  const buffer = 300 / viewport.zoom;
  const viewMinX = -viewport.panX / viewport.zoom - buffer;
  const viewMinY = -viewport.panY / viewport.zoom - buffer;
  const viewMaxX = (svgRect.width - viewport.panX) / viewport.zoom + buffer;
  const viewMaxY = (svgRect.height - viewport.panY) / viewport.zoom + buffer;

  const nodeMinX = node.geometry.x;
  const nodeMinY = node.geometry.y;
  const nodeMaxX = node.geometry.x + Math.max(1, node.geometry.width);
  const nodeMaxY = node.geometry.y + Math.max(1, node.geometry.height);

  return (
    nodeMaxX >= viewMinX &&
    nodeMinX <= viewMaxX &&
    nodeMaxY >= viewMinY &&
    nodeMinY <= viewMaxY
  );
}

interface Props {
  onContextMenu?: (e: React.MouseEvent, nodeId?: string | null) => void;
}

export const Canvas: React.FC<Props> = ({ onContextMenu }) => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const viewport = useCanvasStore((s) => s.viewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const alignmentGuides = useCanvasStore((s) => s.alignmentGuides);
  const zoomAtPoint = useCanvasStore((s) => s.zoomAtPoint);
  const createImage = useCanvasStore((s) => s.createImage);
  const setImageUploadHandler = useCanvasStore((s) => s.setImageUploadHandler);
  const updateNodeContent = useCanvasStore((s) => s.updateNodeContent);
  const setEditingNode = useCanvasStore((s) => s.setEditingNode);

  const showGrid = useCanvasStore((s) => s.showGrid);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const showRulers = useCanvasStore((s) => s.showRulers);
  const mouseCanvasPos = useCanvasStore((s) => s.mouseCanvasPos);
  const activeColor = useCanvasStore((s) => s.activeColor);

  // Resolve effective nodes for active breakpoint
  const effectiveNodes = getEffectiveNodesMap(nodes, activeBreakpoint);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement>(null);

  const editingNode = editingNodeId ? effectiveNodes[editingNodeId] : null;
  const isEditingText = editingNode?.type === "text";
  const storeEditingText = isEditingText && editingNode.content?.kind === "text" ? editingNode.content.text : "Text";

  const [overlayText, setOverlayText] = useState(storeEditingText);

  React.useEffect(() => {
    if (isEditingText) {
      setOverlayText(storeEditingText);
      const timer = setTimeout(() => {
        if (editingTextareaRef.current) {
          editingTextareaRef.current.focus();
          editingTextareaRef.current.select();
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [editingNodeId, isEditingText]);

  React.useEffect(() => {
    setImageUploadHandler(() => {
      if (!fileInputRef.current) return;
      const { panX, panY, zoom } = useCanvasStore.getState().viewport;
      let centerX = 150;
      let centerY = 150;
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        centerX = Math.round((rect.width / 2 - panX) / zoom);
        centerY = Math.round((rect.height / 2 - panY) / zoom);
      }
      fileInputRef.current.dataset.clickX = String(centerX);
      fileInputRef.current.dataset.clickY = String(centerY);
      fileInputRef.current.click();
    });

    return () => {
      setImageUploadHandler(null);
    };
  }, [setImageUploadHandler]);

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const { handlers, drawPreviewRef } = useCanvasPointer(forceUpdate, fileInputRef);

  useKeyboard(fileInputRef);

  // Wheel handler for zoom
  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const { zoom } = useCanvasStore.getState().viewport;
      const direction = e.deltaY < 0 ? 1 : -1;
      const newZoom = zoom * Math.pow(ZOOM_FACTOR, direction);

      zoomAtPoint(newZoom, screenX, screenY);
    },
    [zoomAtPoint]
  );

  // Image file upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const clickX = Number(fileInputRef.current?.dataset.clickX ?? 100);
    const clickY = Number(fileInputRef.current?.dataset.clickY ?? 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        // Cap initial size at max 400px while maintaining aspect ratio
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 200;
        const maxDim = 400;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        createImage(clickX, clickY, w, h, dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // Filter top-level nodes for root SVG rendering
  const topLevelNodes = Object.values(effectiveNodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.order - b.order);

  const preview = drawPreviewRef.current;

  const cursorClass =
    activeTool === "text"
      ? "canvas--text"
      : activeTool === "brush"
      ? "canvas--brush"
      : activeTool === "pencil"
      ? "canvas--pencil"
      : activeTool === "eraser"
      ? "canvas--eraser"
      : activeTool === "fill"
      ? "canvas--fill"
      : activeTool === "rectangle" ||
        activeTool === "line" ||
        activeTool === "polygon" ||
        activeTool === "circle" ||
        activeTool === "curve" ||
        activeTool === "star" ||
        activeTool === "shape3d"
      ? "canvas--crosshair"
      : "canvas--default";

  return (
    <>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <svg
        ref={svgRef}
        className={`canvas ${cursorClass}`}
        {...handlers}
        onWheel={onWheel}
        onContextMenu={(e) => {
          e.preventDefault();
          const targetEl = e.target as HTMLElement | SVGElement;
          const closestNodeEl = targetEl.closest?.("[data-node-id]");
          const hitNodeId = closestNodeEl?.getAttribute("data-node-id") ?? targetEl.getAttribute("data-node-id");
          if (hitNodeId && !selectedNodeIds.has(hitNodeId)) {
            selectNode(hitNodeId);
          }
          if (onContextMenu) {
            onContextMenu(e, hitNodeId ?? undefined);
          }
        }}
      >
        {/* Dot grid background pattern */}
        {showGrid && (
          <defs>
            <pattern
              id="dotGrid"
              width={gridSize * viewport.zoom}
              height={gridSize * viewport.zoom}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${viewport.panX}, ${viewport.panY})`}
            >
              <circle
                cx={gridSize * viewport.zoom}
                cy={gridSize * viewport.zoom}
                r={1}
                fill="rgba(255,255,255,0.15)"
              />
            </pattern>
          </defs>
        )}
        <rect width="100%" height="100%" fill="#1a1a2e" />
        {showGrid && <rect width="100%" height="100%" fill="url(#dotGrid)" />}

        {/* Camera transform group */}
        <g transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}>
          {/* Breakpoint Visual Frame */}
          <BreakpointFrame
            activeBreakpoint={activeBreakpoint}
            zoom={viewport.zoom}
          />

          {/* Render all top-level visible nodes in viewport */}
          {topLevelNodes
            .filter(
              (node) =>
                node.visible !== false &&
                isNodeInViewport(
                  node,
                  viewport,
                  svgRef.current?.getBoundingClientRect() ?? null,
                  selectedNodeIds,
                  editingNodeId
                )
            )
            .map((node) => (
              <NodeRenderer
                key={node.id}
                node={node}
                nodes={effectiveNodes}
                editingNodeId={editingNodeId}
              />
            ))}

          {/* Live Drag-and-Draw Shape & Outer Box Preview */}
          {preview && preview.kind === "rect" && preview.width > 0 && preview.height > 0 && (
            <g pointerEvents="none" opacity={0.85}>
              <NodeRenderer
                node={{
                  id: "draw-preview-shape",
                  parentId: null,
                  type: activeTool === "select" ? "rectangle" : (activeTool as any),
                  name: "Preview",
                  order: 999999,
                  geometry: {
                    x: preview.x,
                    y: preview.y,
                    width: preview.width,
                    height: preview.height,
                    rotation: 0,
                  },
                  style: {
                    fill:
                      activeTool === "circle"
                        ? "#10B981"
                        : activeTool === "polygon"
                        ? "#3B82F6"
                        : activeTool === "star"
                        ? "#F59E0B"
                        : activeTool === "shape3d"
                        ? "#8B5CF6"
                        : activeTool === "curve"
                        ? "#EC4899"
                        : "#E5E7EB",
                    opacity: 0.8,
                    sides: 5,
                    starPoints: 5,
                    innerRadius: 0.5,
                    curvature: 50,
                    depth3d: 30,
                    color3d: "#6D28D9",
                    border: { color: "#2563EB", width: 1.5, style: "solid" },
                  },
                }}
                nodes={{}}
              />
              {/* Outer Drag Bounding Box Outline */}
              <rect
                x={preview.x}
                y={preview.y}
                width={preview.width}
                height={preview.height}
                fill="none"
                stroke="#2563EB"
                strokeWidth={1.5 / viewport.zoom}
                strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
              />
            </g>
          )}

          {/* Draw preview for freehand brush & pencil */}
          {preview && preview.kind === "path" && preview.pathData && (
            <g transform={`translate(${preview.x}, ${preview.y})`} pointerEvents="none">
              <path
                d={preview.pathData}
                fill="none"
                stroke={activeColor}
                strokeWidth={preview.tool === "pencil" ? 2 : 12}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            </g>
          )}

          {/* Draw preview for line */}
          {preview && preview.kind === "line" && (preview.width !== 0 || preview.height !== 0) && (
            <line
              x1={preview.x}
              y1={preview.y}
              x2={preview.x + preview.width}
              y2={preview.y + preview.height}
              stroke="#2563EB"
              strokeWidth={2 / viewport.zoom}
              strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
              pointerEvents="none"
            />
          )}

          {/* Selection overlay */}
          <SelectionOverlay
            selectedNodeIds={selectedNodeIds}
            nodes={effectiveNodes}
            zoom={viewport.zoom}
          />

          {/* Smart Alignment Guides */}
          <AlignmentGuides
            guides={alignmentGuides}
            zoom={viewport.zoom}
          />
        </g>
      </svg>

      {isEditingText && editingNode && (
        <textarea
          ref={editingTextareaRef}
          value={overlayText}
          onChange={(e) => {
            setOverlayText(e.target.value);
            updateNodeContent(editingNode.id, { kind: "text", text: e.target.value }, true);
          }}
          onBlur={() => {
            const finalVal = overlayText.trim() === "" ? "Text" : overlayText;
            updateNodeContent(editingNode.id, { kind: "text", text: finalVal });
            setEditingNode(null);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const finalVal = overlayText.trim() === "" ? "Text" : overlayText;
              updateNodeContent(editingNode.id, { kind: "text", text: finalVal });
              setEditingNode(null);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setEditingNode(null);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: `${editingNode.geometry.x * viewport.zoom + viewport.panX}px`,
            top: `${editingNode.geometry.y * viewport.zoom + viewport.panY}px`,
            width: `${editingNode.geometry.width * viewport.zoom}px`,
            height: `${editingNode.geometry.height * viewport.zoom}px`,
            transform: editingNode.geometry.rotation ? `rotate(${editingNode.geometry.rotation}deg)` : undefined,
            transformOrigin: "center center",
            fontFamily: editingNode.style.typography?.fontFamily ?? "Inter, sans-serif",
            fontSize: `${(editingNode.style.typography?.fontSize ?? 18) * viewport.zoom}px`,
            fontWeight: editingNode.style.typography?.fontWeight ?? 400,
            color: editingNode.style.typography?.color ?? "#E4E4F0",
            textAlign: editingNode.style.typography?.align ?? "left",
            lineHeight: editingNode.style.typography?.lineHeight ?? 1.4,
            letterSpacing: editingNode.style.typography?.letterSpacing ? `${editingNode.style.typography.letterSpacing * viewport.zoom}px` : undefined,
            textTransform: editingNode.style.typography?.textTransform ?? "none",
            textDecoration: editingNode.style.typography?.textDecoration ?? "none",
            background: "rgba(15, 15, 26, 0.96)",
            outline: "2px solid #2563EB",
            outlineOffset: "2px",
            borderRadius: "3px",
            border: "none",
            resize: "none",
            padding: `${2 * viewport.zoom}px ${4 * viewport.zoom}px`,
            boxSizing: "border-box",
            zIndex: 1000,
          }}
        />
      )}
      {showRulers && (
        <Rulers
          viewport={viewport}
          mouseCanvasPos={mouseCanvasPos}
          visible={showRulers}
        />
      )}
    </>
  );
};

export default Canvas;
