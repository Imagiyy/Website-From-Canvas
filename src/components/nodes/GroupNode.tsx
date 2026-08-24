import React from "react";
import type { CanvasNode, NodesById, NodeId } from "../../types/canvas";
import { NodeRenderer } from "./NodeRenderer";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes: NodesById;
  editingNodeId?: NodeId | null;
}

export const GroupNode: React.FC<Props> = React.memo(({ node, nodes, editingNodeId }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const children = node.children || [];
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Sort children by order ascending
  const childNodes = children
    .map((cId) => nodes[cId])
    .filter((n): n is CanvasNode => n !== undefined)
    .sort((a, b) => a.order - b.order);

  return (
    <g
      data-node-id={node.id}
      transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
      style={{ opacity: style.opacity }}
    >
      {/* Invisible bounding rect hit target for group selection */}
      <rect
        data-node-id={node.id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        stroke="none"
        style={{ cursor: "move" }}
      />

      {/* Render group children */}
      {childNodes.map((child) => (
        <NodeRenderer
          key={child.id}
          node={child}
          nodes={nodes}
          editingNodeId={editingNodeId}
        />
      ))}
    </g>
  );
});

GroupNode.displayName = "GroupNode";
