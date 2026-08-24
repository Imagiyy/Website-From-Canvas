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
import { FormControlsNode } from "./FormControlsNode";
import { NavWayfindingNode } from "./NavWayfindingNode";
import { DataDisplayNode } from "./DataDisplayNode";
import { FeedbackOverlayNode } from "./FeedbackOverlayNode";
import { LayoutActionNode } from "./LayoutActionNode";
import { PageSectionNode } from "./PageSectionNode";
import { EmbedNode } from "./EmbedNode";
import { IconNode } from "./IconNode";
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

  const renderForeignObjectNode = (n: CanvasNode, children: React.ReactNode) => {
    const { x, y, width, height, rotation } = n.geometry;
    const cx = x + width / 2;
    const cy = y + height / 2;

    return (
      <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
        <foreignObject
          data-node-id={n.id}
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ overflow: "visible", pointerEvents: "all" }}
        >
          <div data-node-id={n.id} style={{ width: "100%", height: "100%", position: "relative" }}>
            {children}
          </div>
        </foreignObject>
      </g>
    );
  };

  switch (node.type) {
    case "rectangle":
      return <RectNode node={node} nodes={nodes} />;
    case "text":
      return <TextNode node={node} nodes={nodes} isEditing={editingNodeId === node.id} />;
    case "image":
      return <ImageNode node={node} nodes={nodes} />;
    case "line":
      return <LineNode node={node} nodes={nodes} />;
    case "group":
      return <GroupNode node={node} nodes={nodes} editingNodeId={editingNodeId} />;
    case "polygon":
      return <PolygonNode node={node} nodes={nodes} />;
    case "circle":
      return <CircleNode node={node} nodes={nodes} />;
    case "curve":
      return <CurveNode node={node} nodes={nodes} />;
    case "star":
      return <StarNode node={node} nodes={nodes} />;
    case "shape3d":
      return <Shape3DNode node={node} nodes={nodes} />;
    case "brush":
    case "pencil":
    case "pen":
      return <PathNode node={node} nodes={nodes} />;

    case "formInput":
    case "formSelect":
    case "formCheckbox":
    case "formRadio":
    case "formSlider":
    case "formDatePicker":
    case "formColorPicker":
    case "formFileInput":
    case "formRating":
    case "formSignature":
    case "formMap":
    case "formSegmented":
    case "formRichText":
    case "formCodeEditor":
    case "formOtpPin":
    case "formCreditCard":
    case "formTagInput":
    case "formDualSlider":
    case "formVoiceRecorder":
    case "formAvatarUpload":
    case "formEmojiPicker":
    case "formStepper":
    case "formToggleGroup":
    case "formAccordion":
    case "formCaptcha":
    case "formGradientPicker":
    case "formCurrency":
    case "formTimeRange":
      return renderForeignObjectNode(node, <FormControlsNode node={node} />);

    case "navHeader":
    case "navSidebar":
    case "navBreadcrumb":
    case "navPagination":
    case "navTabs":
    case "navToc":
      return renderForeignObjectNode(node, <NavWayfindingNode node={node} />);

    case "dataCard":
    case "dataTable":
    case "dataList":
    case "dataBadge":
    case "dataAccordion":
    case "dataTooltip":
      return renderForeignObjectNode(node, <DataDisplayNode node={node} />);

    case "feedbackModal":
    case "feedbackToast":
    case "feedbackAlert":
    case "feedbackProgress":
    case "feedbackSkeleton":
    case "feedbackEmptyState":
      return renderForeignObjectNode(node, <FeedbackOverlayNode node={node} />);

    case "layoutContainer":
    case "layoutCarousel":
    case "mediaPlayer":
    case "layoutDivider":
    case "actionButton":
    case "actionMenu":
      return renderForeignObjectNode(node, <LayoutActionNode node={node} />);

    case "sectionHero":
    case "sectionPricing":
    case "sectionTestimonials":
    case "sectionTeam":
    case "sectionFeatures":
    case "sectionCTA":
    case "sectionFooter":
      return <PageSectionNode node={node} />;

    case "embedCode":
    case "embedIframe":
      return <EmbedNode node={node} nodes={nodes} />;

    case "iconElement":
      return <IconNode node={node} nodes={nodes} />;

    case "component":
    case "componentInstance": {
      const compDef = node.componentId ? components[node.componentId] : undefined;
      const masterNode = compDef ? nodes[compDef.sourceNodeId] : undefined;
      if (masterNode) {
        const resolved = resolveComponentInstance(node, masterNode);
        return <NodeRenderer node={resolved} nodes={nodes} editingNodeId={editingNodeId} />;
      }
      return <RectNode node={node} nodes={nodes} />;
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const targetProdId = prod?.id || "prod-1";
                  useEcommerceStore.getState().addToCart(targetProdId);
                  useEcommerceStore.getState().openCart();
                }}
                style={{ padding: "6px 12px", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                Add to Cart
              </button>
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
