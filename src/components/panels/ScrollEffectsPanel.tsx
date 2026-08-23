import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ScrollEffectsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const selectedNodeId = useCanvasStore((s) => Array.from(s.selectedNodeIds)[0]);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNode = useCanvasStore((s) => s.updateNode);

  if (!isOpen) return null;

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const effects = selectedNode?.scrollEffects || {
    entrance: "fadeIn",
    scrollBehavior: "none",
    parallaxSpeed: 0.5,
    duration: 600,
    delay: 0,
    easing: "ease-out",
  };

  const updateEffect = (key: string, value: any) => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, {
      scrollEffects: {
        ...effects,
        [key]: value,
      },
    });
  };

  const entranceOptions = [
    { label: "None", value: "none" },
    { label: "Fade In", value: "fadeIn" },
    { label: "Slide Up", value: "slideUp" },
    { label: "Slide Down", value: "slideDown" },
    { label: "Slide Left", value: "slideLeft" },
    { label: "Slide Right", value: "slideRight" },
    { label: "Scale Up", value: "scaleUp" },
    { label: "Blur In", value: "blurIn" },
  ];

  const behaviorOptions = [
    { label: "Standard Flow", value: "none" },
    { label: "Parallax Scroll", value: "parallax" },
    { label: "Sticky Top", value: "sticky" },
    { label: "Reveal on Scroll", value: "revealOnScroll" },
  ];

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">🌀</span>
            Scroll & Motion Effects
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {!selectedNode ? (
            <div style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🌀</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>No Element Selected</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Select any canvas element to apply scroll-triggered entrance animations and parallax motion.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                Target: <span style={{ color: "#a78bfa" }}>{selectedNode.name}</span>
              </div>

              {/* Entrance Animations */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Entrance Animation (On Scroll View)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {entranceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateEffect("entrance", opt.value)}
                      style={{
                        padding: "8px 4px",
                        background: effects.entrance === opt.value ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                        border: effects.entrance === opt.value ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6,
                        color: effects.entrance === opt.value ? "#a78bfa" : "#94a3b8",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll Behavior */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Scroll Behavior Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {behaviorOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateEffect("scrollBehavior", opt.value)}
                      style={{
                        padding: "10px 8px",
                        background: effects.scrollBehavior === opt.value ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                        border: effects.scrollBehavior === opt.value ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6,
                        color: effects.scrollBehavior === opt.value ? "#10b981" : "#94a3b8",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing Controls */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Duration ({effects.duration ?? 600}ms)</label>
                  <input type="range" min="100" max="2000" step="50" value={effects.duration ?? 600} onChange={(e) => updateEffect("duration", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Delay ({effects.delay ?? 0}ms)</label>
                  <input type="range" min="0" max="1000" step="50" value={effects.delay ?? 0} onChange={(e) => updateEffect("delay", Number(e.target.value))} style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrollEffectsPanel;
