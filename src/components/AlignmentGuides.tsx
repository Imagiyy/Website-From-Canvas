import React from "react";
import type { AlignmentGuide } from "../types/canvas";

interface Props {
  guides: AlignmentGuide[];
  zoom: number;
}

/**
 * Renders active smart alignment guide lines (magenta/pink) on the SVG canvas.
 * Lines are scaled inversely by zoom so they stay crisp and 1px wide on screen.
 */
export const AlignmentGuides: React.FC<Props> = React.memo(({ guides, zoom }) => {
  if (guides.length === 0) return null;

  const strokeWidth = 1 / zoom;
  const dashArray = `${4 / zoom} ${3 / zoom}`;
  const color = "#FF007A";

  return (
    <g className="alignment-guides" pointerEvents="none">
      {guides.map((guide) => {
        if (guide.type === "vertical") {
          return (
            <g key={guide.id}>
              <line
                x1={guide.position}
                y1={guide.start}
                x2={guide.position}
                y2={guide.end}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
              />
            </g>
          );
        } else {
          return (
            <g key={guide.id}>
              <line
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
              />
            </g>
          );
        }
      })}
    </g>
  );
});

AlignmentGuides.displayName = "AlignmentGuides";

export default AlignmentGuides;
