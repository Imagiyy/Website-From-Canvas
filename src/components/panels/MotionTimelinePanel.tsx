import React, { useState, useEffect } from "react";
import { useMotionStore, SPRING_PRESETS } from "../../store/motionStore";
import { useCanvasStore } from "../../store/canvasStore";
import type { KeyframeProperty, AnimationTrack, MotionKeyframe } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MotionTimelinePanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const sequences = useMotionStore((s) => s.sequences);
  const activeSequenceId = useMotionStore((s) => s.activeSequenceId);
  const currentTimeMs = useMotionStore((s) => s.currentTimeMs);
  const isPlaying = useMotionStore((s) => s.isPlaying);
  const playbackSpeed = useMotionStore((s) => s.playbackSpeed);

  const createSequence = useMotionStore((s) => s.createSequence);
  const setActiveSequence = useMotionStore((s) => s.setActiveSequence);
  const updateSequence = useMotionStore((s) => s.updateSequence);
  const addTrack = useMotionStore((s) => s.addTrack);
  const removeTrack = useMotionStore((s) => s.removeTrack);
  const addKeyframe = useMotionStore((s) => s.addKeyframe);
  const setCurrentTimeMs = useMotionStore((s) => s.setCurrentTimeMs);
  const togglePlay = useMotionStore((s) => s.togglePlay);
  const setPlaybackSpeed = useMotionStore((s) => s.setPlaybackSpeed);

  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const nodes = useCanvasStore((s) => s.nodes);

  const activeSequence = sequences.find((s) => s.id === activeSequenceId) || sequences[0];

  const [selectedProperty, setSelectedProperty] = useState<KeyframeProperty>("y");
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);

  // Playback timer ticker loop
  useEffect(() => {
    if (!isPlaying || !activeSequence) return;
    const interval = setInterval(() => {
      const { currentTimeMs, setCurrentTimeMs, activeSequenceId, sequences, togglePlay } =
        useMotionStore.getState();
      const currentSeq = sequences.find((s) => s.id === activeSequenceId);
      if (!currentSeq) return;

      const nextTime = currentTimeMs + 30 * playbackSpeed;
      if (nextTime >= currentSeq.durationMs) {
        if (currentSeq.loop) {
          setCurrentTimeMs(0);
        } else {
          setCurrentTimeMs(currentSeq.durationMs);
          togglePlay();
        }
      } else {
        setCurrentTimeMs(nextTime);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying, activeSequence, playbackSpeed]);

  if (!isOpen) return null;

  const firstSelectedNodeId = Array.from(selectedNodeIds)[0];
  const firstSelectedNode = firstSelectedNodeId ? nodes[firstSelectedNodeId] : null;

  const handleAddTrack = () => {
    if (!activeSequence || !firstSelectedNodeId) return;
    addTrack(activeSequence.id, firstSelectedNodeId, selectedProperty);
  };

  const handleAddKeyframeAtPlayhead = (trackId: string, prop: KeyframeProperty) => {
    if (!activeSequence) return;
    const defaultValue = prop === "opacity" ? 1 : prop === "scale" ? 1 : 0;
    addKeyframe(activeSequence.id, trackId, Math.round(currentTimeMs), defaultValue, "spring", SPRING_PRESETS.bouncy);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        className="panel-content"
        style={{ maxWidth: 940, width: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <div>
              <h2 className="panel-title">Advanced Motion & Keyframe Timelines</h2>
              <p className="panel-subtitle">Scrubber multi-track keyframe editor & Spring Dynamics physics engine</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="panel-body" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Sequence Selector & Toolbar */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Sequence:</label>
              <select
                className="panel-input"
                style={{ width: 220 }}
                value={activeSequence?.id || ""}
                onChange={(e) => setActiveSequence(e.target.value)}
              >
                {sequences.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMs}ms)
                  </option>
                ))}
              </select>
              <button
                className="panel-btn panel-btn--small"
                onClick={() => createSequence("New Sequence", 4000)}
              >
                + New Sequence
              </button>
            </div>

            {/* Playback Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className={`panel-btn panel-btn--small ${isPlaying ? "panel-btn--primary" : ""}`}
                onClick={togglePlay}
                style={{ width: 80 }}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>

              <button
                className="panel-btn panel-btn--small"
                onClick={() => setCurrentTimeMs(0)}
                title="Rewind to 0ms"
              >
                ⏮ 0ms
              </button>

              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#10b981", fontWeight: 700 }}>
                {(currentTimeMs / 1000).toFixed(2)}s / {((activeSequence?.durationMs || 3000) / 1000).toFixed(2)}s
              </span>

              <select
                className="panel-input"
                style={{ width: 70, padding: "4px 6px" }}
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={activeSequence?.loop || false}
                  onChange={(e) => activeSequence && updateSequence(activeSequence.id, { loop: e.target.checked })}
                />
                Loop
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={activeSequence?.scrollScrub || false}
                  onChange={(e) => activeSequence && updateSequence(activeSequence.id, { scrollScrub: e.target.checked })}
                />
                Scroll Scrub
              </label>
            </div>
          </div>

          {/* Add Track Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(139, 92, 246, 0.08)", padding: 10, borderRadius: 8, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>Target Node:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6" }}>
                {firstSelectedNode ? firstSelectedNode.name : "None (Select a node on canvas)"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                className="panel-input"
                style={{ width: 140 }}
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value as KeyframeProperty)}
              >
                <option value="opacity">Opacity</option>
                <option value="y">Y Translate</option>
                <option value="x">X Translate</option>
                <option value="scale">Scale</option>
                <option value="rotation">Rotation</option>
                <option value="blur">Blur</option>
              </select>

              <button
                className="panel-btn panel-btn--primary panel-btn--small"
                onClick={handleAddTrack}
                disabled={!firstSelectedNodeId}
              >
                + Add Motion Track
              </button>
            </div>
          </div>

          {/* Timeline Scrubber Multi-Track View */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 12,
              position: "relative",
            }}
          >
            {/* Timeline Ruler Header */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8, marginBottom: 12 }}>
              <div style={{ width: 220, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Track / Property
              </div>
              <div style={{ flex: 1, position: "relative", height: 20 }}>
                {Array.from({ length: 11 }).map((_, i) => {
                  const pct = i * 10;
                  const ms = ((activeSequence?.durationMs || 3000) * i) / 10;
                  return (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${pct}%`,
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: "#64748b",
                        transform: "translateX(-50%)",
                      }}
                    >
                      {(ms / 1000).toFixed(1)}s
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Tracks List */}
            {activeSequence?.tracks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "#64748b", fontSize: 13 }}>
                No animation tracks added. Select an element on the canvas and click "+ Add Motion Track".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeSequence?.tracks.map((tr: AnimationTrack) => {
                  const nodeName = nodes[tr.nodeId]?.name || tr.nodeId;
                  const totalMs = activeSequence.durationMs || 3000;

                  return (
                    <div
                      key={tr.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.02)",
                        padding: "8px 0",
                        borderRadius: 6,
                      }}
                    >
                      {/* Track Info */}
                      <div style={{ width: 220, display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#f8fafc" }}>{nodeName}</div>
                          <div style={{ fontSize: 11, color: "#8b5cf6" }}>Property: {tr.property}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="panel-btn panel-btn--small"
                            onClick={() => handleAddKeyframeAtPlayhead(tr.id, tr.property)}
                            title="Add Keyframe at Playhead"
                            style={{ padding: "2px 6px", fontSize: 10 }}
                          >
                            + Keyframe
                          </button>
                          <button
                            className="panel-btn panel-btn--small panel-btn--danger"
                            onClick={() => removeTrack(activeSequence.id, tr.id)}
                            style={{ padding: "2px 6px", fontSize: 10 }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      {/* Keyframe Track Bar */}
                      <div
                        style={{
                          flex: 1,
                          height: 32,
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: 4,
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                          setCurrentTimeMs(ratio * totalMs);
                        }}
                      >
                        {/* Playhead Vertical Line */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${(currentTimeMs / totalMs) * 100}%`,
                            width: 2,
                            background: "#10b981",
                            zIndex: 10,
                            pointerEvents: "none",
                          }}
                        />

                        {/* Keyframe Nodes */}
                        {tr.keyframes.map((kf: MotionKeyframe) => {
                          const posPct = (kf.timeMs / totalMs) * 100;
                          const isSelected = selectedKeyframeId === kf.id;

                          return (
                            <div
                              key={kf.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKeyframeId(kf.id);
                                setCurrentTimeMs(kf.timeMs);
                              }}
                              style={{
                                position: "absolute",
                                left: `${posPct}%`,
                                top: "50%",
                                width: 14,
                                height: 14,
                                background: isSelected ? "#f59e0b" : "#8b5cf6",
                                border: "2px solid #ffffff",
                                transform: "translate(-50%, -50%) rotate(45deg)",
                                borderRadius: 2,
                                zIndex: 5,
                                cursor: "grab",
                                boxShadow: "0 0 6px rgba(139,92,246,0.6)",
                              }}
                              title={`Time: ${kf.timeMs}ms, Value: ${kf.value}, Easing: ${kf.easing}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spring Dynamics Tuning Engine Section */}
          <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🍃</span> Spring Dynamics Physics Engine
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Tension (Stiffness): 170
                </label>
                <input type="range" min="20" max="400" defaultValue="170" className="panel-input" style={{ width: "100%" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Friction (Damping): 26
                </label>
                <input type="range" min="5" max="80" defaultValue="26" className="panel-input" style={{ width: "100%" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Mass: 1.0kg
                </label>
                <input type="range" min="0.1" max="5.0" step="0.1" defaultValue="1.0" className="panel-input" style={{ width: "100%" }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Physics Presets:
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.keys(SPRING_PRESETS).map((p) => (
                    <button
                      key={p}
                      className="panel-btn panel-btn--small"
                      style={{ textTransform: "capitalize", fontSize: 10, padding: "3px 6px" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
