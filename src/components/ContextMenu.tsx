import React, { useEffect, useRef } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useComponentStore } from "../store/componentStore";
import { booleanUnion, booleanSubtract, booleanIntersect, booleanExclude } from "../utils/booleanOps";
import "./ContextMenu.css";

export interface ContextMenuProps {
  x: number;
  y: number;
  targetNodeId?: string | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, targetNodeId, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const clipboard = useCanvasStore((s) => s.clipboard);

  const copySelected = useCanvasStore((s) => s.copySelected);
  const paste = useCanvasStore((s) => s.paste);
  const duplicate = useCanvasStore((s) => s.duplicate);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const moveForward = useCanvasStore((s) => s.moveForward);
  const moveBackward = useCanvasStore((s) => s.moveBackward);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const toggleNodeLock = useCanvasStore((s) => s.toggleNodeLock);
  const toggleNodeVisibility = useCanvasStore((s) => s.toggleNodeVisibility);
  const selectAll = useCanvasStore((s) => s.selectAll);
  const resetView = useCanvasStore((s) => s.resetView);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const addNode = useCanvasStore((s) => s.addNode);

  // Close on outside click, window resize, or Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it doesn't overflow screen bounds
  const menuWidth = 220;
  const menuHeight = 420;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const adjustedX = Math.min(x, screenW - menuWidth - 8);
  const adjustedY = Math.min(y, screenH - menuHeight - 8);

  const hasSelection = selectedNodeIds.size > 0;
  const singleSelection = selectedNodeIds.size === 1;
  const targetNode = targetNodeId ? nodes[targetNodeId] : null;
  const isLocked = targetNode?.locked === true;
  const isHidden = targetNode?.visible === false;
  const canGroup = selectedNodeIds.size >= 2;
  const canUngroup = Array.from(selectedNodeIds).some((id) => nodes[id]?.type === "group");
  const canBoolean = selectedNodeIds.size === 2;

  const runAction = (fn: () => void) => {
    fn();
    onClose();
  };

  const handleBooleanOp = (op: "union" | "subtract" | "intersect" | "exclude") => {
    if (!canBoolean) return;
    const selected = Array.from(selectedNodeIds).map((id) => nodes[id]);
    const [nodeA, nodeB] = selected;
    if (!nodeA || !nodeB) return;

    let res;
    if (op === "union") res = booleanUnion(nodeA, nodeB);
    else if (op === "subtract") res = booleanSubtract(nodeA, nodeB);
    else if (op === "intersect") res = booleanIntersect(nodeA, nodeB);
    else res = booleanExclude(nodeA, nodeB);

    deleteSelected();
    addNode({
      id: crypto.randomUUID(),
      parentId: null,
      order: 0,
      type: "curve",
      name: `Boolean ${op}`,
      geometry: res.geometry,
      style: { ...nodeA.style },
      pathData: res.pathData,
    });
    onClose();
  };

  const handleCreateComponent = () => {
    const node = targetNode || (selectedNodeIds.size > 0 ? nodes[Array.from(selectedNodeIds)[0]] : null);
    if (!node) return;
    useComponentStore.getState().createComponent(node.name || "Component", node, nodes);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {targetNodeId || hasSelection ? (
        <>
          <button
            className="context-menu__item"
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) {
                  selectNode(targetNodeId);
                }
                copySelected();
              })
            }
          >
            <span className="context-menu__label">Copy</span>
            <span className="context-menu__shortcut">Ctrl+C</span>
          </button>

          <button
            className="context-menu__item"
            disabled={!clipboard || clipboard.length === 0}
            onClick={() => runAction(paste)}
          >
            <span className="context-menu__label">Paste</span>
            <span className="context-menu__shortcut">Ctrl+V</span>
          </button>

          <button
            className="context-menu__item"
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) {
                  selectNode(targetNodeId);
                }
                duplicate();
              })
            }
          >
            <span className="context-menu__label">Duplicate</span>
            <span className="context-menu__shortcut">Ctrl+D</span>
          </button>

          <button
            className="context-menu__item context-menu__item--danger"
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) {
                  selectNode(targetNodeId);
                }
                deleteSelected();
              })
            }
          >
            <span className="context-menu__label">Delete</span>
            <span className="context-menu__shortcut">Del</span>
          </button>

          <div className="context-menu__divider" />

          {/* Component Creation */}
          <button className="context-menu__item" onClick={handleCreateComponent}>
            <span className="context-menu__label">Create Component</span>
          </button>

          {/* Boolean Operations */}
          {canBoolean && (
            <>
              <div className="context-menu__divider" />
              <button className="context-menu__item" onClick={() => handleBooleanOp("union")}>
                <span className="context-menu__label">Boolean Union</span>
              </button>
              <button className="context-menu__item" onClick={() => handleBooleanOp("subtract")}>
                <span className="context-menu__label">Boolean Subtract</span>
              </button>
              <button className="context-menu__item" onClick={() => handleBooleanOp("intersect")}>
                <span className="context-menu__label">Boolean Intersect</span>
              </button>
              <button className="context-menu__item" onClick={() => handleBooleanOp("exclude")}>
                <span className="context-menu__label">Boolean Exclude</span>
              </button>
            </>
          )}

          <div className="context-menu__divider" />

          {canGroup && (
            <button className="context-menu__item" onClick={() => runAction(groupSelected)}>
              <span className="context-menu__label">Group Selection</span>
              <span className="context-menu__shortcut">Ctrl+G</span>
            </button>
          )}

          {canUngroup && (
            <button className="context-menu__item" onClick={() => runAction(ungroupSelected)}>
              <span className="context-menu__label">Ungroup</span>
              <span className="context-menu__shortcut">Ctrl+Shift+G</span>
            </button>
          )}

          {(canGroup || canUngroup) && <div className="context-menu__divider" />}

          <button
            className="context-menu__item"
            disabled={!singleSelection && !targetNodeId}
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) selectNode(targetNodeId);
                bringToFront();
              })
            }
          >
            <span className="context-menu__label">Bring to Front</span>
          </button>

          <button
            className="context-menu__item"
            disabled={!singleSelection && !targetNodeId}
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) selectNode(targetNodeId);
                moveForward();
              })
            }
          >
            <span className="context-menu__label">Move Forward</span>
          </button>

          <button
            className="context-menu__item"
            disabled={!singleSelection && !targetNodeId}
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) selectNode(targetNodeId);
                moveBackward();
              })
            }
          >
            <span className="context-menu__label">Move Backward</span>
          </button>

          <button
            className="context-menu__item"
            disabled={!singleSelection && !targetNodeId}
            onClick={() =>
              runAction(() => {
                if (targetNodeId && !selectedNodeIds.has(targetNodeId)) selectNode(targetNodeId);
                sendToBack();
              })
            }
          >
            <span className="context-menu__label">Send to Back</span>
          </button>

          <div className="context-menu__divider" />

          {targetNodeId && (
            <>
              <button
                className="context-menu__item"
                onClick={() => runAction(() => toggleNodeLock(targetNodeId))}
              >
                <span className="context-menu__label">
                  {isLocked ? "Unlock Element" : "Lock Element"}
                </span>
              </button>

              <button
                className="context-menu__item"
                onClick={() => runAction(() => toggleNodeVisibility(targetNodeId))}
              >
                <span className="context-menu__label">
                  {isHidden ? "Show Element" : "Hide Element"}
                </span>
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <button
            className="context-menu__item"
            disabled={!clipboard || clipboard.length === 0}
            onClick={() => runAction(paste)}
          >
            <span className="context-menu__label">Paste</span>
            <span className="context-menu__shortcut">Ctrl+V</span>
          </button>

          <button className="context-menu__item" onClick={() => runAction(selectAll)}>
            <span className="context-menu__label">Select All</span>
            <span className="context-menu__shortcut">Ctrl+A</span>
          </button>

          <div className="context-menu__divider" />

          <button className="context-menu__item" onClick={() => runAction(resetView)}>
            <span className="context-menu__label">Reset View</span>
            <span className="context-menu__shortcut">Ctrl+0</span>
          </button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
