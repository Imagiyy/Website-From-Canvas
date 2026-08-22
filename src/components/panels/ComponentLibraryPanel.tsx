// Component Library Panel — 2.1 Component System (Symbols)
import React, { useState } from "react";
import { useComponentStore } from "../../store/componentStore";
import { useCanvasStore } from "../../store/canvasStore";
import "../panels/PanelStyles.css";

const ComponentLibraryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const components = useComponentStore((s) => s.components);
  const renameComponent = useComponentStore((s) => s.renameComponent);
  const deleteComponent = useComponentStore((s) => s.deleteComponent);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const componentList = Object.values(components).filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleCreateComponent = () => {
    if (selectedNodeIds.size === 0) return;
    const selectedId = Array.from(selectedNodeIds)[0];
    const node = nodes[selectedId];
    if (!node) return;

    useComponentStore.getState().createComponent(node.name || "Component", node, nodes);
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      renameComponent(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Component Library
          </div>
          <div className="panel-header__actions">
            <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleCreateComponent} disabled={selectedNodeIds.size === 0}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Component
            </button>
            <button className="panel-close-btn" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="panel-body">
          <div className="panel-form-group">
            <input
              className="panel-input"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {componentList.length === 0 ? (
            <div className="panel-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <div className="panel-empty__title">No Components</div>
              <div className="panel-empty__desc">Select an element and click "Create Component" to build your library.</div>
            </div>
          ) : (
            <div className="panel-grid panel-grid--3col">
              {componentList.map((comp) => (
                <div key={comp.id} className="panel-card" style={{ cursor: "pointer" }}>
                  <div style={{ height: 80, background: "rgba(139,92,246,0.08)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity={0.6}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></svg>
                  </div>
                  {editingId === comp.id ? (
                    <input
                      className="panel-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleFinishRename(comp.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleFinishRename(comp.id)}
                      autoFocus
                      style={{ fontSize: 11 }}
                    />
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4f0", cursor: "pointer" }} onDoubleClick={() => handleStartRename(comp.id, comp.name)}>
                        {comp.name}
                      </span>
                      <button className="panel-btn panel-btn--icon panel-btn--small panel-btn--danger" onClick={() => deleteComponent(comp.id)} title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#666680", marginTop: 4 }}>
                    {new Date(comp.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentLibraryPanel;
