import type { BreakpointKey, ElementType, NodesById, PagesById } from "../types/canvas";
import { DEFAULT_NEXT_NUMBER, DEFAULT_PAGE_HEIGHTS, normalizePages } from "./editorState";

export const STORAGE_KEY = "canvassite_project";

export interface PersistedCanvasState {
  pages: PagesById;
  activePageId: string;
  nodes: NodesById;
  nextNumber: Record<ElementType, number>;
  activeColor: string;
  pageHeight: Record<BreakpointKey, number>;
}

export function validatePersistedCanvasState(raw: unknown): PersistedCanvasState | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const fallbackNodes = data.nodes && typeof data.nodes === "object" ? (data.nodes as NodesById) : {};
  const pages = normalizePages(data.pages as Partial<PagesById> | undefined, fallbackNodes);
  const activePageId = data.activePageId && typeof data.activePageId === "string" && pages[data.activePageId] ? data.activePageId : Object.keys(pages)[0] || "page-1";

  return {
    pages,
    activePageId,
    nodes: pages[activePageId]?.nodes ?? fallbackNodes,
    nextNumber:
      data.nextNumber && typeof data.nextNumber === "object"
        ? { ...DEFAULT_NEXT_NUMBER, ...(data.nextNumber as Partial<Record<ElementType, number>>) }
        : { ...DEFAULT_NEXT_NUMBER },
    activeColor: typeof data.activeColor === "string" ? data.activeColor : "#3B82F6",
    pageHeight:
      data.pageHeight && typeof data.pageHeight === "object"
        ? { ...DEFAULT_PAGE_HEIGHTS, ...(data.pageHeight as Partial<Record<BreakpointKey, number>>) }
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

