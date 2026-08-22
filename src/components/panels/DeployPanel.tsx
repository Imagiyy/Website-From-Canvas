// Deploy Panel — 4.2 One-Click Deploy (UI Shell)
import React, { useState } from "react";
import "../panels/PanelStyles.css";

const DeployPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [provider, setProvider] = useState<"vercel" | "netlify" | "none">("none");
  const [customDomain, setCustomDomain] = useState("");
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [deployUrl, setDeployUrl] = useState("");

  const handleDeploy = async () => {
    setDeployStatus("deploying");
    // Simulate deployment
    await new Promise((r) => setTimeout(r, 3000));
    const randomId = Math.random().toString(36).slice(2, 8);
    setDeployUrl(`https://canvassite-${randomId}.${provider === "vercel" ? "vercel" : "netlify"}.app`);
    setDeployStatus("success");
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12A10 10 0 1112 2a10 10 0 0110 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            Deploy
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section__title">Deploy Provider</div>
            <div className="panel-grid panel-grid--2col" style={{ marginBottom: 16 }}>
              <div className={`panel-card ${provider === "vercel" ? "panel-card--selected" : ""}`} onClick={() => setProvider("vercel")} style={{ cursor: "pointer", textAlign: "center", padding: 20 }}>
                <svg width="40" height="40" viewBox="0 0 76 65" fill="#e4e4f0"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e4e4f0", marginTop: 8 }}>Vercel</div>
                <div style={{ fontSize: 11, color: "#666680" }}>Zero-config deployments</div>
              </div>
              <div className={`panel-card ${provider === "netlify" ? "panel-card--selected" : ""}`} onClick={() => setProvider("netlify")} style={{ cursor: "pointer", textAlign: "center", padding: 20 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00C7B7" strokeWidth="1.5"><path d="M12 2L2 19h20L12 2z"/></svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e4e4f0", marginTop: 8 }}>Netlify</div>
                <div style={{ fontSize: 11, color: "#666680" }}>Instant rollbacks</div>
              </div>
            </div>
          </div>

          {provider !== "none" && (
            <>
              <div className="panel-divider" />
              <div className="panel-section">
                <div className="panel-section__title">Custom Domain</div>
                <div className="panel-form-group">
                  <input className="panel-input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="mysite.com"/>
                </div>
                <div className="panel-row" style={{ gap: 8 }}>
                  <div className="status-dot status-dot--online" />
                  <span style={{ fontSize: 12, color: "#10b981" }}>SSL Certificate: Active</span>
                </div>
              </div>

              <div className="panel-divider" />

              <div className="panel-section">
                <button className="panel-btn panel-btn--primary" onClick={handleDeploy} disabled={deployStatus === "deploying"} style={{ width: "100%", justifyContent: "center", padding: "12px 20px", fontSize: 14 }}>
                  {deployStatus === "deploying" ? (
                    <>
                      <div className="panel-spinner" />
                      Deploying...
                    </>
                  ) : deployStatus === "success" ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Deployed!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12A10 10 0 1112 2a10 10 0 0110 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      Deploy to {provider === "vercel" ? "Vercel" : "Netlify"}
                    </>
                  )}
                </button>
              </div>

              {deployStatus === "success" && deployUrl && (
                <div className="panel-card" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981", marginBottom: 4 }}>✓ Deployment Successful</div>
                  <div className="panel-row" style={{ gap: 8 }}>
                    <input className="panel-input" value={deployUrl} readOnly style={{ flex: 1, fontSize: 12 }}/>
                    <button className="panel-btn panel-btn--small" onClick={() => window.open(deployUrl, "_blank")}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Visit
                    </button>
                  </div>
                  {customDomain && (
                    <div style={{ fontSize: 11, color: "#666680", marginTop: 8 }}>Custom domain: {customDomain} — DNS propagation may take up to 48 hours.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeployPanel;
