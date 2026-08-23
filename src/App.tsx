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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isFormsOpen, setIsFormsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);
  const [isEmbedsOpen, setIsEmbedsOpen] = useState(false);
  const [isIconsOpen, setIsIconsOpen] = useState(false);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [isScrollEffectsOpen, setIsScrollEffectsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const [isTokensOpen, setIsTokensOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);
  const [isSEOOpen, setIsSEOOpen] = useState(false);
  const [isCMSOpen, setIsCMSOpen] = useState(false);
  const [isEcommerceOpen, setIsEcommerceOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);

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
    setIsAssetsOpen(false);
  };

  return (
    <div className="app">
      <Toolbar
        onExportClick={() => setIsExportOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenForms={() => setIsFormsOpen(true)}
        onOpenNavigation={() => setIsNavOpen(true)}
        onOpenDataDisplay={() => setIsDataOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenLayoutAction={() => setIsLayoutOpen(true)}
        onOpenComponents={() => setIsComponentsOpen(true)}
        onOpenTokens={() => setIsTokensOpen(true)}
        onOpenAssets={() => setIsAssetsOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        onOpenComments={() => setIsCommentsOpen(true)}
        onOpenInteractions={() => setIsInteractionsOpen(true)}
        onOpenSEO={() => setIsSEOOpen(true)}
        onOpenCMS={() => setIsCMSOpen(true)}
        onOpenEcommerce={() => setIsEcommerceOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onOpenSections={() => setIsSectionsOpen(true)}
        onOpenEmbeds={() => setIsEmbedsOpen(true)}
        onOpenIcons={() => setIsIconsOpen(true)}
        onOpenTypography={() => setIsTypographyOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenImageEditor={() => setIsImageEditorOpen(true)}
        onOpenScrollEffects={() => setIsScrollEffectsOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
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
                  setIsCommentsOpen(true);
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
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <TemplateModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <FormControlsPanel isOpen={isFormsOpen} onClose={() => setIsFormsOpen(false)} />
      <NavigationPanel isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      <DataDisplayPanel isOpen={isDataOpen} onClose={() => setIsDataOpen(false)} />
      <FeedbackPanel isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <LayoutActionPanel isOpen={isLayoutOpen} onClose={() => setIsLayoutOpen(false)} />
      <PageSectionsPanel isOpen={isSectionsOpen} onClose={() => setIsSectionsOpen(false)} />
      <EmbedPanel isOpen={isEmbedsOpen} onClose={() => setIsEmbedsOpen(false)} />
      <IconLibraryPanel isOpen={isIconsOpen} onClose={() => setIsIconsOpen(false)} />
      <TypographyPanel isOpen={isTypographyOpen} onClose={() => setIsTypographyOpen(false)} />
      <AccessibilityPanel isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <ImageEditorPanel isOpen={isImageEditorOpen} onClose={() => setIsImageEditorOpen(false)} />
      <ScrollEffectsPanel isOpen={isScrollEffectsOpen} onClose={() => setIsScrollEffectsOpen(false)} />
      <ThemePanel isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      {features.projects && isProjectsOpen && <ProjectManager onClose={() => setIsProjectsOpen(false)} onLoadProject={handleLoadProject} />}
      {features.componentLibrary && isComponentsOpen && <ComponentLibraryPanel onClose={() => setIsComponentsOpen(false)} />}
      {features.designTokens && isTokensOpen && <DesignTokensPanel onClose={() => setIsTokensOpen(false)} />}
      {features.assetManager && isAssetsOpen && <AssetManager onClose={() => setIsAssetsOpen(false)} onSelectAsset={handleSelectAsset} />}
      {features.versionHistory && isVersionHistoryOpen && <VersionHistory onClose={() => setIsVersionHistoryOpen(false)} onRestore={handleRestoreVersion} />}
      {features.comments && isCommentsOpen && <CommentsPanel onClose={() => setIsCommentsOpen(false)} />}
      {features.interactions && isInteractionsOpen && <InteractionsPanel onClose={() => setIsInteractionsOpen(false)} />}
      {features.seo && isSEOOpen && <SEOPanel onClose={() => setIsSEOOpen(false)} />}
      {features.cms && isCMSOpen && <CMSPanel onClose={() => setIsCMSOpen(false)} />}
      {features.ecommerce && isEcommerceOpen && <EcommercePanel onClose={() => setIsEcommerceOpen(false)} />}
      {features.deployment && isDeployOpen && <DeployPanel onClose={() => setIsDeployOpen(false)} />}
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
