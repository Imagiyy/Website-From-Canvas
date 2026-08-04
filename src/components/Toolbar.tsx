import React from "react";
import { useCanvasStore } from "../store/canvasStore";
import "./Toolbar.css";

interface Props {
  onImageUploadClick?: () => void;
  onExportClick?: () => void;
}

const COLOR_PRESETS = [
  "#000000","#FFFFFF","#EF4444","#F97316","#F59E0B","#10B981",
  "#3B82F6","#6366F1","#8B5CF6","#EC4899","#64748B","#1E293B",
];

export const Toolbar: React.FC<Props> = ({ onImageUploadClick, onExportClick }) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);
  const nodes = useCanvasStore((s) => s.nodes);
  const activeColor = useCanvasStore((s) => s.activeColor);
  const setActiveColor = useCanvasStore((s) => s.setActiveColor);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const triggerImageUpload = useCanvasStore((s) => s.triggerImageUpload);
  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const setActiveBreakpoint = useCanvasStore((s) => s.setActiveBreakpoint);

  const hasSelection = selectedNodeIds.size > 0;
  const canGroup = selectedNodeIds.size >= 2;
  const canUngroup = Array.from(selectedNodeIds).some((id) => nodes[id]?.type === "group");

  const handleImageToolClick = () => {
    setActiveTool("image");
    if (onImageUploadClick) onImageUploadClick();
    triggerImageUpload();
  };

  const ToolBtn: React.FC<{
    tool: string;
    title: string;
    onClick?: () => void;
    children: React.ReactNode;
  }> = ({ tool, title, onClick, children }) => (
    <button
      className={`toolbar__icon-btn ${activeTool === tool ? "toolbar__icon-btn--active" : ""}`}
      onClick={onClick ?? (() => setActiveTool(tool as any))}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="toolbar">
      {/* ══════ CLIPBOARD ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <button className="toolbar__icon-btn" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H12C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 5L3 8L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="toolbar__icon-btn" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H4C2.9 8 2 8.9 2 10C2 11.1 2.9 12 4 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="toolbar__icon-btn toolbar__icon-btn--danger" onClick={deleteSelected} disabled={!hasSelection} title="Delete (Del)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3V2.5C5 1.67 5.67 1 6.5 1H9.5C10.33 1 11 1.67 11 2.5V3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 3H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M3.5 3L4.2 13.5C4.24 14.05 4.7 14.5 5.25 14.5H10.75C11.3 14.5 11.76 14.05 11.8 13.5L12.5 3" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>
        </div>
        <span className="toolbar__group-label">Clipboard</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ TOOLS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            {/* Row 1 */}
            <ToolBtn tool="select" title="Select (V)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 1L3 12.5L6.5 9L10.5 15L12.5 14L8.5 8L13 7.5L3 1Z" fill="currentColor"/></svg>
            </ToolBtn>
            <ToolBtn tool="rectangle" title="Rectangle (R)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>
            </ToolBtn>
            <ToolBtn tool="circle" title="Circle (O)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/></svg>
            </ToolBtn>
            <ToolBtn tool="polygon" title="Polygon (G)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 15,6 12,14 4,14 1,6" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
            </ToolBtn>
            {/* Row 2 */}
            <ToolBtn tool="line" title="Line (L)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="text" title="Text (T)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3H13M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="star" title="Star (S)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 10.3,5.7 15.5,6.5 11.8,10.1 12.6,15.3 8,12.8 3.4,15.3 4.2,10.1 0.5,6.5 5.7,5.7" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg>
            </ToolBtn>
            <ToolBtn tool="curve" title="Curve (C)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12C5 4 11 12 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
            </ToolBtn>
          </div>
        </div>
        <span className="toolbar__group-label">Shapes</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ INSERT ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <ToolBtn tool="image" title="Image (I)" onClick={handleImageToolClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><circle cx="5" cy="5.5" r="1.5" fill="currentColor"/><path d="M2 12L6 8L9.5 11.5L11.5 9.5L14 12" stroke="currentColor" strokeWidth="1.1"/></svg>
            </ToolBtn>
            <ToolBtn tool="shape3d" title="3D Shape (3)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M8 1V15M2 4.5L8 8L14 4.5" stroke="currentColor" strokeWidth="1"/></svg>
            </ToolBtn>
          </div>
        </div>
        <span className="toolbar__group-label">Insert</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ DRAWING TOOLS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <ToolBtn tool="brush" title="Brush (B)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2C14 2 12.5 5 10 5.5C7.5 6 4.5 9 4.5 9L2 14L7 11.5C7 11.5 10 8.5 10.5 6C11 3.5 14 2 14 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="pencil" title="Pencil (P)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="fill" title="Fill Bucket (F)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5L2 6.5L8.5 13L13.5 8L7 1.5H4Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M12 11C12 12.5 13.5 14.5 13.5 14.5C13.5 14.5 15 12.5 15 11C15 10.2 14.3 9.5 13.5 9.5C12.7 9.5 12 10.2 12 11Z" fill={activeColor}/></svg>
            </ToolBtn>
            <ToolBtn tool="eraser" title="Eraser (E)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14.5L1 9.5L9.5 1L14.5 6L6 14.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M4 14.5H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </ToolBtn>
          </div>
        </div>
        <span className="toolbar__group-label">Draw</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ COLORS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__color-area">
            <label className="toolbar__color-main">
              <input
                type="color"
                className="toolbar__color-input"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
              />
              <span className="toolbar__color-swatch" style={{ backgroundColor: activeColor }} />
            </label>
          </div>
          <div className="toolbar__color-presets">
            {COLOR_PRESETS.map((c) => (
              <span
                key={c}
                className="toolbar__color-preset"
                style={{ backgroundColor: c }}
                onClick={() => setActiveColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
        <span className="toolbar__group-label">Colors</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ LAYERS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <button className="toolbar__icon-btn" onClick={groupSelected} disabled={!canGroup} title="Group (Ctrl+G)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/><rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" opacity="0.6"/></svg>
            </button>
            <button className="toolbar__icon-btn" onClick={ungroupSelected} disabled={!canUngroup} title="Ungroup (Ctrl+Shift+G)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/><rect x="8.5" y="8.5" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/></svg>
            </button>
            <button className="toolbar__icon-btn" onClick={bringToFront} disabled={selectedNodeIds.size !== 1} title="Bring to Front">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><rect x="5" y="2" width="8" height="8" rx="1" fill="currentColor" opacity="0.9"/></svg>
            </button>
            <button className="toolbar__icon-btn" onClick={sendToBack} disabled={selectedNodeIds.size !== 1} title="Send to Back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><rect x="1" y="2" width="8" height="8" rx="1" fill="currentColor" opacity="0.9"/></svg>
            </button>
          </div>
        </div>
        <span className="toolbar__group-label">Layers</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ VIEW MODE ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__view-btns">
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "desktop" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("desktop")}
              title="Desktop (1200px)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 14.5H11M8 11.5V14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Desktop
            </button>
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "tablet" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("tablet")}
              title="Tablet (768px)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="12.5" r="0.75" fill="currentColor"/></svg>
              Tablet
            </button>
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "mobile" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("mobile")}
              title="Mobile (375px)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="4" y="1.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="12.5" r="0.75" fill="currentColor"/></svg>
              Mobile
            </button>
          </div>
        </div>
        <span className="toolbar__group-label">View</span>
      </div>

      <div className="toolbar__spacer" />

      {/* ══════ EXPORT ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <button
            className="toolbar__labeled-btn toolbar__labeled-btn--primary"
            onClick={onExportClick}
            title="Publish / Export (HTML & CSS)"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Export
          </button>
        </div>
        <span className="toolbar__group-label">Publish</span>
      </div>
    </div>
  );
};

export default Toolbar;
