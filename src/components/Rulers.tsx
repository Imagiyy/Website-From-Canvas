import React from "react";
import type { Viewport } from "../types/canvas";
import "./Rulers.css";

interface Props {
  viewport: Viewport;
  mouseCanvasPos: { x: number; y: number };
  visible: boolean;
}

export const Rulers: React.FC<Props> = React.memo(({ viewport, mouseCanvasPos, visible }) => {
  if (!visible) return null;

  const { panX, panY, zoom } = viewport;
  const zoomPercent = Math.round(zoom * 100);

  // Dynamic tick step based on zoom level
  let majorStep = 100;
  if (zoom >= 2) majorStep = 50;
  if (zoom >= 4) majorStep = 20;
  if (zoom <= 0.5) majorStep = 200;
  if (zoom <= 0.25) majorStep = 500;

  const minorStep = majorStep / 5;

  // Viewport bounds in canvas space
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const startX = Math.floor((-panX / zoom) / majorStep) * majorStep - majorStep;
  const endX = Math.ceil(((screenW - panX) / zoom) / majorStep) * majorStep + majorStep;

  const startY = Math.floor((-panY / zoom) / majorStep) * majorStep - majorStep;
  const endY = Math.ceil(((screenH - panY) / zoom) / majorStep) * majorStep + majorStep;

  // Generate top ruler ticks
  const topTicks: React.ReactNode[] = [];
  for (let x = startX; x <= endX; x += minorStep) {
    const screenX = x * zoom + panX;
    if (screenX < 0 || screenX > screenW) continue;

    const isMajor = Math.abs(x % majorStep) < 0.01;
    const tickH = isMajor ? 12 : 6;

    topTicks.push(
      <line
        key={`top-tick-${x}`}
        x1={screenX}
        y1={24 - tickH}
        x2={screenX}
        y2={24}
        className={`ruler-tick ${isMajor ? "ruler-tick--major" : ""}`}
      />
    );

    if (isMajor) {
      topTicks.push(
        <text
          key={`top-txt-${x}`}
          x={screenX + 3}
          y={11}
          className="ruler-text"
        >
          {Math.round(x)}
        </text>
      );
    }
  }

  // Generate left ruler ticks
  const leftTicks: React.ReactNode[] = [];
  for (let y = startY; y <= endY; y += minorStep) {
    const screenY = y * zoom + panY;
    if (screenY < 0 || screenY > screenH) continue;

    const isMajor = Math.abs(y % majorStep) < 0.01;
    const tickW = isMajor ? 12 : 6;

    leftTicks.push(
      <line
        key={`left-tick-${y}`}
        x1={24 - tickW}
        y1={screenY}
        x2={24}
        y2={screenY}
        className={`ruler-tick ${isMajor ? "ruler-tick--major" : ""}`}
      />
    );

    if (isMajor) {
      leftTicks.push(
        <text
          key={`left-txt-${y}`}
          x={2}
          y={screenY - 3}
          className="ruler-text"
          transform={`rotate(-90 2 ${screenY - 3})`}
        >
          {Math.round(y)}
        </text>
      );
    }
  }

  // Mouse cursor indicator lines
  const mouseScreenX = mouseCanvasPos.x * zoom + panX;
  const mouseScreenY = mouseCanvasPos.y * zoom + panY;

  return (
    <div className="rulers-container">
      {/* Corner box */}
      <div className="rulers-corner" title={`Zoom: ${zoomPercent}%`}>
        {zoomPercent}%
      </div>

      {/* Top Ruler */}
      <div className="ruler-top">
        <svg className="ruler-svg">
          {topTicks}
          <line
            x1={mouseScreenX}
            y1={0}
            x2={mouseScreenX}
            y2={24}
            className="ruler-guide-indicator"
          />
        </svg>
      </div>

      {/* Left Ruler */}
      <div className="ruler-left">
        <svg className="ruler-svg">
          {leftTicks}
          <line
            x1={0}
            y1={mouseScreenY}
            x2={24}
            y2={mouseScreenY}
            className="ruler-guide-indicator"
          />
        </svg>
      </div>
    </div>
  );
});

Rulers.displayName = "Rulers";

export default Rulers;
