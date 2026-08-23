import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementType } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface NavPreset {
  id: string;
  name: string;
  category: "Global Headers & Sidebars" | "Trails & Page Switchers" | "Content Anchors";
  type: ElementType;
  description: string;
  options?: any;
  icon: React.ReactNode;
}

const NAV_PRESETS: NavPreset[] = [
  {
    id: "nav_header",
    name: "Header & Navbar",
    category: "Global Headers & Sidebars",
    type: "navHeader",
    description: "Global site branding, primary links (Home, Features, Pricing), and CTA utilities.",
    options: { brand: "CanvasSite", links: ["Home", "Features", "Pricing", "Docs"] },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="4" width="18" height="5" rx="1"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="13" y2="17"/></svg>,
  },
  {
    id: "nav_sidebar",
    name: "Sidebar / Drawer Menu",
    category: "Global Headers & Sidebars",
    type: "navSidebar",
    description: "Vertical navigation panel for deep hierarchy, dashboard categories, and settings.",
    options: {
      items: [
        { label: "Overview", icon: "📊" },
        { label: "Analytics", icon: "📈" },
        { label: "Projects", icon: "📁" },
        { label: "Settings", icon: "⚙️" },
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  },
  {
    id: "nav_breadcrumb",
    name: "Breadcrumb Trail",
    category: "Trails & Page Switchers",
    type: "navBreadcrumb",
    description: "Path trail showing current site location (Home / Dashboard / Analytics).",
    options: { trail: ["Home", "Dashboard", "Analytics", "Overview"] },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="9 18 15 12 9 6"/><line x1="4" y1="12" x2="14" y2="12"/></svg>,
  },
  {
    id: "nav_pagination",
    name: "Pagination & Stepper",
    category: "Trails & Page Switchers",
    type: "navPagination",
    description: "Numbered page sequences ([Prev] 1 [2] 3 [Next]) or multi-step wizard bar.",
    options: { totalPages: 5, activePage: 2 },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="2" y="6" width="4" height="12" rx="1"/><rect x="8" y="6" width="4" height="12" rx="1"/><rect x="14" y="6" width="4" height="12" rx="1"/><rect x="20" y="6" width="2" height="12" rx="1"/></svg>,
  },
  {
    id: "nav_tabs",
    name: "Tabs & Segmented Control",
    category: "Trails & Page Switchers",
    type: "navTabs",
    description: "In-page view switcher tabs with active indicator (Overview | Reports | Settings).",
    options: { tabs: ["Overview", "Analytics", "Reports", "Settings"] },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="3"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  },
  {
    id: "nav_toc",
    name: "Table of Contents (Anchor Jump)",
    category: "Content Anchors",
    type: "navToc",
    description: "On-page jump navigation index block for long-form articles & docs.",
    options: {
      sections: [
        "1. Introduction",
        "2. Key Features",
        "3. Installation & Setup",
        "4. API Documentation",
      ],
    },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="18" x2="12" y2="18"/></svg>,
  },
];

export const NavigationPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createNavControl = useCanvasStore((s: any) => s.createNavControl ?? s.createFormControl);

  if (!isOpen) return null;

  const categories = ["Global Headers & Sidebars", "Trails & Page Switchers", "Content Anchors"] as const;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Navigation & Wayfinding Component Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {categories.map((cat) => {
            const items = NAV_PRESETS.filter((p) => p.category === cat);
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
                        createNavControl(preset.type, preset.name, preset.options);
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
