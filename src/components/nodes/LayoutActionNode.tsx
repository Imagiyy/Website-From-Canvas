import React, { useState } from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

export const LayoutActionNode: React.FC<Props> = ({ node }) => {
  const { fill, cornerRadius, border, opacity } = node.style;
  const content = node.content as any;

  // Local state for Play Mode interactions
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: fill || "#181826",
    borderRadius: cornerRadius ? `${cornerRadius}px` : "8px",
    border: border ? `${border.width}px ${border.style} ${border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: opacity ?? 1,
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

    case "mediaPlayer": {
      return (
        <div style={{ ...containerStyle, padding: 0, position: "relative", background: "#09090e" }}>
          {/* Video Preview Canvas */}
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: isPlaying ? "#ef4444" : "#3b82f6", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginTop: 8, zIndex: 2 }}>{content?.title || "Demo Video Stream.mp4"}</div>
          </div>

          {/* Player Timeline Bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 12px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#a0a0c0" }}>
            <span>{isPlaying ? "01:24" : "00:00"}</span>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, position: "relative" }}>
              <div style={{ width: isPlaying ? "35%" : "0%", height: "100%", background: "#3b82f6", borderRadius: 2 }} />
            </div>
            <span>04:30</span>
            <span>🔊</span>
            <span>⛶</span>
          </div>
        </div>
      );
    }

    case "layoutDivider": {
      const label = content?.label || "SECTION DIVIDER";
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: 0 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#666688", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
        </div>
      );
    }

    case "actionButton": {
      const variant = content?.variant || "primary";
      const isFab = variant === "fab";
      const isGhost = variant === "ghost";

      const btnBg = isFab
        ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
        : isGhost
        ? "transparent"
        : variant === "secondary"
        ? "rgba(255,255,255,0.05)"
        : "linear-gradient(135deg, #3b82f6, #1d4ed8)";

      const btnBorder = isGhost ? "1px dashed rgba(255,255,255,0.2)" : variant === "secondary" ? "1px solid rgba(255,255,255,0.2)" : "none";

      return (
        <div
          style={{
            ...containerStyle,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            background: btnBg,
            border: btnBorder,
            borderRadius: isFab ? "50%" : cornerRadius ? `${cornerRadius}px` : "8px",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: isFab ? "0 4px 14px rgba(236,72,153,0.4)" : "none",
          }}
        >
          {isFab ? <span style={{ fontSize: 20 }}>+</span> : <span>{node.name || "Primary Action"}</span>}
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
