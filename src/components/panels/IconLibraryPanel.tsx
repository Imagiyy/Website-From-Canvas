import React, { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CURATED_ICONS = [
  // Navigation & UI
  { name: "Arrow Right", category: "Navigation", path: "M5 12h14M12 5l7 7-7 7" },
  { name: "Arrow Left", category: "Navigation", path: "M19 12H5M12 19l-7-7 7-7" },
  { name: "Chevron Down", category: "Navigation", path: "M6 9l6 6 6-6" },
  { name: "Chevron Up", category: "Navigation", path: "M18 15l-6-6-6 6" },
  { name: "Menu / Hamburger", category: "Navigation", path: "M3 12h18M3 6h18M3 18h18" },
  { name: "Close / X", category: "Navigation", path: "M18 6L6 18M6 6l12 12" },
  { name: "Search", category: "Navigation", path: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { name: "Home", category: "Navigation", path: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  
  // Actions & Controls
  { name: "Check / Confirm", category: "Actions", path: "M20 6L9 17l-5-5" },
  { name: "Plus / Add", category: "Actions", path: "M12 5v14M5 12h14" },
  { name: "Trash / Delete", category: "Actions", path: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" },
  { name: "Edit / Pencil", category: "Actions", path: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" },
  { name: "Download", category: "Actions", path: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
  { name: "Share", category: "Actions", path: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" },
  { name: "Heart / Like", category: "Actions", path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  { name: "Star", category: "Actions", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },

  // Objects & Media
  { name: "User / Profile", category: "Objects", path: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  { name: "Lock / Shield", category: "Objects", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { name: "Mail / Envelope", category: "Objects", path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { name: "Phone", category: "Objects", path: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" },
  { name: "Camera / Image", category: "Objects", path: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" },
  { name: "Shopping Bag", category: "Objects", path: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" },
  { name: "Globe / Web", category: "Objects", path: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM2 12H22M12 2A15.3 15.3 0 0115.5 12A15.3 15.3 0 0112 22A15.3 15.3 0 018.5 12A15.3 15.3 0 0112 2Z" },
  { name: "Settings / Cog", category: "Objects", path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },

  // Tech & Commerce
  { name: "Zap / Lightning", category: "Tech", path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "Shield / Security", category: "Tech", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { name: "Code", category: "Tech", path: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { name: "Terminal", category: "Tech", path: "M4 17l6-6-6-6M12 19h8" },
  { name: "Sparkles / AI", category: "Tech", path: "M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0l-2.121-2.121M7.757 7.757L5.636 5.636" },
];

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
