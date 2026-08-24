import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

/**
 * Generates point coordinates string for a regular polygon with N sides centered inside bounding box.
 */
export function getPolygonPoints(width: number, height: number, sides: number): string {
  const n = Math.max(3, Math.min(30, sides));
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const points: string[] = [];
  // Start from top point (angle -PI/2)
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(" ");
}

export const PolygonNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const sides = style.sides ?? 5;
  const fill = style.fill ?? "#3B82F6";
  const stroke = style.border?.color ?? "none";
  const strokeWidth = style.border?.width ?? 0;
  const strokeDasharray =
    style.border?.style === "dashed"
      ? "6,6"
      : style.border?.style === "dotted"
      ? "2,2"
      : undefined;

  const pointsStr = getPolygonPoints(width, height, sides);

  const depth3d = style.depth3d ?? 0;
  const color3d = style.color3d ?? "#1E40AF";

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <g transform={`translate(${x}, ${y})`}>
        {/* Optional 3D Extrude Shadow Face */}
        {depth3d > 0 && (
          <polygon
            points={pointsStr}
            transform={`translate(${depth3d * 0.5}, ${depth3d * 0.5})`}
            fill={color3d}
            opacity={0.8}
            filter="brightness(0.7)"
          />
        )}

        {/* Main Polygon Shape */}
        <polygon
          data-node-id={node.id}
          points={pointsStr}
          fill={fill}
          stroke={stroke !== "none" ? stroke : undefined}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
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

PolygonNode.displayName = "PolygonNode";

export default PolygonNode;
