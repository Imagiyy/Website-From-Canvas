import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EMBED_PRESETS = [
  {
    category: "Code Blocks",
    items: [
      { type: "embedCode" as const, name: "Custom HTML/CSS/JS", desc: "Inject raw HTML, CSS, or JavaScript code", icon: "</>", embedData: { code: '<!-- Your custom HTML here -->\n<div style="padding:20px;color:#fff;">\n  <h3>Custom Block</h3>\n  <p>Edit in properties panel.</p>\n</div>' } },
    ],
  },
  {
    category: "Media Embeds",
    items: [
      { type: "embedIframe" as const, name: "YouTube Video", desc: "Embed a YouTube video player", icon: "▶", embedData: { iframeSrc: "https://www.youtube.com/embed/dQw4w9WgXcQ", embedType: "youtube" as const } },
      { type: "embedIframe" as const, name: "Google Maps", desc: "Embed an interactive Google Map", icon: "📍", embedData: { iframeSrc: "", embedType: "maps" as const } },
      { type: "embedIframe" as const, name: "Spotify Player", desc: "Embed a Spotify track or playlist", icon: "🎵", embedData: { iframeSrc: "", embedType: "spotify" as const } },
      { type: "embedIframe" as const, name: "Twitter/X Post", desc: "Embed a tweet or X post", icon: "𝕏", embedData: { iframeSrc: "", embedType: "twitter" as const } },
      { type: "embedIframe" as const, name: "Custom iFrame", desc: "Embed any external URL via iframe", icon: "🔗", embedData: { iframeSrc: "", embedType: "custom" as const } },
    ],
  },
];

export const EmbedPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createSectionControl = useCanvasStore((s: any) => s.createSectionControl ?? s.createFormControl);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">{"</>"}</span>
            Custom Code & Embeds
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="panel-description">
            Add custom code blocks or embed third-party content like YouTube videos, maps, and more.
          </p>
          {EMBED_PRESETS.map((cat) => (
            <div key={cat.category} className="panel-category">
              <h3 className="panel-category__title">{cat.category}</h3>
              <div className="panel-grid">
                {cat.items.map((preset, idx) => (
                  <button
                    key={`${preset.type}-${idx}`}
                    className="panel-card"
                    onClick={() => {
                      createSectionControl(preset.type, preset.name, { embedData: preset.embedData });
                      onClose();
                    }}
                  >
                    <span className="panel-card__icon">{preset.icon}</span>
                    <span className="panel-card__name">{preset.name}</span>
                    <span className="panel-card__desc">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmbedPanel;
