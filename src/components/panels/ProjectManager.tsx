// Project Manager — 3.1 Save/Load Multiple Projects
import React, { useEffect, useState, useRef } from "react";
import { useProjectStore } from "../../store/projectStore";
import "../panels/PanelStyles.css";

interface Props {
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
}

const ProjectManager: React.FC<Props> = ({ onClose, onLoadProject }) => {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const refreshProjectList = useProjectStore((s) => s.refreshProjectList);
  const createProject = useProjectStore((s) => s.createProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const exportProject = useProjectStore((s) => s.exportProject);
  const importProject = useProjectStore((s) => s.importProject);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshProjectList();
  }, [refreshProjectList]);

  const handleCreate = async () => {
    const name = newName.trim() || "Untitled Project";
    const id = await createProject(name);
    setNewName("");
    onLoadProject(id);
    onClose();
  };

  const handleLoad = (id: string) => {
    onLoadProject(id);
    onClose();
  };

  const handleExport = async (id: string) => {
    const json = await exportProject(id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-${id.slice(0, 8)}.canvassite`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const id = await importProject(text);
      onLoadProject(id);
      onClose();
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleFinishRename = async () => {
    if (editingId && editName.trim()) {
      await renameProject(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            Projects
          </div>
          <div className="panel-header__actions">
            <button className="panel-btn panel-btn--small" onClick={() => importRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>
            <input ref={importRef} type="file" accept=".canvassite,.json" onChange={handleImport} style={{ display: "none" }} />
            <button className="panel-close-btn" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="panel-body">
          <div className="panel-row" style={{ gap: 8, marginBottom: 16 }}>
            <input className="panel-input" placeholder="New project name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} style={{ flex: 1 }}/>
            <button className="panel-btn panel-btn--primary" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Project
            </button>
          </div>

          {isLoading && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div className="panel-spinner" style={{ margin: "0 auto" }} />
            </div>
          )}

          {!isLoading && projects.length === 0 && (
            <div className="panel-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              <div className="panel-empty__title">No Projects Yet</div>
              <div className="panel-empty__desc">Create your first project to get started.</div>
            </div>
          )}

          <div className="panel-grid panel-grid--3col">
            {projects.map((project) => (
              <div key={project.id} className="panel-card" style={{ cursor: "pointer" }} onClick={() => handleLoad(project.id)}>
                <div style={{ height: 100, background: "linear-gradient(135deg, #1e1e2e, #2a2a4a)", borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666680" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
                  )}
                </div>
                {editingId === project.id ? (
                  <input className="panel-input" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleFinishRename} onKeyDown={(e) => e.key === "Enter" && handleFinishRename()} autoFocus style={{ fontSize: 12 }} onClick={(e) => e.stopPropagation()}/>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>{project.name}</div>
                )}
                <div style={{ fontSize: 10, color: "#666680", marginTop: 2 }}>{formatDate(project.updatedAt)}</div>
                <div className="panel-row" style={{ marginTop: 8, gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button className="panel-btn panel-btn--small panel-btn--icon" title="Rename" onClick={() => handleStartRename(project.id, project.name)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="panel-btn panel-btn--small panel-btn--icon" title="Duplicate" onClick={async () => { await duplicateProject(project.id); await refreshProjectList(); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </button>
                  <button className="panel-btn panel-btn--small panel-btn--icon" title="Export" onClick={() => handleExport(project.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                  <button className="panel-btn panel-btn--small panel-btn--icon panel-btn--danger" title="Delete" onClick={async () => { if (confirm("Delete this project?")) { await deleteProject(project.id); } }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;
