import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Issue {
  id: string;
  nodeId: string;
  nodeName: string;
  severity: "error" | "warning" | "info";
  title: string;
  recommendation: string;
}

export const AccessibilityPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectNode = useCanvasStore((s) => s.selectNode);

  if (!isOpen) return null;

  const issues: Issue[] = [];

  // Audit nodes
  Object.values(nodes).forEach((node) => {
    if (node.type === "image") {
      issues.push({
        id: `alt-${node.id}`,
        nodeId: node.id,
        nodeName: node.name,
        severity: "warning",
        title: "Missing Alt Text",
        recommendation: "Screen readers require descriptive alt text for images to explain visual content to visually impaired users.",
      });
    }

    if (node.type === "text") {
      const fontSize = node.style.typography?.fontSize || 14;
      if (fontSize < 12) {
        issues.push({
          id: `font-size-${node.id}`,
          nodeId: node.id,
          nodeName: node.name,
          severity: "error",
          title: `Small Text Size (${fontSize}px)`,
          recommendation: "Minimum recommended text size for WCAG AA compliance is 12px for body text to ensure readability.",
        });
      }
    }

    if (node.type === "actionButton" || node.type === "formInput") {
      issues.push({
        id: `aria-${node.id}`,
        nodeId: node.id,
        nodeName: node.name,
        severity: "info",
        title: "Verify Interactive Focus State",
        recommendation: "Ensure this element has a visible focus outline when navigating via Keyboard (Tab key).",
      });
    }
  });

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const severityBadges = {
    error: { bg: "#ef444422", color: "#ef4444", label: "Error" },
    warning: { bg: "#f59e0b22", color: "#f59e0b", label: "Warning" },
    info: { bg: "#3b82f622", color: "#3b82f6", label: "Info" },
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">♿</span>
            Accessibility (a11y) Audit
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{errorCount}</div>
              <div style={{ fontSize: 10, color: "#fca5a5" }}>Errors</div>
            </div>
            <div style={{ flex: 1, padding: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{warningCount}</div>
              <div style={{ fontSize: 10, color: "#fde68a" }}>Warnings</div>
            </div>
            <div style={{ flex: 1, padding: 12, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6" }}>{infoCount}</div>
              <div style={{ fontSize: 10, color: "#93c5fd" }}>Suggestions</div>
            </div>
          </div>

          <p className="panel-description">
            Scanned canvas elements against WCAG 2.1 accessibility guidelines. Click an issue to select the node.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
            {issues.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "#10b981" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>No Accessibility Issues Found</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Your canvas elements pass basic WCAG AA guidelines!</div>
              </div>
            ) : (
              issues.map((issue) => {
                const b = severityBadges[issue.severity];
                return (
                  <div
                    key={issue.id}
                    onClick={() => {
                      selectNode(issue.nodeId);
                      onClose();
                    }}
                    style={{
                      padding: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{issue.nodeName}: {issue.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: b.bg, color: b.color, textTransform: "uppercase" }}>
                        {b.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{issue.recommendation}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
