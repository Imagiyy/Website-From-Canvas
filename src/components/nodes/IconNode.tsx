import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

export const IconNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const iconColor = node.iconData?.iconColor || style.fill || "#e4e4f0";
  const svgPath = node.iconData?.svgPath || "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5";

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <foreignObject data-node-id={node.id} x={x} y={y} width={width} height={height} style={{ overflow: "visible" }}>
        <div data-node-id={node.id} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            viewBox="0 0 24 24"
            width={Math.min(width, height) * 0.8}
            height={Math.min(width, height) * 0.8}
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={svgPath} />
          </svg>
        </div>
      </foreignObject>
    </g>
  );
});

IconNode.displayName = "IconNode";
