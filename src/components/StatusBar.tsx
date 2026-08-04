import React from "react";
import { useCanvasStore } from "../store/canvasStore";
import "./StatusBar.css";

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

export const StatusBar: React.FC = () => {
  const viewport = useCanvasStore((s) => s.viewport);
  const nodes = useCanvasStore((s) => s.nodes);
  const mouseCanvasPos = useCanvasStore((s) => s.mouseCanvasPos);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const zoomTo = useCanvasStore((s) => s.zoomTo);
  const resetView = useCanvasStore((s) => s.resetView);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);

  const showGrid = useCanvasStore((s) => s.showGrid);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const showRulers = useCanvasStore((s) => s.showRulers);
  const toggleShowGrid = useCanvasStore((s) => s.toggleShowGrid);
  const toggleSnapToGrid = useCanvasStore((s) => s.toggleSnapToGrid);
  const toggleShowRulers = useCanvasStore((s) => s.toggleShowRulers);

  const zoomPercent = Math.round(viewport.zoom * 100);
  const nodeCount = Object.keys(nodes).length;
  const selCount = selectedNodeIds.size;

  const toolLabel: Record<string, string> = {
    select: "Select",
    rectangle: "Rectangle",
    text: "Text",
    image: "Image",
    line: "Line",
    polygon: "Polygon",
    circle: "Circle",
    curve: "Curve",
    star: "Star",
    shape3d: "3D Shape",
    brush: "Brush",
    pencil: "Pencil",
    fill: "Fill",
    eraser: "Eraser",
  };

  return (
    <div className="status-bar">
      {/* Zoom Controls */}
      <div className="status-bar__section">
        <button
          className="status-bar__btn"
          onClick={() => zoomTo(viewport.zoom / 1.2)}
          title="Zoom Out (−)"
        >
          −
        </button>
        <input
          type="range"
          className="status-bar__slider"
          min="10"
          max="500"
          value={zoomPercent}
          onChange={(e) => zoomTo(Number(e.target.value) / 100)}
          title={`Zoom: ${zoomPercent}%`}
        />
        <button
          className="status-bar__btn"
          onClick={() => zoomTo(viewport.zoom * 1.2)}
          title="Zoom In (+)"
        >
          +
        </button>
        <span
          className="status-bar__zoom-label"
          onClick={() => zoomTo(1)}
          title="Click to reset to 100%"
        >
          {zoomPercent}%
        </span>
      </div>

      <div className="status-bar__separator" />

      {/* Zoom Presets */}
      <div className="status-bar__section">
        {ZOOM_PRESETS.filter((z) => [0.5, 1, 2].includes(z)).map((z) => (
          <button
            key={z}
            className="status-bar__btn"
            onClick={() => zoomTo(z)}
            style={viewport.zoom === z ? { color: "var(--accent)", fontWeight: 600 } : undefined}
          >
            {Math.round(z * 100)}%
          </button>
        ))}
        <button className="status-bar__btn" onClick={resetView} title="Reset View">
          Fit
        </button>
      </div>

      <div className="status-bar__separator" />

      {/* Grid & Ruler Toggles */}
      <div className="status-bar__section">
        <button
          className="status-bar__btn"
          onClick={toggleShowGrid}
          style={showGrid ? { color: "var(--accent)", fontWeight: 600 } : undefined}
          title="Toggle Grid Overlay"
        >
          Grid: {gridSize}px {showGrid ? "ON" : "OFF"}
        </button>
        <button
          className="status-bar__btn"
          onClick={toggleSnapToGrid}
          style={snapToGrid ? { color: "var(--accent)", fontWeight: 600 } : undefined}
          title="Toggle Snap to Grid"
        >
          Snap: {snapToGrid ? "ON" : "OFF"}
        </button>
        <button
          className="status-bar__btn"
          onClick={toggleShowRulers}
          style={showRulers ? { color: "var(--accent)", fontWeight: 600 } : undefined}
          title="Toggle Canvas Rulers"
        >
          Rulers: {showRulers ? "ON" : "OFF"}
        </button>
      </div>

      <div className="status-bar__separator" />

      {/* Mouse Coordinates */}
      <div className="status-bar__section">
        <span className="status-bar__coords">
          X: {Math.round(mouseCanvasPos.x)} &nbsp; Y: {Math.round(mouseCanvasPos.y)}
        </span>
      </div>

      <div className="status-bar__spacer" />

      {/* Active Tool Badge */}
      <span style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {toolLabel[activeTool] ?? activeTool}
      </span>

      <div className="status-bar__separator" />

      {/* Selection & Node Count */}
      <div className="status-bar__section">
        {selCount > 0 && (
          <span className="status-bar__badge status-bar__badge--nodes">
            {selCount} sel
          </span>
        )}
        <span className="status-bar__badge status-bar__badge--nodes">
          {nodeCount} {nodeCount === 1 ? "element" : "elements"}
        </span>
      </div>

      <div className="status-bar__separator" />

      {/* New Project */}
      <button
        className="status-bar__btn"
        onClick={() => {
          if (nodeCount === 0 || window.confirm("Clear all elements and start a new project?")) {
            clearCanvas();
          }
        }}
        title="New Project — Clear Canvas"
      >
        New Project
      </button>

      <span className="status-bar__badge status-bar__badge--saved">
        Auto-saved
      </span>
    </div>
  );
};

export default StatusBar;
