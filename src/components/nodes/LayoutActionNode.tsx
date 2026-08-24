import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";
import { resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
}

export const LayoutActionNode: React.FC<Props> = ({ node }) => {
  const resolvedStyle = resolveNodeStyle(node);
  const content = resolveNodeContent(node);

  // Local state for Play Mode interactions
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: resolvedStyle.fill || "#181826",
    borderRadius: resolvedStyle.cornerRadius ? `${resolvedStyle.cornerRadius}px` : "8px",
    border: resolvedStyle.border ? `${resolvedStyle.border.width}px ${resolvedStyle.border.style} ${resolvedStyle.border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: resolvedStyle.opacity ?? 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "8px 12px",
    color: "#e4e4f0",
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    userSelect: "none",
  };

  switch (node.type) {
    case "layoutContainer": {
      const items = content?.columns || ["Column A", "Column B", "Column C"];
      return (
        <div style={{ ...containerStyle, padding: 12, justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {content?.title || "Flex Grid Container"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8, flex: 1, marginTop: 8 }}>
            {items.map((col: string) => (
              <div key={col} style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 6, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0c0", fontSize: 11 }}>
                {col}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "layoutCarousel": {
      const slides = content?.slides || [
        { title: "Slide 1: Vision", bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
        { title: "Slide 2: Architecture", bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
        { title: "Slide 3: Deployment", bg: "linear-gradient(135deg, #10b981, #047857)" },
      ];
      const curSlide = slides[activeSlide % slides.length];

      return (
        <div style={{ ...containerStyle, padding: 0, position: "relative", background: curSlide.bg }}>
          {/* Slide Viewport */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: 20, textAlign: "center", color: "#fff" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{curSlide.title}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Swipe or click controls to navigate</div>
          </div>

          {/* Previous / Next Controls */}
          <div style={{ position: "absolute", inset: "0 8px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
            <button
              onClick={() => setActiveSlide((s) => (s === 0 ? slides.length - 1 : s - 1))}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >
              ◄
            </button>
            <button
              onClick={() => setActiveSlide((s) => (s + 1) % slides.length)}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >
              ►
            </button>
          </div>

          {/* Dots Indicator */}
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {slides.map((_: any, idx: number) => (
              <div
                key={idx}
                onClick={() => setActiveSlide(idx)}
                style={{ width: activeSlide === idx ? 16 : 6, height: 6, borderRadius: 3, background: activeSlide === idx ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s ease" }}
              />
            ))}
          </div>
        </div>
      );
    }

    case "actionMenu": {
      const items = content?.items || ["Edit Node", "Duplicate Item", "Export Code", "Delete Node"];
      return (
        <div style={{ ...containerStyle, padding: 0, position: "relative", overflow: "visible" }}>
          {/* Menu Trigger Button */}
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", width: "100%", height: "100%", boxSizing: "border-box", cursor: "pointer", fontWeight: 600 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span>{content?.title || "••• Actions"}</span>
            <span style={{ fontSize: 10, color: "#8888a8", transform: isMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>▼</span>
          </div>

          {/* Expanded Dropdown Item List */}
          {isMenuOpen && (
            <div style={{ position: "absolute", top: "105%", left: 0, right: 0, background: "#111827", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: 4, zIndex: 50, boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
              {items.map((item: string, idx: number) => (
                <div
                  key={item}
                  style={{ padding: "6px 10px", borderRadius: 4, fontSize: 11, color: idx === items.length - 1 ? "#f87171" : "#e4e4f0", cursor: "pointer" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
