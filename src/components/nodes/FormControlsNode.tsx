import React, { useState } from "react";
import type { CanvasNode, NodesById } from "../../types/canvas";
import { resolveNodeStyle, resolveNodeContent } from "../../utils/nodeResolver";

interface Props {
  node: CanvasNode;
  nodes?: NodesById;
}

export const FormControlsNode: React.FC<Props> = ({ node }) => {
  const resolvedStyle = resolveNodeStyle(node);
  const content = resolveNodeContent(node);

  // Local state for interactive controls in Play Mode
  const [val, setVal] = useState<any>(content.defaultValue);
  const [rating, setRating] = useState<number>(content.rating);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isChecked, setIsChecked] = useState<boolean>(true);
  const [signatureStrokes, setSignatureStrokes] = useState<boolean>(false);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: resolvedStyle.fill || "#1e1e2e",
    borderRadius: resolvedStyle.cornerRadius ? `${resolvedStyle.cornerRadius}px` : "8px",
    border: resolvedStyle.border ? `${resolvedStyle.border.width}px ${resolvedStyle.border.style} ${resolvedStyle.border.color}` : "1px solid rgba(255,255,255,0.15)",
    opacity: resolvedStyle.opacity ?? 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "6px 12px",
    color: "#e4e4f0",
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    userSelect: "none",
  };

  switch (node.type) {
    case "formInput": {
      const inputType = content.inputType || "text";
      if (inputType === "textarea") {
        return (
          <div style={{ ...containerStyle, justifyContent: "flex-start" }}>
            <label style={{ fontSize: 11, color: "#8888a8", marginBottom: 4 }}>{content.text || "Label"}</label>
            <textarea
              style={{
                width: "100%",
                flex: 1,
                background: "transparent",
                border: "none",
                color: "#ffffff",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 13,
              }}
              placeholder={content?.placeholder || "Enter message..."}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        );
      }

      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            {inputType === "search" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8888a8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            )}
            {inputType === "email" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8888a8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            )}
            {inputType === "password" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8888a8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            )}
            <input
              type={inputType}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                outline: "none",
                fontFamily: "inherit",
                fontSize: 13,
              }}
              placeholder={content?.placeholder || `Enter ${node.name.toLowerCase()}...`}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        </div>
      );
    }

    case "formRichText": {
      return (
        <div style={{ ...containerStyle, padding: 0, justifyContent: "flex-start" }}>
          {/* WYSIWYG Toolbar */}
          <div style={{ display: "flex", gap: 4, padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <button style={{ background: "none", border: "none", color: "#e4e4f0", fontWeight: 800, cursor: "pointer", padding: "2px 6px" }}>B</button>
            <button style={{ background: "none", border: "none", color: "#e4e4f0", fontStyle: "italic", cursor: "pointer", padding: "2px 6px" }}>I</button>
            <button style={{ background: "none", border: "none", color: "#e4e4f0", textDecoration: "underline", cursor: "pointer", padding: "2px 6px" }}>U</button>
            <button style={{ background: "none", border: "none", color: "#e4e4f0", cursor: "pointer", padding: "2px 6px" }}>• List</button>
            <button style={{ background: "none", border: "none", color: "#e4e4f0", fontFamily: "monospace", cursor: "pointer", padding: "2px 6px" }}>&lt;/&gt;</button>
          </div>
          <textarea
            style={{
              width: "100%",
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#ffffff",
              resize: "none",
              outline: "none",
              padding: 8,
              fontFamily: "inherit",
              fontSize: 13,
            }}
            placeholder="Write formatted article or comment..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        </div>
      );
    }

    case "formSelect": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{val || content?.text || "Select Option"}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      );
    }

    case "formCheckbox": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: "2px solid #3b82f6",
              background: isChecked ? "#3b82f6" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => setIsChecked(!isChecked)}
          >
            {isChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <span>{node.name || "Checkbox Option"}</span>
        </div>
      );
    }

    case "formRadio": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid #8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => setIsChecked(!isChecked)}
          >
            {isChecked && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6" }} />}
          </div>
          <span>{node.name || "Radio Option"}</span>
        </div>
      );
    }

    case "formSegmented": {
      const tabs = ["Day", "Week", "Month", "Year"];
      return (
        <div style={{ ...containerStyle, padding: 3, flexDirection: "row", gap: 4 }}>
          {tabs.map((tab, idx) => (
            <div
              key={tab}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "6px 0",
                borderRadius: 6,
                background: activeTab === idx ? "#3b82f6" : "transparent",
                fontWeight: activeTab === idx ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => setActiveTab(idx)}
            >
              {tab}
            </div>
          ))}
        </div>
      );
    }

    case "formSlider": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#8888a8" }}>
            <span>{node.name}</span>
            <span>{val || 50}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={val || 50}
            onChange={(e) => setVal(e.target.value)}
            style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
          />
        </div>
      );
    }

    case "formDatePicker": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{val || "Select Date..."}</span>
          </div>
        </div>
      );
    }

    case "formColorPicker": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: val || "#3b82f6", border: "1px solid rgba(255,255,255,0.3)" }} />
          <span>{val || "#3B82F6"}</span>
        </div>
      );
    }

    case "formFileInput": {
      return (
        <div style={{ ...containerStyle, alignItems: "center", justifyContent: "center", textAlign: "center", borderStyle: "dashed" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ marginBottom: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div style={{ fontWeight: 600, fontSize: 12 }}>Drag & drop files here</div>
          <div style={{ fontSize: 10, color: "#8888a8" }}>SVG, PNG, JPG, or PDF up to 10MB</div>
        </div>
      );
    }

    case "formRating": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={star <= rating ? "#f59e0b" : "none"}
                stroke="#f59e0b"
                strokeWidth="2"
                style={{ cursor: "pointer" }}
                onClick={() => setRating(star)}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </div>
      );
    }

    case "formSignature": {
      return (
        <div style={{ ...containerStyle, padding: 8, justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, color: "#8888a8", display: "flex", justifyContent: "space-between" }}>
            <span>Sign Here</span>
            <span style={{ cursor: "pointer", color: "#ef4444" }} onClick={() => setSignatureStrokes(false)}>Clear</span>
          </div>
          <div
            style={{
              flex: 1,
              margin: "6px 0",
              borderBottom: "1px dashed rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "crosshair",
            }}
            onClick={() => setSignatureStrokes(true)}
          >
            {signatureStrokes ? (
              <svg width="200" height="60" viewBox="0 0 200 60"><path d="M 10 30 Q 30 10, 50 30 T 90 30 T 130 10 T 170 40" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/></svg>
            ) : (
              <span style={{ fontSize: 11, color: "#666680" }}>Click or drag to sign</span>
            )}
          </div>
        </div>
      );
    }

    case "formMap": {
      return (
        <div style={{ ...containerStyle, padding: 0, position: "relative" }}>
          <div style={{ width: "100%", height: "100%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" style={{ margin: "0 auto 4px" }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="12" r="3"/></svg>
              <div style={{ fontWeight: 600, fontSize: 12 }}>San Francisco, CA</div>
            </div>
          </div>
        </div>
      );
    }

    case "formCodeEditor": {
      return (
        <div style={{ ...containerStyle, padding: 0, justifyContent: "flex-start", fontFamily: "monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "#111122", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}>
            <span style={{ color: "#3b82f6" }}>JavaScript</span>
            <span style={{ color: "#8888a8", cursor: "pointer" }}>Copy</span>
          </div>
          <div style={{ display: "flex", flex: 1, padding: 8 }}>
            <div style={{ color: "#666680", paddingRight: 10, userSelect: "none", textAlign: "right" }}>1<br/>2<br/>3<br/>4</div>
            <textarea
              style={{ flex: 1, background: "transparent", border: "none", color: "#67e8f9", resize: "none", outline: "none", fontFamily: "monospace", fontSize: 12 }}
              value={val || "const app = express();\napp.use(cors());\napp.listen(3000);"}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        </div>
      );
    }

    case "formOtpPin": {
      return (
        <div style={containerStyle}>
          <div style={{ fontSize: 11, color: "#8888a8", marginBottom: 6 }}>Enter 6-Digit OTP Code</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["5", "9", "2", "1", "0", "4"].map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                style={{ width: 32, height: 36, textAlign: "center", background: "rgba(255,255,255,0.05)", border: "1px solid #3b82f6", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 15 }}
              />
            ))}
          </div>
        </div>
      );
    }

    case "formCreditCard": {
      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#8888a8" }}>Credit / Debit Card</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>VISA</span>
          </div>
          <input
            type="text"
            placeholder="4532 •••• •••• 8892"
            style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#fff", outline: "none", fontSize: 14, fontFamily: "monospace" }}
          />
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#8888a8" }}>
            <span>EXP: MM/YY</span>
            <span>CVC: •••</span>
          </div>
        </div>
      );
    }

    case "formTagInput": {
      const tags = ["React", "Next.js", "Tailwind"];
      return (
        <div style={{ ...containerStyle, flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {tags.map((t) => (
            <span key={t} style={{ background: "#3b82f622", border: "1px solid #3b82f6", color: "#93c5fd", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
              {t} ✕
            </span>
          ))}
          <span style={{ color: "#666680", fontSize: 11 }}>+ Add tag</span>
        </div>
      );
    }

    case "formDualSlider": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#8888a8" }}>
            <span>Price Range</span>
            <span>$20 - $150</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, position: "relative" }}>
            <div style={{ position: "absolute", left: "20%", right: "30%", top: 0, bottom: 0, background: "#8b5cf6", borderRadius: 3 }} />
          </div>
        </div>
      );
    }

    case "formVoiceRecorder": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
            </div>
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>00:14</span>
          </div>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[12, 24, 16, 28, 10, 22, 18, 26, 14, 20].map((h, idx) => (
              <div key={idx} style={{ width: 3, height: h, background: "#ef4444", borderRadius: 2 }} />
            ))}
          </div>
        </div>
      );
    }

    case "formAvatarUpload": {
      return (
        <div style={{ ...containerStyle, alignItems: "center", justifyContent: "center", borderRadius: "50%", width: "100%", height: "100%", padding: 0, position: "relative", background: "#312e81" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div style={{ position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
      );
    }

    case "formEmojiPicker": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", justifyContent: "space-around", fontSize: 18 }}>
          {["😀", "😂", "❤️", "👍", "🎉", "🚀", "💡", "🔥"].map((emoji) => (
            <span key={emoji} style={{ cursor: "pointer" }}>{emoji}</span>
          ))}
        </div>
      );
    }

    case "formStepper": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#8888a8" }}>Quantity</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>
            <button style={{ background: "none", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>-</button>
            <span style={{ fontWeight: 700 }}>1</span>
            <button style={{ background: "none", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
        </div>
      );
    }

    case "formToggleGroup": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", gap: 6, padding: 4 }}>
          {["Light", "Dark", "Auto"].map((theme, idx) => (
            <div key={theme} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: idx === 1 ? "#3b82f6" : "transparent", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
              {theme}
            </div>
          ))}
        </div>
      );
    }

    case "formAccordion": {
      return (
        <div style={{ ...containerStyle, padding: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600 }}>
            <span>What is CanvasSite Builder?</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div style={{ fontSize: 11, color: "#8888a8", marginTop: 4 }}>Visual web app canvas designer with multi-framework code exporters.</div>
        </div>
      );
    }

    case "formCaptcha": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between", background: "#181824", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, border: "2px solid #666", borderRadius: 4, background: "#fff", cursor: "pointer" }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>I'm not a robot</span>
          </div>
          <div style={{ textAlign: "right", fontSize: 9, color: "#666680" }}>reCAPTCHA<br/>Privacy - Terms</div>
        </div>
      );
    }

    case "formGradientPicker": {
      return (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#8888a8" }}>
            <span>Linear Gradient</span>
            <span>135°</span>
          </div>
          <div style={{ height: 16, borderRadius: 4, background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)", border: "1px solid rgba(255,255,255,0.2)" }} />
        </div>
      );
    }

    case "formCurrency": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#10b981", fontWeight: 700 }}>USD $</span>
          <input type="text" placeholder="1,250.00" style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none", fontSize: 14, fontWeight: 700 }} />
        </div>
      );
    }

    case "formTimeRange": {
      return (
        <div style={{ ...containerStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#8888a8" }}>Schedule Slot</span>
          <span style={{ fontWeight: 600, color: "#3b82f6" }}>09:00 AM - 05:00 PM</span>
        </div>
      );
    }

    default:
      return <div style={containerStyle}>{node.name}</div>;
  }
};
