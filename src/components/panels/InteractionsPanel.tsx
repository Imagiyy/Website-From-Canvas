// Interactions Panel — 2.6 Interactions & Animations
import React, { useState } from "react";
import { useInteractionStore } from "../../store/interactionStore";
import { useCanvasStore } from "../../store/canvasStore";
import type { AnimationType, EasingType, ClickActionType } from "../../types/canvas";
import "../panels/PanelStyles.css";

const ANIMATION_TYPES: { value: AnimationType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade In" },
  { value: "slideInLeft", label: "Slide In Left" },
  { value: "slideInRight", label: "Slide In Right" },
  { value: "slideInUp", label: "Slide In Up" },
  { value: "slideInDown", label: "Slide In Down" },
  { value: "scaleIn", label: "Scale In" },
  { value: "rotateIn", label: "Rotate In" },
  { value: "bounceIn", label: "Bounce In" },
];

const EASING_TYPES: { value: EasingType; label: string }[] = [
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
  { value: "linear", label: "Linear" },
];

const CLICK_ACTIONS: { value: ClickActionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "navigateTo", label: "Navigate to Page" },
  { value: "openUrl", label: "Open URL" },
  { value: "toggleVisibility", label: "Toggle Visibility" },
  { value: "scrollTo", label: "Scroll to Section" },
];

const InteractionsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"hover" | "click" | "entrance" | "scroll">("hover");
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const selectedId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null;

  const interactions = useInteractionStore((s) => selectedId ? s.interactions[selectedId] : undefined);
  const setHoverState = useInteractionStore((s) => s.setHoverState);
  const setClickAction = useInteractionStore((s) => s.setClickAction);
  const setEntranceAnimation = useInteractionStore((s) => s.setEntranceAnimation);
  const setScrollAnimation = useInteractionStore((s) => s.setScrollAnimation);

  if (!selectedId) {
    return (
      <div className="panel-overlay" onClick={onClose}>
        <div className="panel-modal panel-modal--narrow" onClick={(e) => e.stopPropagation()}>
          <div className="panel-header">
            <div className="panel-header__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Interactions
            </div>
            <button className="panel-close-btn" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty__title">No Element Selected</div>
              <div className="panel-empty__desc">Select a single element to configure interactions.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Interactions & Animations
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            {(["hover", "click", "entrance", "scroll"] as const).map((tab) => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? "panel-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "hover" && (
            <div className="panel-section">
              <div className="panel-section__title">Hover State</div>
              <div className="panel-form-group">
                <label className="panel-label">Background Color on Hover</label>
                <div className="panel-row">
                  <input type="color" value={interactions?.hover?.style?.fill || "#3B82F6"} onChange={(e) => setHoverState(selectedId, { ...interactions?.hover, style: { ...interactions?.hover?.style, fill: e.target.value }, transition: interactions?.hover?.transition || 200 })} style={{ width: 36, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }}/>
                  <input className="panel-input" value={interactions?.hover?.style?.fill || ""} placeholder="e.g. #3B82F6" onChange={(e) => setHoverState(selectedId, { ...interactions?.hover, style: { ...interactions?.hover?.style, fill: e.target.value }, transition: interactions?.hover?.transition || 200 })}/>
                </div>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Opacity on Hover</label>
                <input type="range" className="panel-slider" min="0" max="1" step="0.05" value={interactions?.hover?.style?.opacity ?? 1} onChange={(e) => setHoverState(selectedId, { ...interactions?.hover, style: { ...interactions?.hover?.style, opacity: parseFloat(e.target.value) }, transition: interactions?.hover?.transition || 200 })}/>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Transition Duration (ms)</label>
                <input type="number" className="panel-input" value={interactions?.hover?.transition || 200} onChange={(e) => setHoverState(selectedId, { ...interactions?.hover, transition: parseInt(e.target.value) || 200 })}/>
              </div>
            </div>
          )}

          {activeTab === "click" && (
            <div className="panel-section">
              <div className="panel-section__title">Click Action (Hyperlinks & Triggers)</div>
              <div className="panel-form-group">
                <label className="panel-label">Action Type</label>
                <select className="panel-select" value={interactions?.click?.type || "none"} onChange={(e) => setClickAction(selectedId, { type: e.target.value as ClickActionType, target: interactions?.click?.target })}>
                  {CLICK_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              {interactions?.click?.type === "navigateTo" && (
                <div className="panel-form-group">
                  <label className="panel-label">Target Canvas Page</label>
                  <select
                    className="panel-select"
                    value={interactions?.click?.target || ""}
                    onChange={(e) => setClickAction(selectedId, { type: "navigateTo", target: e.target.value, ...(interactions?.click || {}) })}
                  >
                    <option value="">-- Select Target Page --</option>
                    {Object.values(useCanvasStore.getState().pages).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(interactions?.click?.type === "scrollTo" || interactions?.click?.type === "toggleVisibility") && (
                <div className="panel-form-group">
                  <label className="panel-label">Target Layer / Element</label>
                  <select
                    className="panel-select"
                    value={interactions?.click?.target || ""}
                    onChange={(e) => setClickAction(selectedId, { type: interactions?.click?.type || "scrollTo", target: e.target.value, ...(interactions?.click || {}) })}
                  >
                    <option value="">-- Select Target Element --</option>
                    {Object.values(useCanvasStore.getState().nodes).map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} [{n.type}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {interactions?.click?.type === "openUrl" && (
                <div className="panel-form-group">
                  <label className="panel-label">Target URL</label>
                  <input
                    className="panel-input"
                    placeholder="https://example.com"
                    value={interactions?.click?.target || ""}
                    onChange={(e) => setClickAction(selectedId, { type: "openUrl", target: e.target.value, ...(interactions?.click || {}) })}
                  />
                </div>
              )}

              {interactions?.click?.type === "openUrl" && (
                <div className="panel-form-group">
                  <div className="panel-row">
                    <label className="panel-toggle">
                      <input type="checkbox" checked={interactions?.click?.openInNewTab || false} onChange={(e) => setClickAction(selectedId, { type: "openUrl", target: interactions?.click?.target || "", ...interactions?.click, openInNewTab: e.target.checked })}/>
                      <span className="panel-toggle__slider" />
                    </label>
                    <span style={{ fontSize: 12, color: "#b4b4c8" }}>Open in new tab</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "entrance" && (
            <div className="panel-section">
              <div className="panel-section__title">Entrance Animation</div>
              <div className="panel-form-group">
                <label className="panel-label">Animation Type</label>
                <select className="panel-select" value={interactions?.entrance?.type || "none"} onChange={(e) => setEntranceAnimation(selectedId, { type: e.target.value as AnimationType, duration: interactions?.entrance?.duration || 500, delay: interactions?.entrance?.delay || 0, easing: interactions?.entrance?.easing || "ease" })}>
                  {ANIMATION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="panel-grid panel-grid--2col">
                <div className="panel-form-group">
                  <label className="panel-label">Duration (ms)</label>
                  <input type="number" className="panel-input" value={interactions?.entrance?.duration || 500} onChange={(e) => setEntranceAnimation(selectedId, { type: interactions?.entrance?.type || "fadeIn", duration: parseInt(e.target.value) || 500, delay: interactions?.entrance?.delay || 0, easing: interactions?.entrance?.easing || "ease" })}/>
                </div>
                <div className="panel-form-group">
                  <label className="panel-label">Delay (ms)</label>
                  <input type="number" className="panel-input" value={interactions?.entrance?.delay || 0} onChange={(e) => setEntranceAnimation(selectedId, { type: interactions?.entrance?.type || "fadeIn", duration: interactions?.entrance?.duration || 500, delay: parseInt(e.target.value) || 0, easing: interactions?.entrance?.easing || "ease" })}/>
                </div>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Easing</label>
                <select className="panel-select" value={interactions?.entrance?.easing || "ease"} onChange={(e) => setEntranceAnimation(selectedId, { type: interactions?.entrance?.type || "fadeIn", duration: interactions?.entrance?.duration || 500, delay: interactions?.entrance?.delay || 0, easing: e.target.value as EasingType })}>
                  {EASING_TYPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {activeTab === "scroll" && (
            <div className="panel-section">
              <div className="panel-section__title">Scroll-Triggered Animation</div>
              <div className="panel-form-group">
                <label className="panel-label">Animation Type</label>
                <select className="panel-select" value={interactions?.scroll?.type || "none"} onChange={(e) => setScrollAnimation(selectedId, { type: e.target.value as AnimationType, triggerOffset: interactions?.scroll?.triggerOffset || 0.5, duration: interactions?.scroll?.duration || 600, easing: interactions?.scroll?.easing || "ease-out" })}>
                  {ANIMATION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="panel-form-group">
                <label className="panel-label">Trigger Offset ({Math.round((interactions?.scroll?.triggerOffset || 0.5) * 100)}% of viewport)</label>
                <input type="range" className="panel-slider" min="0" max="1" step="0.05" value={interactions?.scroll?.triggerOffset || 0.5} onChange={(e) => setScrollAnimation(selectedId, { type: interactions?.scroll?.type || "fadeIn", duration: interactions?.scroll?.duration || 600, easing: interactions?.scroll?.easing || "ease-out", triggerOffset: parseFloat(e.target.value) })}/>
              </div>
              <div className="panel-grid panel-grid--2col">
                <div className="panel-form-group">
                  <label className="panel-label">Duration (ms)</label>
                  <input type="number" className="panel-input" value={interactions?.scroll?.duration || 600} onChange={(e) => setScrollAnimation(selectedId, { type: interactions?.scroll?.type || "fadeIn", triggerOffset: interactions?.scroll?.triggerOffset || 0.5, duration: parseInt(e.target.value) || 600, easing: interactions?.scroll?.easing || "ease-out" })}/>
                </div>
                <div className="panel-form-group">
                  <label className="panel-label">Easing</label>
                  <select className="panel-select" value={interactions?.scroll?.easing || "ease-out"} onChange={(e) => setScrollAnimation(selectedId, { type: interactions?.scroll?.type || "fadeIn", triggerOffset: interactions?.scroll?.triggerOffset || 0.5, duration: interactions?.scroll?.duration || 600, easing: e.target.value as EasingType })}>
                    {EASING_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractionsPanel;
