// Design Tokens Panel — 2.2 Named Colors & Text Styles
import React, { useState } from "react";
import { useDesignTokenStore } from "../../store/designTokenStore";
import { useCanvasStore } from "../../store/canvasStore";
import type { TypographyStyle } from "../../types/canvas";
import "../panels/PanelStyles.css";

const DesignTokensPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"colors" | "text">("colors");
  const colorTokens = useDesignTokenStore((s) => s.colorTokens);
  const textStyleTokens = useDesignTokenStore((s) => s.textStyleTokens);
  const addColorToken = useDesignTokenStore((s) => s.addColorToken);
  const updateColorToken = useDesignTokenStore((s) => s.updateColorToken);
  const deleteColorToken = useDesignTokenStore((s) => s.deleteColorToken);
  const addTextStyle = useDesignTokenStore((s) => s.addTextStyle);
  const deleteTextStyle = useDesignTokenStore((s) => s.deleteTextStyle);

  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const updateNodeStyle = useCanvasStore((s) => s.updateNodeStyle);

  const [newColorName, setNewColorName] = useState("");
  const [newColorValue, setNewColorValue] = useState("#8B5CF6");
  const [newStyleName, setNewStyleName] = useState("");

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    addColorToken(newColorName.trim(), newColorValue);
    setNewColorName("");
  };

  const handleAddTextStyle = () => {
    if (!newStyleName.trim()) return;
    const defaultStyle: TypographyStyle = {
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 400,
      color: "#E4E4F0",
      align: "left",
      lineHeight: 1.5,
    };
    addTextStyle(newStyleName.trim(), defaultStyle);
    setNewStyleName("");
  };

  const handleApplyColor = (color: string) => {
    selectedNodeIds.forEach((id) => {
      updateNodeStyle(id, { fill: color });
    });
  };

  const handleApplyTextStyle = (style: TypographyStyle) => {
    selectedNodeIds.forEach((id) => {
      updateNodeStyle(id, { typography: style });
    });
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Design Tokens
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === "colors" ? "panel-tab--active" : ""}`} onClick={() => setActiveTab("colors")}>Colors</button>
            <button className={`panel-tab ${activeTab === "text" ? "panel-tab--active" : ""}`} onClick={() => setActiveTab("text")}>Text Styles</button>
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "colors" && (
            <>
              <div className="panel-section">
                <div className="panel-row" style={{ gap: 8, marginBottom: 12 }}>
                  <input className="panel-input" placeholder="Color name..." value={newColorName} onChange={(e) => setNewColorName(e.target.value)} style={{ flex: 1 }}/>
                  <input type="color" value={newColorValue} onChange={(e) => setNewColorValue(e.target.value)} style={{ width: 36, height: 36, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent" }}/>
                  <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleAddColor}>Add</button>
                </div>

                <div className="panel-grid panel-grid--2col">
                  {colorTokens.map((token) => (
                    <div key={token.id} className="panel-card" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => handleApplyColor(token.value)}>
                      <div className="panel-color-swatch" style={{ backgroundColor: token.value }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.name}</div>
                        <div style={{ fontSize: 10, color: "#666680" }}>{token.value}</div>
                      </div>
                      <button className="panel-btn panel-btn--icon panel-btn--small" style={{ opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); deleteColorToken(token.id); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "text" && (
            <>
              <div className="panel-section">
                <div className="panel-row" style={{ gap: 8, marginBottom: 12 }}>
                  <input className="panel-input" placeholder="Style name..." value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)} style={{ flex: 1 }}/>
                  <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleAddTextStyle}>Add</button>
                </div>

                {textStyleTokens.map((token) => (
                  <div key={token.id} className="panel-card" style={{ cursor: "pointer" }} onClick={() => handleApplyTextStyle(token.style)}>
                    <div className="panel-row panel-row--between">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4f0" }}>{token.name}</div>
                        <div style={{ fontSize: 10, color: "#666680" }}>
                          {token.style.fontFamily.split(",")[0]} · {token.style.fontSize}px · {token.style.fontWeight}
                        </div>
                      </div>
                      <button className="panel-btn panel-btn--icon panel-btn--small" style={{ opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); deleteTextStyle(token.id); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ marginTop: 8, fontFamily: token.style.fontFamily, fontSize: Math.min(token.style.fontSize, 24), fontWeight: token.style.fontWeight, color: token.style.color, lineHeight: token.style.lineHeight, textTransform: (token.style.textTransform as any) || "none" }}>
                      The quick brown fox jumps
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel-footer">
          <span style={{ fontSize: 11, color: "#666680", flex: 1 }}>
            {selectedNodeIds.size > 0 ? `${selectedNodeIds.size} element(s) selected — click a token to apply` : "Select elements to apply tokens"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DesignTokensPanel;
