import React from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { useCanvasStore } from "../../store/canvasStore";
import { resolveNodeBox, resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
  isEditing?: boolean;
}

export const TextNode: React.FC<Props> = React.memo(({ node, nodes = {}, isEditing = false }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const resolvedContent = resolveNodeContent(node);
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const setEditingNode = useCanvasStore((s) => s.setEditingNode);

  const storeText = resolvedContent.text || "Text";
  const typo = style.typography!;

  const backgroundStyle = style.gradient
    ? `linear-gradient(${style.gradient.angle ?? 135}deg, ${style.gradient.startColor}, ${style.gradient.endColor})`
    : style.fill && style.fill !== "transparent"
    ? style.fill
    : undefined;

  const borderStyle =
    style.border && style.border.width > 0
      ? `${style.border.width}px ${style.border.style ?? "solid"} ${style.border.color ?? "#2563EB"}`
      : undefined;

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <foreignObject
        data-node-id={node.id}
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          overflow: "visible",
          cursor: isEditing ? "text" : "move",
          pointerEvents: isEditing ? "none" : "auto",
        }}
      >
        <div
          data-node-id={node.id}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingNode(node.id);
          }}
          style={{
            width: "100%",
            height: "100%",
            fontFamily: typo.fontFamily,
            fontSize: `${typo.fontSize}px`,
            fontWeight: typo.fontWeight,
            color: typo.color,
            textAlign: typo.align,
            lineHeight: typo.lineHeight,
            letterSpacing: typo.letterSpacing ? `${typo.letterSpacing}px` : undefined,
            textTransform: typo.textTransform ?? "none",
            textDecoration: typo.textDecoration ?? "none",
            background: backgroundStyle,
            backgroundColor: !style.gradient && style.fill && style.fill !== "transparent" ? style.fill : undefined,
            borderRadius: style.cornerRadius ? `${style.cornerRadius}px` : undefined,
            border: borderStyle,
            opacity: isEditing ? 0 : style.opacity,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "none",
            boxSizing: "border-box",
            padding: "4px 8px",
            filter: style.shadow
              ? `drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color})`
              : undefined,
          }}
        >
          {storeText}
        </div>
      </foreignObject>
    </g>
  );
});

TextNode.displayName = "TextNode";

export default TextNode;
