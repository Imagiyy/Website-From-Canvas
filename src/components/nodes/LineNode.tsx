import React from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

/**
 * Line element type:
 * Represented as (x, y) for start endpoint and (x + width, y + height) for end endpoint.
 * Note: width and height can be negative for lines drawn upwards or leftwards.
 * Rotation is not used for lines since (width, height) delta encodes line orientation.
 */
export const LineNode: React.FC<Props> = React.memo(({ node }) => {
  const { geometry, style } = node;
  const { x, y, width, height } = geometry;

  const x1 = x;
  const y1 = y;
  const x2 = x + width;
  const y2 = y + height;

  const strokeColor = style.border?.color ?? "#2563EB";
  const strokeWidth = style.border?.width ?? 2;

  let strokeDasharray: string | undefined;
  if (style.border) {
    switch (style.border.style) {
      case "dashed":
        strokeDasharray = `${strokeWidth * 4} ${strokeWidth * 2}`;
        break;
      case "dotted":
        strokeDasharray = `${strokeWidth} ${strokeWidth}`;
        break;
      default:
        strokeDasharray = undefined;
    }
  }

  return (
    <g data-node-id={node.id} style={{ cursor: "move" }}>
      {/* Invisible thick line stroke for easier pointer hit-testing */}
      <line
        data-node-id={node.id}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={Math.max(12, strokeWidth + 8)}
        strokeLinecap="round"
      />

      {/* Visible line stroke */}
      <line
        data-node-id={node.id}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={style.opacity}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        pointerEvents="none"
      />
    </g>
  );
});

LineNode.displayName = "LineNode";
