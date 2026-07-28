import React from "react";
import type { CanvasNode } from "../types/canvas";

interface Props {
  node: CanvasNode;
}

/**
 * Renders a single rectangle as an SVG <rect>.
 * All pointer events bubble up to Canvas — this component is purely presentational.
 */
const RectangleNode: React.FC<Props> = React.memo(({ node }) => {
  const { geometry, style } = node;
  const { x, y, width, height, rotation } = geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Map border style to SVG stroke-dasharray
  let strokeDasharray: string | undefined;
  if (style.border) {
    switch (style.border.style) {
      case "dashed":
        strokeDasharray = `${style.border.width * 4} ${style.border.width * 2}`;
        break;
      case "dotted":
        strokeDasharray = `${style.border.width} ${style.border.width}`;
        break;
      default:
        strokeDasharray = undefined;
    }
  }

  return (
    <rect
      data-node-id={node.id}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={style.cornerRadius ?? 0}
      ry={style.cornerRadius ?? 0}
      fill={style.fill ?? "transparent"}
      fillOpacity={style.opacity}
      stroke={style.border?.color ?? "none"}
      strokeWidth={style.border?.width ?? 0}
      strokeDasharray={strokeDasharray}
      transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
      style={{ cursor: "move" }}
    />
  );
});

RectangleNode.displayName = "RectangleNode";

export default RectangleNode;
