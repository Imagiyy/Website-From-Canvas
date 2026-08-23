import React from "react";
import type { CanvasNode } from "../../types/canvas";

interface Props {
  node: CanvasNode;
}

export const PageSectionNode: React.FC<Props> = React.memo(({ node }) => {
  const { x, y, width, height, rotation } = node.geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const renderContent = () => {
    switch (node.type) {
      case "sectionHero": {
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", textAlign: "center", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.1) 0%, transparent 50%)", pointerEvents: "none" }} />
            <div style={{ fontSize: Math.min(32, width * 0.06), fontWeight: 800, lineHeight: 1.1, zIndex: 1, letterSpacing: "-0.02em" }}>Build Something Amazing</div>
            <div style={{ fontSize: Math.min(16, width * 0.03), color: "#94a3b8", maxWidth: "80%", lineHeight: 1.5, zIndex: 1 }}>Create stunning websites with our intuitive drag-and-drop builder. No coding required.</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, zIndex: 1 }}>
              <div style={{ padding: "10px 24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff" }}>Get Started</div>
              <div style={{ padding: "10px 24px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Learn More</div>
            </div>
          </div>
        );
      }

      case "sectionPricing": {
        const tiers = [
          { name: "Basic", price: "$9", features: ["5 Projects", "1GB Storage", "Email Support"] },
          { name: "Pro", price: "$29", features: ["Unlimited Projects", "10GB Storage", "Priority Support", "Custom Domain"], featured: true },
          { name: "Enterprise", price: "$99", features: ["Everything in Pro", "100GB Storage", "Dedicated Manager", "SLA Guarantee", "SSO"] },
        ];
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
            <div style={{ fontSize: Math.min(22, width * 0.04), fontWeight: 700 }}>Choose Your Plan</div>
            <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flex: 1 }}>
              {tiers.map((t) => (
                <div key={t.name} style={{ flex: 1, maxWidth: "32%", background: t.featured ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))" : "rgba(255,255,255,0.04)", border: t.featured ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.featured ? "#a78bfa" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.name}</div>
                  <div style={{ fontSize: Math.min(28, width * 0.05), fontWeight: 800 }}>{t.price}<span style={{ fontSize: 12, color: "#64748b" }}>/mo</span></div>
                  {t.features.map((f) => (
                    <div key={f} style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#10b981" }}>✓</span> {f}
                    </div>
                  ))}
                  <div style={{ marginTop: "auto", padding: "8px 16px", background: t.featured ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 11, fontWeight: 600, textAlign: "center", color: "#fff", cursor: "pointer" }}>
                    {t.featured ? "Get Started" : "Choose Plan"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "sectionTestimonials": {
        const reviews = [
          { name: "Sarah K.", role: "CEO, TechCorp", text: "This tool transformed our workflow entirely. Highly recommended!", stars: 5 },
          { name: "James L.", role: "Designer, Studio", text: "The best website builder I've ever used. Beautiful results.", stars: 5 },
          { name: "Maria G.", role: "Freelancer", text: "Incredible value for money. My clients love the sites I build.", stars: 4 },
        ];
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
            <div style={{ fontSize: Math.min(22, width * 0.04), fontWeight: 700 }}>What Our Users Say</div>
            <div style={{ display: "flex", gap: 12, width: "100%", flex: 1 }}>
              {reviews.map((r) => (
                <div key={r.name} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#fbbf24" }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, fontStyle: "italic", flex: 1 }}>"{r.text}"</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{r.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "sectionTeam": {
        const members = [
          { name: "Alex Rivera", role: "CEO & Founder", color: "#6366f1" },
          { name: "Jordan Chen", role: "Lead Designer", color: "#ec4899" },
          { name: "Sam Patel", role: "CTO", color: "#10b981" },
          { name: "Casey Kim", role: "Head of Marketing", color: "#f59e0b" },
        ];
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
            <div style={{ fontSize: Math.min(22, width * 0.04), fontWeight: 700 }}>Meet Our Team</div>
            <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flex: 1, flexWrap: "wrap" }}>
              {members.map((m) => (
                <div key={m.name} style={{ width: "22%", minWidth: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${m.color}, ${m.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                    {m.name.charAt(0)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>{m.role}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {["twitter", "linkedin", "github"].map((s) => (
                      <div key={s} style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#94a3b8" }}>
                        {s.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "sectionFeatures": {
        const features = [
          { icon: "⚡", title: "Lightning Fast", desc: "Optimized for speed with instant loading times." },
          { icon: "🎨", title: "Fully Customizable", desc: "Tailor every detail to match your brand." },
          { icon: "📱", title: "Responsive", desc: "Looks perfect on every device and screen size." },
          { icon: "🔒", title: "Secure", desc: "Enterprise-grade security for your peace of mind." },
          { icon: "📊", title: "Analytics", desc: "Built-in insights to track your growth." },
          { icon: "🚀", title: "One-Click Deploy", desc: "Publish your site in seconds, not hours." },
        ];
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
            <div style={{ fontSize: Math.min(22, width * 0.04), fontWeight: 700 }}>Powerful Features</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%", flex: 1 }}>
              {features.map((f) => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 22 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "sectionCTA": {
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)", borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, boxSizing: "border-box", color: "#fff", fontFamily: "Inter, sans-serif", textAlign: "center", overflow: "hidden" }}>
            <div style={{ fontSize: Math.min(28, width * 0.05), fontWeight: 800, lineHeight: 1.1 }}>Ready to Get Started?</div>
            <div style={{ fontSize: Math.min(14, width * 0.025), color: "rgba(255,255,255,0.8)", maxWidth: "70%", lineHeight: 1.5 }}>Join thousands of creators building beautiful websites today. Start your free trial now.</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <div style={{ padding: "12px 28px", background: "#fff", color: "#4f46e5", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Start Free Trial</div>
              <div style={{ padding: "12px 28px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Contact Sales</div>
            </div>
          </div>
        );
      }

      case "sectionFooter": {
        const cols = [
          { title: "Product", links: ["Features", "Pricing", "Templates", "Integrations"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
          { title: "Support", links: ["Help Center", "Documentation", "Status", "Contact"] },
        ];
        return (
          <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16, boxSizing: "border-box", color: "#f1f5f9", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 24, flex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>CanvasSite</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>Build beautiful websites without writing code. Trusted by 10,000+ creators worldwide.</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {["T", "L", "G", "I"].map((s) => (
                    <div key={s} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s}</div>
                  ))}
                </div>
              </div>
              {cols.map((c) => (
                <div key={c.title} style={{ flex: 0.7 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.title}</div>
                  {c.links.map((l) => (
                    <div key={l} style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6, cursor: "pointer" }}>{l}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, fontSize: 11, color: "#475569", textAlign: "center" }}>
              © 2024 CanvasSite. All rights reserved.
            </div>
          </div>
        );
      }

      default:
        return <div data-node-id={node.id} style={{ width: "100%", height: "100%", background: "#1e1e2e", borderRadius: 8, padding: 16, color: "#aaa", fontFamily: "sans-serif", fontSize: 12 }}>Section</div>;
    }
  };

  return (
    <g transform={rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : undefined}>
      <foreignObject data-node-id={node.id} x={x} y={y} width={width} height={height} style={{ overflow: "visible" }}>
        {renderContent()}
      </foreignObject>
    </g>
  );
});

PageSectionNode.displayName = "PageSectionNode";
