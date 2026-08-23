import type { BreakpointKey, ElementType, NodesById, PagesById } from "../types/canvas";

export const STORAGE_KEY = "canvassite_project";

export interface PersistedCanvasState {
  pages: PagesById;
  activePageId: string;
  nodes: NodesById;
  nextNumber: Record<ElementType, number>;
  activeColor: string;
  pageHeight: Record<BreakpointKey, number>;
}

const DEFAULT_NEXT_NUMBER: Record<ElementType, number> = {
  rectangle: 1,
  text: 1,
  image: 1,
  line: 1,
  group: 1,
  polygon: 1,
  circle: 1,
  curve: 1,
  star: 1,
  shape3d: 1,
  brush: 1,
  pencil: 1,
  pen: 1,
  component: 1,
  componentInstance: 1,
  product: 1,
  formInput: 1,
  formSelect: 1,
  formCheckbox: 1,
  formRadio: 1,
  formSlider: 1,
  formDatePicker: 1,
  formColorPicker: 1,
  formFileInput: 1,
  formRating: 1,
  formSignature: 1,
  formMap: 1,
  formSegmented: 1,
  formRichText: 1,
  formCodeEditor: 1,
  formOtpPin: 1,
  formCreditCard: 1,
  formTagInput: 1,
  formDualSlider: 1,
  formVoiceRecorder: 1,
  formAvatarUpload: 1,
  formEmojiPicker: 1,
  formStepper: 1,
  formToggleGroup: 1,
  formAccordion: 1,
  formCaptcha: 1,
  formGradientPicker: 1,
  formCurrency: 1,
  formTimeRange: 1,
  navHeader: 1,
  navSidebar: 1,
  navBreadcrumb: 1,
  navPagination: 1,
  navTabs: 1,
  navToc: 1,
  dataCard: 1,
  dataTable: 1,
  dataList: 1,
  dataBadge: 1,
  dataAccordion: 1,
  dataTooltip: 1,
  feedbackModal: 1,
  feedbackToast: 1,
  feedbackAlert: 1,
  feedbackProgress: 1,
  feedbackSkeleton: 1,
  feedbackEmptyState: 1,
  layoutContainer: 1,
  layoutCarousel: 1,
  mediaPlayer: 1,
  layoutDivider: 1,
  actionButton: 1,
  actionMenu: 1,
  sectionHero: 1,
  sectionPricing: 1,
  sectionTestimonials: 1,
  sectionTeam: 1,
  sectionFeatures: 1,
  sectionCTA: 1,
  sectionFooter: 1,
  embedCode: 1,
  embedIframe: 1,
  iconElement: 1,
};

const DEFAULT_PAGE_HEIGHTS: Record<BreakpointKey, number> = {
  desktop: 1200,
  tablet: 1400,
  mobile: 1600,
};

function normalizePages(rawPages?: unknown, fallbackNodes?: NodesById): PagesById {
  if (rawPages && typeof rawPages === "object") {
    const entries = Object.entries(rawPages as Record<string, any>).filter(([_, page]) => !!page && typeof page === "object");
    if (entries.length > 0) {
      return Object.fromEntries(
        entries.map(([id, page]) => [
          id,
          {
            id: String(page.id ?? id),
            name: String(page.name ?? "Untitled"),
            slug: String(page.slug ?? "untitled"),
            nodes: page.nodes && typeof page.nodes === "object" ? (page.nodes as NodesById) : fallbackNodes ?? {},
            seo: page.seo ?? undefined,
          },
        ])
      );
    }
  }

  const firstPageId = "page-1";
  return {
    [firstPageId]: {
      id: firstPageId,
      name: "Home",
      slug: "index",
      nodes: fallbackNodes ?? {},
    },
  };
}

export function validatePersistedCanvasState(raw: unknown): PersistedCanvasState | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, any>;
  const fallbackNodes = data.nodes && typeof data.nodes === "object" ? (data.nodes as NodesById) : {};
  const pages = normalizePages(data.pages, fallbackNodes);
  const activePageId = data.activePageId && pages[data.activePageId] ? data.activePageId : Object.keys(pages)[0] || "page-1";

  return {
    pages,
    activePageId,
    nodes: pages[activePageId]?.nodes ?? fallbackNodes,
    nextNumber:
      data.nextNumber && typeof data.nextNumber === "object"
        ? { ...DEFAULT_NEXT_NUMBER, ...data.nextNumber }
        : { ...DEFAULT_NEXT_NUMBER },
    activeColor: typeof data.activeColor === "string" ? data.activeColor : "#3B82F6",
    pageHeight:
      data.pageHeight && typeof data.pageHeight === "object"
        ? { ...DEFAULT_PAGE_HEIGHTS, ...data.pageHeight }
        : { ...DEFAULT_PAGE_HEIGHTS },
  };
}

export function loadCanvasState(): PersistedCanvasState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return validatePersistedCanvasState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCanvasState(state: PersistedCanvasState): void {
  try {
    const currentPages = {
      ...state.pages,
      [state.activePageId]: {
        ...state.pages[state.activePageId],
        nodes: state.nodes,
      },
    };

    const data: PersistedCanvasState = {
      pages: currentPages,
      activePageId: state.activePageId,
      nodes: state.nodes,
      nextNumber: state.nextNumber,
      activeColor: state.activeColor,
      pageHeight: state.pageHeight,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[CanvasSite] Failed to save to localStorage — data may be too large:", err);
    // Dispatch a custom event that UI can listen to for user notification
    try {
      window.dispatchEvent(new CustomEvent("canvassite:storage-error", { detail: { error: err } }));
    } catch {
      // ignore dispatch failures in non-browser environments
    }
  }
}

export function clearCanvasState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore removal failures
  }
}
