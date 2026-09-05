// Asset Manager — 3.2 Centralized Image/Media Library
import React, { useEffect, useState, useRef } from "react";
import { useAssetStore } from "../../store/assetStore";
import { ICON_LIBRARY, ICON_CATEGORIES, searchIcons } from "../../data/iconLibrary";
import "../panels/PanelStyles.css";

const AssetManager: React.FC<{ onClose: () => void; onSelectAsset?: (dataUrl: string) => void }> = ({ onClose, onSelectAsset }) => {
  const [activeTab, setActiveTab] = useState<"uploads" | "icons">("uploads");
  const assets = useAssetStore((s) => s.assets);
  const searchQuery = useAssetStore((s) => s.searchQuery);
  const filterType = useAssetStore((s) => s.filterType);
  const setSearchQuery = useAssetStore((s) => s.setSearchQuery);
  const setFilterType = useAssetStore((s) => s.setFilterType);
  const loadAssets = useAssetStore((s) => s.loadAssets);
  const addAsset = useAssetStore((s) => s.addAsset);
  const removeAsset = useAssetStore((s) => s.removeAsset);
  const getFilteredAssets = useAssetStore((s) => s.getFilteredAssets);

  const [isDragging, setIsDragging] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const filteredAssets = getFilteredAssets();

  const filteredIcons = iconSearch
    ? searchIcons(iconSearch)
    : selectedCategory === "all"
    ? ICON_LIBRARY
    : ICON_LIBRARY.filter((i) => i.category === selectedCategory);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    for (const file of files) {
      await addAsset(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await addAsset(file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Asset Manager
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === "uploads" ? "panel-tab--active" : ""}`} onClick={() => setActiveTab("uploads")}>Uploads ({assets.length})</button>
            <button className={`panel-tab ${activeTab === "icons" ? "panel-tab--active" : ""}`} onClick={() => setActiveTab("icons")}>Icon Library ({ICON_LIBRARY.length})</button>
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "uploads" && (
            <>
              <div className={`panel-dropzone ${isDragging ? "panel-dropzone--active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div className="panel-dropzone__text">Drop images here or click to upload</div>
                <div className="panel-dropzone__hint">Supports PNG, JPG, SVG, WebP, GIF</div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />

              <div className="panel-row" style={{ marginTop: 16, marginBottom: 12, gap: 8 }}>
                <input className="panel-input" placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1 }}/>
                <select className="panel-select" value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={{ width: 120 }}>
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="svg">SVGs</option>
                  <option value="video">Videos</option>
                </select>
              </div>

              {filteredAssets.length === 0 ? (
                <div className="panel-empty">
                  <div className="panel-empty__title">No Assets</div>
                  <div className="panel-empty__desc">Upload images to build your asset library.</div>
                </div>
              ) : (
                <div className="panel-grid panel-grid--4col">
                  {filteredAssets.map((asset) => (
                    <div key={asset.id} className="panel-card" style={{ cursor: "pointer", padding: 6 }} onClick={() => onSelectAsset?.(asset.dataUrl)}>
                      <div style={{ height: 80, borderRadius: 6, overflow: "hidden", marginBottom: 6, background: "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={asset.thumbnail || asset.dataUrl} alt={asset.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#e4e4f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</div>
                      <div className="panel-row panel-row--between" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: "#666680" }}>{formatSize(asset.size)}</span>
                        <button className="panel-btn panel-btn--icon panel-btn--small" style={{ opacity: 0.4, padding: 2 }} onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "icons" && (
            <>
              <div className="panel-row" style={{ gap: 8, marginBottom: 12 }}>
                <input className="panel-input" placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} style={{ flex: 1 }}/>
                <select className="panel-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: 160 }}>
                  <option value="all">All Categories</option>
                  {ICON_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="panel-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))" }}>
                {filteredIcons.map((icon, i) => (
                  <div key={`${icon.name}-${i}`} className="panel-card" style={{ textAlign: "center", cursor: "pointer", padding: 8 }}
                    onClick={() => {
                      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(icon.svg)}`;
                      onSelectAsset?.(dataUrl);
                    }}>
                    <div style={{ width: 32, height: 32, margin: "0 auto 4px", color: "#b4b4c8" }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                    <div style={{ fontSize: 9, color: "#8888a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{icon.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
