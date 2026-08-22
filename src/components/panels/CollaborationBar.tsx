// Collaboration Bar — 3.5 Real-Time Collaboration (UI Shell)
import React from "react";
import { useCollaborationStore } from "../../store/collaborationStore";
import "../panels/PanelStyles.css";

const CollaborationBar: React.FC = () => {
  const isEnabled = useCollaborationStore((s) => s.isCollaborationEnabled);
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const startDemoMode = useCollaborationStore((s) => s.startDemoMode);
  const stopDemoMode = useCollaborationStore((s) => s.stopDemoMode);
  const openShareDialog = useCollaborationStore((s) => s.openShareDialog);

  if (!isEnabled) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button className="panel-btn panel-btn--small" onClick={startDemoMode} title="Enable collaboration demo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Collaborate
        </button>
      </div>
    );
  }

  const activeCollaborators = collaborators.filter((c) => c.isActive);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {activeCollaborators.slice(0, 4).map((collab, i) => (
          <div
            key={collab.id}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: collab.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              border: "2px solid #16162a",
              marginLeft: i > 0 ? -8 : 0,
              zIndex: 10 - i,
              cursor: "default",
            }}
            title={collab.name}
          >
            {collab.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        ))}
        {activeCollaborators.length > 4 && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#8888a8", marginLeft: -8, border: "2px solid #16162a" }}>
            +{activeCollaborators.length - 4}
          </div>
        )}
      </div>

      <span style={{ fontSize: 11, color: "#8888a8" }}>{activeCollaborators.length} online</span>

      <button className="panel-btn panel-btn--small" onClick={openShareDialog}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>

      <button className="panel-btn panel-btn--small panel-btn--danger" onClick={stopDemoMode} title="End collaboration" style={{ padding: "4px 8px" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
};

// Collaboration Cursors Overlay (renders other users' cursors on canvas)
export const CollaborationCursors: React.FC<{ viewport: { panX: number; panY: number; zoom: number } }> = ({ viewport }) => {
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const isEnabled = useCollaborationStore((s) => s.isCollaborationEnabled);

  if (!isEnabled) return null;

  return (
    <>
      {collaborators.filter((c) => c.isActive).map((collab) => {
        const screenX = collab.x * viewport.zoom + viewport.panX;
        const screenY = collab.y * viewport.zoom + viewport.panY;

        return (
          <div key={collab.id} className="collab-cursor" style={{ transform: `translate(${screenX}px, ${screenY}px)` }}>
            <svg className="collab-cursor__pointer" viewBox="0 0 16 20" fill={collab.color}>
              <path d="M0 0L16 12L9.6 13.6L6.4 20L4 13.6L0 0Z" />
            </svg>
            <div className="collab-cursor__name" style={{ background: collab.color }}>{collab.name}</div>
          </div>
        );
      })}
    </>
  );
};

// Share Dialog
export const ShareDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const generateShareLink = useCollaborationStore((s) => s.generateShareLink);
  const shareLink = useCollaborationStore((s) => s.shareLink);
  const shareMode = useCollaborationStore((s) => s.shareMode);

  const handleGenerate = (mode: "view" | "edit") => {
    generateShareLink(mode);
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/></svg>
            Share Project
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section__title">Generate Share Link</div>
            <div className="panel-grid panel-grid--2col" style={{ marginBottom: 16 }}>
              <button className={`panel-btn ${shareMode === "view" && shareLink ? "panel-btn--primary" : ""}`} onClick={() => handleGenerate("view")} style={{ justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Only
              </button>
              <button className={`panel-btn ${shareMode === "edit" && shareLink ? "panel-btn--primary" : ""}`} onClick={() => handleGenerate("edit")} style={{ justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Can Edit
              </button>
            </div>

            {shareLink && (
              <div className="panel-card">
                <div className="panel-row" style={{ gap: 8 }}>
                  <input className="panel-input" value={shareLink} readOnly style={{ flex: 1, fontSize: 11 }}/>
                  <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleCopy}>Copy</button>
                </div>
                <div style={{ fontSize: 11, color: "#666680", marginTop: 8 }}>
                  <span className={`panel-badge ${shareMode === "edit" ? "panel-badge--warning" : "panel-badge--success"}`}>{shareMode === "edit" ? "Edit Access" : "View Only"}</span>
                  <span style={{ marginLeft: 8 }}>Anyone with this link can {shareMode === "edit" ? "edit" : "view"} this project.</span>
                </div>
              </div>
            )}
          </div>

          <div className="panel-divider" />

          <div className="panel-section">
            <div className="panel-section__title">Invite by Email</div>
            <div className="panel-row" style={{ gap: 8 }}>
              <input className="panel-input" placeholder="email@example.com" style={{ flex: 1 }}/>
              <button className="panel-btn panel-btn--primary panel-btn--small">Invite</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationBar;
