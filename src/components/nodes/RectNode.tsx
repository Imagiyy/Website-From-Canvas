import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

/**
 * Renders a single rectangle as an SVG <rect> with gradient support.
 */
export const RectNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

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

  const filterStyle = style.shadow
    ? `drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color})`
    : undefined;

  const grad = style.gradient;
  const gradId = `grad-${node.id}`;
  const angle = grad?.angle ?? 135;
  const angleRad = ((angle - 90) * Math.PI) / 180;
  const x1 = `${Math.round(50 + Math.cos(angleRad) * 50)}%`;
  const y1 = `${Math.round(50 + Math.sin(angleRad) * 50)}%`;
  const x2 = `${Math.round(50 - Math.cos(angleRad) * 50)}%`;
  const y2 = `${Math.round(50 - Math.sin(angleRad) * 50)}%`;

  return (
    <g>
      {grad && (
        <defs>
          <linearGradient id={gradId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0%" stopColor={grad.startColor} />
            <stop offset="100%" stopColor={grad.endColor} />
          </linearGradient>
        </defs>
      )}
      <rect
        data-node-id={node.id}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={style.cornerRadius ?? 0}
        ry={style.cornerRadius ?? 0}
        fill={grad ? `url(#${gradId})` : style.fill ?? "#E5E7EB"}
        fillOpacity={style.opacity}
        stroke={style.border?.color ?? "none"}
        strokeWidth={style.border?.width ?? 0}
        strokeDasharray={strokeDasharray}
        transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
        style={{ cursor: "move", filter: filterStyle }}
      />
    </g>
  );
});

RectNode.displayName = "RectNode";
