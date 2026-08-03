import React, { useState } from "react";
import type { CanvasNode, NodesById, NodeId, ElementType } from "../types/canvas";
import { useCanvasStore } from "../store/canvasStore";
import "./LayerPanel.css";

const IconForType: React.FC<{ type: ElementType }> = ({ type }) => {
  switch (type) {
    case "rectangle":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "text":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <path d="M2 2H10M6 2V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "image":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="4" cy="5" r="1" fill="currentColor" />
          <path d="M2 9L5 6L7.5 8.5L9 7L10 9" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "line":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "group":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5L6.5 3.5H10.5C11.33 3.5 12 4.17 12 5V9.5C12 10.33 11.33 11 10.5 11H2.5C1.67 11 1 10.33 1 9.5V3.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "polygon":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <polygon points="6,1 11,4.5 9,10.5 3,10.5 1,4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "circle":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case "curve":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <path d="M1 9C3 3 9 9 11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "star":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <polygon points="6,0.5 7.7,4 11.5,4.6 8.7,7.3 9.4,11.1 6,9.3 2.6,11.1 3.3,7.3 0.5,4.6 4.3,4" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      );
    case "shape3d":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <path d="M6 0.5L10.5 3V9L6 11.5L1.5 9V3L6 0.5Z" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <path d="M6 0.5V11.5M1.5 3L6 6L10.5 3" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "brush":
    case "pencil":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="layer-panel__icon">
          <path d="M9.5 1.5L10.5 2.5L3.5 9.5H2.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    default:
      return null;
  }
};

const LayerItem: React.FC<{
  node: CanvasNode;
  nodes: NodesById;
  selectedNodeIds: Set<NodeId>;
  depth?: number;
}> = ({ node, nodes, selectedNodeIds, depth = 0 }) => {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const updateNodeName = useCanvasStore((s) => s.updateNodeName);
  const toggleNodeVisibility = useCanvasStore((s) => s.toggleNodeVisibility);
  const toggleNodeLock = useCanvasStore((s) => s.toggleNodeLock);

  const [collapsed, setCollapsed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameText, setNameText] = useState(node.name);

  const isSelected = selectedNodeIds.has(node.id);
  const isHidden = node.visible === false;
  const isLocked = node.locked === true;
  const isGroup = node.type === "group" && node.children && node.children.length > 0;

  const childNodes = isGroup
    ? node
        .children!.map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => n !== undefined)
        .sort((a, b) => b.order - a.order)
    : [];

  return (
    <div className={`layer-panel__item-wrapper ${isHidden ? "layer-panel__item-wrapper--hidden" : ""}`}>
      <button
        className={`layer-panel__item ${isSelected ? "layer-panel__item--selected" : ""} ${isLocked ? "layer-panel__item--locked" : ""}`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onClick={(e) => {
          if (!isLocked) {
            selectNode(node.id, e.shiftKey);
          }
        }}
      >
        {isGroup && (
          <span
            className="layer-panel__expand-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
          >
            {collapsed ? "▶" : "▼"}
          </span>
        )}
        <IconForType type={node.type} />
        {isEditingName ? (
          <input
            type="text"
            className="layer-panel__name-input"
            value={nameText}
            autoFocus
            onChange={(e) => setNameText(e.target.value)}
            onBlur={() => {
              if (nameText.trim()) updateNodeName(node.id, nameText.trim());
              setIsEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (nameText.trim()) updateNodeName(node.id, nameText.trim());
                setIsEditingName(false);
              } else if (e.key === "Escape") {
                setNameText(node.name);
                setIsEditingName(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="layer-panel__name"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
            title="Double-click to rename"
          >
            {node.name}
          </span>
        )}

        {/* Lock & Visibility Action Buttons */}
        <div className="layer-panel__actions">
          <span
            className={`layer-panel__action-btn ${isLocked ? "layer-panel__action-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeLock(node.id);
            }}
            title={isLocked ? "Unlock element" : "Lock element"}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              {isLocked ? (
                <path d="M4 7V4a4 4 0 1 1 8 0v3h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm2 0h4V4a2 2 0 1 0-4 0v3z" fill="currentColor" />
              ) : (
                <path d="M4 7V4a4 4 0 1 1 8 0h-1.5a2.5 2.5 0 1 0-5 0v3h7a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1z" fill="currentColor" opacity="0.4" />
              )}
            </svg>
          </span>
          <span
            className={`layer-panel__action-btn ${isHidden ? "layer-panel__action-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeVisibility(node.id);
            }}
            title={isHidden ? "Show element" : "Hide element"}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              {isHidden ? (
                <path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5zm0 8.5C6.1 11.5 4.5 9.9 4.5 8S6.1 4.5 8 4.5 11.5 6.1 11.5 8 9.9 11.5 8 11.5z" fill="currentColor" opacity="0.3" />
              ) : (
                <path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5zm0 8.5C6.1 11.5 4.5 9.9 4.5 8S6.1 4.5 8 4.5 11.5 6.1 11.5 8 9.9 11.5 8 11.5zm0-5.5C6.6 6 5.5 7.1 5.5 8.5S6.6 11 8 11s2.5-1.1 2.5-2.5S9.4 6 8 6z" fill="currentColor" />
              )}
            </svg>
          </span>
        </div>
      </button>

      {isGroup && !collapsed && (
        <div className="layer-panel__children">
          {childNodes.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              nodes={nodes}
              selectedNodeIds={selectedNodeIds}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayerPanel: React.FC = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);

  const topLevelNodes = Object.values(nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => b.order - a.order);

  return (
    <div className="layer-panel">
      <div className="layer-panel__header">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L1 5L8 9L15 5L8 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M1 8L8 12L15 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 11L8 15L15 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Layers</span>
      </div>

      <div className="layer-panel__list">
        {topLevelNodes.length === 0 ? (
          <div className="layer-panel__empty">
            No elements yet.
            <br />
            Select a tool to add shapes, text, images, or lines.
          </div>
        ) : (
          topLevelNodes.map((node) => (
            <LayerItem
              key={node.id}
              node={node}
              nodes={nodes}
              selectedNodeIds={selectedNodeIds}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
