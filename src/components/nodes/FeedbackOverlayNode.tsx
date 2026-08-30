import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";
import { resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
}

export const FeedbackOverlayNode: React.FC<Props> = ({ node }) => {
  const resolvedStyle = resolveNodeStyle(node);
  const content = resolveNodeContent(node);

  // Local state for Play Mode interactions
  const [progressVal, setProgressVal] = useState<number>(68);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: resolvedStyle.fill || "#181826",
    borderRadius: resolvedStyle.cornerRadius ? `${resolvedStyle.cornerRadius}px` : "8px",
    border: resolvedStyle.border ? `${resolvedStyle.border.width}px ${resolvedStyle.border.style} ${resolvedStyle.border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: isDismissed ? 0.4 : (resolvedStyle.opacity ?? 1),
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
    case "feedbackModal": {
      const showTitle = content.showTitle;
      const showText = content.showText;
      const showConfirmBtn = content.showConfirmBtn;
      const showCancelBtn = content.showCancelBtn;

      return (
        <div style={{ ...containerStyle, padding: 0, position: "relative" }}>
          {/* Modal Content Window */}
          <div style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {showTitle && <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{content.title}</div>}
              <span style={{ cursor: "pointer", color: "#8888a8", fontSize: 14 }} onClick={() => setIsDismissed(true)}>✕</span>
            </div>
            {showText && (
              <div style={{ fontSize: 12, color: "#a0a0c0", lineHeight: 1.4, margin: "8px 0" }}>
                {content.text}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {showCancelBtn && (
                <button style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0c0", fontSize: 11, cursor: "pointer" }}>
                  {content.cancelText}
                </button>
              )}
              {showConfirmBtn && (
                <button style={{ padding: "6px 12px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
                  {content.confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "feedbackToast": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between", background: "#10b98122", border: "1px solid #10b981", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#34d399" }}>✓</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{content.text}</span>
          </div>
          <span style={{ fontSize: 12, color: "#34d399", cursor: "pointer", fontWeight: 700 }} onClick={() => setIsDismissed(true)}>
            Dismiss
          </span>
        </div>
      );
    }

    case "feedbackAlert": {
      const type = content.alertType;
      const alertBg = type === "error" ? "#ef444422" : type === "success" ? "#10b98122" : "#f59e0b22";
      const alertBorder = type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#f59e0b";
      const alertIcon = type === "error" ? "🚨" : type === "success" ? "✅" : "⚠️";
      const alertColor = type === "error" ? "#f87171" : type === "success" ? "#34d399" : "#fbbf24";

      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", gap: 10, background: alertBg, border: `1px solid ${alertBorder}`, color: "#fff", padding: "10px 14px" }}>
          <span style={{ fontSize: 16 }}>{alertIcon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: alertColor }}>{content.title}</div>
            <div style={{ fontSize: 11, color: "#a0a0c0" }}>{content.text}</div>
          </div>
        </div>
      );
    }

    case "feedbackProgress": {
      const pct = content.progressVal ?? progressVal;
      return (
        <div style={{ ...containerStyle, padding: 10, gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#a0a0c0" }}>
            <span>{content.label}</span>
            <span style={{ fontWeight: 700, color: "#3b82f6" }}>{pct}%</span>
          </div>
          <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", position: "relative" }} onClick={() => setProgressVal((p) => (p >= 100 ? 20 : p + 20))}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
        </div>
      );
    }

    case "feedbackSkeleton": {
      return (
        <div style={{ ...containerStyle, padding: 12, justifyContent: "space-between", background: "#161626" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ width: "60%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
              <div style={{ width: "40%", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>
          <div style={{ width: "100%", height: 12, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginTop: 8 }} />
          <div style={{ width: "80%", height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
        </div>
      );
    }

    case "feedbackEmptyState": {
      return (
        <div style={{ ...containerStyle, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, gap: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{content.title}</div>
          <div style={{ fontSize: 11, color: "#8888a8", maxWidth: 240, lineHeight: 1.4 }}>
            {content.text}
          </div>
          <button style={{ marginTop: 8, padding: "6px 14px", borderRadius: 6, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            {content.buttonText}
          </button>
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
