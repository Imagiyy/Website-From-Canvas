import React, { useState, useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { generateMultiPageSiteCode } from "../utils/exportSite";
import { exportToReact } from "../utils/exportReact";
import { exportToNextjs } from "../utils/exportNextjs";
import { exportToTailwind } from "../utils/exportTailwind";
import { exportToFigma } from "../utils/exportFigma";
import { exportAsSVG, exportAsPNG, exportAsPDF, downloadFile } from "../utils/exportImage";
import { useSEOStore } from "../store/seoStore";
import "./ExportModal.css";
import "../components/panels/PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export type ExportFormat = "html" | "react" | "nextjs" | "tailwind" | "figma" | "image";

export const ExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const pages = useCanvasStore((s) => s.pages);
  const activePageId = useCanvasStore((s) => s.activePageId);
  const nodes = useCanvasStore((s) => s.nodes);
  const pageSEO = useSEOStore((s) => s.pageSEO);

  const [format, setFormat] = useState<ExportFormat>("html");
  const [activeTab, setActiveTab] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [imageScale, setImageScale] = useState<number>(2);

  // Ensure active page in pages map always has the latest canvas nodes
  const syncedPages = useMemo(() => {
    const safeActiveId = activePageId || Object.keys(pages)[0] || "page-1";
    return {
      ...pages,
      [safeActiveId]: {
        ...pages[safeActiveId],
        id: safeActiveId,
        name: pages[safeActiveId]?.name || "Home",
        slug: pages[safeActiveId]?.slug || "index",
        nodes: nodes,
      },
    };
  }, [pages, activePageId, nodes]);

  // Generate files dynamically each time format, canvas nodes, pages, or buildTimestamp updates
  const exportFiles = useMemo(() => {
    if (!isOpen) return [];

    switch (format) {
      case "html": {
        const { pageFiles, css } = generateMultiPageSiteCode(syncedPages, activePageId, nodes);
        const files = pageFiles.map((f) => ({ filename: f.filename, content: f.html }));
        files.push({ filename: "style.css", content: css });
        return files;
      }
      case "react": {
        return exportToReact(syncedPages, activePageId, nodes);
      }
      case "nextjs": {
        return exportToNextjs(syncedPages, activePageId, nodes, pageSEO);
      }
      case "tailwind": {
        return exportToTailwind(syncedPages, activePageId, nodes);
      }
      case "figma": {
        const json = exportToFigma(syncedPages, activePageId, nodes);
        return [{ filename: "canvas-design.figma.json", content: json }];
      }
      case "image": {
        const svg = exportAsSVG(nodes);
        return [{ filename: "canvas-export.svg", content: svg }];
      }
      default:
        return [];
    }
  }, [format, syncedPages, activePageId, nodes, pageSEO, isOpen]);

  // Set default selected file whenever exportFiles changes
  const activeFile = useMemo(() => {
    if (!exportFiles || exportFiles.length === 0) return { filename: "", content: "" };
    const found = exportFiles.find((f) => f.filename === activeTab);
    return found || exportFiles[0];
  }, [exportFiles, activeTab]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (activeFile?.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAll = async () => {
    if (format === "image") {
      // SVG download
      const svg = exportAsSVG(nodes);
      downloadFile(svg, "canvas-design.svg", "image/svg+xml");
      return;
    }

    if (format === "figma") {
      const json = exportToFigma(pages, activePageId, nodes);
      downloadFile(json, "canvas-design.figma.json", "application/json");
      return;
    }

    // Download files sequentially
    exportFiles.forEach((file, idx) => {
      setTimeout(() => {
        const mime = file.filename.endsWith(".json")
          ? "application/json"
          : file.filename.endsWith(".css")
          ? "text/css"
          : file.filename.endsWith(".tsx") || file.filename.endsWith(".ts")
          ? "text/plain"
          : "text/html";
        downloadFile(file.content, file.filename, mime);
      }, idx * 150);
    });
  };

  const handleExportPNG = async () => {
    const dataUrl = await exportAsPNG(nodes, 1200, 900, imageScale);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `canvas-design@${imageScale}x.png`;
    a.click();
  };

  const handleExportPDF = async () => {
    const blob = await exportAsPDF(nodes, 1200, 900);
    downloadFile(blob, "canvas-design.pdf", "application/pdf");
  };

  return (
    <div className="export-modal__overlay" onClick={onClose}>
      <div className="export-modal export-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 960 }}>
        {/* Modal Header */}
        <div className="export-modal__header">
          <div className="export-modal__header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <div>
              <h2 style={{ fontSize: 16, color: "#e4e4f0", margin: 0 }}>Export & Publish Code</h2>
              <span style={{ fontSize: 12, color: "#8888a8" }}>Choose framework or design output format</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="export-modal__close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="panel-tabs" style={{ margin: "12px 20px 0" }}>
          <button className={`panel-tab ${format === "html" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("html"); setActiveTab(""); }}>HTML & CSS</button>
          <button className={`panel-tab ${format === "react" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("react"); setActiveTab(""); }}>React TS</button>
          <button className={`panel-tab ${format === "nextjs" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("nextjs"); setActiveTab(""); }}>Next.js App Router</button>
          <button className={`panel-tab ${format === "tailwind" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("tailwind"); setActiveTab(""); }}>Tailwind CSS</button>
          <button className={`panel-tab ${format === "figma" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("figma"); setActiveTab(""); }}>Figma JSON</button>
          <button className={`panel-tab ${format === "image" ? "panel-tab--active" : ""}`} onClick={() => { setFormat("image"); setActiveTab(""); }}>PNG / SVG / PDF</button>
        </div>

        {/* Sub-file Tabs */}
        {format !== "image" && exportFiles.length > 0 && (
          <div className="export-modal__tabs" style={{ padding: "8px 20px 0" }}>
            {exportFiles.map((file) => (
              <button
                key={file.filename}
                className={`export-modal__tab ${(activeFile.filename === file.filename) ? "export-modal__tab--active" : ""}`}
                onClick={() => setActiveTab(file.filename)}
              >
                <span>{file.filename}</span>
              </button>
            ))}
          </div>
        )}

        {/* Image Export Panel Special View */}
        {format === "image" ? (
          <div className="panel-body" style={{ padding: 24 }}>
            <div className="panel-section">
              <div className="panel-section__title">Export Image & Vector Formats</div>
              <div className="panel-grid panel-grid--3col">
                <div className="panel-card" style={{ textAlign: "center", padding: 20 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" style={{ margin: "0 auto 8px" }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>PNG Image</div>
                  <div className="panel-form-group" style={{ marginTop: 10 }}>
                    <label className="panel-label">Scale</label>
                    <select className="panel-select" value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))}>
                      <option value={1}>1x (Standard)</option>
                      <option value={2}>2x (Retina / High Res)</option>
                      <option value={3}>3x (Ultra HD)</option>
                    </select>
                  </div>
                  <button className="panel-btn panel-btn--primary" onClick={handleExportPNG} style={{ width: "100%", justifyContent: "center" }}>Download PNG</button>
                </div>

                <div className="panel-card" style={{ textAlign: "center", padding: 20 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" style={{ margin: "0 auto 8px" }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>SVG Vector</div>
                  <div style={{ fontSize: 11, color: "#666680", margin: "12px 0 16px" }}>Scalable vector graphics string</div>
                  <button className="panel-btn panel-btn--primary" onClick={handleDownloadAll} style={{ width: "100%", justifyContent: "center" }}>Download SVG</button>
                </div>

                <div className="panel-card" style={{ textAlign: "center", padding: 20 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" style={{ margin: "0 auto 8px" }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4f0" }}>PDF Document</div>
                  <div style={{ fontSize: 11, color: "#666680", margin: "12px 0 16px" }}>Print-ready vector PDF</div>
                  <button className="panel-btn panel-btn--primary" onClick={handleExportPDF} style={{ width: "100%", justifyContent: "center" }}>Download PDF</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Code Content Box */
          <div className="export-modal__code-container" style={{ flex: 1, minHeight: 320 }}>
            <pre className="export-modal__code">
              <code>{activeFile?.content || ""}</code>
            </pre>
          </div>
        )}

        {/* Actions Bar */}
        <div className="export-modal__footer">
          <div className="export-modal__footer-info">
            {copied && <span className="export-modal__copied-toast">✓ Copied {activeFile?.filename} to clipboard!</span>}
          </div>
          {format !== "image" && (
            <div className="export-modal__footer-actions">
              <button className="export-modal__secondary-btn" onClick={handleCopy}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5V2.5A1.5 1.5 0 0 1 2.5 1H9.5A1.5 1.5 0 0 1 11 2.5V3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <span>Copy {activeFile?.filename}</span>
              </button>

              <button className="export-modal__primary-btn" onClick={handleDownloadAll}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Download All ({exportFiles.length} files)</span>
              </button>

              <button
                className="export-modal__primary-btn"
                onClick={async () => {
                  const { downloadSiteZip } = await import("../utils/exportZip");
                  downloadSiteZip(exportFiles, `canvas-website-${format}`);
                }}
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#10b981" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span>Download .ZIP Archive</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
