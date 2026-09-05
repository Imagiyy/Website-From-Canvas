// Version History — 3.3 Named Checkpoints
import React, { useEffect, useState } from "react";
import { useVersionStore } from "../../store/versionStore";
import { useCanvasStore } from "../../store/canvasStore";
import "../panels/PanelStyles.css";

const VersionHistory: React.FC<{ onClose: () => void; onRestore: (pages: import("../../types/canvas").PagesById) => void }> = ({ onClose, onRestore }) => {
  const checkpoints = useVersionStore((s) => s.checkpoints);
  const loadCheckpoints = useVersionStore((s) => s.loadCheckpoints);
  const createCheckpoint = useVersionStore((s) => s.createCheckpoint);
  const deleteCheckpoint = useVersionStore((s) => s.deleteCheckpoint);
  const renameCheckpoint = useVersionStore((s) => s.renameCheckpoint);
  const pages = useCanvasStore((s) => s.pages);
  const nodes = useCanvasStore((s) => s.nodes);
  const activePageId = useCanvasStore((s) => s.activePageId);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { loadCheckpoints(); }, [loadCheckpoints]);

  const handleCreate = async () => {
    const name = newName.trim() || `Checkpoint ${checkpoints.length + 1}`;
    const safePages = Object.keys(pages).length > 0 ? pages : { "page-1": { id: "page-1", name: "Home", slug: "index", nodes } };
    const activePage = safePages[activePageId] ?? Object.values(safePages)[0];
    const allPages = {
      ...safePages,
      ...(activePage ? { [activePage.id]: { ...activePage, nodes } } : {}),
    };
    await createCheckpoint(name, allPages);
    setNewName("");
  };

  const handleRestore = (cp: import("../../types/canvas").VersionCheckpoint) => {
    if (confirm(`Restore to "${cp.name}"? Current unsaved changes will be lost.`)) {
      onRestore(cp.pages);
      onClose();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Version History
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="panel-body">
          <div className="panel-row" style={{ gap: 8, marginBottom: 16 }}>
            <input className="panel-input" placeholder="Checkpoint name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()}/>
            <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Save
            </button>
          </div>

          {checkpoints.length === 0 ? (
            <div className="panel-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div className="panel-empty__title">No Checkpoints</div>
              <div className="panel-empty__desc">Create a checkpoint to save the current state of your project.</div>
            </div>
          ) : (
            <div className="timeline">
              {checkpoints.map((cp, index) => (
                <div key={cp.id} className="timeline-item">
                  <div className={`timeline-item__dot ${index === 0 ? "timeline-item__dot--current" : ""}`} />
                  <div className="timeline-item__header">
                    {editingId === cp.id ? (
                      <input className="panel-input" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => { renameCheckpoint(cp.id, editName); setEditingId(null); }} onKeyDown={(e) => { if (e.key === "Enter") { renameCheckpoint(cp.id, editName); setEditingId(null); } }} autoFocus style={{ fontSize: 12, flex: 1 }}/>
                    ) : (
                      <span className="timeline-item__name">{cp.name}</span>
                    )}
                    <span className="timeline-item__time">{formatTime(cp.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#666680" }}>
                    {Object.keys(cp.pages).length} page(s) · {Object.values(cp.pages).reduce((sum, p) => sum + Object.keys(p.nodes).length, 0)} elements
                  </div>
                  <div className="timeline-item__actions">
                    <button className="panel-btn panel-btn--small" onClick={() => handleRestore(cp)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                      Restore
                    </button>
                    <button className="panel-btn panel-btn--small" onClick={() => { setEditingId(cp.id); setEditName(cp.name); }}>Rename</button>
                    <button className="panel-btn panel-btn--small panel-btn--danger" onClick={() => deleteCheckpoint(cp.id)}>Delete</button>
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

export default VersionHistory;
