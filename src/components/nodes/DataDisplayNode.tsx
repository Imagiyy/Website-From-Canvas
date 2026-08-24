import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";
import { resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
}

export const DataDisplayNode: React.FC<Props> = ({ node }) => {
  const resolvedStyle = resolveNodeStyle(node);
  const content = resolveNodeContent(node);

  // Local state for Play Mode testing
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: resolvedStyle.fill || "#181826",
    borderRadius: resolvedStyle.cornerRadius ? `${resolvedStyle.cornerRadius}px` : "8px",
    border: resolvedStyle.border ? `${resolvedStyle.border.width}px ${resolvedStyle.border.style} ${resolvedStyle.border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: resolvedStyle.opacity ?? 1,
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
      const showTitle = content.showTitle;
      const showSubtitle = content.showSubtitle;
      const showBadge = content.showBadge;
      const showText = content.showText;
      const showButton = content.showButton;

      return (
        <div style={{ ...containerStyle, padding: 16, justifyContent: "space-between" }}>
          {/* Card Header & Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {showTitle && <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{content.title}</div>}
              {showSubtitle && <div style={{ fontSize: 11, color: "#8888a8", marginTop: 2 }}>{content.subtitle}</div>}
            </div>
            {showBadge && (
              <span style={{ padding: "2px 8px", borderRadius: 12, background: "rgba(59,130,246,0.2)", border: "1px solid #3b82f6", color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>
                {content.badge}
              </span>
            )}
          </div>

          {/* Description */}
          {showText && (
            <div style={{ fontSize: 12, color: "#a0a0c0", lineHeight: 1.4, margin: "8px 0" }}>
              {content.text}
            </div>
          )}

          {/* Action Footer */}
          {showButton && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={{ padding: "6px 14px", borderRadius: 6, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                {content.buttonText}
              </button>
            </div>
          )}
        </div>
      );
    }

    case "dataTable": {
      const rows = content.rows;
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
            {rows.map((row: any, idx: number) => {
              const name = row.name || row.id || "Row " + (idx + 1);
              const role = row.role || row.status || "Item";
              const status = row.status || "Active";
              return (
                <div
                  key={name + idx}
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
                  <span style={{ fontWeight: 600, color: "#fff" }}>{name}</span>
                  <span style={{ color: "#a0a0c0" }}>{role}</span>
                  <span>
                    <span style={{ padding: "2px 6px", borderRadius: 10, background: status === "Active" || status === "Completed" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: status === "Active" || status === "Completed" ? "#34d399" : "#f87171", fontSize: 10, fontWeight: 600 }}>
                      ● {status}
                    </span>
                  </span>
                  <span style={{ textAlign: "right", color: "#3b82f6", fontWeight: 600, fontSize: 11 }}>Edit</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "dataList": {
      const items = content.items;
      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "flex-start", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Activity Feed & Logs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {items.map((item: any, idx: number) => {
              const label = typeof item === "string" ? item : item.label || item.title || "Item " + (idx + 1);
              const avatar = typeof item === "object" ? item.avatar || item.icon || "👤" : "👤";
              const time = typeof item === "object" ? item.time || "Just now" : "";
              const desc = typeof item === "object" ? item.desc || "" : "";
              return (
                <div key={label + idx} style={{ display: "flex", gap: 10, padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                    {avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: "#fff" }}>{label}</span>
                      {time && <span style={{ fontSize: 10, color: "#666688" }}>{time}</span>}
                    </div>
                    {desc && <div style={{ fontSize: 11, color: "#8888a8", marginTop: 2 }}>{desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "dataBadge": {
      const variant = content.variant;
      const badgeBg = variant === "success" ? "#10b98122" : variant === "warning" ? "#f59e0b22" : "#3b82f622";
      const badgeBorder = variant === "success" ? "#10b981" : variant === "warning" ? "#f59e0b" : "#3b82f6";
      const badgeColor = variant === "success" ? "#34d399" : variant === "warning" ? "#fbbf24" : "#60a5fa";

      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "center", background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor, fontWeight: 700, borderRadius: 16 }}>
          <span style={{ fontSize: 12 }}>● {content.label}</span>
        </div>
      );
    }

    case "dataAccordion": {
      const accordions = content.accordions;
      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "flex-start", gap: 6 }}>
          {accordions.map((sec: any, idx: number) => {
            const isOpen = expandedAccordion === idx;
            return (
              <div key={sec.title + idx} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontWeight: 600, fontSize: 12 }}
                  onClick={() => setExpandedAccordion(isOpen ? null : idx)}
                >
                  <span>{sec.title}</span>
                  <span style={{ color: "#8888a8", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>▼</span>
                </div>
                {isOpen && (
                  <div style={{ padding: "8px 12px", fontSize: 11, color: "#a0a0c0", lineHeight: 1.4, background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {sec.content || sec.body}
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
            <span>💡 {content.trigger}</span>
          </div>
          {showTooltip && (
            <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#111827", border: "1px solid #3b82f6", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 11, whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              {content.text}
            </div>
          )}
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
