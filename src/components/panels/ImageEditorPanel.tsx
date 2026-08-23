import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageEditorPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const selectedNodeId = useCanvasStore((s) => Array.from(s.selectedNodeIds)[0]);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNode = useCanvasStore((s) => s.updateNode);

  if (!isOpen) return null;

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const isImageSelected = selectedNode?.type === "image";
  const filters = selectedNode?.imageFilters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
  };

  const updateFilter = (key: string, value: number) => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, {
      imageFilters: {
        ...filters,
        [key]: value,
      },
    });
  };

  const resetFilters = () => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, {
      imageFilters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
      },
    });
  };

  const aspectPresets = [
    { label: "1:1 Square", ratio: 1 },
    { label: "16:9 Landscape", ratio: 16 / 9 },
    { label: "4:3 Standard", ratio: 4 / 3 },
    { label: "9:16 Portrait", ratio: 9 / 16 },
  ];

  const applyAspect = (ratio: number) => {
    if (!selectedNode || !selectedNodeId) return;
    const currentW = selectedNode.geometry.width;
    updateNode(selectedNodeId, {
      geometry: {
        ...selectedNode.geometry,
        height: Math.round(currentW / ratio),
      },
    });
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">🖼️</span>
            Image Editor & Filters
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {!isImageSelected ? (
            <div style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>No Image Selected</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Select an image element on the canvas to adjust filters, crop ratio, and effects.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Editing: {selectedNode.name}</span>
                <button
                  onClick={resetFilters}
                  style={{ padding: "4px 10px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 4, color: "#94a3b8", fontSize: 10, cursor: "pointer" }}
                >
                  Reset Filters
                </button>
              </div>

              {/* Filter Sliders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Brightness ({filters.brightness ?? 100}%)</label>
                  <input type="range" min="0" max="200" value={filters.brightness ?? 100} onChange={(e) => updateFilter("brightness", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Contrast ({filters.contrast ?? 100}%)</label>
                  <input type="range" min="0" max="200" value={filters.contrast ?? 100} onChange={(e) => updateFilter("contrast", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Saturation ({filters.saturation ?? 100}%)</label>
                  <input type="range" min="0" max="200" value={filters.saturation ?? 100} onChange={(e) => updateFilter("saturation", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Blur ({filters.blur ?? 0}px)</label>
                  <input type="range" min="0" max="20" value={filters.blur ?? 0} onChange={(e) => updateFilter("blur", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Grayscale ({filters.grayscale ?? 0}%)</label>
                  <input type="range" min="0" max="100" value={filters.grayscale ?? 0} onChange={(e) => updateFilter("grayscale", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Sepia ({filters.sepia ?? 0}%)</label>
                  <input type="range" min="0" max="100" value={filters.sepia ?? 0} onChange={(e) => updateFilter("sepia", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
              </div>

              {/* Aspect Ratio Crop Presets */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", display: "block", marginBottom: 8 }}>Aspect Ratio Presets</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {aspectPresets.map((ap) => (
                    <button
                      key={ap.label}
                      onClick={() => applyAspect(ap.ratio)}
                      style={{
                        padding: "8px 4px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6,
                        color: "#e2e8f0",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {ap.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditorPanel;
