import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";
import { resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
}

export const NavWayfindingNode: React.FC<Props> = ({ node }) => {
  const resolvedStyle = resolveNodeStyle(node);
  const content = resolveNodeContent(node);

  // Local state for interactive Play Mode testing
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(2);
  const [activeSidebarItem, setActiveSidebarItem] = useState<number>(0);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: resolvedStyle.fill || "#181826",
    borderRadius: resolvedStyle.cornerRadius ? `${resolvedStyle.cornerRadius}px` : "8px",
    border: resolvedStyle.border ? `${resolvedStyle.border.width}px ${resolvedStyle.border.style} ${resolvedStyle.border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: opacity ?? 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "8px 12px",
    color: "#e4e4f0",
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    userSelect: "none",
  };

  switch (node.type) {
    case "navHeader": {
      const links = content?.links || ["Home", "Features", "Pricing", "Docs"];
      const showLogo = content?.showLogo !== false;
      const showLinks = content?.showLinks !== false;
      const showSignIn = content?.showSignIn !== false;
      const showCta = content?.showCta !== false;

      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          {/* Brand Logo */}
          {showLogo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "#fff" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>
                ⚡
              </div>
              <span>{content?.brand || "CanvasSite"}</span>
            </div>
          )}

          {/* Primary Nav Links */}
          {showLinks && (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {links.map((link: string, idx: number) => (
                <span
                  key={link + idx}
                  style={{
                    color: activeTab === idx ? "#3b82f6" : "#a0a0c0",
                    fontWeight: activeTab === idx ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontSize: 13,
                  }}
                  onClick={() => setActiveTab(idx)}
                >
                  {link}
                </span>
              ))}
            </div>
          )}

          {/* Top-level Utilities & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {showSignIn && (
              <span style={{ fontSize: 12, color: "#a0a0c0", cursor: "pointer" }}>{content?.signInText || "Sign In"}</span>
            )}
            {showCta && (
              <button style={{ padding: "6px 14px", borderRadius: 6, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                {content?.ctaText || "Get Started"}
              </button>
            )}
          </div>
        </div>
      );
    }

    case "navSidebar": {
      const items = content?.items || [
        { label: "Overview", icon: "📊" },
        { label: "Analytics", icon: "📈" },
        { label: "Projects", icon: "📁" },
        { label: "Customers", icon: "👥" },
        { label: "Settings", icon: "⚙️" },
      ];
      return (
        <div style={{ ...containerStyle, padding: 12, justifyContent: "flex-start", gap: 16 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              🚀
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Workspace</span>
          </div>

          {/* Vertical Menu Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {items.map((item: any, idx: number) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: activeSidebarItem === idx ? "rgba(139, 92, 246, 0.15)" : "transparent",
                  color: activeSidebarItem === idx ? "#a78bfa" : "#a0a0c0",
                  fontWeight: activeSidebarItem === idx ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setActiveSidebarItem(idx)}
              >
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {activeSidebarItem === idx && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "navBreadcrumb": {
      const trail = content?.trail || ["Home", "Dashboard", "Analytics", "Overview"];
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", gap: 8, fontSize: 12 }}>
          {trail.map((crumb: string, idx: number) => (
            <React.Fragment key={crumb}>
              <span
                style={{
                  color: idx === trail.length - 1 ? "#fff" : "#8888a8",
                  fontWeight: idx === trail.length - 1 ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {crumb}
              </span>
              {idx < trail.length - 1 && <span style={{ color: "#555577" }}>/</span>}
            </React.Fragment>
          ))}
        </div>
      );
    }

    case "navPagination": {
      const pages = [1, 2, 3, 4, 5];
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#8888a8" }}>Showing Page {activePage} of 5</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 11 }}
            >
              Prev
            </button>
            {pages.map((pg) => (
              <button
                key={pg}
                onClick={() => setActivePage(pg)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: activePage === pg ? "#3b82f6" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontWeight: activePage === pg ? 700 : 400,
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                {pg}
              </button>
            ))}
            <button
              disabled={activePage === 5}
              onClick={() => setActivePage((p) => Math.min(5, p + 1))}
              style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 11 }}
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    case "navTabs": {
      const tabs = content?.tabs || ["Overview", "Analytics", "Reports", "Settings"];
      return (
        <div style={{ ...containerStyle, padding: 0, justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 12px" }}>
            {tabs.map((tab: string, idx: number) => (
              <div
                key={tab}
                style={{
                  padding: "8px 12px",
                  color: activeTab === idx ? "#3b82f6" : "#8888a8",
                  fontWeight: activeTab === idx ? 600 : 400,
                  borderBottom: activeTab === idx ? "2px solid #3b82f6" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontSize: 13,
                }}
                onClick={() => setActiveTab(idx)}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "navToc": {
      const sections = content?.sections || [
        "1. Introduction",
        "2. Key Architecture Features",
        "3. Installation & Setup",
        "4. Configuration Schema",
        "5. API Reference",
      ];
      return (
        <div style={{ ...containerStyle, padding: 12, justifyContent: "flex-start", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
            Table of Contents
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sections.map((sec: string, idx: number) => (
              <span
                key={sec}
                style={{
                  color: activeTab === idx ? "#3b82f6" : "#a0a0c0",
                  fontWeight: activeTab === idx ? 600 : 400,
                  cursor: "pointer",
                  fontSize: 12,
                  paddingLeft: 4,
                  borderLeft: activeTab === idx ? "2px solid #3b82f6" : "2px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setActiveTab(idx)}
              >
                {sec}
              </span>
            ))}
          </div>
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
