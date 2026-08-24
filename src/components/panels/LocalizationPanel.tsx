import React, { useState } from "react";
import { useLocalizationStore } from "../../store/localizationStore";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalizationPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const locales = useLocalizationStore((s) => s.locales);
  const activeLocaleCode = useLocalizationStore((s) => s.activeLocaleCode);
  const translationKeys = useLocalizationStore((s) => s.translationKeys);

  const addLocale = useLocalizationStore((s) => s.addLocale);
  const removeLocale = useLocalizationStore((s) => s.removeLocale);
  const setActiveLocale = useLocalizationStore((s) => s.setActiveLocale);
  const updateLocale = useLocalizationStore((s) => s.updateLocale);
  const addTranslationKey = useLocalizationStore((s) => s.addTranslationKey);
  const setTranslation = useLocalizationStore((s) => s.setTranslation);
  const deleteTranslationKey = useLocalizationStore((s) => s.deleteTranslationKey);
  const formatCurrency = useLocalizationStore((s) => s.formatCurrency);
  const formatDate = useLocalizationStore((s) => s.formatDate);

  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const nodes = useCanvasStore((s) => s.nodes);

  const [activeTab, setActiveTab] = useState<"locales" | "translations" | "visibility">("locales");
  const [newKeyName, setNewKeyName] = useState("");
  const [newDefaultText, setNewDefaultText] = useState("");

  const [newLocaleCode, setNewLocaleCode] = useState("");
  const [newLocaleName, setNewLocaleName] = useState("");
  const [newLocaleDirection, setNewLocaleDirection] = useState<"ltr" | "rtl">("ltr");
  const [newLocaleCurrency] = useState("USD");

  if (!isOpen) return null;

  const firstSelectedNodeId = Array.from(selectedNodeIds)[0];
  const firstSelectedNode = firstSelectedNodeId ? nodes[firstSelectedNodeId] : null;

  const handleAddTranslationKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    addTranslationKey(newKeyName, newDefaultText);
    setNewKeyName("");
    setNewDefaultText("");
  };

  const handleAddCustomLocale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocaleCode || !newLocaleName) return;
    addLocale({
      code: newLocaleCode,
      name: newLocaleName,
      direction: newLocaleDirection,
      currency: newLocaleCurrency,
      dateFormat: "DD/MM/YYYY",
    });
    setNewLocaleCode("");
    setNewLocaleName("");
  };

  const currentActiveLocale = locales.find((l) => l.code === activeLocaleCode) || locales[0];

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
            <span style={{ fontSize: 20 }}>🌍</span>
            <div>
              <h2 className="panel-title">Localization & Multi-Language Architecture</h2>
              <p className="panel-subtitle">Locales, RTL layout mirroring, string translations & region rules</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 16px" }}>
          <button
            className={`panel-tab ${activeTab === "locales" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("locales")}
          >
            Locales & Formatting
          </button>
          <button
            className={`panel-tab ${activeTab === "translations" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("translations")}
          >
            Translation Dictionary ({translationKeys.length})
          </button>
          <button
            className={`panel-tab ${activeTab === "visibility" ? "panel-tab--active" : ""}`}
            onClick={() => setActiveTab("visibility")}
          >
            Conditional Locale Rules
          </button>
        </div>

        <div className="panel-body" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {/* TAB 1: LOCALES & FORMATTING */}
          {activeTab === "locales" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Active Locale Bar */}
              <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, color: "#3b82f6", fontWeight: 700 }}>Active Canvas Preview Locale</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94a3b8" }}>
                      Switch locale to test live layout mirroring, translations, and currency formats.
                    </p>
                  </div>
                  <select
                    className="panel-input"
                    style={{ width: 220, fontWeight: 700, borderColor: "#3b82f6" }}
                    value={activeLocaleCode}
                    onChange={(e) => setActiveLocale(e.target.value)}
                  >
                    {locales.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.direction.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
                  <div>
                    Direction: <strong style={{ color: currentActiveLocale.direction === "rtl" ? "#ef4444" : "#10b981" }}>{currentActiveLocale.direction.toUpperCase()}</strong>
                  </div>
                  <div>
                    Sample Currency: <strong>{formatCurrency(129.99)}</strong>
                  </div>
                  <div>
                    Sample Date: <strong>{formatDate(new Date())}</strong>
                  </div>
                </div>
              </div>

              {/* Supported Locales Table */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", margin: "0 0 10px 0" }}>Site Locales List</h4>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#cbd5e1" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left", color: "#94a3b8" }}>
                        <th style={{ padding: 10 }}>Code</th>
                        <th style={{ padding: 10 }}>Language Name</th>
                        <th style={{ padding: 10 }}>Direction</th>
                        <th style={{ padding: 10 }}>Currency</th>
                        <th style={{ padding: 10, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locales.map((l) => (
                        <tr key={l.code} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: 10, fontFamily: "monospace", fontWeight: 700, color: "#8b5cf6" }}>{l.code}</td>
                          <td style={{ padding: 10, fontWeight: 600 }}>{l.name} {l.isDefault && <span style={{ fontSize: 10, background: "#10b981", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>Default</span>}</td>
                          <td style={{ padding: 10 }}>
                            <select
                              className="panel-input"
                              style={{ width: 80, padding: "2px 4px", fontSize: 11 }}
                              value={l.direction}
                              onChange={(e) => updateLocale(l.code, { direction: e.target.value as any })}
                            >
                              <option value="ltr">LTR</option>
                              <option value="rtl">RTL ⬅️</option>
                            </select>
                          </td>
                          <td style={{ padding: 10 }}>
                            <input
                              className="panel-input"
                              style={{ width: 70, padding: "2px 4px", fontSize: 11 }}
                              value={l.currency}
                              onChange={(e) => updateLocale(l.code, { currency: e.target.value })}
                            />
                          </td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            {!l.isDefault && (
                              <button
                                className="panel-btn panel-btn--small panel-btn--danger"
                                onClick={() => removeLocale(l.code)}
                                style={{ padding: "2px 6px", fontSize: 10 }}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Custom Locale Form */}
              <form onSubmit={handleAddCustomLocale} style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Locale Code (e.g. it-IT):</label>
                  <input
                    className="panel-input"
                    placeholder="it-IT"
                    value={newLocaleCode}
                    onChange={(e) => setNewLocaleCode(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Language Name:</label>
                  <input
                    className="panel-input"
                    placeholder="Italian (Italy)"
                    value={newLocaleName}
                    onChange={(e) => setNewLocaleName(e.target.value)}
                  />
                </div>
                <div style={{ width: 100 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Direction:</label>
                  <select
                    className="panel-input"
                    value={newLocaleDirection}
                    onChange={(e) => setNewLocaleDirection(e.target.value as any)}
                  >
                    <option value="ltr">LTR</option>
                    <option value="rtl">RTL</option>
                  </select>
                </div>
                <button type="submit" className="panel-btn panel-btn--primary">
                  + Add Locale
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: TRANSLATIONS DICTIONARY */}
          {activeTab === "translations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Add New Key Form */}
              <form onSubmit={handleAddTranslationKey} style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Key Name (dot.notation):</label>
                  <input
                    className="panel-input"
                    placeholder="hero.subtitle"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>Default English Text:</label>
                  <input
                    className="panel-input"
                    placeholder="Create stunning websites faster"
                    value={newDefaultText}
                    onChange={(e) => setNewDefaultText(e.target.value)}
                  />
                </div>
                <button type="submit" className="panel-btn panel-btn--primary">
                  + Add String Key
                </button>
              </form>

              {/* Translation Dictionary List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {translationKeys.map((tk) => (
                  <div key={tk.id} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#10b981", fontSize: 13 }}>
                        {tk.key}
                      </span>
                      <button
                        className="panel-btn panel-btn--small panel-btn--danger"
                        onClick={() => deleteTranslationKey(tk.id)}
                        style={{ padding: "2px 6px", fontSize: 10 }}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                      {locales.map((l) => (
                        <div key={l.code}>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>
                            {l.name} ({l.code}):
                          </label>
                          <input
                            className="panel-input"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            value={tk.translations[l.code] || ""}
                            placeholder={`Enter ${l.name} text...`}
                            onChange={(e) => setTranslation(tk.id, l.code, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONDITIONAL VISIBILITY */}
          {activeTab === "visibility" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: 12, borderRadius: 8 }}>
                <h4 style={{ margin: 0, fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>Locale Conditional Block Rules</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94a3b8" }}>
                  Show or hide targeted elements based on visitor locale or country detection.
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
                  Selected Element: <strong style={{ color: "#8b5cf6" }}>{firstSelectedNode ? firstSelectedNode.name : "None selected"}</strong>
                </div>

                {firstSelectedNode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Condition Rule:</label>
                      <select className="panel-input" style={{ width: 200 }}>
                        <option value="showIf">Show ONLY if visitor matches</option>
                        <option value="hideIf">Hide if visitor matches</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Target Locales:</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {locales.map((l) => (
                          <label key={l.code} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 4 }}>
                            <input type="checkbox" defaultChecked={l.code === "en-US"} />
                            {l.code} ({l.name})
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 12 }}>Select a canvas node to configure its locale visibility rules.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
