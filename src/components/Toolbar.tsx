import React from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useAuthStore } from "../store/authStore";
import { useEcommerceStore } from "../store/ecommerceStore";
import { getEnabledFeatures } from "../config/productScope";
import CollaborationBar from "./panels/CollaborationBar";
import "./Toolbar.css";

interface Props {
  onImageUploadClick?: () => void;
  onExportClick?: () => void;
  onOpenProjects?: () => void;
  onOpenTemplates?: () => void;
  onOpenForms?: () => void;
  onOpenNavigation?: () => void;
  onOpenDataDisplay?: () => void;
  onOpenFeedback?: () => void;
  onOpenLayoutAction?: () => void;
  onOpenComponents?: () => void;
  onOpenTokens?: () => void;
  onOpenAssets?: () => void;
  onOpenVersionHistory?: () => void;
  onOpenComments?: () => void;
  onOpenInteractions?: () => void;
  onOpenSEO?: () => void;
  onOpenCMS?: () => void;
  onOpenEcommerce?: () => void;
  onOpenDeploy?: () => void;
  onOpenSections?: () => void;
  onOpenEmbeds?: () => void;
  onOpenIcons?: () => void;
  onOpenTypography?: () => void;
  onOpenAccessibility?: () => void;
  onOpenImageEditor?: () => void;
  onOpenScrollEffects?: () => void;
  onOpenTheme?: () => void;
  onOpenMotion?: () => void;
  onOpenLocalization?: () => void;
  onOpenPlugins?: () => void;
  onOpenWebhooks?: () => void;
}

const COLOR_PRESETS = [
  "#000000","#FFFFFF","#EF4444","#F97316","#F59E0B","#10B981",
  "#3B82F6","#6366F1","#8B5CF6","#EC4899","#64748B","#1E293B",
];

export const Toolbar: React.FC<Props> = ({
  onImageUploadClick,
  onExportClick,
  onOpenProjects,
  onOpenTemplates,
  onOpenForms,
  onOpenNavigation,
  onOpenDataDisplay,
  onOpenFeedback,
  onOpenLayoutAction,
  onOpenComponents,
  onOpenTokens,
  onOpenAssets,
  onOpenVersionHistory,
  onOpenComments,
  onOpenInteractions,
  onOpenSEO,
  onOpenCMS,
  onOpenEcommerce,
  onOpenDeploy,
  onOpenSections,
  onOpenEmbeds,
  onOpenIcons,
  onOpenTypography,
  onOpenAccessibility,
  onOpenImageEditor,
  onOpenScrollEffects,
  onOpenTheme,
  onOpenMotion,
  onOpenLocalization,
  onOpenPlugins,
  onOpenWebhooks,
}) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const past = useCanvasStore((s) => s.past);
  const future = useCanvasStore((s) => s.future);
  const activeColor = useCanvasStore((s) => s.activeColor);
  const setActiveColor = useCanvasStore((s) => s.setActiveColor);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const triggerImageUpload = useCanvasStore((s) => s.triggerImageUpload);
  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const setActiveBreakpoint = useCanvasStore((s) => s.setActiveBreakpoint);
  const isPreviewMode = useCanvasStore((s) => s.isPreviewMode);
  const togglePreviewMode = useCanvasStore((s) => s.togglePreviewMode);

  const cartItemCount = useEcommerceStore((s) => s.getCartItemCount());
  const openCart = useEcommerceStore((s) => s.openCart);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const features = getEnabledFeatures();

  const hasSelection = selectedNodeIds.size > 0;

  const handleImageToolClick = () => {
    setActiveTool("image");
    if (onImageUploadClick) onImageUploadClick();
    triggerImageUpload();
  };

  const ToolBtn: React.FC<{
    tool: string;
    title: string;
    onClick?: () => void;
    children: React.ReactNode;
  }> = ({ tool, title, onClick, children }) => (
    <button
      className={`toolbar__icon-btn ${activeTool === tool ? "toolbar__icon-btn--active" : ""}`}
      onClick={onClick ?? (() => setActiveTool(tool as any))}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="toolbar" style={{ flexWrap: "wrap", height: "auto", minHeight: 48, gap: 4, padding: "4px 8px" }}>
      {/* ══════ PROJECTS & FILE ══════ */}
      {features.projects && (
        <div className="toolbar__group">
          <div className="toolbar__group-content">
            <div className="toolbar__tool-grid">
              <button className="toolbar__icon-btn" onClick={onOpenProjects} title="Projects Manager">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenTemplates} title="Starter Templates Gallery">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </button>
              {features.versionHistory && (
                <button className="toolbar__icon-btn" onClick={onOpenVersionHistory} title="Version History">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </button>
              )}
            </div>
          </div>
          <span className="toolbar__group-label">Project</span>
        </div>
      )}

      <div className="toolbar__group-sep" />

      {/* ══════ CLIPBOARD ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <button className="toolbar__icon-btn" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H12C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 5L3 8L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="toolbar__icon-btn" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H4C2.9 8 2 8.9 2 10C2 11.1 2.9 12 4 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="toolbar__icon-btn toolbar__icon-btn--danger" onClick={deleteSelected} disabled={!hasSelection} title="Delete (Del)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 3V2.5C5 1.67 5.67 1 6.5 1H9.5C10.33 1 11 1.67 11 2.5V3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 3H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M3.5 3L4.2 13.5C4.24 14.05 4.7 14.5 5.25 14.5H10.75C11.3 14.5 11.76 14.05 11.8 13.5L12.5 3" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>
        </div>
        <span className="toolbar__group-label">Clipboard</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ TOOLS & VECTOR ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__tool-grid">
            <ToolBtn tool="select" title="Select (V)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 1L3 12.5L6.5 9L10.5 15L12.5 14L8.5 8L13 7.5L3 1Z" fill="currentColor"/></svg>
            </ToolBtn>
            <ToolBtn tool="rectangle" title="Rectangle (R)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>
            </ToolBtn>
            <ToolBtn tool="circle" title="Circle (O)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/></svg>
            </ToolBtn>
            <ToolBtn tool="polygon" title="Polygon (G)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 15,6 12,14 4,14 1,6" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
            </ToolBtn>
            <ToolBtn tool="line" title="Line (L)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="text" title="Text (T)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3H13M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn tool="star" title="Star (S)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polygon points="8,1 10.3,5.7 15.5,6.5 11.8,10.1 12.6,15.3 8,12.8 3.4,15.3 4.2,10.1 0.5,6.5 5.7,5.7" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg>
            </ToolBtn>
            <ToolBtn tool="pen" title="Pen Tool (P)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="12" cy="12" r="1"/></svg>
            </ToolBtn>
          </div>
        </div>
        <span className="toolbar__group-label">Shapes</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ LIBRARIES & ASSETS ══════ */}
      {(features.componentLibrary || features.designTokens || features.assetManager) && (
        <div className="toolbar__group">
          <div className="toolbar__group-content">
            <div className="toolbar__tool-grid">
              {features.componentLibrary && (
                <button className="toolbar__icon-btn" onClick={onOpenComponents} title="Component Library">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </button>
              )}
              {features.designTokens && (
                <button className="toolbar__icon-btn" onClick={onOpenTokens} title="Design Tokens (Colors & Text)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              )}
              {features.assetManager && (
                <button className="toolbar__icon-btn" onClick={onOpenAssets} title="Asset & Icon Manager">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
              )}
              <ToolBtn tool="image" title="Insert Image" onClick={handleImageToolClick}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><circle cx="5" cy="5.5" r="1.5" fill="currentColor"/><path d="M2 12L6 8L9.5 11.5L11.5 9.5L14 12" stroke="currentColor" strokeWidth="1.1"/></svg>
              </ToolBtn>
            </div>
          </div>
          <span className="toolbar__group-label">Libraries</span>
        </div>
      )}

      <div className="toolbar__group-sep" />

      {/* ══════ FEATURES & INTEGRATIONS ══════ */}
      {(features.interactions || features.comments || features.seo || features.cms || features.ecommerce) && (
        <div className="toolbar__group">
          <div className="toolbar__group-content">
            <div className="toolbar__tool-grid">
              <button className="toolbar__icon-btn" onClick={onOpenForms} title="Form & Input Controls Engine">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenNavigation} title="Navigation & Wayfinding Library">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenDataDisplay} title="Content & Data Display Library">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenFeedback} title="Feedback, Overlays & Status Library">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenLayoutAction} title="Layout, Media & Action Controls Library">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenSections} title="Pre-built Page Sections">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenEmbeds} title="Custom Code & Embeds">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenIcons} title="Icons Library">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenTypography} title="Typography System & Google Fonts">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenAccessibility} title="Accessibility (a11y) Audit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M12 6v6m0 0l-3 6m3-6l3 6M6 10h12"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenImageEditor} title="Image Editor & Filters">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenScrollEffects} title="Scroll & Motion Effects">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9"/><path d="M12 7v5l3 3"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenTheme} title="Global Site Theming">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenMotion} title="Advanced Motion & Keyframe Scrubber Timelines">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenLocalization} title="Localization, Translations & RTL Layout Mirroring">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenPlugins} title="Plugin Marketplace & Developer SDK Sandbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </button>
              <button className="toolbar__icon-btn" onClick={onOpenWebhooks} title="Native Webhook & Form Action Pipelines">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
              {features.interactions && (
                <button className="toolbar__icon-btn" onClick={onOpenInteractions} title="Interactions & Animations">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </button>
              )}
              {features.comments && (
                <button className="toolbar__icon-btn" onClick={onOpenComments} title="Comments & Feedback">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                </button>
              )}
              {features.seo && (
                <button className="toolbar__icon-btn" onClick={onOpenSEO} title="SEO & Analytics">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
              )}
              {features.cms && (
                <button className="toolbar__icon-btn" onClick={onOpenCMS} title="CMS Integration">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M9 12l3 3-3 3"/></svg>
                </button>
              )}
              {features.ecommerce && (
                <button className="toolbar__icon-btn" onClick={onOpenEcommerce} title="E-commerce Store">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </button>
              )}
            </div>
          </div>
          <span className="toolbar__group-label">Features</span>
        </div>
      )}

      <div className="toolbar__group-sep" />

      {/* ══════ COLORS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__color-area">
            <label className="toolbar__color-main">
              <input
                type="color"
                className="toolbar__color-input"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
              />
              <span className="toolbar__color-swatch" style={{ backgroundColor: activeColor }} />
            </label>
          </div>
          <div className="toolbar__color-presets">
            {COLOR_PRESETS.map((c) => (
              <span
                key={c}
                className="toolbar__color-preset"
                style={{ backgroundColor: c }}
                onClick={() => setActiveColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
        <span className="toolbar__group-label">Colors</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ BREAKPOINTS ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content">
          <div className="toolbar__view-btns">
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "desktop" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("desktop")}
              title="Desktop (1200px)"
            >
              Desktop
            </button>
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "tablet" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("tablet")}
              title="Tablet (768px)"
            >
              Tablet
            </button>
            <button
              className={`toolbar__view-btn ${activeBreakpoint === "mobile" ? "toolbar__view-btn--active" : ""}`}
              onClick={() => setActiveBreakpoint("mobile")}
              title="Mobile (375px)"
            >
              Mobile
            </button>
          </div>
        </div>
        <span className="toolbar__group-label">View</span>
      </div>

      <div className="toolbar__group-sep" />

      {/* ══════ PLAY / PREVIEW & CART ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content" style={{ display: "flex", gap: 6 }}>
          <button
            className={`toolbar__labeled-btn ${isPreviewMode ? "toolbar__labeled-btn--primary" : ""}`}
            onClick={togglePreviewMode}
            title={isPreviewMode ? "Exit Interactive Test Mode" : "Play / Test Interactive Website (Hyperlinks, Hover, Cart, Animations)"}
            style={{
              background: isPreviewMode ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255, 255, 255, 0.05)",
              color: isPreviewMode ? "#ffffff" : "#e4e4f0",
              borderColor: isPreviewMode ? "#10b981" : "rgba(255, 255, 255, 0.1)",
              fontWeight: 700,
            }}
          >
            {isPreviewMode ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Editing
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play Mode
              </>
            )}
          </button>

          {features.ecommerce && (
            <button
              className="toolbar__icon-btn"
              onClick={openCart}
              title="Shopping Cart"
              style={{ position: "relative" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    background: "#10b981",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: "50%",
                    width: 15,
                    height: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </div>
        <span className="toolbar__group-label">Interactive</span>
      </div>

      <div className="toolbar__spacer" />

      {/* ══════ COLLABORATION & AUTH ══════ */}
      {(features.collaboration || features.auth) && (
        <div className="toolbar__group">
          <div className="toolbar__group-content" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {features.collaboration && <CollaborationBar />}
            {features.auth && (
              isAuthenticated ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => openAuthModal()}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {user?.name.charAt(0) || "U"}
                  </div>
                </div>
              ) : (
                <button className="panel-btn panel-btn--small" onClick={() => openAuthModal("login")}>Sign In</button>
              )
            )}
          </div>
          <span className="toolbar__group-label">Account</span>
        </div>
      )}

      <div className="toolbar__group-sep" />

      {/* ══════ DEPLOY & EXPORT ══════ */}
      <div className="toolbar__group">
        <div className="toolbar__group-content" style={{ display: "flex", gap: 6 }}>
          {features.deployment && onOpenDeploy && (
            <button
              className="toolbar__labeled-btn"
              onClick={onOpenDeploy}
              title="One-Click Deploy (Vercel / Netlify)"
              style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12A10 10 0 1112 2a10 10 0 0110 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              Deploy
            </button>
          )}
          <button
            className="toolbar__labeled-btn toolbar__labeled-btn--primary"
            onClick={onExportClick}
            title="Export (React, Next.js, HTML, Figma, Images)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Export
          </button>
        </div>
        <span className="toolbar__group-label">Publish</span>
      </div>
    </div>
  );
};

export default Toolbar;
