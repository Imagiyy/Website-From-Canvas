import React from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

export const PathNode: React.FC<Props> = React.memo(({ node }) => {
  const { geometry, style, pathData } = node;
  const { x, y, width, height, rotation } = geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (!pathData) return null;

  const isPencil = node.type === "pencil";
  const strokeColor = style.border?.color ?? style.fill ?? "#3B82F6";
  const strokeWidth = style.brushSize ?? style.border?.width ?? (isPencil ? 2 : 12);
  const opacity = style.opacity ?? 1;

  const depth3d = style.depth3d ?? 0;
  const color3d = style.color3d ?? "#1E40AF";

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <g transform={`translate(${x}, ${y})`}>
        {/* Optional 3D Extrude Shadow Path */}
        {depth3d > 0 && (
          <path
            d={pathData}
            transform={`translate(${depth3d * 0.4}, ${depth3d * 0.4})`}
            fill="none"
            stroke={color3d}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity * 0.7}
          />
        )}

        {/* Main Freehand Stroke Path */}
        <path
          data-node-id={node.id}
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
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

PathNode.displayName = "PathNode";

export default PathNode;
