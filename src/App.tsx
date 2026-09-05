import { useState } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import LayerPanel from "./components/LayerPanel";
import PropertyPanel from "./components/PropertyPanel";
import ExportModal from "./components/ExportModal";
import StatusBar from "./components/StatusBar";
import ContextMenu from "./components/ContextMenu";

// Feature Panels
import ComponentLibraryPanel from "./components/panels/ComponentLibraryPanel";
import DesignTokensPanel from "./components/panels/DesignTokensPanel";
import InteractionsPanel from "./components/panels/InteractionsPanel";
import ProjectManager from "./components/panels/ProjectManager";
import AssetManager from "./components/panels/AssetManager";
import VersionHistory from "./components/panels/VersionHistory";
import CommentsPanel from "./components/panels/CommentsPanel";
import { ShareDialog, CollaborationCursors } from "./components/panels/CollaborationBar";
import AuthModal from "./components/panels/AuthModal";
import SEOPanel from "./components/panels/SEOPanel";
import CMSPanel from "./components/panels/CMSPanel";
import EcommercePanel from "./components/panels/EcommercePanel";
import DeployPanel from "./components/panels/DeployPanel";
import { TemplateModal } from "./components/panels/TemplateModal";
import { FormControlsPanel } from "./components/panels/FormControlsPanel";
import { NavigationPanel } from "./components/panels/NavigationPanel";
import { DataDisplayPanel } from "./components/panels/DataDisplayPanel";
import { FeedbackPanel } from "./components/panels/FeedbackPanel";
import { LayoutActionPanel } from "./components/panels/LayoutActionPanel";
import { PageSectionsPanel } from "./components/panels/PageSectionsPanel";
import { EmbedPanel } from "./components/panels/EmbedPanel";
import { IconLibraryPanel } from "./components/panels/IconLibraryPanel";
import { TypographyPanel } from "./components/panels/TypographyPanel";
import { AccessibilityPanel } from "./components/panels/AccessibilityPanel";
import { ImageEditorPanel } from "./components/panels/ImageEditorPanel";
import { ScrollEffectsPanel } from "./components/panels/ScrollEffectsPanel";
import { ThemePanel } from "./components/panels/ThemePanel";
import { MotionTimelinePanel } from "./components/panels/MotionTimelinePanel";
import { LocalizationPanel } from "./components/panels/LocalizationPanel";
import { PluginMarketplacePanel } from "./components/panels/PluginMarketplacePanel";
import { WebhookPanel } from "./components/panels/WebhookPanel";

import { useCanvasStore } from "./store/canvasStore";
import { useProjectStore } from "./store/projectStore";
import { useCollaborationStore } from "./store/collaborationStore";
import { useCommentStore } from "./store/commentStore";
import { getEnabledFeatures } from "./config/productScope";

import "./App.css";

export interface ContextMenuState {
  x: number;
  y: number;
  targetNodeId?: string | null;
}

function App() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const features = getEnabledFeatures();

  const isShareDialogOpen = useCollaborationStore((s) => s.isShareDialogOpen);
  const closeShareDialog = useCollaborationStore((s) => s.closeShareDialog);
  const loadProject = useProjectStore((s) => s.loadProject);
  const setPages = useCanvasStore((s) => s.setPages);
  const viewport = useCanvasStore((s) => s.viewport);
  const addNode = useCanvasStore((s) => s.addNode);
  const comments = useCommentStore((s) => s.comments);
  const setActiveComment = useCommentStore((s) => s.setActiveComment);

  const handleLoadProject = async (id: string) => {
    const project = await loadProject(id);
    if (project && setPages) {
      setPages(project.pages, project.activePageId);
    }
  };

  const handleRestoreVersion = (restoredPages: import("./types/canvas").PagesById) => {
    if (setPages) {
      const activeId = Object.keys(restoredPages)[0] || "page-1";
      setPages(restoredPages, activeId);
    }
  };

  const handleSelectAsset = (dataUrl: string) => {
    addNode({
      id: crypto.randomUUID(),
      parentId: null,
      order: 0,
      type: "image",
      name: "Image Asset",
      geometry: { x: 200, y: 200, width: 300, height: 200, rotation: 0 },
      style: { opacity: 1 },
      content: { kind: "image", assetUrl: dataUrl, fit: "cover" },
    });
    setActivePanel(null);
  };

  const closePanel = () => setActivePanel(null);

  return (
    <div className="app">
      <Toolbar
        onExportClick={() => setActivePanel("export")}
        onOpenProjects={() => setActivePanel("projects")}
        onOpenTemplates={() => setActivePanel("templates")}
        onOpenForms={() => setActivePanel("forms")}
        onOpenNavigation={() => setActivePanel("nav")}
        onOpenDataDisplay={() => setActivePanel("data")}
        onOpenFeedback={() => setActivePanel("feedback")}
        onOpenLayoutAction={() => setActivePanel("layout")}
        onOpenComponents={() => setActivePanel("components")}
        onOpenTokens={() => setActivePanel("tokens")}
        onOpenAssets={() => setActivePanel("assets")}
        onOpenVersionHistory={() => setActivePanel("versionHistory")}
        onOpenComments={() => setActivePanel("comments")}
        onOpenInteractions={() => setActivePanel("interactions")}
        onOpenSEO={() => setActivePanel("seo")}
        onOpenCMS={() => setActivePanel("cms")}
        onOpenEcommerce={() => setActivePanel("ecommerce")}
        onOpenDeploy={() => setActivePanel("deploy")}
        onOpenSections={() => setActivePanel("sections")}
        onOpenEmbeds={() => setActivePanel("embeds")}
        onOpenIcons={() => setActivePanel("icons")}
        onOpenTypography={() => setActivePanel("typography")}
        onOpenAccessibility={() => setActivePanel("accessibility")}
        onOpenImageEditor={() => setActivePanel("imageEditor")}
        onOpenScrollEffects={() => setActivePanel("scrollEffects")}
        onOpenTheme={() => setActivePanel("theme")}
        onOpenMotion={() => setActivePanel("motion")}
        onOpenLocalization={() => setActivePanel("localization")}
        onOpenPlugins={() => setActivePanel("plugins")}
        onOpenWebhooks={() => setActivePanel("webhooks")}
      />

      <div className="app__body" style={{ position: "relative" }}>
        <LayerPanel
          onContextMenu={(e, nodeId) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, targetNodeId: nodeId });
          }}
        />

        <div className="app__canvas-container" style={{ position: "relative" }}>
          <Canvas
            onContextMenu={(e, nodeId) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, targetNodeId: nodeId });
            }}
          />

          {/* Real-time Collaboration Cursors */}
          <CollaborationCursors viewport={viewport} />

          {/* Comment Pins rendered over canvas */}
          {comments.filter((c) => !c.resolved).map((c, idx) => {
            const pinX = c.position.x * viewport.zoom + viewport.panX;
            const pinY = c.position.y * viewport.zoom + viewport.panY;
            return (
              <div
                key={c.id}
                className="comment-pin"
                style={{
                  left: pinX,
                  top: pinY,
                  background: c.avatarColor,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveComment(c.id);
                  setActivePanel("comments");
                }}
                title={`${c.author}: ${c.text}`}
              >
                <span className="comment-pin__number">{idx + 1}</span>
              </div>
            );
          })}
        </div>

        <PropertyPanel />
      </div>

      <StatusBar />

      {/* Feature Modals */}
      <ExportModal isOpen={activePanel === "export"} onClose={closePanel} />
      <TemplateModal isOpen={activePanel === "templates"} onClose={closePanel} />
      <FormControlsPanel isOpen={activePanel === "forms"} onClose={closePanel} />
      <NavigationPanel isOpen={activePanel === "nav"} onClose={closePanel} />
      <DataDisplayPanel isOpen={activePanel === "data"} onClose={closePanel} />
      <FeedbackPanel isOpen={activePanel === "feedback"} onClose={closePanel} />
      <LayoutActionPanel isOpen={activePanel === "layout"} onClose={closePanel} />
      <PageSectionsPanel isOpen={activePanel === "sections"} onClose={closePanel} />
      <EmbedPanel isOpen={activePanel === "embeds"} onClose={closePanel} />
      <IconLibraryPanel isOpen={activePanel === "icons"} onClose={closePanel} />
      <TypographyPanel isOpen={activePanel === "typography"} onClose={closePanel} />
      <AccessibilityPanel isOpen={activePanel === "accessibility"} onClose={closePanel} />
      <ImageEditorPanel isOpen={activePanel === "imageEditor"} onClose={closePanel} />
      <ScrollEffectsPanel isOpen={activePanel === "scrollEffects"} onClose={closePanel} />
      <ThemePanel isOpen={activePanel === "theme"} onClose={closePanel} />
      <MotionTimelinePanel isOpen={activePanel === "motion"} onClose={closePanel} />
      <LocalizationPanel isOpen={activePanel === "localization"} onClose={closePanel} />
      <PluginMarketplacePanel isOpen={activePanel === "plugins"} onClose={closePanel} />
      <WebhookPanel isOpen={activePanel === "webhooks"} onClose={closePanel} />
      {features.projects && activePanel === "projects" && <ProjectManager onClose={closePanel} onLoadProject={handleLoadProject} />}
      {features.componentLibrary && activePanel === "components" && <ComponentLibraryPanel onClose={closePanel} />}
      {features.designTokens && activePanel === "tokens" && <DesignTokensPanel onClose={closePanel} />}
      {features.assetManager && activePanel === "assets" && <AssetManager onClose={closePanel} onSelectAsset={handleSelectAsset} />}
      {features.versionHistory && activePanel === "versionHistory" && <VersionHistory onClose={closePanel} onRestore={handleRestoreVersion} />}
      {features.comments && activePanel === "comments" && <CommentsPanel onClose={closePanel} />}
      {features.interactions && activePanel === "interactions" && <InteractionsPanel onClose={closePanel} />}
      {features.seo && activePanel === "seo" && <SEOPanel onClose={closePanel} />}
      {features.cms && activePanel === "cms" && <CMSPanel onClose={closePanel} />}
      {features.ecommerce && activePanel === "ecommerce" && <EcommercePanel onClose={closePanel} />}
      {features.deployment && activePanel === "deploy" && <DeployPanel onClose={closePanel} />}
      {features.collaboration && isShareDialogOpen && <ShareDialog onClose={closeShareDialog} />}
      {features.auth && <AuthModal />}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetNodeId={contextMenu.targetNodeId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default App;
