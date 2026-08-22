import React, { useState, useEffect } from "react";
import type { CanvasNode, TypographyStyle, Style, ShadowStyle } from "../types/canvas";
import { useCanvasStore } from "../store/canvasStore";
import { getEffectiveNode } from "../utils/breakpoint";
import "./PropertyPanel.css";

const DebouncedNumInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}> = ({ value, onChange, className, min, max, step, placeholder }) => {
  const [localVal, setLocalVal] = useState(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const flush = () => {
    const num = Number(localVal);
    if (!isNaN(num) && num !== value) {
      onChange(num);
    } else {
      setLocalVal(String(value));
    }
  };

  return (
    <input
      type="number"
      className={className}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={flush}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          flush();
        }
      }}
    />
  );
};

const DebouncedTextInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const flush = () => {
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={flush}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          flush();
        }
      }}
    />
  );
};

const QUICK_SWATCHES = [
  { name: "Transparent", value: "transparent" },
  { name: "White", value: "#FFFFFF" },
  { name: "Slate", value: "#64748B" },
  { name: "Dark", value: "#1E293B" },
  { name: "Blue", value: "#2563EB" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
];

export const PropertyPanel: React.FC = () => {
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const nodes = useCanvasStore((s) => s.nodes);
  const activeBreakpoint = useCanvasStore((s) => s.activeBreakpoint);
  const updateNodeName = useCanvasStore((s) => s.updateNodeName);
  const updateNodeGeometry = useCanvasStore((s) => s.updateNodeGeometry);
  const updateNodeStyle = useCanvasStore((s) => s.updateNodeStyle);
  const updateNodeContent = useCanvasStore((s) => s.updateNodeContent);
  const updateSelectedNodesStyle = useCanvasStore((s) => s.updateSelectedNodesStyle);
  const updateImageFit = useCanvasStore((s) => s.updateImageFit);
  const alignSelected = useCanvasStore((s) => s.alignSelected);
  const distributeSelected = useCanvasStore((s) => s.distributeSelected);

  const selectedList = Array.from(selectedNodeIds)
    .map((id) => (nodes[id] ? getEffectiveNode(nodes[id], activeBreakpoint) : undefined))
    .filter((n): n is CanvasNode => n !== undefined);

  // Case 1: Empty selection
  if (selectedList.length === 0) {
    return (
      <div className="property-panel">
        <div className="property-panel__header">
          <span>Inspector</span>
        </div>
        <div className="property-panel__empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" opacity="0.4">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <p>No element selected</p>
          <span>Select an item on the canvas to configure its properties.</span>
        </div>
      </div>
    );
  }

  // Case 2: Multi-selection (2+ elements)
  if (selectedList.length > 1) {
    return (
      <div className="property-panel">
        <div className="property-panel__header">
          <span>Inspector</span>
          <span className="property-panel__badge">{selectedList.length} Selected</span>
        </div>

        <div className="property-panel__content">
          {/* Alignment Actions */}
          <div className="property-panel__section">
            <span className="property-panel__section-title">Align Selection</span>
            <div className="property-panel__btn-group">
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("left")}
                title="Align Left"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="4" width="8" height="3" fill="currentColor" />
                  <rect x="4" y="9" width="5" height="3" fill="currentColor" />
                </svg>
              </button>
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("centerX")}
                title="Align Center X"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="4" width="10" height="3" fill="currentColor" />
                  <rect x="5.5" y="9" width="5" height="3" fill="currentColor" />
                </svg>
              </button>
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("right")}
                title="Align Right"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="14" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="4" width="8" height="3" fill="currentColor" />
                  <rect x="7" y="9" width="5" height="3" fill="currentColor" />
                </svg>
              </button>
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("top")}
                title="Align Top"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="4" width="3" height="8" fill="currentColor" />
                  <rect x="9" y="4" width="3" height="5" fill="currentColor" />
                </svg>
              </button>
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("centerY")}
                title="Align Center Y"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="3" width="3" height="10" fill="currentColor" />
                  <rect x="9" y="5.5" width="3" height="5" fill="currentColor" />
                </svg>
              </button>
              <button
                className="property-panel__icon-btn"
                onClick={() => alignSelected("bottom")}
                title="Align Bottom"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="4" width="3" height="8" fill="currentColor" />
                  <rect x="9" y="7" width="3" height="5" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {/* Distribute Spacing (3+ Items) */}
          {selectedList.length >= 3 && (
            <div className="property-panel__section">
              <span className="property-panel__section-title">Distribute Spacing</span>
              <div className="property-panel__distribute-group">
                <button
                  className="property-panel__btn"
                  onClick={() => distributeSelected("horizontal")}
                >
                  ↔ Horizontal Gap
                </button>
                <button
                  className="property-panel__btn"
                  onClick={() => distributeSelected("vertical")}
                >
                  ↕ Vertical Gap
                </button>
              </div>
            </div>
          )}

          {/* Bulk Style Section */}
          <div className="property-panel__section">
            <span className="property-panel__section-title">Bulk Appearance</span>
            <div className="property-panel__row">
              <label>Fill Color</label>
              <div className="property-panel__color-wrapper">
                <input
                  type="color"
                  value="#2563EB"
                  onChange={(e) => updateSelectedNodesStyle({ fill: e.target.value })}
                />
                <input
                  type="text"
                  className="property-panel__hex-input"
                  placeholder="#HEX"
                  onChange={(e) => updateSelectedNodesStyle({ fill: e.target.value })}
                />
              </div>
            </div>

            <div className="property-panel__row">
              <label>Opacity</label>
              <div className="property-panel__range-wrapper">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  defaultValue="1"
                  onChange={(e) => updateSelectedNodesStyle({ opacity: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Single element selected
  const node = selectedList[0];
  const { geometry, style } = node;

  const handleGeomChange = (key: keyof typeof geometry, value: number) => {
    if (isNaN(value)) return;
    updateNodeGeometry(node.id, { [key]: value });
  };

  const handleFillChange = (color: string) => {
    updateNodeStyle(node.id, { fill: color });
  };

  const handleOpacityChange = (opacity: number) => {
    updateNodeStyle(node.id, { opacity: Math.max(0, Math.min(1, opacity)) });
  };

  const handleCornerRadiusChange = (radius: number) => {
    updateNodeStyle(node.id, { cornerRadius: Math.max(0, radius) });
  };

  const handleBorderChange = (partialBorder: Partial<NonNullable<Style["border"]>>) => {
    updateNodeStyle(node.id, {
      border: {
        color: node.style.border?.color ?? "#2563EB",
        width: node.style.border?.width ?? 1,
        style: node.style.border?.style ?? "solid",
        ...partialBorder,
      },
    });
  };

  const handleShadowChange = (partialShadow: Partial<ShadowStyle> | null) => {
    if (partialShadow === null) {
      updateNodeStyle(node.id, { shadow: undefined });
      return;
    }
    const currentShadow = node.style.shadow ?? {
      color: "rgba(0, 0, 0, 0.4)",
      x: 0,
      y: 4,
      blur: 12,
    };
    updateNodeStyle(node.id, {
      shadow: { ...currentShadow, ...partialShadow },
    });
  };

  const handleTypoChange = (partialTypo: Partial<TypographyStyle>) => {
    const currentTypo = node.style.typography ?? {
      fontFamily: "Inter, sans-serif",
      fontSize: 18,
      fontWeight: 400,
      color: "#E4E4F0",
      align: "left",
      lineHeight: 1.4,
    };
    updateNodeStyle(node.id, {
      typography: { ...currentTypo, ...partialTypo },
    });
  };

  const imageContent = node.content?.kind === "image" ? node.content : null;

  return (
    <div className="property-panel">
      {/* Header */}
      <div className="property-panel__header">
        <DebouncedTextInput
          className="property-panel__name-input"
          value={node.name}
          onChange={(val) => updateNodeName(node.id, val)}
        />
        <div className="property-panel__badges">
          {activeBreakpoint !== "desktop" && (
            <span className="property-panel__override-badge">
              {activeBreakpoint.toUpperCase()} OVERRIDE
            </span>
          )}
          <span className="property-panel__type-badge">{node.type}</span>
        </div>
      </div>

      <div className="property-panel__content">
        {/* Transform / Geometry */}
        <div className="property-panel__section">
          <span className="property-panel__section-title">Transform</span>
          <div className="property-panel__grid">
            <div className="property-panel__field">
              <label>X</label>
              <DebouncedNumInput
                value={Math.round(geometry.x)}
                onChange={(val) => handleGeomChange("x", val)}
              />
            </div>
            <div className="property-panel__field">
              <label>Y</label>
              <DebouncedNumInput
                value={Math.round(geometry.y)}
                onChange={(val) => handleGeomChange("y", val)}
              />
            </div>
            <div className="property-panel__field">
              <label>W</label>
              <DebouncedNumInput
                value={Math.round(geometry.width)}
                onChange={(val) => handleGeomChange("width", val)}
              />
            </div>
            <div className="property-panel__field">
              <label>H</label>
              <DebouncedNumInput
                value={Math.round(geometry.height)}
                onChange={(val) => handleGeomChange("height", val)}
              />
            </div>
            <div className="property-panel__field property-panel__field--full">
              <label>Rotation (°)</label>
              <DebouncedNumInput
                value={Math.round(geometry.rotation)}
                onChange={(val) => handleGeomChange("rotation", val)}
              />
            </div>
          </div>
        </div>

        {/* Fill & Appearance */}
        {/* Fill & Appearance */}
        {node.type !== "line" && node.type !== "group" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Fill & Appearance</span>
            
            {/* Fill Mode Switcher (Solid vs Gradient) */}
            <div className="property-panel__row">
              <label>Fill Mode</label>
              <div className="property-panel__btn-group">
                <button
                  className={`property-panel__toggle-btn ${!style.gradient ? "property-panel__toggle-btn--active" : ""}`}
                  onClick={() => updateNodeStyle(node.id, { gradient: undefined })}
                >
                  Solid
                </button>
                <button
                  className={`property-panel__toggle-btn ${style.gradient ? "property-panel__toggle-btn--active" : ""}`}
                  onClick={() =>
                    updateNodeStyle(node.id, {
                      gradient: style.gradient ?? {
                        type: "linear",
                        startColor: style.fill && style.fill !== "transparent" ? style.fill : "#3B82F6",
                        endColor: "#9333EA",
                        angle: 135,
                      },
                    })
                  }
                >
                  Gradient
                </button>
              </div>
            </div>

            {!style.gradient ? (
              <>
                <div className="property-panel__row">
                  <label>Fill Color</label>
                  <div className="property-panel__color-wrapper">
                    <input
                      type="color"
                      value={style.fill && style.fill !== "transparent" ? style.fill : "#E5E7EB"}
                      onChange={(e) => handleFillChange(e.target.value)}
                    />
                    <input
                      type="text"
                      className="property-panel__hex-input"
                      value={style.fill ?? "#E5E7EB"}
                      onChange={(e) => handleFillChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Palette Swatches */}
                <div className="property-panel__swatches">
                  {QUICK_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      className={`property-panel__swatch ${
                        style.fill === swatch.value ? "property-panel__swatch--active" : ""
                      }`}
                      style={{
                        background: swatch.value === "transparent" ? "#16162A" : swatch.value,
                        border: swatch.value === "transparent" ? "1px dashed #5A5A78" : "none",
                      }}
                      title={swatch.name}
                      onClick={() => handleFillChange(swatch.value)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Gradient Start Color */}
                <div className="property-panel__row">
                  <label>Start Color</label>
                  <div className="property-panel__color-wrapper">
                    <input
                      type="color"
                      value={style.gradient.startColor}
                      onChange={(e) =>
                        updateNodeStyle(node.id, {
                          gradient: { ...style.gradient!, startColor: e.target.value },
                        })
                      }
                    />
                    <input
                      type="text"
                      className="property-panel__hex-input"
                      value={style.gradient.startColor}
                      onChange={(e) =>
                        updateNodeStyle(node.id, {
                          gradient: { ...style.gradient!, startColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Gradient End Color */}
                <div className="property-panel__row">
                  <label>End Color</label>
                  <div className="property-panel__color-wrapper">
                    <input
                      type="color"
                      value={style.gradient.endColor}
                      onChange={(e) =>
                        updateNodeStyle(node.id, {
                          gradient: { ...style.gradient!, endColor: e.target.value },
                        })
                      }
                    />
                    <input
                      type="text"
                      className="property-panel__hex-input"
                      value={style.gradient.endColor}
                      onChange={(e) =>
                        updateNodeStyle(node.id, {
                          gradient: { ...style.gradient!, endColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Gradient Angle Slider */}
                <div className="property-panel__row">
                  <label>Angle (°)</label>
                  <div className="property-panel__range-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={style.gradient.angle ?? 135}
                      onChange={(e) =>
                        updateNodeStyle(node.id, {
                          gradient: { ...style.gradient!, angle: Number(e.target.value) },
                        })
                      }
                    />
                    <span>{style.gradient.angle ?? 135}°</span>
                  </div>
                </div>

                {/* Gradient Presets */}
                <div className="property-panel__swatches">
                  {[
                    { name: "Sunset", start: "#F59E0B", end: "#EF4444", angle: 135 },
                    { name: "Ocean", start: "#06B6D4", end: "#3B82F6", angle: 135 },
                    { name: "Cyberpunk", start: "#EC4899", end: "#8B5CF6", angle: 135 },
                    { name: "Emerald", start: "#10B981", end: "#06B6D4", angle: 135 },
                    { name: "Neon Fire", start: "#F97316", end: "#EC4899", angle: 135 },
                    { name: "Midnight", start: "#6366F1", end: "#1E1B4B", angle: 180 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      className="property-panel__swatch"
                      style={{
                        background: `linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})`,
                      }}
                      title={preset.name}
                      onClick={() =>
                        updateNodeStyle(node.id, {
                          gradient: {
                            type: "linear",
                            startColor: preset.start,
                            endColor: preset.end,
                            angle: preset.angle,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </>
            )}

            <div className="property-panel__row">
              <label>Opacity</label>
              <div className="property-panel__range-wrapper">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={style.opacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                />
                <span>{Math.round(style.opacity * 100)}%</span>
              </div>
            </div>

            {(node.type === "rectangle" || node.type === "image") && (
              <div className="property-panel__row">
                <label>Corner Radius</label>
                <input
                  type="number"
                  min="0"
                  className="property-panel__num-input"
                  value={style.cornerRadius ?? 0}
                  onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
                />
              </div>
            )}
          </div>
        )}

        {/* Border / Stroke Settings */}
        {node.type !== "group" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Border / Stroke</span>
            <div className="property-panel__row">
              <label>Color</label>
              <div className="property-panel__color-wrapper">
                <input
                  type="color"
                  value={style.border?.color ?? "#2563EB"}
                  onChange={(e) => handleBorderChange({ color: e.target.value })}
                />
                <input
                  type="text"
                  className="property-panel__hex-input"
                  value={style.border?.color ?? "#2563EB"}
                  onChange={(e) => handleBorderChange({ color: e.target.value })}
                />
              </div>
            </div>

            <div className="property-panel__row">
              <label>Width (px)</label>
              <input
                type="number"
                min="0"
                className="property-panel__num-input"
                value={style.border?.width ?? 0}
                onChange={(e) => handleBorderChange({ width: Number(e.target.value) })}
              />
            </div>

            <div className="property-panel__row">
              <label>Style</label>
              <select
                className="property-panel__select"
                value={style.border?.style ?? "solid"}
                onChange={(e) => handleBorderChange({ style: e.target.value as "solid" | "dashed" | "dotted" })}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
        )}

        {/* Drop Shadow Settings */}
        {node.type !== "group" && (
          <div className="property-panel__section">
            <div className="property-panel__section-header">
              <span className="property-panel__section-title">Drop Shadow</span>
              <input
                type="checkbox"
                checked={!!style.shadow}
                onChange={(e) => handleShadowChange(e.target.checked ? {} : null)}
              />
            </div>

            {style.shadow && (
              <>
                <div className="property-panel__row">
                  <label>Color</label>
                  <div className="property-panel__color-wrapper">
                    <input
                      type="color"
                      value={style.shadow.color.startsWith("#") ? style.shadow.color : "#000000"}
                      onChange={(e) => handleShadowChange({ color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="property-panel__hex-input"
                      value={style.shadow.color}
                      onChange={(e) => handleShadowChange({ color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="property-panel__grid">
                  <div className="property-panel__field">
                    <label>X</label>
                    <input
                      type="number"
                      value={style.shadow.x}
                      onChange={(e) => handleShadowChange({ x: Number(e.target.value) })}
                    />
                  </div>
                  <div className="property-panel__field">
                    <label>Y</label>
                    <input
                      type="number"
                      value={style.shadow.y}
                      onChange={(e) => handleShadowChange({ y: Number(e.target.value) })}
                    />
                  </div>
                  <div className="property-panel__field property-panel__field--full">
                    <label>Blur</label>
                    <input
                      type="number"
                      min="0"
                      value={style.shadow.blur}
                      onChange={(e) => handleShadowChange({ blur: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Text Content (Text Node Only) */}
        {node.type === "text" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Text Content</span>
            <textarea
              className="property-panel__textarea"
              rows={3}
              value={node.content?.kind === "text" ? node.content.text : "Text"}
              onChange={(e) => updateNodeContent(node.id, { kind: "text", text: e.target.value }, true)}
              placeholder="Enter text..."
            />
          </div>
        )}

        {/* Typography Settings (Text Node Only) */}
        {node.type === "text" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Typography</span>

            {/* Google Fonts Picker */}
            <div className="property-panel__row">
              <label>Font Family</label>
              <select
                className="property-panel__select"
                value={style.typography?.fontFamily ?? "Inter, sans-serif"}
                onChange={(e) => handleTypoChange({ fontFamily: e.target.value })}
              >
                <option value="Inter, sans-serif">Inter (Sans-Serif)</option>
                <option value="Roboto, sans-serif">Roboto (Sans-Serif)</option>
                <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                <option value="Outfit, sans-serif">Outfit (Modern)</option>
                <option value="Montserrat, sans-serif">Montserrat (Geometric)</option>
                <option value="Poppins, sans-serif">Poppins (Sans-Serif)</option>
                <option value="Lora, serif">Lora (Serif)</option>
                <option value="Oswald, sans-serif">Oswald (Condensed)</option>
                <option value="'Fira Code', monospace">Fira Code (Monospace)</option>
                <option value="Caveat, cursive">Caveat (Handwriting)</option>
              </select>
            </div>

            <div className="property-panel__row">
              <label>Size (px)</label>
              <input
                type="number"
                min="8"
                max="200"
                className="property-panel__num-input"
                value={style.typography?.fontSize ?? 18}
                onChange={(e) => handleTypoChange({ fontSize: Number(e.target.value) })}
              />
            </div>

            <div className="property-panel__row">
              <label>Weight</label>
              <select
                className="property-panel__select"
                value={style.typography?.fontWeight ?? 400}
                onChange={(e) => handleTypoChange({ fontWeight: Number(e.target.value) })}
              >
                <option value={100}>Thin (100)</option>
                <option value={300}>Light (300)</option>
                <option value={400}>Regular (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semi-Bold (600)</option>
                <option value={700}>Bold (700)</option>
                <option value={900}>Black (900)</option>
              </select>
            </div>

            <div className="property-panel__row">
              <label>Text Color</label>
              <div className="property-panel__color-wrapper">
                <input
                  type="color"
                  value={style.typography?.color ?? "#E4E4F0"}
                  onChange={(e) => handleTypoChange({ color: e.target.value })}
                />
                <input
                  type="text"
                  className="property-panel__hex-input"
                  value={style.typography?.color ?? "#E4E4F0"}
                  onChange={(e) => handleTypoChange({ color: e.target.value })}
                />
              </div>
            </div>

            <div className="property-panel__row">
              <label>Align</label>
              <div className="property-panel__btn-group">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    className={`property-panel__icon-btn ${
                      style.typography?.align === align ? "property-panel__icon-btn--active" : ""
                    }`}
                    onClick={() => handleTypoChange({ align })}
                  >
                    {align.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Spacing (Tracking) */}
            <div className="property-panel__row">
              <label>Spacing (px)</label>
              <input
                type="number"
                min="-5"
                max="30"
                className="property-panel__num-input"
                value={style.typography?.letterSpacing ?? 0}
                onChange={(e) => handleTypoChange({ letterSpacing: Number(e.target.value) })}
              />
            </div>

            {/* Text Transform */}
            <div className="property-panel__row">
              <label>Transform</label>
              <div className="property-panel__btn-group">
                {(
                  [
                    { label: "None", val: "none" },
                    { label: "TT", val: "uppercase" },
                    { label: "tt", val: "lowercase" },
                    { label: "Tt", val: "capitalize" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.val}
                    className={`property-panel__icon-btn ${
                      (style.typography?.textTransform ?? "none") === t.val ? "property-panel__icon-btn--active" : ""
                    }`}
                    onClick={() => handleTypoChange({ textTransform: t.val })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Decoration */}
            <div className="property-panel__row">
              <label>Decoration</label>
              <div className="property-panel__btn-group">
                {(
                  [
                    { label: "None", val: "none" },
                    { label: "U", val: "underline" },
                    { label: "S", val: "line-through" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.val}
                    className={`property-panel__icon-btn ${
                      (style.typography?.textDecoration ?? "none") === d.val ? "property-panel__icon-btn--active" : ""
                    }`}
                    style={d.val === "underline" ? { textDecoration: "underline" } : d.val === "line-through" ? { textDecoration: "line-through" } : undefined}
                    onClick={() => handleTypoChange({ textDecoration: d.val })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Fit (Image Node Only) */}
        {node.type === "image" && imageContent && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Image Fit</span>
            <div className="property-panel__row">
              <label>Object Fit</label>
              <div className="property-panel__btn-group">
                {(["cover", "contain", "fill"] as const).map((fit) => (
                  <button
                    key={fit}
                    className={`property-panel__btn ${
                      imageContent.fit === fit ? "property-panel__btn--active" : ""
                    }`}
                    onClick={() => updateImageFit(node.id, fit)}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Polygon Settings (Polygon Node Only) */}
        {node.type === "polygon" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Polygon Geometry</span>
            <div className="property-panel__row">
              <label>Sides ({style.sides ?? 5})</label>
              <input
                type="range"
                min="3"
                max="30"
                value={style.sides ?? 5}
                onChange={(e) => updateNodeStyle(node.id, { sides: Number(e.target.value) })}
                className="property-panel__slider"
              />
              <input
                type="number"
                min="3"
                max="30"
                value={style.sides ?? 5}
                onChange={(e) => updateNodeStyle(node.id, { sides: Number(e.target.value) })}
                className="property-panel__num-input"
              />
            </div>
          </div>
        )}

        {/* Star Settings (Star Node Only) */}
        {node.type === "star" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Star Geometry</span>
            <div className="property-panel__row">
              <label>Points ({style.starPoints ?? 5})</label>
              <input
                type="range"
                min="3"
                max="20"
                value={style.starPoints ?? 5}
                onChange={(e) => updateNodeStyle(node.id, { starPoints: Number(e.target.value) })}
                className="property-panel__slider"
              />
              <input
                type="number"
                min="3"
                max="20"
                value={style.starPoints ?? 5}
                onChange={(e) => updateNodeStyle(node.id, { starPoints: Number(e.target.value) })}
                className="property-panel__num-input"
              />
            </div>
            <div className="property-panel__row">
              <label>Inner Ratio</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={style.innerRadius ?? 0.5}
                onChange={(e) => updateNodeStyle(node.id, { innerRadius: Number(e.target.value) })}
                className="property-panel__slider"
              />
            </div>
          </div>
        )}

        {/* Curve Settings (Curve Node Only) */}
        {node.type === "curve" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Curve Settings</span>
            <div className="property-panel__row">
              <label>Curvature</label>
              <input
                type="range"
                min="-100"
                max="100"
                value={style.curvature ?? 50}
                onChange={(e) => updateNodeStyle(node.id, { curvature: Number(e.target.value) })}
                className="property-panel__slider"
              />
            </div>
          </div>
        )}

        {/* 3D Shape Settings (Shape3D Node Only) */}
        {node.type === "shape3d" && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">3D Mesh Geometry</span>
            <div className="property-panel__row">
              <label>3D Sides ({style.sides ?? 4})</label>
              <input
                type="range"
                min="3"
                max="30"
                value={style.sides ?? 4}
                onChange={(e) => updateNodeStyle(node.id, { sides: Number(e.target.value) })}
                className="property-panel__slider"
              />
              <input
                type="number"
                min="3"
                max="30"
                value={style.sides ?? 4}
                onChange={(e) => updateNodeStyle(node.id, { sides: Number(e.target.value) })}
                className="property-panel__num-input"
              />
            </div>
          </div>
        )}

        {/* Freehand Brush & Pencil Settings */}
        {(node.type === "brush" || node.type === "pencil") && (
          <div className="property-panel__section">
            <span className="property-panel__section-title">Stroke & Size</span>
            <div className="property-panel__row">
              <label>Stroke Size ({style.brushSize ?? (node.type === "pencil" ? 2 : 12)}px)</label>
              <input
                type="range"
                min="1"
                max="100"
                value={style.brushSize ?? (node.type === "pencil" ? 2 : 12)}
                onChange={(e) => updateNodeStyle(node.id, { brushSize: Number(e.target.value) })}
                className="property-panel__slider"
              />
              <input
                type="number"
                min="1"
                max="100"
                value={style.brushSize ?? (node.type === "pencil" ? 2 : 12)}
                onChange={(e) => updateNodeStyle(node.id, { brushSize: Number(e.target.value) })}
                className="property-panel__num-input"
              />
            </div>
            <div className="property-panel__row">
              <label>Stroke Color</label>
              <div className="property-panel__color-wrapper">
                <input
                  type="color"
                  value={style.border?.color ?? style.fill ?? "#3B82F6"}
                  onChange={(e) =>
                    updateNodeStyle(node.id, {
                      border: { ...(style.border ?? { width: 2, style: "solid" }), color: e.target.value },
                    })
                  }
                />
                <input
                  type="text"
                  className="property-panel__hex-input"
                  value={style.border?.color ?? style.fill ?? "#3B82F6"}
                  onChange={(e) =>
                    updateNodeStyle(node.id, {
                      border: { ...(style.border ?? { width: 2, style: "solid" }), color: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* 3D Visual Design Settings (All Shapes) */}
        <div className="property-panel__section">
          <span className="property-panel__section-title">3D Extrude & Depth</span>
          <div className="property-panel__row">
            <label>Extrude Depth</label>
            <input
              type="range"
              min="0"
              max="100"
              value={style.depth3d ?? 0}
              onChange={(e) => updateNodeStyle(node.id, { depth3d: Number(e.target.value) })}
              className="property-panel__slider"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={style.depth3d ?? 0}
              onChange={(e) => updateNodeStyle(node.id, { depth3d: Number(e.target.value) })}
              className="property-panel__num-input"
            />
          </div>
          {(style.depth3d ?? 0) > 0 && (
            <div className="property-panel__row">
              <label>3D Color</label>
              <div className="property-panel__color-wrapper">
                <input
                  type="color"
                  value={style.color3d ?? "#1E40AF"}
                  onChange={(e) => updateNodeStyle(node.id, { color3d: e.target.value })}
                />
                <input
                  type="text"
                  className="property-panel__hex-input"
                  value={style.color3d ?? "#1E40AF"}
                  onChange={(e) => updateNodeStyle(node.id, { color3d: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Phase 2.4 Effects & Filters (Blur, Glassmorphism, Inner Shadow) */}
        <div className="property-panel__section">
          <span className="property-panel__section-title">Effects & Filters</span>
          <div className="property-panel__row">
            <label>Gaussian Blur ({style.blur ?? 0}px)</label>
            <input
              type="range"
              min="0"
              max="50"
              value={style.blur ?? 0}
              onChange={(e) => updateNodeStyle(node.id, { blur: Number(e.target.value) })}
              className="property-panel__slider"
            />
          </div>
          <div className="property-panel__row">
            <label>Backdrop Blur ({style.backgroundBlur ?? 0}px)</label>
            <input
              type="range"
              min="0"
              max="50"
              value={style.backgroundBlur ?? 0}
              onChange={(e) => updateNodeStyle(node.id, { backgroundBlur: Number(e.target.value) })}
              className="property-panel__slider"
            />
          </div>
        </div>

        {/* Phase 2.5 Responsive Constraints */}
        <div className="property-panel__section">
          <span className="property-panel__section-title">Responsive Constraints</span>
          <div className="property-panel__row">
            <label>Pin Horizontal</label>
            <select
              className="property-panel__select"
              value={node.layout?.pinX ?? "none"}
              onChange={(val) => {
                const pinXVal = val.target.value as any;
                useCanvasStore.setState((s) => ({
                  nodes: {
                    ...s.nodes,
                    [node.id]: {
                      ...s.nodes[node.id],
                      layout: { ...s.nodes[node.id]?.layout, pinX: pinXVal },
                    },
                  },
                }));
              }}
            >
              <option value="none">Free</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Left & Right (Stretch)</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyPanel;
