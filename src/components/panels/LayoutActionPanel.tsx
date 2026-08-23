import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementType } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface LayoutPreset {
  id: string;
  name: string;
  category: "Layout, Containers & Media" | "Action & Utility Controls";
  type: ElementType;
  description: string;
  options?: any;
  icon: React.ReactNode;
}

const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "layout_container",
    name: "Grid & Flex Container",
    category: "Layout, Containers & Media",
    type: "layoutContainer",
    description: "Responsive layout box defining structural row/column flows and gaps.",
    options: { title: "Flex Grid Container", columns: ["Column A", "Column B", "Column C"] },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  },
  {
    id: "layout_carousel",
    name: "Carousel / Media Slider",
    category: "Layout, Containers & Media",
    type: "layoutCarousel",
    description: "Swipeable viewports for browsing sets of media cards with controls & dot indicators.",
    options: {
      slides: [
        { title: "Slide 1: Vision", bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
        { title: "Slide 2: Architecture", bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
        { title: "Slide 3: Deployment", bg: "linear-gradient(135deg, #10b981, #047857)" },
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 12l3-3 3 3"/><path d="M18 12l-3 3-3-3"/></svg>,
  },
  {
    id: "media_player",
    name: "Embedded Media Player",
    category: "Layout, Containers & Media",
    type: "mediaPlayer",
    description: "Video & audio player frame with timeline controls, play/pause, time code & volume.",
    options: { title: "Demo Video Stream.mp4" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  },
  {
    id: "layout_divider",
    name: "Divider & Section Rule",
    category: "Layout, Containers & Media",
    type: "layoutDivider",
    description: "Visual rule line separating distinct content blocks with optional label.",
    options: { label: "SECTION DIVIDER" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>,
  },
  {
    id: "action_button",
    name: "Action Button (Primary, Ghost, FAB)",
    category: "Action & Utility Controls",
    type: "actionButton",
    description: "Interactive button trigger for submitting forms, opening views, or logic execution.",
    options: { variant: "primary" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  },
  {
    id: "action_menu",
    name: "Dropdown & Context Menu",
    category: "Action & Utility Controls",
    type: "actionMenu",
    description: "Pop-up list of secondary action links attached to a button or icon trigger.",
    options: { title: "••• Actions", items: ["Edit Node", "Duplicate Item", "Export Code", "Delete Node"] },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  },
];

export const LayoutActionPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createLayoutActionControl = useCanvasStore((s: any) => s.createLayoutActionControl ?? s.createFormControl);

  if (!isOpen) return null;

  const categories = ["Layout, Containers & Media", "Action & Utility Controls"] as const;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            Layout, Media & Action Controls Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {categories.map((cat) => {
            const items = LAYOUT_PRESETS.filter((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div className="panel-section__title" style={{ color: "#3b82f6", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  {cat} ({items.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {items.map((preset) => (
                    <div
                      key={preset.id}
                      style={{
                        background: "#1e1e36",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: 14,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => {
                        createLayoutActionControl(preset.type, preset.name, preset.options);
                        onClose();
                      }}
                    >
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8 }}>{preset.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#e4e4f0", marginBottom: 2 }}>{preset.name}</div>
                        <div style={{ fontSize: 11, color: "#8888a8", lineHeight: 1.4 }}>{preset.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
