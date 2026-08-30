import type { CanvasNode, NodesById, Geometry, Style, BreakpointId } from "../types/canvas";
import { getEffectiveNode } from "./breakpoint";

export interface ResolvedBox extends Geometry {
  relativeX: number;
  relativeY: number;
  isChildOfGroup: boolean;
}

export interface ResolvedStyle extends Style {
  isVectorShape: boolean;
}

export interface ResolvedContent {
  kind?: string;
  text?: string;
  title?: string;
  subtitle?: string;
  brand?: string;
  workspaceTitle?: string;
  links: string[];
  signInText: string;
  ctaText: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  buttonText: string;
  confirmText: string;
  cancelText: string;
  badge: string;
  options: string[];
  items: any[];
  sections: string[];
  trail: string[];
  tabs: string[];
  cols: any[];
  tiers: any[];
  reviews: any[];
  members: any[];
  features: any[];
  copyright: string;
  placeholder: string;
  defaultValue: string;
  rating: number;
  rows: any[];
  variant: string;
  trigger: string;
  alertType: string;
  label: string;
  inputType: string;
  columns: any[];
  slides: any[];

  // Visibility Switches
  showLogo: boolean;
  showLinks: boolean;
  showSignIn: boolean;
  showCta: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showBadge: boolean;
  showText: boolean;
  showButton: boolean;
  showConfirmBtn: boolean;
  showCancelBtn: boolean;

  // Form Control Fields
  minValue: number;
  maxValue: number;
  step: number;
  value: number;
  progressVal: number;
  dualValues: [number, number];
  date: string;
  time: string;
  color: string;
  tags: string[];
  emojis: string[];
  code: string;
  language: string;
  pinLength: number;
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  accordions: any[];
}

/**
 * Resolves exact box geometry for canvas and exporters.
 * Handles group child relative coordinates (fixes double-offset bug).
 */
export function resolveNodeBox(node: CanvasNode, nodes: NodesById, breakpoint: BreakpointId = "desktop"): ResolvedBox {
  const effective = getEffectiveNode(node, breakpoint);
  const geom = effective.geometry;

  let relativeX = geom.x;
  let relativeY = geom.y;
  let isChildOfGroup = false;

  if (node.parentId && nodes[node.parentId]) {
    const parentNode = nodes[node.parentId];
    const parentEffective = getEffectiveNode(parentNode, breakpoint);
    relativeX = geom.x - parentEffective.geometry.x;
    relativeY = geom.y - parentEffective.geometry.y;
    isChildOfGroup = true;
  }

  return {
    ...geom,
    relativeX,
    relativeY,
    isChildOfGroup,
  };
}

/**
 * Resolves normalized visual styling parameters.
 */
export function resolveNodeStyle(node: CanvasNode, breakpoint: BreakpointId = "desktop"): ResolvedStyle {
  const effective = getEffectiveNode(node, breakpoint);
  const s = effective.style || {};

  const vectorTypes = new Set([
    "polygon",
    "circle",
    "curve",
    "star",
    "shape3d",
    "brush",
    "pencil",
    "pen",
    "line",
  ]);

  const isVectorShape = vectorTypes.has(node.type);

  return {
    fill: s.fill ?? "transparent",
    gradient: s.gradient,
    cornerRadius: s.cornerRadius ?? 0,
    border: s.border,
    opacity: s.opacity ?? 1,
    shadow: s.shadow,
    blur: s.blur,
    backgroundBlur: s.backgroundBlur,
    typography: {
      fontFamily: s.typography?.fontFamily || "Inter, sans-serif",
      fontSize: s.typography?.fontSize || 14,
      fontWeight: s.typography?.fontWeight || 400,
      color: s.typography?.color || "#ffffff",
      align: s.typography?.align || "left",
      lineHeight: s.typography?.lineHeight || 1.4,
      letterSpacing: s.typography?.letterSpacing || 0,
      textTransform: s.typography?.textTransform || "none",
      textDecoration: s.typography?.textDecoration || "none",
    },
    sides: s.sides ?? 5,
    depth3d: s.depth3d ?? 0,
    color3d: s.color3d ?? "#1E40AF",
    brushSize: s.brushSize ?? 2,
    starPoints: s.starPoints ?? 5,
    innerRadius: s.innerRadius ?? 0.5,
    curvature: s.curvature ?? 50,
    isVectorShape,
  };
}

/**
 * Resolves content values and fallback defaults for canvas and exporters.
 */
export function resolveNodeContent(node: CanvasNode): ResolvedContent {
  const c = (node.content as any) || {};

  return {
    kind: c.kind,
    text: c.text ?? c.title ?? node.name,
    title: c.title ?? c.text ?? node.name,
    subtitle: c.subtitle ?? "",
    brand: c.brand ?? "CanvasSite",
    workspaceTitle: c.workspaceTitle ?? c.brand ?? "Workspace",
    links: Array.isArray(c.links) ? c.links : (Array.isArray(c.trail) ? c.trail : ["Home", "Features", "Pricing", "Docs"]),
    signInText: c.signInText ?? "Sign In",
    ctaText: c.ctaText ?? "Get Started",
    primaryButtonText: c.primaryButtonText ?? c.buttonText ?? "Get Started",
    secondaryButtonText: c.secondaryButtonText ?? "Learn More",
    buttonText: c.buttonText ?? c.primaryButtonText ?? "Learn More →",
    confirmText: c.confirmText ?? "Confirm",
    cancelText: c.cancelText ?? "Cancel",
    badge: c.badge ?? "PRO",
    options: Array.isArray(c.options) ? c.options : ["Option 1", "Option 2", "Option 3"],
    items: Array.isArray(c.items)
      ? c.items
      : [
          { label: "Overview", icon: "📊" },
          { label: "Analytics", icon: "📈" },
          { label: "Projects", icon: "📁" },
          { label: "Settings", icon: "⚙️" },
        ],
    sections: Array.isArray(c.sections) ? c.sections : ["1. Introduction", "2. Setup", "3. API Reference"],
    trail: Array.isArray(c.trail) ? c.trail : ["Home", "Dashboard", "Overview"],
    tabs: Array.isArray(c.tabs) ? c.tabs : ["Overview", "Analytics", "Reports", "Settings"],
    cols: Array.isArray(c.cols)
      ? c.cols
      : [
          { title: "Product", links: ["Features", "Pricing", "Templates", "Integrations"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
          { title: "Support", links: ["Help Center", "Documentation", "Status", "Contact"] },
        ],
    tiers: Array.isArray(c.tiers)
      ? c.tiers
      : [
          { name: "Starter", price: "$9", period: "/mo", cta: "Choose Starter", popular: false, features: ["1 Project", "Basic Analytics"] },
          { name: "Pro", price: "$29", period: "/mo", cta: "Get Started", popular: true, features: ["Unlimited Projects", "Custom Domain", "Priority Support"] },
          { name: "Enterprise", price: "$99", period: "/mo", cta: "Contact Sales", popular: false, features: ["Dedicated Server", "SLA Guarantee", "24/7 Phone Support"] },
        ],
    reviews: Array.isArray(c.reviews)
      ? c.reviews
      : [
          { name: "Sarah K.", role: "CEO, TechCorp", text: "This tool transformed our workflow entirely. Highly recommended!", stars: 5 },
          { name: "James L.", role: "Designer, Studio", text: "The best website builder I've ever used. Beautiful results.", stars: 5 },
          { name: "Maria G.", role: "Freelancer", text: "Incredible value for money. My clients love the sites I build.", stars: 4 },
        ],
    members: Array.isArray(c.members)
      ? c.members
      : [
          { name: "Alex Rivera", role: "CEO & Founder", color: "#6366f1" },
          { name: "Jordan Chen", role: "Lead Designer", color: "#ec4899" },
          { name: "Sam Patel", role: "CTO", color: "#10b981" },
          { name: "Casey Kim", role: "Head of Marketing", color: "#f59e0b" },
        ],
    features: Array.isArray(c.features)
      ? c.features
      : [
          { icon: "⚡", title: "Lightning Fast", desc: "Optimized for speed with instant loading times." },
          { icon: "🎨", title: "Fully Customizable", desc: "Tailor every detail to match your brand." },
          { icon: "📱", title: "Responsive", desc: "Looks perfect on every device and screen size." },
          { icon: "🔒", title: "Secure", desc: "Enterprise-grade security for your peace of mind." },
          { icon: "📊", title: "Analytics", desc: "Built-in insights to track your growth." },
          { icon: "🚀", title: "One-Click Deploy", desc: "Publish your site in seconds, not hours." },
        ],
    copyright: c.copyright ?? "© 2024 CanvasSite. All rights reserved.",
    placeholder: c.placeholder ?? `Enter ${node.name.toLowerCase()}...`,
    defaultValue: c.defaultValue ?? "",
    rating: typeof c.rating === "number" ? c.rating : 4,
    rows: Array.isArray(c.rows) ? c.rows : [
      { id: "1", name: "Project Alpha", status: "Active", budget: "$12,400" },
      { id: "2", name: "Beta Release", status: "Pending", budget: "$8,200" },
      { id: "3", name: "Design System", status: "Completed", budget: "$15,000" },
    ],
    variant: c.variant ?? "primary",
    trigger: c.trigger ?? "Hover for Details",
    alertType: c.alertType ?? "warning",
    label: c.label ?? c.text ?? "Label",
    inputType: c.inputType ?? "text",
    columns: Array.isArray(c.columns) ? c.columns : (Array.isArray(c.cols) ? c.cols : ["Column A", "Column B", "Column C"]),
    slides: Array.isArray(c.slides) ? c.slides : ["Slide 1", "Slide 2", "Slide 3"],

    // Sub-element Visibility Switches
    showLogo: c.showLogo !== false,
    showLinks: c.showLinks !== false,
    showSignIn: c.showSignIn !== false,
    showCta: c.showCta !== false,
    showTitle: c.showTitle !== false,
    showSubtitle: c.showSubtitle !== false,
    showBadge: c.showBadge !== false,
    showText: c.showText !== false,
    showButton: c.showButton !== false,
    showConfirmBtn: c.showConfirmBtn !== false,
    showCancelBtn: c.showCancelBtn !== false,

    // Form Control Specific Defaults
    minValue: typeof c.minValue === "number" ? c.minValue : 0,
    maxValue: typeof c.maxValue === "number" ? c.maxValue : 100,
    step: typeof c.step === "number" ? c.step : 1,
    value: typeof c.value === "number" ? c.value : 50,
    progressVal: typeof c.progressVal === "number" ? c.progressVal : (typeof c.progress === "number" ? c.progress : 68),
    dualValues: Array.isArray(c.dualValues) ? c.dualValues : [20, 80],
    date: c.date || "2026-08-24",
    time: c.time || "12:00",
    color: c.color || "#3b82f6",
    tags: Array.isArray(c.tags) ? c.tags : ["Design", "React", "CSS"],
    emojis: Array.isArray(c.emojis) ? c.emojis : ["👍", "❤️", "🔥", "🚀", "🎉"],
    code: c.code || "const greeting = 'Hello Canvas';",
    language: c.language || "javascript",
    pinLength: typeof c.pinLength === "number" ? c.pinLength : 4,
    cardHolder: c.cardHolder || "Alex Rivera",
    cardNumber: c.cardNumber || "•••• •••• •••• 4242",
    expiry: c.expiry || "12/28",
    cvv: c.cvv || "•••",
    accordions: Array.isArray(c.accordions)
      ? c.accordions
      : [
          { title: "Is it customizable?", content: "Yes, fully customizable styling and layout." },
          { title: "What code formats are supported?", content: "Clean HTML/CSS, React TS, Next.js, and Tailwind CSS." },
        ],
  };
}

/**
 * Returns top-level nodes in Spatial Layout order (Y ascending top-to-bottom, X ascending left-to-right).
 */
export function getRenderTree(nodes: NodesById): CanvasNode[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === null)
    .sort((a, b) => {
      if (Math.abs(a.geometry.y - b.geometry.y) > 10) {
        return a.geometry.y - b.geometry.y;
      }
      if (Math.abs(a.geometry.x - b.geometry.x) > 10) {
        return a.geometry.x - b.geometry.x;
      }
      return a.order - b.order;
    });
}
