import React from "react";
import { BREAKPOINT_WIDTHS, type BreakpointKey } from "../types/canvas";

interface Props {
  activeBreakpoint: BreakpointKey;
  zoom: number;
}

/**
 * Visual device boundary frame on SVG canvas when viewing Tablet (768px) or Mobile (375px) breakpoints.
 * Displays backdrop shading outside the frame, crisp outline border, and device label header badge.
 */
export const BreakpointFrame: React.FC<Props> = React.memo(({ activeBreakpoint, zoom }) => {
  const frameWidth = BREAKPOINT_WIDTHS[activeBreakpoint];
  if (!frameWidth) return null;

  const strokeWidth = 1.5 / zoom;
  const dashArray = `${6 / zoom} ${4 / zoom}`;

  const frameX = 0;
  const frameY = 0;
  const frameHeight = 2000; // Deep canvas height for responsive view

  const title = activeBreakpoint === "tablet" ? "TABLET VIEW (768px)" : "MOBILE VIEW (375px)";

  return (
    <g className="breakpoint-frame" pointerEvents="none">
      {/* Outer Left Backdrop */}
      <rect
        x={frameX - 4000}
        y={frameY - 2000}
        width={4000}
        height={8000}
        fill="rgba(0, 0, 0, 0.4)"
      />

      {/* Outer Right Backdrop */}
      <rect
        x={frameX + frameWidth}
        y={frameY - 2000}
        width={4000}
        height={8000}
        fill="rgba(0, 0, 0, 0.4)"
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
      />

      {/* Device Header Label Badge */}
      <g transform={`translate(${frameX + frameWidth / 2}, ${frameY - 14 / zoom})`}>
        <rect
          x={-75 / zoom}
          y={-14 / zoom}
          width={150 / zoom}
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
    </g>
  );
});

BreakpointFrame.displayName = "BreakpointFrame";

export default BreakpointFrame;
