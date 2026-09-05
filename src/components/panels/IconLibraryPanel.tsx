import React, { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

import { CURATED_ICONS } from "../../constants/icons";

export const IconLibraryPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  const createSectionControl = useCanvasStore((s: any) => s.createSectionControl ?? s.createFormControl);

  if (!isOpen) return null;

  const filteredIcons = CURATED_ICONS.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">✨</span>
            Icons Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <input
            type="text"
            placeholder="Search icons (e.g. arrow, check, user, lock)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              marginBottom: 16,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
            {filteredIcons.map((icon) => (
              <button
                key={icon.name}
                className="panel-card"
                onClick={() => {
                  createSectionControl("iconElement", icon.name, {
                    defaultSize: { w: 48, h: 48 },
                    iconData: { iconName: icon.name, svgPath: icon.path, iconColor: "#e4e4f0", iconSize: 48 },
                  });
                  onClose();
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 14 }}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon.path} />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1", marginTop: 8, textAlign: "center" }}>{icon.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconLibraryPanel;
