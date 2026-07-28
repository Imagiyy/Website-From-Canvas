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
  }
};

const LayerItem: React.FC<{
  node: CanvasNode;
  nodes: NodesById;
  selectedNodeIds: Set<NodeId>;
  depth?: number;
}> = ({ node, nodes, selectedNodeIds, depth = 0 }) => {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const [collapsed, setCollapsed] = useState(false);

  const isSelected = selectedNodeIds.has(node.id);
  const isGroup = node.type === "group" && node.children && node.children.length > 0;

  const childNodes = isGroup
    ? node
        .children!.map((cId) => nodes[cId])
        .filter((n): n is CanvasNode => n !== undefined)
        .sort((a, b) => b.order - a.order)
    : [];

  return (
    <div className="layer-panel__item-wrapper">
      <button
        className={`layer-panel__item ${isSelected ? "layer-panel__item--selected" : ""}`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onClick={(e) => selectNode(node.id, e.shiftKey)}
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
        <span className="layer-panel__name">{node.name}</span>
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

  // Render top-level nodes (parentId === null), sorted by order descending (front to back)
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
