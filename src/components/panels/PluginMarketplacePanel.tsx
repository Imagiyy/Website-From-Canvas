import React, { useState } from "react";
import { usePluginStore } from "../../store/pluginStore";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginMarketplacePanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const plugins = usePluginStore((s) => s.plugins);
  const togglePluginStatus = usePluginStore((s) => s.togglePluginStatus);
  const addCustomPlugin = usePluginStore((s) => s.addCustomPlugin);
  const addNode = useCanvasStore((s) => s.addNode);

  const [activeTab, setActiveTab] = useState<"directory" | "developer">("directory");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customIcon, setCustomIcon] = useState("⚙️");
  const [customScript, setCustomScript] = useState(
    '// Canvas Plugin SDK Sandbox\ncanvas.addNode({ type: "rectangle", name: "Plugin Generated Node" });'
  );

  const [aiPrompt, setAiPrompt] = useState("Modern SaaS Pricing Card Grid with gradient CTA button");
  const [aiGenerating, setAiGenerating] = useState(false);

  if (!isOpen) return null;

  const filteredPlugins = plugins.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  const handleRunAiCopilot = () => {
    setAiGenerating(true);
    setTimeout(() => {
      // Generated AI card on canvas
      addNode({
        id: crypto.randomUUID(),
        parentId: null,
        order: 0,
        type: "rectangle",
        name: "AI Generated Component Block",
        geometry: { x: 300, y: 250, width: 340, height: 220, rotation: 0 },
        style: {
          fill: "#1e1b4b",
          cornerRadius: 16,
          opacity: 1,
          border: { color: "#6366f1", width: 2, style: "solid" },
          shadow: { color: "rgba(99,102,241,0.3)", x: 0, y: 10, blur: 24 },
        },
      });
      setAiGenerating(false);
    }, 800);
  };

  const handleAddCustomPluginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName) return;
    addCustomPlugin({
      name: customName,
      version: "1.0.0",
      author: "Local Developer",
      description: customDescription || "Custom developer extension",
      icon: customIcon || "🧩",
      category: "tools",
      status: "active",
      permissions: ["writeCanvas"],
      mainScript: customScript,
    });
    setCustomName("");
    setCustomDescription("");
    setActiveTab("directory");
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        className="panel-content"
        style={{ maxWidth: 880, width: "94vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔌</span>
            <div>
              <h2 className="panel-title">Plugin SDK & Extension Marketplace</h2>
              <p className="panel-subtitle">Third-party tools, AI generators, sandboxed developer SDK APIs</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 16px" }}>
          <button
            className={`panel-tab ${activeTab === "directory" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("directory")}
          >
            Plugin Marketplace ({plugins.length})
          </button>
          <button
            className={`panel-tab ${activeTab === "developer" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("developer")}
          >
            Developer SDK & Sandbox
          </button>
        </div>

        <div className="panel-body" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* TAB 1: MARKETPLACE DIRECTORY */}
          {activeTab === "directory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* AI Copilot Special Runner Banner */}
              <div style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Active AI Copilot Plugin</h4>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    className="panel-input"
                    style={{ flex: 1 }}
                    placeholder="Describe element or section to generate with AI..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <button
                    className="panel-btn panel-btn--primary"
                    onClick={handleRunAiCopilot}
                    disabled={aiGenerating}
                  >
                    {aiGenerating ? "Generating..." : "Generate UI"}
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "generators", "tools", "integrations", "assets"].map((cat) => (
                  <button
                    key={cat}
                    className={`panel-btn panel-btn--small ${selectedCategory === cat ? "panel-btn--primary" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ textTransform: "capitalize" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Plugin Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                {filteredPlugins.map((plugin) => {
                  const isActive = plugin.status === "active";

                  return (
                    <div
                      key={plugin.id}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${isActive ? "rgba(139, 92, 246, 0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 10,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 22 }}>{plugin.icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{plugin.name}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                v{plugin.version} by {plugin.author}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: 11, color: "#cbd5e1", margin: "6px 0 12px 0", lineHeight: 1.4 }}>
                          {plugin.description}
                        </p>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                          {plugin.permissions.map((perm: string) => (
                            <span
                              key={perm}
                              style={{
                                fontSize: 9,
                                background: "rgba(255,255,255,0.05)",
                                color: "#94a3b8",
                                padding: "2px 5px",
                                borderRadius: 4,
                              }}
                            >
                              🔑 {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: isActive ? "#10b981" : "#64748b",
                          }}
                        >
                          {isActive ? "● Active" : "○ Installed"}
                        </span>

                        <button
                          className={`panel-btn panel-btn--small ${isActive ? "panel-btn--danger" : "panel-btn--primary"}`}
                          onClick={() => togglePluginStatus(plugin.id)}
                          style={{ padding: "3px 8px", fontSize: 11 }}
                        >
                          {isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DEVELOPER SDK & SANDBOX */}
          {activeTab === "developer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 12, borderRadius: 8 }}>
                <h4 style={{ margin: 0, fontSize: 13, color: "#3b82f6", fontWeight: 700 }}>Developer Plugin SDK Sandbox</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94a3b8" }}>
                  Inject third-party JS scripts into the sandboxed plugin runtime to generate shapes, extend UI, or sync data.
                </p>
              </div>

              <form onSubmit={handleAddCustomPluginSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Icon:</label>
                    <input
                      className="panel-input"
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Plugin Name:</label>
                    <input
                      className="panel-input"
                      placeholder="My Canvas Extension"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Description:</label>
                  <input
                    className="panel-input"
                    placeholder="Short description of your custom plugin..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Sandboxed JS Main Script:</label>
                  <textarea
                    className="panel-input"
                    rows={6}
                    style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.4 }}
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                  />
                </div>

                <button type="submit" className="panel-btn panel-btn--primary" style={{ alignSelf: "flex-start" }}>
                  + Register Plugin to Canvas SDK
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
