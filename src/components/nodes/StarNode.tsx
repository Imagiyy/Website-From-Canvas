import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

import { getStarPoints } from "../../utils/shapeGeometry";

export const StarNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const pointsCount = style.starPoints ?? 5;
  const innerRatio = style.innerRadius ?? 0.5;
  const fill = style.fill ?? "#F59E0B";
  const stroke = style.border?.color ?? "none";
  const strokeWidth = style.border?.width ?? 0;

  const pointsStr = getStarPoints(width, height, pointsCount, innerRatio);
  const depth3d = style.depth3d ?? 0;
  const color3d = style.color3d ?? "#B45309";

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <g transform={`translate(${x}, ${y})`}>
        {depth3d > 0 && (
          <polygon
            points={pointsStr}
            transform={`translate(${depth3d * 0.4}, ${depth3d * 0.4})`}
            fill={color3d}
            opacity={0.8}
          />
        )}
        <polygon
          data-node-id={node.id}
          points={pointsStr}
          fill={fill}
          stroke={stroke !== "none" ? stroke : undefined}
          strokeWidth={strokeWidth}
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

StarNode.displayName = "StarNode";

export default StarNode;
