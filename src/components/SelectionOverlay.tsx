import React from "react";
import type { CanvasNode, NodesById, NodeId } from "../types/canvas";

interface Props {
  selectedNodeIds: Set<NodeId>;
  nodes: NodesById;
  zoom: number;
}

/**
 * Renders selection handles and bounding box outlines:
 * - Single selected Line: Renders 2 endpoint handles ('start' and 'end') without rotation handle.
 *   Explanation: Lines represent a vector between two explicit points (x, y) and (x+width, y+height)
 *   rather than a standard rectangle bounding box. Dragging either endpoint modifies length and angle directly,
 *   so 8-handle bounding box resizing and separate rotation handles do not apply to lines.
 * - Single selected Node (Rect/Text/Image/Group): Renders 8 resize handles + 1 rotate handle.
 * - Multi-selected Nodes: Renders a bounding box around all selected nodes with outline and 8 resize handles.
 */
export const SelectionOverlay: React.FC<Props> = React.memo(({ selectedNodeIds, nodes, zoom }) => {
  if (selectedNodeIds.size === 0) return null;

  // Handle sizes in canvas space (constant pixel size on screen)
  const hs = 8 / zoom;
  const half = hs / 2;
  const rotateOffset = 24 / zoom;
  const outlineWidth = 1.5 / zoom;
  const handleStrokeWidth = 1 / zoom;
  const rotateLineWidth = 1 / zoom;

  const selectedList = Array.from(selectedNodeIds)
    .map((id) => nodes[id])
    .filter((n): n is CanvasNode => n !== undefined);

  if (selectedList.length === 0) return null;

  // -------------------------------------------------------------------------
  // Case 1: Single Line Selected
  // -------------------------------------------------------------------------
  if (selectedList.length === 1 && selectedList[0].type === "line") {
    const line = selectedList[0];
    const x1 = line.geometry.x;
    const y1 = line.geometry.y;
    const x2 = line.geometry.x + line.geometry.width;
    const y2 = line.geometry.y + line.geometry.height;

    return (
      <g>
        {/* Line selection outline */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#2563EB"
          strokeWidth={outlineWidth * 1.5}
          strokeDasharray={`${4 / zoom} ${3 / zoom}`}
          pointerEvents="none"
        />

        {/* Start endpoint handle */}
        <circle
          data-handle="line-start"
          cx={x1}
          cy={y1}
          r={half * 1.2}
          fill="white"
          stroke="#2563EB"
          strokeWidth={handleStrokeWidth}
          style={{ cursor: "move" }}
        />

        {/* End endpoint handle */}
        <circle
          data-handle="line-end"
          cx={x2}
          cy={y2}
          r={half * 1.2}
          fill="white"
          stroke="#2563EB"
          strokeWidth={handleStrokeWidth}
          style={{ cursor: "move" }}
        />
      </g>
    );
  }

  // -------------------------------------------------------------------------
  // Case 2: Single Node Selected (Rect / Text / Image / Group)
  // -------------------------------------------------------------------------
  if (selectedList.length === 1) {
    const node = selectedList[0];
    const { x, y, width, height, rotation } = node.geometry;
    const cx = x + width / 2;
    const cy = y + height / 2;

    const handles = [
      { id: "nw", hx: x, hy: y },
      { id: "n", hx: x + width / 2, hy: y },
      { id: "ne", hx: x + width, hy: y },
      { id: "e", hx: x + width, hy: y + height / 2 },
      { id: "se", hx: x + width, hy: y + height },
      { id: "s", hx: x + width / 2, hy: y + height },
      { id: "sw", hx: x, hy: y + height },
      { id: "w", hx: x, hy: y + height / 2 },
    ] as const;

    const handleCursors: Record<string, string> = {
      nw: "nwse-resize",
      n: "ns-resize",
      ne: "nesw-resize",
      e: "ew-resize",
      se: "nwse-resize",
      s: "ns-resize",
      sw: "nesw-resize",
      w: "ew-resize",
    };

    return (
      <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
        {/* Selection outline */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="#2563EB"
          strokeWidth={outlineWidth}
          strokeDasharray={node.type === "group" ? `${4 / zoom} ${3 / zoom}` : undefined}
          rx={node.style.cornerRadius ?? 0}
          ry={node.style.cornerRadius ?? 0}
          pointerEvents="none"
        />

        {/* Rotate handle line */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y - rotateOffset}
          stroke="#2563EB"
          strokeWidth={rotateLineWidth}
          pointerEvents="none"
        />

        {/* Rotate handle group with curved arrow icon */}
        <g
          data-handle="rotate"
          transform={`translate(${x + width / 2}, ${y - rotateOffset})`}
          style={{ cursor: "grab" }}
        >
          <circle
            r={half * 1.3}
            fill="white"
            stroke="#2563EB"
            strokeWidth={handleStrokeWidth}
          />
          <path
            d={`M ${-3 / zoom} ${-1 / zoom} A ${3.5 / zoom} ${3.5 / zoom} 0 1 1 ${3 / zoom} ${1 / zoom}`}
            fill="none"
            stroke="#2563EB"
            strokeWidth={1.2 / zoom}
            strokeLinecap="round"
            pointerEvents="none"
          />
          <polyline
            points={`${1 / zoom},${-2 / zoom} ${3 / zoom},${1 / zoom} ${4.5 / zoom},${-1 / zoom}`}
            fill="none"
            stroke="#2563EB"
            strokeWidth={1.2 / zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        </g>

        {/* Resize handles */}
        {handles.map(({ id, hx, hy }) => (
          <rect
            key={id}
            data-handle={id}
            x={hx - half}
            y={hy - half}
            width={hs}
            height={hs}
            fill="white"
            stroke="#2563EB"
            strokeWidth={handleStrokeWidth}
            style={{ cursor: handleCursors[id] }}
          />
        ))}
      </g>
    );
  }

  // -------------------------------------------------------------------------
  // Case 3: Multi-Selection (2+ nodes selected)
  // -------------------------------------------------------------------------
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedList.forEach((node) => {
    let x1 = node.geometry.x;
    let y1 = node.geometry.y;
    let x2 = node.geometry.x + node.geometry.width;
    let y2 = node.geometry.y + node.geometry.height;

    if (node.type === "line") {
      x2 = node.geometry.x + node.geometry.width;
      y2 = node.geometry.y + node.geometry.height;
      if (x1 > x2) [x1, x2] = [x2, x1];
      if (y1 > y2) [y1, y2] = [y2, y1];
    }

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const handles = [
    { id: "nw", hx: minX, hy: minY },
    { id: "n", hx: minX + width / 2, hy: minY },
    { id: "ne", hx: minX + width, hy: minY },
    { id: "e", hx: minX + width, hy: minY + height / 2 },
    { id: "se", hx: minX + width, hy: minY + height },
    { id: "s", hx: minX + width / 2, hy: minY + height },
    { id: "sw", hx: minX, hy: minY + height },
    { id: "w", hx: minX, hy: minY + height / 2 },
  ] as const;

  const handleCursors: Record<string, string> = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
  };

  return (
    <g>
      {/* Multi-selection bounding box */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="rgba(37, 99, 235, 0.05)"
        stroke="#2563EB"
        strokeWidth={outlineWidth}
        strokeDasharray={`${4 / zoom} ${3 / zoom}`}
        pointerEvents="none"
      />

      {/* Multi-selection resize handles */}
      {handles.map(({ id, hx, hy }) => (
        <rect
          key={id}
          data-handle={id}
          x={hx - half}
          y={hy - half}
          width={hs}
          height={hs}
          fill="white"
          stroke="#2563EB"
          strokeWidth={handleStrokeWidth}
          style={{ cursor: handleCursors[id] }}
        />
      ))}
    </g>
  );
});

SelectionOverlay.displayName = "SelectionOverlay";

export default SelectionOverlay;
