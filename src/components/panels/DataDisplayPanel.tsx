import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementType } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface DataPreset {
  id: string;
  name: string;
  category: "Cards & Layout Containers" | "Tables, Feeds & Lists" | "Badges, Overlays & Collapsibles";
  type: ElementType;
  description: string;
  options?: any;
  icon: React.ReactNode;
}

const DATA_PRESETS: DataPreset[] = [
  {
    id: "data_card",
    name: "Feature / Content Card",
    category: "Cards & Layout Containers",
    type: "dataCard",
    description: "Self-contained card grouping title, status badge, text snippet, and action button.",
    options: { title: "Feature Card", subtitle: "Productivity Module", badge: "PRO", buttonText: "Learn More →" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  },
  {
    id: "data_table",
    name: "Table & Data Grid",
    category: "Tables, Feeds & Lists",
    type: "dataTable",
    description: "Tabular data view featuring headers, sortable columns, zebra striping, and action links.",
    options: {
      rows: [
        { name: "Alex Rivera", role: "Frontend Lead", status: "Active", date: "Today" },
        { name: "Sarah Chen", role: "Product Designer", status: "Active", date: "Yesterday" },
        { name: "Michael Vance", role: "DevOps Engineer", status: "Offline", date: "3d ago" },
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
  },
  {
    id: "data_list",
    name: "Activity Log / List Feed",
    category: "Tables, Feeds & Lists",
    type: "dataList",
    description: "Linear item display with user avatars, message text, and relative timestamps.",
    options: {
      items: [
        { avatar: "👤", title: "New deployment pushed", time: "2m ago", desc: "Production build v2.4.0 success" },
        { avatar: "💬", title: "New comment on Navbar", time: "15m ago", desc: "Abrar left feedback on responsive menu" },
        { avatar: "🔔", title: "System Alert", time: "1h ago", desc: "Database backup completed successfully" },
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
  {
    id: "data_badge",
    name: "Badge & Status Chip",
    category: "Badges, Overlays & Collapsibles",
    type: "dataBadge",
    description: "Compact status indicator label (Live, Active, v2.4.0, Pro) with pill border.",
    options: { variant: "success" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="8" cy="12" r="2"/></svg>,
  },
  {
    id: "data_accordion",
    name: "Accordion & Collapsible",
    category: "Badges, Overlays & Collapsibles",
    type: "dataAccordion",
    description: "Stacked headers expanding to reveal or collapse hidden content panels.",
    options: {
      sections: [
        { title: "What is CanvasSite Engine?", body: "CanvasSite is a visual web app builder with real-time code exporters." },
        { title: "Which export formats are supported?", body: "HTML/CSS, React TSX, Next.js App Router, Tailwind CSS, and Figma JSON." },
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><path d="M8 14l4 4 4-4"/></svg>,
  },
  {
    id: "data_tooltip",
    name: "Tooltip & Popover Overlay",
    category: "Badges, Overlays & Collapsibles",
    type: "dataTooltip",
    description: "Contextual hover/click overlay popover with helper info and keyboard shortcuts.",
    options: { trigger: "Hover for Details", text: "Quick contextual overlay popover with helper info" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="12" cy="10" r="1"/></svg>,
  },
];

export const DataDisplayPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createDataControl = useCanvasStore((s: any) => s.createDataControl ?? s.createFormControl);

  if (!isOpen) return null;

  const categories = ["Cards & Layout Containers", "Tables, Feeds & Lists", "Badges, Overlays & Collapsibles"] as const;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Content & Data Display Component Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {categories.map((cat) => {
            const items = DATA_PRESETS.filter((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div className="panel-section__title" style={{ color: "#8b5cf6", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
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
                        createDataControl(preset.type, preset.name, preset.options);
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
