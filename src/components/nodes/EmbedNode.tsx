import React, { useState } from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

export const EmbedNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const [editMode, setEditMode] = useState(false);

  const renderContent = () => {
    switch (node.type) {
      case "embedCode": {
        const code = node.embedData?.code || '<!-- Paste your HTML here -->\n<div style="padding: 20px;">\n  <h3>Custom Code Block</h3>\n  <p>Edit to add your own HTML.</p>\n</div>';
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#1a1a2e", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "monospace", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#f59e0b" }}>{"</>"}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>Custom Code</span>
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); setEditMode(!editMode); }}
                style={{ padding: "3px 10px", background: editMode ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)", borderRadius: 4, fontSize: 10, color: editMode ? "#10b981" : "#94a3b8", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
              >
                {editMode ? "Preview" : "Edit"}
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
              {editMode ? (
                <pre style={{ margin: 0, fontSize: 11, color: "#e4e4f0", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{code}</pre>
              ) : (
                <div style={{ fontSize: 11, color: "#e4e4f0" }} dangerouslySetInnerHTML={{ __html: code }} />
              )}
            </div>
          </div>
        );
      }

      case "embedIframe": {
        const src = node.embedData?.iframeSrc || "";
        const embedType = node.embedData?.embedType || "custom";
        const typeColors: Record<string, string> = { youtube: "#ff0000", maps: "#34a853", spotify: "#1db954", twitter: "#1da1f2", custom: "#6366f1" };
        const typeLabels: Record<string, string> = { youtube: "▶ YouTube", maps: "📍 Maps", spotify: "🎵 Spotify", twitter: "𝕏 Twitter", custom: "🔗 iFrame" };

        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#1a1a2e", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[embedType] || "#6366f1" }} />
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{typeLabels[embedType] || "iFrame Embed"}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              {src ? (
                <iframe src={src} style={{ width: "100%", height: "100%", border: "none", borderRadius: 6 }} title="Embed" sandbox="allow-scripts allow-same-origin" />
              ) : (
                <div style={{ textAlign: "center", color: "#475569", fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>No URL set</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Add an iframe URL in the properties panel</div>
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#1e1e2e", borderRadius: 8, padding: 16, color: "#aaa", fontSize: 12 }}>Embed</div>;
    }
  };

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <foreignObject data-node-id={node.id} x={x} y={y} width={width} height={height} style={{ overflow: "visible" }}>
        {renderContent()}
      </foreignObject>
    </g>
  );
});

EmbedNode.displayName = "EmbedNode";
