import React from "react";
import type { CanvasNode } from "../../types/canvas";
import { useCanvasStore } from "../../store/canvasStore";

interface Props {
  node: CanvasNode;
  isEditing?: boolean;
}

export const TextNode: React.FC<Props> = React.memo(({ node, isEditing = false }) => {
  const { geometry, style, content } = node;
  const { x, y, width, height, rotation } = geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const setEditingNode = useCanvasStore((s) => s.setEditingNode);

  const storeText = content?.kind === "text" ? content.text : "Text";

  const typo = style.typography ?? {
    fontFamily: "Inter, sans-serif",
    fontSize: 18,
    fontWeight: 400,
    color: "#E4E4F0",
    align: "left",
    lineHeight: 1.4,
  };

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
            opacity: isEditing ? 0 : style.opacity,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "none",
            boxSizing: "border-box",
            padding: "2px 4px",
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
