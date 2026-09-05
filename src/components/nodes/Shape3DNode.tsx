import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

import { getPolygonVertices } from "../../utils/shapeGeometry";

export const Shape3DNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const sides = style.sides ?? 4;
  const mainColor = style.fill ?? "#8B5CF6";
  const depth = style.depth3d ?? 30;
  const sideColor = style.color3d ?? "#6D28D9";
  const stroke = style.border?.color ?? "none";
  const strokeWidth = style.border?.width ?? 0;

  const dOffset = Math.max(8, depth * 0.35);
  const faceW = Math.max(20, width - dOffset);
  const faceH = Math.max(20, height - dOffset);

  const vertices = getPolygonVertices(faceW, faceH, sides);
  const topPolygonPoints = vertices.map((v) => `${v.x},${v.y}`).join(" ");

  // Generate extrude side faces with 3D lighting shading
  const n = vertices.length;
  const sideFaces = vertices.map((vA, i) => {
    const vB = vertices[(i + 1) % n];
    const quadPoints = `${vA.x},${vA.y} ${vB.x},${vB.y} ${vB.x + dOffset},${vB.y + dOffset} ${vA.x + dOffset},${vA.y + dOffset}`;

    // Shading factor based on face angle to simulate 3D light direction
    const angle = (i * 2 * Math.PI) / n;
    const shadeFactor = 0.5 + 0.4 * Math.sin(angle);
    return {
      id: i,
      points: quadPoints,
      shadeFactor,
    };
  });

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <g transform={`translate(${x}, ${y})`} data-node-id={node.id} style={{ cursor: "move", pointerEvents: "auto" }}>
        {/* Back / Extrude Side Faces */}
        {sideFaces.map((face) => (
          <polygon
            key={face.id}
            points={face.points}
            fill={sideColor}
            opacity={style.opacity}
            style={{
              filter: `brightness(${face.shadeFactor.toFixed(2)})`,
            }}
          />
        ))}

        {/* Back Shifted Base Polygon */}
        <polygon
          points={topPolygonPoints}
          transform={`translate(${dOffset}, ${dOffset})`}
          fill={sideColor}
          opacity={style.opacity * 0.7}
        />

        {/* Top / Front Main Polygon Face */}
        <polygon
          points={topPolygonPoints}
          fill={mainColor}
          stroke={stroke !== "none" ? stroke : undefined}
          strokeWidth={strokeWidth}
          opacity={style.opacity}
          filter={
            style.shadow
              ? `drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color})`
              : undefined
          }
        />
      </g>
    </g>
  );
});

Shape3DNode.displayName = "Shape3DNode";

export default Shape3DNode;
