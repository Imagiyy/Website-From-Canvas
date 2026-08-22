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
import { useComponentStore, resolveComponentInstance } from "../../store/componentStore";
import { useEcommerceStore } from "../../store/ecommerceStore";

interface Props {
  node: CanvasNode;
  nodes: NodesById;
  editingNodeId?: NodeId | null;
}

export const NodeRenderer: React.FC<Props> = React.memo(({ node, nodes, editingNodeId }) => {
  const components = useComponentStore((s) => s.components);
  const products = useEcommerceStore((s) => s.products);

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
    case "pen":
      return <PathNode node={node} />;

    case "component":
    case "componentInstance": {
      const compDef = node.componentId ? components[node.componentId] : undefined;
      const masterNode = compDef ? nodes[compDef.sourceNodeId] : undefined;
      if (masterNode) {
        const resolved = resolveComponentInstance(node, masterNode);
        return <NodeRenderer node={resolved} nodes={nodes} editingNodeId={editingNodeId} />;
      }
      return <RectNode node={node} />;
    }

    case "product": {
      const prod = node.productId ? products.find((p) => p.id === node.productId) : undefined;
      const title = prod?.name || node.name || "Product";
      const price = prod ? `$${prod.price.toFixed(2)}` : "$49.99";
      const { x, y, width, height, rotation } = node.geometry;
      const cx = x + width / 2;
      const cy = y + height / 2;

      return (
        <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
          <foreignObject data-node-id={node.id} x={x} y={y} width={width} height={height} style={{ overflow: "visible" }}>
            <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", color: "#e4e4f0" }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{price}</div>
              <button style={{ padding: "4px 8px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>Add to Cart</button>
            </div>
          </foreignObject>
        </g>
      );
    }

    default:
      return <RectNode node={node} />;
  }
});

NodeRenderer.displayName = "NodeRenderer";
