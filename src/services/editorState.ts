import type {
  BreakpointKey,
  CanvasPage,
  ElementType,
  NodesById,
  PagesById,
} from "../types/canvas";

export interface EditorStateSnapshot {
  pages: PagesById;
  activePageId: string;
  nodes: NodesById;
  nextNumber: Record<ElementType, number>;
  activeColor: string;
  pageHeight: Record<BreakpointKey, number>;
}

export const DEFAULT_NEXT_NUMBER: Record<ElementType, number> = {
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
};

export const DEFAULT_PAGE_HEIGHTS: Record<BreakpointKey, number> = {
  desktop: 1200,
  tablet: 1400,
  mobile: 1600,
};

export function createDefaultPages(nodes: NodesById = {}): PagesById {
  const defaultPageId = "page-1";
  return {
    [defaultPageId]: {
      id: defaultPageId,
      name: "Home",
      slug: "index",
      nodes,
    },
  };
}

export function normalizePage(page: Partial<CanvasPage> | undefined, fallbackId = "page-1", fallbackNodes: NodesById = {}): CanvasPage {
  const id = String(page?.id ?? fallbackId);
  return {
    id,
    name: String(page?.name ?? "Untitled"),
    slug: String(page?.slug ?? "untitled"),
    nodes: (page?.nodes && typeof page.nodes === "object" ? page.nodes : fallbackNodes) as NodesById,
    seo: page?.seo,
  };
}

export function normalizePages(pages: Partial<PagesById> | undefined, fallbackNodes: NodesById = {}): PagesById {
  if (!pages || typeof pages !== "object") {
    return createDefaultPages(fallbackNodes);
  }

  const entries = Object.entries(pages as Record<string, Partial<CanvasPage>>);
  if (entries.length === 0) {
    return createDefaultPages(fallbackNodes);
  }

  return Object.fromEntries(
    entries.map(([id, page]) => [id, normalizePage(page, id, fallbackNodes)])
  );
}

export function getActivePageId(pages: PagesById, requestedId?: string): string {
  if (requestedId && pages[requestedId]) return requestedId;
  const firstKey = Object.keys(pages)[0];
  return firstKey ?? "page-1";
}

export function syncPageNodes(pages: PagesById, activePageId: string, nodes: NodesById): PagesById {
  const nextPages = { ...pages };
  const currentPage = nextPages[activePageId] ?? { id: activePageId, name: "Untitled", slug: "untitled", nodes: {} };
  nextPages[activePageId] = {
    ...currentPage,
    nodes,
  };
  return nextPages;
}

export function normalizeEditorState(input: Partial<EditorStateSnapshot> = {}): EditorStateSnapshot {
  const fallbackNodes = (input.nodes && typeof input.nodes === "object" ? input.nodes : {}) as NodesById;
  const pages = normalizePages(input.pages, fallbackNodes);
  const activePageId = getActivePageId(pages, input.activePageId);
  const nodes = pages[activePageId]?.nodes ?? fallbackNodes;

  return {
    pages,
    activePageId,
    nodes,
    nextNumber: { ...DEFAULT_NEXT_NUMBER, ...(input.nextNumber ?? {}) },
    activeColor: typeof input.activeColor === "string" ? input.activeColor : "#3B82F6",
    pageHeight: {
      ...DEFAULT_PAGE_HEIGHTS,
      ...(input.pageHeight ?? {}),
    },
  };
}
