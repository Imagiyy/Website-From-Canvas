import React, { useState } from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { useCanvasStore } from "../../store/canvasStore";
import { resolveNodeBox, resolveNodeStyle } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

export const ImageNode: React.FC<Props> = React.memo(({ node, nodes = {} }) => {
  const box = resolveNodeBox(node, nodes);
  const style = resolveNodeStyle(node);
  const { content } = node;
  const { relativeX: x, relativeY: y, width, height, rotation } = box;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const updateImageFit = useCanvasStore((s) => s.updateImageFit);

  const [showFitMenu, setShowFitMenu] = useState(false);

  const imageContent = content?.kind === "image" ? content : {
    kind: "image" as const,
    assetUrl: "",
    fit: "cover" as const,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFitMenu((prev) => !prev);
  };

  const setFit = (fit: "cover" | "contain" | "fill") => {
    updateImageFit(node.id, fit);
    setShowFitMenu(false);
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
        onContextMenu={handleContextMenu}
        style={{ overflow: "visible", cursor: "move" }}
      >
        <div
          data-node-id={node.id}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            opacity: style.opacity,
            borderRadius: `${style.cornerRadius ?? 0}px`,
            overflow: "hidden",
            filter: [
              style.shadow ? `drop-shadow(${style.shadow.x}px ${style.shadow.y}px ${style.shadow.blur}px ${style.shadow.color})` : "",
              node.imageFilters?.brightness !== undefined ? `brightness(${node.imageFilters.brightness}%)` : "",
              node.imageFilters?.contrast !== undefined ? `contrast(${node.imageFilters.contrast}%)` : "",
              node.imageFilters?.saturation !== undefined ? `saturate(${node.imageFilters.saturation}%)` : "",
              node.imageFilters?.blur !== undefined ? `blur(${node.imageFilters.blur}px)` : "",
              node.imageFilters?.grayscale !== undefined ? `grayscale(${node.imageFilters.grayscale}%)` : "",
              node.imageFilters?.sepia !== undefined ? `sepia(${node.imageFilters.sepia}%)` : "",
              node.imageFilters?.hueRotate !== undefined ? `hue-rotate(${node.imageFilters.hueRotate}deg)` : "",
            ].filter(Boolean).join(" ") || undefined,
          }}
        >
          {imageContent.assetUrl ? (
            <img
              data-node-id={node.id}
              src={imageContent.assetUrl}
              alt={node.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: imageContent.fit,
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div
              data-node-id={node.id}
              style={{
                width: "100%",
                height: "100%",
                background: "#2A2A4A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8888A8",
                fontSize: "12px",
              }}
            >
              No Image
            </div>
          )}

          {/* Quick Fit Selector Overlay on Right Click */}
          {showFitMenu && (
            <div
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "#16162A",
                border: "1px solid #2A2A4A",
                borderRadius: 4,
                padding: 4,
                display: "flex",
                gap: 4,
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(["cover", "contain", "fill"] as const).map((fitMode) => (
                <button
                  key={fitMode}
                  onClick={() => setFit(fitMode)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "10px",
                    background: imageContent.fit === fitMode ? "#2563EB" : "transparent",
                    color: imageContent.fit === fitMode ? "#FFF" : "#8888A8",
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {fitMode}
                </button>
              ))}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
});

ImageNode.displayName = "ImageNode";
