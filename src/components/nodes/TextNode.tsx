import React, { useRef, useEffect } from "react";
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

  const updateNodeContent = useCanvasStore((s) => s.updateNodeContent);
  const setEditingNode = useCanvasStore((s) => s.setEditingNode);

  const textValue = content?.kind === "text" ? content.text : "Text";
  const typo = style.typography ?? {
    fontFamily: "Inter, sans-serif",
    fontSize: 18,
    fontWeight: 400,
    color: "#E4E4F0",
    align: "left",
    lineHeight: 1.4,
  };

  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Select all text when entering edit mode
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const commitText = () => {
    if (editableRef.current) {
      const newText = editableRef.current.innerText.trim() || "Text";
      if (newText !== textValue) {
        updateNodeContent(node.id, { kind: "text", text: newText });
      }
    }
    setEditingNode(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitText();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingNode(null);
    }
  };

  return (
    <g
      transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}
    >
      <foreignObject
        data-node-id={node.id}
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ overflow: "visible", cursor: isEditing ? "text" : "move" }}
      >
        <div
          ref={editableRef}
          data-node-id={node.id}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingNode(node.id);
          }}
          onPointerDown={isEditing ? (e) => e.stopPropagation() : undefined}
          onBlur={commitText}
          onKeyDown={isEditing ? handleKeyDown : undefined}
          style={{
            width: "100%",
            height: "100%",
            fontFamily: typo.fontFamily,
            fontSize: `${typo.fontSize}px`,
            fontWeight: typo.fontWeight,
            color: typo.color,
            textAlign: typo.align,
            lineHeight: typo.lineHeight,
            opacity: style.opacity,
            outline: isEditing ? "1.5px solid #2563EB" : "none",
            outlineOffset: "2px",
            borderRadius: "2px",
            background: isEditing ? "rgba(15, 15, 26, 0.9)" : "transparent",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: isEditing ? "text" : "none",
            boxSizing: "border-box",
            padding: "2px 4px",
          }}
        >
          {textValue}
        </div>
      </foreignObject>
    </g>
  );
});

TextNode.displayName = "TextNode";
