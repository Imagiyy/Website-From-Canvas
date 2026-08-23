import React from "react";
import { BREAKPOINT_WIDTHS, type BreakpointKey } from "../types/canvas";
import { useCanvasStore } from "../store/canvasStore";

interface Props {
  activeBreakpoint: BreakpointKey;
  zoom: number;
}

/**
 * Visual device boundary frame on SVG canvas for Desktop, Tablet, and Mobile breakpoints.
 * Displays outer backdrop shading, crisp border outline, page header badge,
 * and an interactive bottom height resize handle to adjust exact website length.
 */
export const BreakpointFrame: React.FC<Props> = React.memo(({ activeBreakpoint, zoom }) => {
  const frameWidth = BREAKPOINT_WIDTHS[activeBreakpoint] ?? 1200;
  const pageHeights = useCanvasStore((s) => s.pageHeight);
  const frameHeight = pageHeights[activeBreakpoint] ?? 1200;
  const activePageId = useCanvasStore((s) => s.activePageId);
  const pages = useCanvasStore((s) => s.pages);
  const activePage = pages[activePageId];
  const pageBg = activePage?.backgroundColor || "transparent";

  const strokeWidth = 1.5 / zoom;
  const dashArray = `${6 / zoom} ${4 / zoom}`;

  const frameX = 0;
  const frameY = 0;

  const title =
    activeBreakpoint === "desktop"
      ? "DESKTOP VIEW (1200px)"
      : activeBreakpoint === "tablet"
      ? "TABLET VIEW (768px)"
      : "MOBILE VIEW (375px)";

  return (
    <g className="breakpoint-frame">
      {/* Website Page Background Fill */}
      {pageBg !== "transparent" && (
        <rect
          x={frameX}
          y={frameY}
          width={frameWidth}
          height={frameHeight}
          fill={pageBg}
          pointerEvents="none"
        />
      )}

      {/* Outer Left Backdrop */}
      <rect
        x={frameX - 5000}
        y={frameY - 2000}
        width={5000}
        height={10000}
        fill="rgba(0, 0, 0, 0.45)"
        pointerEvents="none"
      />

      {/* Outer Right Backdrop */}
      <rect
        x={frameX + frameWidth}
        y={frameY - 2000}
        width={5000}
        height={10000}
        fill="rgba(0, 0, 0, 0.45)"
        pointerEvents="none"
      />

      {/* Outer Top Backdrop */}
      <rect
        x={frameX}
        y={frameY - 2000}
        width={frameWidth}
        height={2000}
        fill="rgba(0, 0, 0, 0.45)"
        pointerEvents="none"
      />

      {/* Outer Bottom Backdrop (Below Website Page Height) */}
      <rect
        x={frameX}
        y={frameY + frameHeight}
        width={frameWidth}
        height={8000}
        fill="rgba(0, 0, 0, 0.45)"
        pointerEvents="none"
      />

      {/* Breakpoint Frame Border */}
      <rect
        x={frameX}
        y={frameY}
        width={frameWidth}
        height={frameHeight}
        fill="none"
        stroke="#2563EB"
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        pointerEvents="none"
      />

      {/* Device Header Label Badge */}
      <g transform={`translate(${frameX + frameWidth / 2}, ${frameY - 14 / zoom})`} pointerEvents="none">
        <rect
          x={-85 / zoom}
          y={-14 / zoom}
          width={170 / zoom}
          height={24 / zoom}
          rx={4 / zoom}
          fill="#2563EB"
        />
        <text
          x={0}
          y={2 / zoom}
          fill="white"
          fontSize={11 / zoom}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {title}
        </text>
      </g>

      {/* Interactive Bottom Page Height Handle Bar */}
      <g transform={`translate(${frameX + frameWidth / 2}, ${frameY + frameHeight})`}>
        <rect
          data-handle="page-height"
          x={-110 / zoom}
          y={-12 / zoom}
          width={220 / zoom}
          height={24 / zoom}
          rx={12 / zoom}
          fill="#2563EB"
          stroke="white"
          strokeWidth={1 / zoom}
          style={{ cursor: "ns-resize" }}
        />
        <text
          x={0}
          y={1 / zoom}
          fill="white"
          fontSize={11 / zoom}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          ↕ Page Height ({frameHeight}px)
        </text>
      </g>
    </g>
  );
});

BreakpointFrame.displayName = "BreakpointFrame";

export default BreakpointFrame;
