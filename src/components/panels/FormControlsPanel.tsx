import React from "react";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementType } from "../../types/canvas";
import "./PanelStyles.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FormPreset {
  id: string;
  name: string;
  category: "Text Inputs" | "Selection Controls" | "Pickers & Ranges" | "Direct Actions";
  type: ElementType;
  description: string;
  options?: any;
  icon: React.ReactNode;
}

const FORM_PRESETS: FormPreset[] = [
  // Text Inputs
  {
    id: "text_input",
    name: "Text Input",
    category: "Text Inputs",
    type: "formInput",
    description: "Single-line alphanumeric text field with label.",
    options: { inputType: "text", label: "Full Name" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  },
  {
    id: "email_input",
    name: "Email Input",
    category: "Text Inputs",
    type: "formInput",
    description: "Email address field with mail icon.",
    options: { inputType: "email", label: "Email Address" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
  {
    id: "password_input",
    name: "Password Field",
    category: "Text Inputs",
    type: "formInput",
    description: "Masked password field with lock icon.",
    options: { inputType: "password", label: "Password" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
  {
    id: "search_input",
    name: "Search Bar",
    category: "Text Inputs",
    type: "formInput",
    description: "Search query bar with search icon.",
    options: { inputType: "search", label: "Search Website" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    id: "textarea",
    name: "Textarea (Multi-line)",
    category: "Text Inputs",
    type: "formInput",
    description: "Multi-line text input for comments and messages.",
    options: { inputType: "textarea", label: "Comments & Feedback" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: "wysiwyg",
    name: "Rich Text Editor (WYSIWYG)",
    category: "Text Inputs",
    type: "formRichText",
    description: "Rich text editor with formatting toolbar (Bold, List, Link).",
    options: { label: "Article Content" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },

  // Code & Security Inputs
  {
    id: "code_editor",
    name: "Code Editor (Syntax)",
    category: "Text Inputs",
    type: "formCodeEditor",
    description: "Monaco-style code block with line numbers & copy action.",
    options: { label: "Code Snippet" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
  {
    id: "otp_pin",
    name: "OTP / PIN Verification",
    category: "Text Inputs",
    type: "formOtpPin",
    description: "6-digit verification code input boxes.",
    options: { label: "Security OTP" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
  {
    id: "credit_card",
    name: "Credit Card Payment",
    category: "Text Inputs",
    type: "formCreditCard",
    description: "Card number, expiry, and CVC input fields.",
    options: { label: "Payment Method" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    id: "currency",
    name: "Currency & Money Input",
    category: "Text Inputs",
    type: "formCurrency",
    description: "Formatted money field with currency symbol.",
    options: { label: "Budget Amount" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },

  // Selection Controls
  {
    id: "checkbox",
    name: "Checkbox Toggle",
    category: "Selection Controls",
    type: "formCheckbox",
    description: "Multi-item selection or terms agreement checkbox.",
    options: { label: "I agree to Terms & Conditions" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    id: "radio",
    name: "Radio Option",
    category: "Selection Controls",
    type: "formRadio",
    description: "Single-choice radio button list item.",
    options: { label: "Standard Shipping" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>,
  },
  {
    id: "select",
    name: "Dropdown Select",
    category: "Selection Controls",
    type: "formSelect",
    description: "Collapsible single option dropdown menu.",
    options: { label: "Select Country" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  },
  {
    id: "tag_input",
    name: "Tag / Chip Input",
    category: "Selection Controls",
    type: "formTagInput",
    description: "Type & press enter to generate removable chips.",
    options: { label: "Skills & Tags" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  },
  {
    id: "toggle_group",
    name: "Toggle Pill Group",
    category: "Selection Controls",
    type: "formToggleGroup",
    description: "Horizontal choice buttons for small option groups.",
    options: { label: "Theme Preference" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="4"/></svg>,
  },
  {
    id: "segmented",
    name: "Segmented Control",
    category: "Selection Controls",
    type: "formSegmented",
    description: "Horizontal tab buttons for toggling small option groups.",
    options: { label: "View Mode" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="3"/><line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/></svg>,
  },

  // Pickers & Ranges
  {
    id: "range_slider",
    name: "Range Track Slider",
    category: "Pickers & Ranges",
    type: "formSlider",
    description: "Continuous numeric range track slider.",
    options: { label: "Price Range ($)" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="4"/></svg>,
  },
  {
    id: "dual_slider",
    name: "Dual Range Slider",
    category: "Pickers & Ranges",
    type: "formDualSlider",
    description: "Min & Max dual thumb range selector.",
    options: { label: "Min / Max Range" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>,
  },
  {
    id: "date_picker",
    name: "Date & Time Picker",
    category: "Pickers & Ranges",
    type: "formDatePicker",
    description: "Visual calendar date and time selection input.",
    options: { label: "Booking Date" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    id: "time_range",
    name: "Time Slot Schedule",
    category: "Pickers & Ranges",
    type: "formTimeRange",
    description: "Start & end time range slot picker.",
    options: { label: "Schedule Slot" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    id: "color_picker",
    name: "Color Swatch Picker",
    category: "Pickers & Ranges",
    type: "formColorPicker",
    description: "Hex & RGB color swatch selection control.",
    options: { label: "Primary Theme Color" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.5-.67 1.5-1.5 0-.42-.16-.8-.42-1.08-.27-.29-.42-.68-.42-1.11 0-.9.7-1.6 1.6-1.6h2.24C19.52 16.71 22 14.1 22 11c0-4.97-4.48-9-10-9z"/></svg>,
  },
  {
    id: "gradient_picker",
    name: "Color Gradient Picker",
    category: "Pickers & Ranges",
    type: "formGradientPicker",
    description: "Linear & radial color gradient stops bar.",
    options: { label: "Background Gradient" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l18-6"/></svg>,
  },
  {
    id: "file_upload",
    name: "File Upload Dropzone",
    category: "Pickers & Ranges",
    type: "formFileInput",
    description: "Drag-and-drop file upload container.",
    options: { label: "Upload Documents" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
  {
    id: "avatar_upload",
    name: "Avatar & Image Cropper",
    category: "Pickers & Ranges",
    type: "formAvatarUpload",
    description: "Profile picture uploader with circular preview mask.",
    options: { label: "Profile Avatar" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },

  // Direct Actions & Media Widgets
  {
    id: "stepper",
    name: "Numeric Stepper Counter",
    category: "Direct Actions",
    type: "formStepper",
    description: "Quantity counter button box (- / +).",
    options: { label: "Item Quantity" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>,
  },
  {
    id: "rating_widget",
    name: "5-Star Rating Widget",
    category: "Direct Actions",
    type: "formRating",
    description: "Interactive 5-star rating scale.",
    options: { label: "Product Rating" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    id: "emoji_picker",
    name: "Emoji & Reaction Bar",
    category: "Direct Actions",
    type: "formEmojiPicker",
    description: "Quick emoji reaction bar picker.",
    options: { label: "Post Reaction" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  },
  {
    id: "voice_recorder",
    name: "Audio / Voice Recorder",
    category: "Direct Actions",
    type: "formVoiceRecorder",
    description: "Microphone recorder with live audio waveform graph.",
    options: { label: "Voice Note" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  },
  {
    id: "signature_pad",
    name: "Signature Canvas Pad",
    category: "Direct Actions",
    type: "formSignature",
    description: "Pointer- & touch-driven freehand signature canvas.",
    options: { label: "User Signature" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>,
  },
  {
    id: "accordion",
    name: "Accordion / Collapsible",
    category: "Direct Actions",
    type: "formAccordion",
    description: "Expandable collapsible section toggle block.",
    options: { label: "FAQ Accordion" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><path d="M8 14l4 4 4-4"/></svg>,
  },
  {
    id: "captcha",
    name: "reCAPTCHA Security Check",
    category: "Direct Actions",
    type: "formCaptcha",
    description: "I'm not a robot security verification widget.",
    options: { label: "Security Verification" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    id: "map_picker",
    name: "Interactive Map Picker",
    category: "Direct Actions",
    type: "formMap",
    description: "Draggable map pin spatial location selector.",
    options: { label: "Store Location" },
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
];

export const FormControlsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const createFormControl = useCanvasStore((s) => s.createFormControl);

  if (!isOpen) return null;

  const categories = ["Text Inputs", "Selection Controls", "Pickers & Ranges", "Direct Actions"] as const;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 880 }}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Interactive Form & Input Controls Library
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body" style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {categories.map((cat) => {
            const items = FORM_PRESETS.filter((p) => p.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div className="panel-section__title" style={{ color: "#3b82f6", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                  {cat} ({items.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
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
                        createFormControl(preset.type, preset.name, preset.options);
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
