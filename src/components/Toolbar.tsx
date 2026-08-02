import React from "react";
import { useCanvasStore } from "../store/canvasStore";
import "./Toolbar.css";

interface Props {
  onImageUploadClick?: () => void;
  onExportClick?: () => void;
}

export const Toolbar: React.FC<Props> = ({ onImageUploadClick, onExportClick }) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);
  const nodes = useCanvasStore((s) => s.nodes);

  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const resetView = useCanvasStore((s) => s.resetView);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const moveForward = useCanvasStore((s) => s.moveForward);
  const moveBackward = useCanvasStore((s) => s.moveBackward);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);

  const hasSelection = selectedNodeIds.size > 0;
  const singleSelection = selectedNodeIds.size === 1;
  const canGroup = selectedNodeIds.size >= 2;
  const canUngroup = Array.from(selectedNodeIds).some(
    (id) => nodes[id]?.type === "group"
  );

  const triggerImageUpload = useCanvasStore((s) => s.triggerImageUpload);

  const handleImageToolClick = () => {
    setActiveTool("image");
    if (onImageUploadClick) {
      onImageUploadClick();
    }
    triggerImageUpload();
  };

  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const setActiveBreakpoint = useCanvasStore((s) => s.setActiveBreakpoint);

  return (
    <div className="toolbar">
      {/* Breakpoint Switcher Section */}
      <div className="toolbar__section">
        <span className="toolbar__label">View Mode</span>
        <button
          className={`toolbar__btn ${activeBreakpoint === "desktop" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveBreakpoint("desktop")}
          title="Desktop Base View (Freeform)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 14.5H11M8 11.5V14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>Desktop</span>
        </button>

        <button
          className={`toolbar__btn ${activeBreakpoint === "tablet" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveBreakpoint("tablet")}
          title="Tablet View (768px)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="12.5" r="0.75" fill="currentColor" />
          </svg>
          <span>Tablet 768px</span>
        </button>

        <button
          className={`toolbar__btn ${activeBreakpoint === "mobile" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveBreakpoint("mobile")}
          title="Mobile View (375px)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="1.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="12.5" r="0.75" fill="currentColor" />
          </svg>
          <span>Mobile 375px</span>
        </button>
      </div>

      <div className="toolbar__separator" />
      {/* Tools Section */}
      <div className="toolbar__section">
        <span className="toolbar__label">Tools</span>

        {/* Select */}
        <button
          className={`toolbar__btn ${activeTool === "select" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("select")}
          title="Select (V)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 1L3 12.5L6.5 9L10.5 15L12.5 14L8.5 8L13 7.5L3 1Z" fill="currentColor" />
          </svg>
          <span>Select</span>
        </button>

        {/* Rectangle */}
        <button
          className={`toolbar__btn ${activeTool === "rectangle" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("rectangle")}
          title="Rectangle (R)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="3.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>Rectangle</span>
        </button>

        {/* Text */}
        <button
          className={`toolbar__btn ${activeTool === "text" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("text")}
          title="Text (T)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3H13M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Text</span>
        </button>

        {/* Image */}
        <button
          className={`toolbar__btn ${activeTool === "image" ? "toolbar__btn--active" : ""}`}
          onClick={handleImageToolClick}
          title="Image (I)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5" cy="5.5" r="1.5" fill="currentColor" />
            <path d="M2 12L6 8L9.5 11.5L11.5 9.5L14 12" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>Image</span>
        </button>

        {/* Line */}
        <button
          className={`toolbar__btn ${activeTool === "line" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("line")}
          title="Line (L)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>Line</span>
        </button>

        {/* Polygon */}
        <button
          className={`toolbar__btn ${activeTool === "polygon" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("polygon")}
          title="Polygon (Multi-side)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 15,6 12,14 4,14 1,6" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
          <span>Polygon</span>
        </button>

        {/* Circle */}
        <button
          className={`toolbar__btn ${activeTool === "circle" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("circle")}
          title="Circle / Ellipse"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
          <span>Circle</span>
        </button>

        {/* Curve */}
        <button
          className={`toolbar__btn ${activeTool === "curve" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("curve")}
          title="Curve / Wave"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12C5 4 11 12 14 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
          <span>Curve</span>
        </button>

        {/* Star */}
        <button
          className={`toolbar__btn ${activeTool === "star" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("star")}
          title="Star"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 10.3,5.7 15.5,6.5 11.8,10.1 12.6,15.3 8,12.8 3.4,15.3 4.2,10.1 0.5,6.5 5.7,5.7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          <span>Star</span>
        </button>

        {/* 3D Shape */}
        <button
          className={`toolbar__btn ${activeTool === "shape3d" ? "toolbar__btn--active" : ""}`}
          onClick={() => setActiveTool("shape3d")}
          title="3D Cube / Prism"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M8 1V15M2 4.5L8 8L14 4.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>3D Shape</span>
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Undo / Redo */}
      <div className="toolbar__section">
        <button
          className="toolbar__btn"
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H12C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 5L3 8L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="toolbar__btn"
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H4C2.9 8 2 8.9 2 10C2 11.1 2.9 12 4 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Grouping Section */}
      <div className="toolbar__section">
        <button
          className="toolbar__btn"
          onClick={groupSelected}
          disabled={!canGroup}
          title="Group (Ctrl+G)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
            <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
          <span>Group</span>
        </button>
        <button
          className="toolbar__btn"
          onClick={ungroupSelected}
          disabled={!canUngroup}
          title="Ungroup (Ctrl+Shift+G)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="1.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="8.5" y="8.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
          <span>Ungroup</span>
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Layer Z-Order Section */}
      <div className="toolbar__section">
        <span className="toolbar__label">Layer</span>
        <button
          className="toolbar__btn"
          onClick={bringToFront}
          disabled={!singleSelection}
          title="Bring to Front"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
            <rect x="5" y="2" width="8" height="8" rx="1" fill="currentColor" opacity="0.9" />
          </svg>
        </button>
        <button
          className="toolbar__btn"
          onClick={moveForward}
          disabled={!singleSelection}
          title="Move Forward"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3L4 7H12L8 3Z" fill="currentColor" />
            <rect x="6.5" y="7" width="3" height="6" fill="currentColor" />
          </svg>
        </button>
        <button
          className="toolbar__btn"
          onClick={moveBackward}
          disabled={!singleSelection}
          title="Move Backward"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13L12 9H4L8 13Z" fill="currentColor" />
            <rect x="6.5" y="3" width="3" height="6" fill="currentColor" />
          </svg>
        </button>
        <button
          className="toolbar__btn"
          onClick={sendToBack}
          disabled={!singleSelection}
          title="Send to Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
            <rect x="1" y="2" width="8" height="8" rx="1" fill="currentColor" opacity="0.9" />
          </svg>
        </button>
      </div>

      <div className="toolbar__separator" />

      {/* Delete */}
      <div className="toolbar__section">
        <button
          className="toolbar__btn toolbar__btn--danger"
          onClick={deleteSelected}
          disabled={!hasSelection}
          title="Delete (Del)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3V2.5C5 1.67 5.67 1 6.5 1H9.5C10.33 1 11 1.67 11 2.5V3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 3H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3.5 3L4.2 13.5C4.24 14.05 4.7 14.5 5.25 14.5H10.75C11.3 14.5 11.76 14.05 11.8 13.5L12.5 3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {/* View Reset & Export */}
      <div className="toolbar__spacer" />
      <div className="toolbar__section">
        <button className="toolbar__btn" onClick={resetView} title="Reset View">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <line x1="8" y1="1" x2="8" y2="4" stroke="currentColor" strokeWidth="1.2" />
            <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2" />
            <line x1="1" y1="8" x2="4" y2="8" stroke="currentColor" strokeWidth="1.2" />
            <line x1="12" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>Reset View</span>
        </button>

        <button
          className="toolbar__btn toolbar__btn--primary"
          onClick={onExportClick}
          title="Publish / Export Standalone Web App (HTML & CSS)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Publish / Export</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
