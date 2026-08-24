import React, { useState } from "react";
import { usePluginStore } from "../../store/pluginStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const webhooks = usePluginStore((s) => s.webhooks);
  const webhookLogs = usePluginStore((s) => s.webhookLogs);

  const addWebhook = usePluginStore((s) => s.addWebhook);
  const updateWebhook = usePluginStore((s) => s.updateWebhook);
  const deleteWebhook = usePluginStore((s) => s.deleteWebhook);
  const triggerWebhook = usePluginStore((s) => s.triggerWebhook);
  const clearLogs = usePluginStore((s) => s.clearLogs);

  const [activeTab, setActiveTab] = useState<"endpoints" | "logs">("endpoints");

  const [name, setName] = useState("");
  const [service, setService] = useState<"zapier" | "supabase" | "make" | "custom">("zapier");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<("form_submit" | "cms_update" | "ecom_order")[]>(["form_submit"]);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleAddWebhookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    addWebhook({
      name,
      service,
      url,
      events,
      headers: { "Content-Type": "application/json" },
      enabled: true,
    });
    setName("");
    setUrl("");
  };

  const handleTestWebhook = async (event: "form_submit" | "cms_update" | "ecom_order") => {
    setIsTesting(true);
    await triggerWebhook(event, {
      test: true,
      sender: "CreateWebsiteCanvas Webhook Engine",
      email: "test.lead@example.com",
      timestamp: Date.now(),
    });
    setIsTesting(false);
    setActiveTab("logs");
  };

  const handleEventCheckbox = (ev: "form_submit" | "cms_update" | "ecom_order") => {
    if (events.includes(ev)) {
      setEvents(events.filter((e) => e !== ev));
    } else {
      setEvents([...events, ev]);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        className="panel-content"
        style={{ maxWidth: 860, width: "92vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔗</span>
            <div>
              <h2 className="panel-title">Webhook & Form Actions Manager</h2>
              <p className="panel-subtitle">Pipe form leads, CMS updates & orders to Zapier, Supabase & CRMs</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 16px" }}>
          <button
            className={`panel-tab ${activeTab === "endpoints" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("endpoints")}
          >
            Webhook Endpoints ({webhooks.length})
          </button>
          <button
            className={`panel-tab ${activeTab === "logs" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            Delivery Logs ({webhookLogs.length})
          </button>
        </div>

        <div className="panel-body" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* TAB 1: ENDPOINTS */}
          {activeTab === "endpoints" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Add Webhook Form */}
              <form onSubmit={handleAddWebhookSubmit} style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13, color: "#f8fafc", fontWeight: 700 }}>+ Add Native Webhook Endpoint</h4>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Endpoint Name:</label>
                    <input
                      className="panel-input"
                      placeholder="e.g. Zapier Sales Lead Capture"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div style={{ width: 140 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Service:</label>
                    <select
                      className="panel-input"
                      value={service}
                      onChange={(e) => setService(e.target.value as any)}
                    >
                      <option value="zapier">Zapier</option>
                      <option value="supabase">Supabase</option>
                      <option value="make">Make / Integromat</option>
                      <option value="custom">Custom REST HTTP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Webhook Target URL:</label>
                  <input
                    className="panel-input"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Trigger Events:</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#cbd5e1" }}>
                      <input
                        type="checkbox"
                        checked={events.includes("form_submit")}
                        onChange={() => handleEventCheckbox("form_submit")}
                      />
                      Form Submissions
                    </label>

                    <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#cbd5e1" }}>
                      <input
                        type="checkbox"
                        checked={events.includes("cms_update")}
                        onChange={() => handleEventCheckbox("cms_update")}
                      />
                      CMS Content Updates
                    </label>

                    <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#cbd5e1" }}>
                      <input
                        type="checkbox"
                        checked={events.includes("ecom_order")}
                        onChange={() => handleEventCheckbox("ecom_order")}
                      />
                      E-Commerce Orders
                    </label>
                  </div>
                </div>

                <button type="submit" className="panel-btn panel-btn--primary" style={{ alignSelf: "flex-start" }}>
                  Save Endpoint
                </button>
              </form>

              {/* Endpoints List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {webhooks.map((wh) => (
                  <div key={wh.id} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{wh.name}</span>
                          <span style={{ fontSize: 10, background: "rgba(139,92,246,0.2)", color: "#8b5cf6", padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", fontWeight: 700 }}>
                            {wh.service}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", marginTop: 4 }}>
                          {wh.url}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          className="panel-btn panel-btn--small"
                          onClick={() => handleTestWebhook("form_submit")}
                          disabled={isTesting}
                          style={{ padding: "3px 8px", fontSize: 11 }}
                        >
                          🧪 Test Trigger
                        </button>

                        <button
                          className="panel-btn panel-btn--small panel-btn--danger"
                          onClick={() => deleteWebhook(wh.id)}
                          style={{ padding: "3px 8px", fontSize: 11 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {wh.events.map((ev: string) => (
                          <span key={ev} style={{ fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "1px 6px", borderRadius: 4 }}>
                            ⚡ {ev}
                          </span>
                        ))}
                      </div>

                      <label style={{ fontSize: 11, color: wh.enabled ? "#10b981" : "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={wh.enabled}
                          onChange={(e) => updateWebhook(wh.id, { enabled: e.target.checked })}
                        />
                        {wh.enabled ? "Active" : "Disabled"}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LOGS */}
          {activeTab === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Recent Webhook Executions Log</span>
                <button className="panel-btn panel-btn--small" onClick={clearLogs}>
                  Clear Log History
                </button>
              </div>

              {webhookLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#64748b", fontSize: 12 }}>
                  No webhook delivery logs yet. Trigger a form submission or test trigger to see execution output.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${log.status === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        borderRadius: 6,
                        padding: 10,
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: log.status === "success" ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                          [{log.statusCode || 200}] {log.event.toUpperCase()}
                        </span>
                        <span style={{ color: "#64748b" }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ color: "#94a3b8", marginBottom: 4 }}>
                        Payload: {JSON.stringify(log.payload)}
                      </div>
                      <div style={{ color: "#8b5cf6" }}>
                        Response: {log.responseBody}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
