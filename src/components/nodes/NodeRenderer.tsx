import React from "react";
import type { CanvasNode, NodesById, NodeId } from "../../types/canvas";
import { RectNode } from "./RectNode";
import { TextNode } from "./TextNode";
import { ImageNode } from "./ImageNode";
import { LineNode } from "./LineNode";
import { GroupNode } from "./GroupNode";

interface Props {
  node: CanvasNode;
  nodes: NodesById;
  editingNodeId?: NodeId | null;
}

export const NodeRenderer: React.FC<Props> = React.memo(({ node, nodes, editingNodeId }) => {
  switch (node.type) {
    case "rectangle":
      return <RectNode node={node} />;
    case "text":
      return <TextNode node={node} isEditing={editingNodeId === node.id} />;
    case "image":
      return <ImageNode node={node} />;
    case "line":
      return <LineNode node={node} />;
    case "group":
      return <GroupNode node={node} nodes={nodes} editingNodeId={editingNodeId} />;
    default:
      return null;
  }
});

NodeRenderer.displayName = "NodeRenderer";
