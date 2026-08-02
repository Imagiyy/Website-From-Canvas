import React from "react";
import type { CanvasNode, NodesById, NodeId } from "../../types/canvas";
import { RectNode } from "./RectNode";
import { TextNode } from "./TextNode";
import { ImageNode } from "./ImageNode";
import { LineNode } from "./LineNode";
import { GroupNode } from "./GroupNode";
import { PolygonNode } from "./PolygonNode";
import { CircleNode } from "./CircleNode";
import { CurveNode } from "./CurveNode";
import { StarNode } from "./StarNode";
import { Shape3DNode } from "./Shape3DNode";
import { PathNode } from "./PathNode";

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
    case "polygon":
      return <PolygonNode node={node} />;
    case "circle":
      return <CircleNode node={node} />;
    case "curve":
      return <CurveNode node={node} />;
    case "star":
      return <StarNode node={node} />;
    case "shape3d":
      return <Shape3DNode node={node} />;
    case "brush":
    case "pencil":
      return <PathNode node={node} />;
    default:
      return null;
  }
});

NodeRenderer.displayName = "NodeRenderer";
