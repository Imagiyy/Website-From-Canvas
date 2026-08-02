import React from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

export const CircleNode: React.FC<Props> = React.memo(({ node }) => {
  const { geometry, style } = node;
  const { x, y, width, height, rotation } = geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const fill = style.fill ?? "#10B981";
  const stroke = style.border?.color ?? "none";
  const strokeWidth = style.border?.width ?? 0;
  const strokeDasharray =
    style.border?.style === "dashed"
      ? "6,6"
      : style.border?.style === "dotted"
      ? "2,2"
      : undefined;

  const depth3d = style.depth3d ?? 0;
  const color3d = style.color3d ?? "#065F46";

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      {/* 3D Extrude Base */}
      {depth3d > 0 && (
        <ellipse
          cx={cx + depth3d * 0.4}
          cy={cy + depth3d * 0.4}
          rx={rx}
          ry={ry}
          fill={color3d}
          opacity={0.8}
        />
      )}

      {/* Main Ellipse / Circle */}
      <ellipse
        data-node-id={node.id}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
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
  );
});

CircleNode.displayName = "CircleNode";

export default CircleNode;
