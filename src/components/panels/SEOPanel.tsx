// SEO Panel — 4.3 SEO & Analytics Settings
import React, { useState } from "react";
import { useSEOStore } from "../../store/seoStore";
import { useCanvasStore } from "../../store/canvasStore";
import "../panels/PanelStyles.css";

const SEOPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const activePageId = useCanvasStore((s) => s.activePageId);
  const pages = useCanvasStore((s) => s.pages);
  const pageSEO = useSEOStore((s) => s.getPageSEO(activePageId));
  const updatePageSEO = useSEOStore((s) => s.updatePageSEO);
  const globalAnalyticsId = useSEOStore((s) => s.globalAnalyticsId);
  const setGlobalAnalyticsId = useSEOStore((s) => s.setGlobalAnalyticsId);
  const generateSitemap = useSEOStore((s) => s.generateSitemap);

  const [activeTab, setActiveTab] = useState<"page" | "og" | "analytics" | "sitemap">("page");
  const [sitemapPreview, setSitemapPreview] = useState<string | null>(null);

  const currentPage = pages[activePageId];

  const handleGenerateSitemap = () => {
    const pageList = Object.values(pages).map((p) => ({ slug: p.slug, name: p.name }));
    const xml = generateSitemap(pageList, "https://yoursite.com");
    setSitemapPreview(xml);
  };

  const handleDownloadSitemap = () => {
    if (!sitemapPreview) return;
    const blob = new Blob([sitemapPreview], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            SEO & Analytics — {currentPage?.name}
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            {(["page", "og", "analytics", "sitemap"] as const).map((tab) => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? "panel-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "page" ? "Page SEO" : tab === "og" ? "Social" : tab === "analytics" ? "Analytics" : "Sitemap"}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "page" && (
            <div className="panel-section">
              <div className="panel-form-group">
                <label className="panel-label">Page Title</label>
                <input className="panel-input" value={pageSEO.title || ""} onChange={(e) => updatePageSEO(activePageId, { title: e.target.value })} placeholder="My Amazing Page"/>
                <div style={{ fontSize: 10, color: "#666680", marginTop: 4 }}>{(pageSEO.title || "").length}/60 characters</div>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Meta Description</label>
                <textarea className="panel-input panel-textarea" value={pageSEO.description || ""} onChange={(e) => updatePageSEO(activePageId, { description: e.target.value })} placeholder="A brief description of this page for search engines..." rows={3}/>
                <div style={{ fontSize: 10, color: "#666680", marginTop: 4 }}>{(pageSEO.description || "").length}/160 characters</div>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Canonical URL</label>
                <input className="panel-input" value={pageSEO.canonicalUrl || ""} onChange={(e) => updatePageSEO(activePageId, { canonicalUrl: e.target.value })} placeholder="https://yoursite.com/page"/>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Robots</label>
                <select className="panel-select" value={pageSEO.robots || "index, follow"} onChange={(e) => updatePageSEO(activePageId, { robots: e.target.value })}>
                  <option value="index, follow">Index, Follow</option>
                  <option value="noindex, follow">No Index, Follow</option>
                  <option value="index, nofollow">Index, No Follow</option>
                  <option value="noindex, nofollow">No Index, No Follow</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "og" && (
            <div className="panel-section">
              <div className="panel-form-group">
                <label className="panel-label">OG Title</label>
                <input className="panel-input" value={pageSEO.ogTitle || ""} onChange={(e) => updatePageSEO(activePageId, { ogTitle: e.target.value })} placeholder={pageSEO.title || "Same as page title"}/>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">OG Description</label>
                <textarea className="panel-input panel-textarea" value={pageSEO.ogDescription || ""} onChange={(e) => updatePageSEO(activePageId, { ogDescription: e.target.value })} placeholder={pageSEO.description || "Same as meta description"} rows={2}/>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">OG Image URL</label>
                <input className="panel-input" value={pageSEO.ogImage || ""} onChange={(e) => updatePageSEO(activePageId, { ogImage: e.target.value })} placeholder="https://yoursite.com/og-image.png"/>
              </div>
              <div className="panel-divider" />
              <div className="panel-section__title">Preview</div>
              <div className="og-preview">
                <div className="og-preview__image">
                  {pageSEO.ogImage ? <img src={pageSEO.ogImage} alt="OG" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : "No image set"}
                </div>
                <div className="og-preview__body">
                  <div className="og-preview__site">yoursite.com</div>
                  <div className="og-preview__title">{pageSEO.ogTitle || pageSEO.title || "Page Title"}</div>
                  <div className="og-preview__desc">{pageSEO.ogDescription || pageSEO.description || "Page description..."}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="panel-section">
              <div className="panel-form-group">
                <label className="panel-label">Google Analytics Measurement ID</label>
                <input className="panel-input" value={globalAnalyticsId} onChange={(e) => setGlobalAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX"/>
                <div style={{ fontSize: 10, color: "#666680", marginTop: 4 }}>This will be included in all exported pages.</div>
              </div>
              <div className="panel-divider" />
              <div className="panel-section__title">Lighthouse Audit</div>
              <button className="panel-btn" onClick={() => window.open("https://pagespeed.web.dev/", "_blank")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Run PageSpeed Insights
              </button>
            </div>
          )}

          {activeTab === "sitemap" && (
            <div className="panel-section">
              <button className="panel-btn panel-btn--primary" onClick={handleGenerateSitemap} style={{ marginBottom: 16 }}>Generate Sitemap</button>
              {sitemapPreview && (
                <>
                  <pre style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 12, fontSize: 11, color: "#a0a0b8", overflow: "auto", maxHeight: 300, whiteSpace: "pre-wrap" }}>{sitemapPreview}</pre>
                  <button className="panel-btn panel-btn--primary" onClick={handleDownloadSitemap} style={{ marginTop: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download sitemap.xml
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOPanel;
