import React from "react";
import { useThemeStore, THEME_PRESETS } from "../../store/themeStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setMode = useThemeStore((s) => s.setMode);
  const updateColors = useThemeStore((s) => s.updateColors);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">🎨</span>
            Global Site Theming
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="panel-description">
            Customize global theme variables, mode (Light/Dark), and color palettes applied across your site.
          </p>

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setMode("dark")}
              style={{
                flex: 1,
                padding: "10px",
                background: currentTheme.mode === "dark" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: currentTheme.mode === "dark" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: currentTheme.mode === "dark" ? "#a78bfa" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🌙 Dark Mode
            </button>
            <button
              onClick={() => setMode("light")}
              style={{
                flex: 1,
                padding: "10px",
                background: currentTheme.mode === "light" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: currentTheme.mode === "light" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: currentTheme.mode === "light" ? "#a78bfa" : "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ☀️ Light Mode
            </button>
          </div>

          {/* Preset Palettes */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 10, textTransform: "uppercase" }}>Preset Palettes</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {THEME_PRESETS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: 12,
                    background: currentTheme.id === t.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                    border: currentTheme.id === t.id ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 4, height: 16, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ flex: 1, background: t.colors.primary }} />
                    <div style={{ flex: 1, background: t.colors.secondary }} />
                    <div style={{ flex: 1, background: t.colors.accent }} />
                    <div style={{ flex: 1, background: t.colors.background }} />
                    <div style={{ flex: 1, background: t.colors.surface }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Color Overrides */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 10, textTransform: "uppercase" }}>Custom Theme Variables</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {(Object.keys(currentTheme.colors) as (keyof typeof currentTheme.colors)[]).map((key) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{key}</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="color"
                      value={currentTheme.colors[key]}
                      onChange={(e) => updateColors({ [key]: e.target.value })}
                      style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer", padding: 0 }}
                    />
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#cbd5e1" }}>{currentTheme.colors[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePanel;
