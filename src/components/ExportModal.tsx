import React, { useState, useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { generateSiteCode } from "../utils/exportSite";
import "./ExportModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const nodes = useCanvasStore((s) => s.nodes);
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [copied, setCopied] = useState(false);

  const { html, css } = useMemo(() => {
    if (!isOpen) return { html: "", css: "" };
    return generateSiteCode(nodes);
  }, [nodes, isOpen]);

  if (!isOpen) return null;

  const currentCode = activeTab === "html" ? html : css;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Download index.html
    const htmlBlob = new Blob([html], { type: "text/html" });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const aHtml = document.createElement("a");
    aHtml.href = htmlUrl;
    aHtml.download = "index.html";
    aHtml.click();
    URL.revokeObjectURL(htmlUrl);

    // Download style.css
    setTimeout(() => {
      const cssBlob = new Blob([css], { type: "text/css" });
      const cssUrl = URL.createObjectURL(cssBlob);
      const aCss = document.createElement("a");
      aCss.href = cssUrl;
      aCss.download = "style.css";
      aCss.click();
      URL.revokeObjectURL(cssUrl);
    }, 150);
  };

  return (
    <div className="export-modal__overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="export-modal__header">
          <div className="export-modal__header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div>
              <h2>Export Published Web App</h2>
              <span>Clean HTML5 & CSS3 with responsive media query overrides</span>
            </div>
          </div>
          <button className="export-modal__close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="export-modal__tabs">
          <button
            className={`export-modal__tab ${activeTab === "html" ? "export-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("html")}
          >
            <span>index.html</span>
          </button>
          <button
            className={`export-modal__tab ${activeTab === "css" ? "export-modal__tab--active" : ""}`}
            onClick={() => setActiveTab("css")}
          >
            <span>style.css</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="export-modal__code-container">
          <pre className="export-modal__code">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Actions Bar */}
        <div className="export-modal__footer">
          <div className="export-modal__footer-info">
            {copied && <span className="export-modal__copied-toast">✓ Copied to clipboard!</span>}
          </div>
          <div className="export-modal__footer-actions">
            <button className="export-modal__secondary-btn" onClick={handleCopy}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5V2.5A1.5 1.5 0 0 1 2.5 1H9.5A1.5 1.5 0 0 1 11 2.5V3" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span>Copy {activeTab.toUpperCase()}</span>
            </button>

            <button className="export-modal__primary-btn" onClick={handleDownload}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>Download Files (index.html & style.css)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
