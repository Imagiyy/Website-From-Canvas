import React, { useCallback, useRef, useState } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useCanvasPointer } from "../hooks/useCanvasPointer";
import { NodeRenderer } from "./nodes/NodeRenderer";
import SelectionOverlay from "./SelectionOverlay";
import AlignmentGuides from "./AlignmentGuides";
import BreakpointFrame from "./BreakpointFrame";
import Toolbar from "./Toolbar";
import { useKeyboard } from "../hooks/useKeyboard";
import { getEffectiveNodesMap } from "../utils/breakpoint";
import "./Canvas.css";

const ZOOM_FACTOR = 1.1;

export const Canvas: React.FC = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const viewport = useCanvasStore((s) => s.viewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const editingNodeId = useCanvasStore((s) => s.editingNodeId);
  const alignmentGuides = useCanvasStore((s) => s.alignmentGuides);
  const zoomAtPoint = useCanvasStore((s) => s.zoomAtPoint);
  const createImage = useCanvasStore((s) => s.createImage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  const { handlers, drawPreviewRef } = useCanvasPointer(forceUpdate, fileInputRef);
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Resolve effective nodes for active breakpoint
  const effectiveNodes = getEffectiveNodesMap(nodes, activeBreakpoint);

  // Filter top-level nodes for root SVG rendering
  const topLevelNodes = Object.values(effectiveNodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => a.order - b.order);

  const preview = drawPreviewRef.current;

  const cursorClass =
    activeTool === "text"
      ? "canvas--text"
      : activeTool === "rectangle" || activeTool === "line"
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
      >
        {/* Dot grid background pattern */}
        <defs>
          <pattern
            id="dotGrid"
            width={20 / viewport.zoom}
            height={20 / viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.panX / viewport.zoom}, ${viewport.panY / viewport.zoom})`}
          >
            <circle
              cx={1 / viewport.zoom}
              cy={1 / viewport.zoom}
              r={1 / viewport.zoom}
              fill="rgba(255,255,255,0.08)"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#1a1a2e" />
        <rect width="100%" height="100%" fill="url(#dotGrid)" />

        {/* Camera transform group */}
        <g transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}>
          {/* Breakpoint Visual Frame */}
          <BreakpointFrame
            activeBreakpoint={activeBreakpoint}
            zoom={viewport.zoom}
          />

          {/* Render all top-level nodes */}
          {topLevelNodes.map((node) => (
            <NodeRenderer
              key={node.id}
              node={node}
              nodes={effectiveNodes}
              editingNodeId={editingNodeId}
            />
          ))}

          {/* Draw preview for rectangle */}
          {preview && preview.kind === "rect" && preview.width > 0 && preview.height > 0 && (
            <rect
              x={preview.x}
              y={preview.y}
              width={preview.width}
              height={preview.height}
              fill="rgba(229, 231, 235, 0.3)"
              stroke="#2563EB"
              strokeWidth={1 / viewport.zoom}
              strokeDasharray={`${4 / viewport.zoom} ${3 / viewport.zoom}`}
              pointerEvents="none"
            />
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
    </>
  );
};

export default Canvas;
