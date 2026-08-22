// CMS Panel — 4.4 CMS Integration (UI Shell)
import React, { useState } from "react";
import { useCMSStore, type CMSProvider } from "../../store/cmsStore";
import type { CMSFieldType } from "../../types/canvas";
import "../panels/PanelStyles.css";

const FIELD_TYPES: { value: CMSFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "richText", label: "Rich Text" },
  { value: "image", label: "Image" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "list", label: "List" },
];

const CMSPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const provider = useCMSStore((s) => s.provider);
  const apiEndpoint = useCMSStore((s) => s.apiEndpoint);
  const apiKey = useCMSStore((s) => s.apiKey);
  const contentTypes = useCMSStore((s) => s.contentTypes);
  const isConnected = useCMSStore((s) => s.isConnected);
  const setProvider = useCMSStore((s) => s.setProvider);
  const setApiEndpoint = useCMSStore((s) => s.setApiEndpoint);
  const setApiKey = useCMSStore((s) => s.setApiKey);
  const addContentType = useCMSStore((s) => s.addContentType);
  const deleteContentType = useCMSStore((s) => s.deleteContentType);
  const addField = useCMSStore((s) => s.addField);
  const deleteField = useCMSStore((s) => s.deleteField);
  const testConnection = useCMSStore((s) => s.testConnection);

  const [activeTab, setActiveTab] = useState<"setup" | "content" | "templates">("setup");
  const [newTypeName, setNewTypeName] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CMSFieldType>("text");
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M9 12l3 3-3 3"/></svg>
            CMS Integration
            {isConnected && <span className="panel-badge panel-badge--success">Connected</span>}
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            {(["setup", "content", "templates"] as const).map((tab) => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? "panel-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "setup" && (
            <div className="panel-section">
              <div className="panel-form-group">
                <label className="panel-label">CMS Provider</label>
                <select className="panel-select" value={provider} onChange={(e) => setProvider(e.target.value as CMSProvider)}>
                  <option value="none">Select Provider</option>
                  <option value="strapi">Strapi</option>
                  <option value="contentful">Contentful</option>
                  <option value="custom">Custom API</option>
                </select>
              </div>
              {provider !== "none" && (
                <>
                  <div className="panel-form-group">
                    <label className="panel-label">API Endpoint</label>
                    <input className="panel-input" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder={provider === "strapi" ? "http://localhost:1337/api" : "https://cdn.contentful.com"}/>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-label">API Key</label>
                    <input className="panel-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Your API key..."/>
                  </div>
                  <button className="panel-btn panel-btn--primary" onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? <div className="panel-spinner" /> : "Test Connection"}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "content" && (
            <div className="panel-section">
              <div className="panel-section__title">Content Types</div>
              <div className="panel-row" style={{ gap: 8, marginBottom: 12 }}>
                <input className="panel-input" placeholder="Content type name..." value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} style={{ flex: 1 }}/>
                <button className="panel-btn panel-btn--primary panel-btn--small" onClick={() => { if (newTypeName.trim()) { addContentType(newTypeName.trim()); setNewTypeName(""); } }}>Add</button>
              </div>

              {contentTypes.map((ct) => (
                <div key={ct.id} className="panel-card" style={{ marginBottom: 8 }}>
                  <div className="panel-row panel-row--between" style={{ cursor: "pointer" }} onClick={() => setExpandedType(expandedType === ct.id ? null : ct.id)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>{ct.name}</div>
                      <div style={{ fontSize: 10, color: "#666680" }}>{ct.fields.length} fields · /{ct.slug}</div>
                    </div>
                    <div className="panel-row" style={{ gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#666680" }}>{expandedType === ct.id ? "▲" : "▼"}</span>
                      <button className="panel-btn panel-btn--icon panel-btn--small panel-btn--danger" onClick={(e) => { e.stopPropagation(); deleteContentType(ct.id); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                  {expandedType === ct.id && (
                    <div style={{ marginTop: 10 }}>
                      {ct.fields.map((field) => (
                        <div key={field.id} className="panel-list-item">
                          <span className="panel-badge">{field.type}</span>
                          <span style={{ fontSize: 12, color: "#e4e4f0", flex: 1 }}>{field.name}</span>
                          {field.required && <span className="panel-badge panel-badge--warning">Required</span>}
                          <button className="panel-btn panel-btn--icon panel-btn--small" style={{ opacity: 0.4 }} onClick={() => deleteField(ct.id, field.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                      <div className="panel-row" style={{ gap: 6, marginTop: 8 }}>
                        <input className="panel-input" placeholder="Field name" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} style={{ flex: 1, fontSize: 11 }}/>
                        <select className="panel-select" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CMSFieldType)} style={{ width: 100, fontSize: 11 }}>
                          {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                        <button className="panel-btn panel-btn--small panel-btn--primary" onClick={() => { if (newFieldName.trim()) { addField(ct.id, newFieldName.trim(), newFieldType); setNewFieldName(""); } }}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="panel-section">
              <div className="panel-section__title">Dynamic Templates</div>
              <div className="panel-card" style={{ textAlign: "center", padding: 24 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ margin: "0 auto 8px", color: "#666680" }}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0", marginBottom: 4 }}>Blog & Collection Templates</div>
                <div style={{ fontSize: 12, color: "#666680" }}>Bind canvas elements to CMS fields to create dynamic page templates.</div>
                <div style={{ fontSize: 11, color: "#8888a8", marginTop: 12 }}>Select an element on canvas, then choose a content type and field to bind.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMSPanel;
