import React, { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_FONTS = [
  { name: "Inter", category: "Sans-Serif", sample: "The quick brown fox jumps over the lazy dog" },
  { name: "Roboto", category: "Sans-Serif", sample: "The quick brown fox jumps over the lazy dog" },
  { name: "Poppins", category: "Sans-Serif", sample: "The quick brown fox jumps over the lazy dog" },
  { name: "Playfair Display", category: "Serif", sample: "The quick brown fox jumps over the lazy dog" },
  { name: "Merriweather", category: "Serif", sample: "The quick brown fox jumps over the lazy dog" },
  { name: "Fira Code", category: "Monospace", sample: "const greeting = 'Hello World';" },
  { name: "Space Grotesk", category: "Display", sample: "Modern & Futuristic Typography" },
  { name: "Outfit", category: "Sans-Serif", sample: "Clean Modern Geometric Typeface" },
];

const TEXT_PRESETS = [
  { label: "Heading 1 (H1)", fontSize: 36, fontWeight: 800, lineHeight: 1.2, desc: "Main Page Title" },
  { label: "Heading 2 (H2)", fontSize: 28, fontWeight: 700, lineHeight: 1.3, desc: "Section Header" },
  { label: "Heading 3 (H3)", fontSize: 22, fontWeight: 600, lineHeight: 1.4, desc: "Subsection Header" },
  { label: "Subheading", fontSize: 18, fontWeight: 500, lineHeight: 1.5, desc: "Supporting Subtitle" },
  { label: "Body Text", fontSize: 14, fontWeight: 400, lineHeight: 1.6, desc: "Standard Paragraph Content" },
  { label: "Caption / Small", fontSize: 11, fontWeight: 400, lineHeight: 1.5, desc: "Helper text or metadata" },
];

export const TypographyPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedFont, setSelectedFont] = useState("Inter");
  const selectedNodeId = useCanvasStore((s) => Array.from(s.selectedNodeIds)[0]);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeStyle = useCanvasStore((s) => s.updateNodeStyle);
  const addNode = useCanvasStore((s) => s.addNode);

  if (!isOpen) return null;

  const applyFontToSelected = (fontName: string) => {
    setSelectedFont(fontName);
    if (selectedNodeId && nodes[selectedNodeId]) {
      const existingType = nodes[selectedNodeId].style.typography || {
        fontSize: 14,
        fontWeight: 400,
        color: "#e4e4f0",
        align: "left",
        lineHeight: 1.5,
      };
      updateNodeStyle(selectedNodeId, {
        typography: { ...existingType, fontFamily: fontName },
      });
    }
  };

  const addTextWithPreset = (preset: typeof TEXT_PRESETS[0]) => {
    addNode({
      id: crypto.randomUUID(),
      parentId: null,
      order: 0,
      type: "text",
      name: preset.label,
      geometry: { x: 200, y: 200, width: 320, height: preset.fontSize * preset.lineHeight + 10, rotation: 0 },
      style: {
        fill: "transparent",
        opacity: 1,
        typography: {
          fontFamily: selectedFont,
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight,
          lineHeight: preset.lineHeight,
          color: "#e4e4f0",
          align: "left",
        },
      },
      content: { kind: "text", text: preset.label },
    });
    onClose();
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">🔤</span>
            Typography & Font System
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="panel-description">
            Choose Google Fonts or insert styled typography presets directly onto your canvas.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Fonts list */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Font Families
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                {POPULAR_FONTS.map((font) => (
                  <div
                    key={font.name}
                    onClick={() => applyFontToSelected(font.name)}
                    style={{
                      padding: "10px 14px",
                      background: selectedFont === font.name ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      border: selectedFont === font.name ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{font.name}</span>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{font.category}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#cbd5e1", fontFamily: font.name, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {font.sample}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Presets */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Type Presets (One-Click Add)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                {TEXT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addTextWithPreset(preset)}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: preset.fontSize > 24 ? 18 : preset.fontSize, fontWeight: preset.fontWeight, color: "#fff", fontFamily: selectedFont }}>
                      {preset.label} ({preset.fontSize}px)
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypographyPanel;
