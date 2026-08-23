import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_PRESETS = [
  {
    category: "Hero & Landing",
    items: [
      { type: "sectionHero" as const, name: "Hero Section", desc: "Full-width hero banner with headline, subtitle, and CTA buttons", icon: "🏔️", defaultSize: { w: 800, h: 400 } },
      { type: "sectionCTA" as const, name: "Call to Action", desc: "Eye-catching CTA banner with gradient background", icon: "📢", defaultSize: { w: 800, h: 240 } },
    ],
  },
  {
    category: "Content Sections",
    items: [
      { type: "sectionFeatures" as const, name: "Features Grid", desc: "6-item feature showcase with icons and descriptions", icon: "⚡", defaultSize: { w: 800, h: 360 } },
      { type: "sectionPricing" as const, name: "Pricing Table", desc: "3-tier pricing comparison with feature lists", icon: "💰", defaultSize: { w: 800, h: 400 } },
      { type: "sectionTestimonials" as const, name: "Testimonials", desc: "Customer review cards with star ratings", icon: "💬", defaultSize: { w: 800, h: 280 } },
      { type: "sectionTeam" as const, name: "Team Members", desc: "Team grid with avatars, roles, and social links", icon: "👥", defaultSize: { w: 800, h: 320 } },
    ],
  },
  {
    category: "Footer",
    items: [
      { type: "sectionFooter" as const, name: "Footer Block", desc: "Multi-column footer with links, social icons, and copyright", icon: "📋", defaultSize: { w: 800, h: 260 } },
    ],
  },
];

export const PageSectionsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createSectionControl = useCanvasStore((s: any) => s.createSectionControl ?? s.createFormControl);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <span className="panel-header__icon">🏗️</span>
            Pre-built Page Sections
          </div>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="panel-description">
            Drag-and-drop complete website sections. Each section is fully styled and responsive-ready.
          </p>
          {SECTION_PRESETS.map((cat) => (
            <div key={cat.category} className="panel-category">
              <h3 className="panel-category__title">{cat.category}</h3>
              <div className="panel-grid">
                {cat.items.map((preset) => (
                  <button
                    key={preset.type}
                    className="panel-card"
                    onClick={() => {
                      createSectionControl(preset.type, preset.name, { defaultSize: preset.defaultSize });
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

export default PageSectionsPanel;
