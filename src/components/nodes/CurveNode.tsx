import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

export const CurveNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const curvature = style.curvature ?? 50;
  const stroke = style.border?.color ?? style.fill ?? "#EC4899";
  const strokeWidth = Math.max(2, style.border?.width ?? 4);

  // Calculate S-curve or Arch path relative to (width, height)
  const curveDepth = (curvature / 100) * (height / 2);
  const pathD = `M 0,${height / 2} C ${width * 0.25},${height / 2 - curveDepth} ${width * 0.75},${height / 2 + curveDepth} ${width},${height / 2}`;

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <g transform={`translate(${x}, ${y})`}>
        <path
          data-node-id={node.id}
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={style.opacity}
          filter={
            style.shadow
              ? `drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color})`
              : undefined
          }
          style={{ cursor: "move", pointerEvents: "auto" }}
        />
      </g>
    </g>
  );
});

CurveNode.displayName = "CurveNode";

export default CurveNode;
