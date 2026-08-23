import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  {
    id: "saas",
    title: "SaaS & AI Product Landing Page",
    category: "Landing Page",
    description: "Modern dark theme landing page with Hero banner, headline typography, CTA button, and 3 feature cards.",
    badge: "Popular",
    color: "#3b82f6",
  },
  {
    id: "ecommerce",
    title: "E-Commerce Storefront & Cart",
    category: "Storefront",
    description: "Complete e-commerce layout with store banner, product cards, price tags, and live Add-to-Cart integration.",
    badge: "Interactive",
    color: "#10b981",
  },
];

export const TemplateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);

  if (!isOpen) return null;

  const handleSelect = (templateId: string) => {
    loadTemplate(templateId);
    onClose();
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            Pre-designed Website Starter Templates
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 20 }}>
            Choose a responsive starter template to load pre-built section layouts onto your canvas.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                style={{
                  background: "#1e1e36",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => handleSelect(tmpl.id)}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: tmpl.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tmpl.category}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: `${tmpl.color}22`, color: tmpl.color, padding: "2px 8px", borderRadius: 12 }}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e4e4f0", marginBottom: 8 }}>{tmpl.title}</div>
                  <div style={{ fontSize: 13, color: "#8888a8", lineHeight: 1.5 }}>{tmpl.description}</div>
                </div>

                <button
                  className="panel-btn panel-btn--primary"
                  style={{ marginTop: 20, width: "100%", justifyContent: "center", background: tmpl.color, borderColor: tmpl.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(tmpl.id);
                  }}
                >
                  Load Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
