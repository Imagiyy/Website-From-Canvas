import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementType } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackPreset {
  id: string;
  name: string;
  category: "Modals, Dialogs & Toasts" | "Alerts & Status Indicators" | "Placeholders & Empty States";
  type: ElementType;
  description: string;
  options?: any;
  icon: React.ReactNode;
}

const FEEDBACK_PRESETS: FeedbackPreset[] = [
  {
    id: "feedback_modal",
    name: "Modal / Confirmation Dialog",
    category: "Modals, Dialogs & Toasts",
    type: "feedbackModal",
    description: "Blocking popup popup dialog requiring user confirmation or action.",
    options: { title: "Confirm Action", text: "Are you sure you want to proceed with this operation?" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>,
  },
  {
    id: "feedback_toast",
    name: "Toast / Snackbar Bar",
    category: "Modals, Dialogs & Toasts",
    type: "feedbackToast",
    description: "Non-intrusive temporary notification bar for async operations with dismiss action.",
    options: { text: "Changes saved successfully!" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
  {
    id: "feedback_alert",
    name: "Alert Banner",
    category: "Alerts & Status Indicators",
    type: "feedbackAlert",
    description: "Prominent banner conveying success, warning, or system error messages.",
    options: { alertType: "warning", title: "System Alert", text: "API rate limit at 85%. Consider upgrading your plan." },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    id: "feedback_progress",
    name: "Progress Bar & Spinner",
    category: "Alerts & Status Indicators",
    type: "feedbackProgress",
    description: "Visual percentage track indicator for ongoing background processes.",
    options: { label: "Processing File Upload...", progress: 68 },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/></svg>,
  },
  {
    id: "feedback_skeleton",
    name: "Skeleton Loader",
    category: "Placeholders & Empty States",
    type: "feedbackSkeleton",
    description: "Placeholder wireframe loader card shown while dynamic data fetches.",
    options: {},
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>,
  },
  {
    id: "feedback_empty",
    name: "Empty State Screen",
    category: "Placeholders & Empty States",
    type: "feedbackEmptyState",
    description: "Informational screen view shown when a view has no data to display.",
    options: { title: "No Results Found", text: "There is no data to display right now.", buttonText: "+ Create New Entry" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  },
];

export const FeedbackPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createFeedbackControl = useCanvasStore((s: any) => s.createFeedbackControl ?? s.createFormControl);

  if (!isOpen) return null;

  const categories = ["Modals, Dialogs & Toasts", "Alerts & Status Indicators", "Placeholders & Empty States"] as const;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Feedback, Overlays & Status Component Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {categories.map((cat) => {
            const items = FEEDBACK_PRESETS.filter((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div className="panel-section__title" style={{ color: "#ef4444", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  {cat} ({items.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {items.map((preset) => (
                    <div
                      key={preset.id}
                      style={{
                        background: "#1e1e36",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: 14,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => {
                        createFeedbackControl(preset.type, preset.name, preset.options);
                        onClose();
                      }}
                    >
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8 }}>{preset.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#e4e4f0", marginBottom: 2 }}>{preset.name}</div>
                        <div style={{ fontSize: 11, color: "#8888a8", lineHeight: 1.4 }}>{preset.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
