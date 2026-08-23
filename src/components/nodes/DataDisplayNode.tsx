import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

export const DataDisplayNode: React.FC<Props> = ({ node }) => {
  const { fill, cornerRadius, border, opacity } = node.style;
  const content = node.content as any;

  // Local state for Play Mode testing
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: fill || "#181826",
    borderRadius: cornerRadius ? `${cornerRadius}px` : "8px",
    border: border ? `${border.width}px ${border.style} ${border.color}` : "1px solid rgba(255,255,255,0.15)",
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
    case "dataCard": {
      return (
        <div style={{ ...containerStyle, padding: 16, justifyContent: "space-between" }}>
          {/* Card Header & Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{content?.title || "Feature Card"}</div>
              <div style={{ fontSize: 11, color: "#8888a8", marginTop: 2 }}>{content?.subtitle || "Productivity Module"}</div>
            </div>
            <span style={{ padding: "2px 8px", borderRadius: 12, background: "rgba(59,130,246,0.2)", border: "1px solid #3b82f6", color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>
              {content?.badge || "PRO"}
            </span>
          </div>

          {/* Description */}
          <div style={{ fontSize: 12, color: "#a0a0c0", lineHeight: 1.4, margin: "8px 0" }}>
            {content?.text || "Self-contained card container grouping related text, badges, and primary action buttons."}
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{ padding: "6px 14px", borderRadius: 6, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {content?.buttonText || "Learn More →"}
            </button>
          </div>
        </div>
      );
    }

    case "dataTable": {
      const rows = content?.rows || [
        { name: "Alex Rivera", role: "Frontend Lead", status: "Active", date: "Today" },
        { name: "Sarah Chen", role: "Product Designer", status: "Active", date: "Yesterday" },
        { name: "Michael Vance", role: "DevOps Engineer", status: "Offline", date: "3d ago" },
      ];

      return (
        <div style={{ ...containerStyle, padding: 0, justifyContent: "flex-start" }}>
          {/* Header Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, fontSize: 11, color: "#8888a8" }}>
            <span>USER</span>
            <span>ROLE</span>
            <span>STATUS</span>
            <span style={{ textAlign: "right" }}>ACTION</span>
          </div>

          {/* Data Rows */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {rows.map((row: any, idx: number) => (
              <div
                key={row.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.5fr 1fr",
                  padding: "8px 12px",
                  alignItems: "center",
                  background: selectedRow === idx ? "rgba(59,130,246,0.12)" : idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() => setSelectedRow(idx)}
              >
                <span style={{ fontWeight: 600, color: "#fff" }}>{row.name}</span>
                <span style={{ color: "#a0a0c0" }}>{row.role}</span>
                <span>
                  <span style={{ padding: "2px 6px", borderRadius: 10, background: row.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: row.status === "Active" ? "#34d399" : "#f87171", fontSize: 10, fontWeight: 600 }}>
                    ● {row.status}
                  </span>
                </span>
                <span style={{ textAlign: "right", color: "#3b82f6", fontWeight: 600, fontSize: 11 }}>Edit</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "dataList": {
      const items = content?.items || [
        { avatar: "👤", title: "New deployment pushed", time: "2m ago", desc: "Production build v2.4.0 success" },
        { avatar: "💬", title: "New comment on Navbar", time: "15m ago", desc: "Abrar left feedback on responsive menu" },
        { avatar: "🔔", title: "System Alert", time: "1h ago", desc: "Database backup completed successfully" },
      ];

      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "flex-start", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Activity Feed & Logs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {items.map((item: any) => (
              <div key={item.title} style={{ display: "flex", gap: 10, padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                  {item.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: "#fff" }}>{item.title}</span>
                    <span style={{ fontSize: 10, color: "#666688" }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8888a8", marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "dataBadge": {
      const variant = content?.variant || "success";
      const badgeBg = variant === "success" ? "#10b98122" : variant === "warning" ? "#f59e0b22" : "#3b82f622";
      const badgeBorder = variant === "success" ? "#10b981" : variant === "warning" ? "#f59e0b" : "#3b82f6";
      const badgeColor = variant === "success" ? "#34d399" : variant === "warning" ? "#fbbf24" : "#60a5fa";

      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "center", background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontWeight: 700, borderRadius: 16 }}>
          <span style={{ fontSize: 12 }}>● {node.name || "Live Badge"}</span>
        </div>
      );
    }

    case "dataAccordion": {
      const sections = content?.sections || [
        { title: "What is CanvasSite Engine?", body: "CanvasSite is a visual web app builder with real-time multi-framework code exporters." },
        { title: "Which export formats are supported?", body: "HTML/CSS, React TSX, Next.js App Router, Tailwind CSS, and Figma JSON." },
        { title: "How does Play Mode work?", body: "Play Mode enables interactive testing of form fields, tabs, navigation, cart, and state logic." },
      ];

      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "flex-start", gap: 6 }}>
          {sections.map((sec: any, idx: number) => {
            const isOpen = expandedAccordion === idx;
            return (
              <div key={sec.title} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}
                  onClick={() => setExpandedAccordion(isOpen ? null : idx)}
                >
                  <span>{sec.title}</span>
                  <span style={{ color: "#8888a8", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>▼</span>
                </div>
                {isOpen && (
                  <div style={{ padding: "8px 12px", fontSize: 11, color: "#a0a0c0", lineHeight: 1.4, background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {sec.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case "dataTooltip": {
      return (
        <div style={{ ...containerStyle, padding: 6, position: "relative", alignItems: "center", justifyContent: "center" }} onMouseEnter={() => setShowTooltip(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#93c5fd" }}>
            <span>💡 {content?.trigger || "Hover for Details"}</span>
          </div>
          {showTooltip && (
            <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#111827", border: "1px solid #3b82f6", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 11, whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              {content?.text || "Quick contextual overlay popover with helper info"}
            </div>
          )}
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
