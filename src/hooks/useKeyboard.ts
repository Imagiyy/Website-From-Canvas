import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";

/**
 * Global keyboard shortcuts.
 * Listens on `window` and ignores events when an input/textarea is focused or a text node is being inline-edited.
 */
export function useKeyboard(fileInputRef?: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useCanvasStore.getState();

      // If user is currently editing a text node, ignore standard shortcuts except Escape
      if (store.editingNodeId) {
        if (e.key === "Escape") {
          e.preventDefault();
          store.setEditingNode(null);
        }
        return;
      }

      // Ignore if user is typing in an input/textarea element
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Grouping: Ctrl+G
      if (ctrl && !shift && key === "g") {
        e.preventDefault();
        store.groupSelected();
        return;
      }

      // Ungrouping: Ctrl+Shift+G
      if (ctrl && shift && key === "g") {
        e.preventDefault();
        store.ungroupSelected();
        return;
      }

      // Undo: Ctrl+Z
      if (ctrl && !shift && key === "z") {
        e.preventDefault();
        store.undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((ctrl && shift && key === "z") || (ctrl && key === "y")) {
        e.preventDefault();
        store.redo();
        return;
      }

      // Copy: Ctrl+C
      if (ctrl && key === "c") {
        e.preventDefault();
        store.copySelected();
        return;
      }

      // Paste: Ctrl+V
      if (ctrl && key === "v") {
        e.preventDefault();
        store.paste();
        return;
      }

      // Duplicate: Ctrl+D
      if (ctrl && key === "d") {
        e.preventDefault();
        store.duplicate();
        return;
      }

      // Don't process single-key shortcuts if Ctrl is held
      if (ctrl) return;

      // Delete: Delete or Backspace
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        store.deleteSelected();
        return;
      }

      // Keyboard Arrow Nudges (1px alone, 10px with Shift)
      if (key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown") {
        e.preventDefault();
        const step = shift ? 10 : 1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        store.nudgeSelected(dx, dy);
        return;
      }

      // Tool shortcuts (only when no modifier keys)
      if (!shift) {
        if (key === "v") {
          store.setActiveTool("select");
          return;
        }
        if (key === "r") {
          store.setActiveTool("rectangle");
          return;
        }
        if (key === "t") {
          store.setActiveTool("text");
          return;
        }
        if (key === "i") {
          store.setActiveTool("image");
          if (fileInputRef?.current) {
            fileInputRef.current.dataset.clickX = "100";
            fileInputRef.current.dataset.clickY = "100";
            fileInputRef.current.click();
          }
          return;
        }
        if (key === "l") {
          store.setActiveTool("line");
          return;
        }
        if (key === "escape") {
          store.setActiveTool("select");
          store.selectNode(null);
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fileInputRef]);
}
