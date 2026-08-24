// CanvasSite data model — Extended for Phases 2-4
// Supports: components, pen tool, effects, layout, interactions, comments, CMS, e-commerce, SEO

export type NodeId = string;
export type BreakpointId = "desktop" | "tablet" | "mobile";

export type ElementType =
  | "rectangle"
  | "text"
  | "image"
  | "line"
  | "group"
  | "polygon"
  | "circle"
  | "curve"
  | "star"
  | "shape3d"
  | "brush"
  | "pencil"
  | "pen"
  | "component"
  | "componentInstance"
  | "product"
  | "formInput"
  | "formSelect"
  | "formCheckbox"
  | "formRadio"
  | "formSlider"
  | "formDatePicker"
  | "formColorPicker"
  | "formFileInput"
  | "formRating"
  | "formSignature"
  | "formMap"
  | "formSegmented"
  | "formRichText"
  | "formCodeEditor"
  | "formOtpPin"
  | "formCreditCard"
  | "formTagInput"
  | "formDualSlider"
  | "formVoiceRecorder"
  | "formAvatarUpload"
  | "formEmojiPicker"
  | "formStepper"
  | "formToggleGroup"
  | "formAccordion"
  | "formCaptcha"
  | "formGradientPicker"
  | "formCurrency"
  | "formTimeRange"
  | "navHeader"
  | "navSidebar"
  | "navBreadcrumb"
  | "navPagination"
  | "navTabs"
  | "navToc"
  | "dataCard"
  | "dataTable"
  | "dataList"
  | "dataBadge"
  | "dataAccordion"
  | "dataTooltip"
  | "feedbackModal"
  | "feedbackToast"
  | "feedbackAlert"
  | "feedbackProgress"
  | "feedbackSkeleton"
  | "feedbackEmptyState"
  | "layoutContainer"
  | "layoutCarousel"
  | "mediaPlayer"
  | "layoutDivider"
  | "actionButton"
  | "actionMenu"
  | "sectionHero"
  | "sectionPricing"
  | "sectionTestimonials"
  | "sectionTeam"
  | "sectionFeatures"
  | "sectionCTA"
  | "sectionFooter"
  | "embedCode"
  | "embedIframe"
  | "iconElement";

export type BreakpointKey = "desktop" | "tablet" | "mobile";

export const BREAKPOINT_WIDTHS: Record<BreakpointKey, number | null> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

export const DEFAULT_PAGE_HEIGHTS: Record<BreakpointKey, number> = {
  desktop: 1200,
  tablet: 1400,
  mobile: 1600,
};

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing?: number; // px tracking (-5 to 20px)
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
}

export interface ShadowStyle {
  color: string;
  x: number;
  y: number;
  blur: number;
}

export interface GradientFill {
  type: "linear" | "radial";
  startColor: string;
  endColor: string;
  angle?: number; // 0-360 deg
}

// ---------- Effects & Filters (2.4) ----------

export interface BorderStyle {
  color: string;
  width: number;
  style: "solid" | "dashed" | "dotted";
}

export interface FillLayer {
  id: string;
  type: "solid" | "gradient";
  color?: string;
  gradient?: GradientFill;
  opacity: number;
  visible: boolean;
}

// ---------- Layout Constraints (2.5) ----------

export interface LayoutConstraints {
  display?: "absolute" | "flex";
  flexDirection?: "row" | "column";
  gap?: number;
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap?: boolean;
  pinX?: "none" | "left" | "right" | "both" | "center";
  pinLeft?: boolean;
  pinRight?: boolean;
  pinTop?: boolean;
  pinBottom?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

// ---------- Interactions & Animations (2.6) ----------

export type ClickActionType = "navigateTo" | "openUrl" | "toggleVisibility" | "scrollTo" | "none";

export interface ClickAction {
  type: ClickActionType;
  target?: string; // page slug, URL, element ID, or section ID
  openInNewTab?: boolean;
}

export type AnimationType = "fadeIn" | "slideInLeft" | "slideInRight" | "slideInUp" | "slideInDown" | "scaleIn" | "rotateIn" | "bounceIn" | "none";
export type EasingType = "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | "cubic-bezier";

export interface EntranceAnimation {
  type: AnimationType;
  duration: number; // ms
  delay: number; // ms
  easing: EasingType;
}

export interface ScrollAnimation {
  type: AnimationType;
  triggerOffset: number; // 0-1 (percentage of viewport)
  duration: number;
  easing: EasingType;
}

export interface HoverState {
  style?: Partial<Style>;
  transition?: number; // ms
}

export interface ElementInteractions {
  hover?: HoverState;
  click?: ClickAction;
  entrance?: EntranceAnimation;
  scroll?: ScrollAnimation;
}

// ---------- Pen Tool (2.3) ----------

export interface PenPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number }; // bezier control point
  handleOut?: { x: number; y: number }; // bezier control point
}

// ---------- Component System (2.1) ----------

export interface ComponentDefinition {
  id: string;
  name: string;
  description?: string;
  sourceNodeId: NodeId; // The master node
  thumbnail?: string; // data URL thumbnail
  createdAt: number;
}

export interface ComponentOverride {
  geometry?: Partial<Geometry>;
  style?: Partial<Style>;
  content?: TextContent | ImageContent;
}

// ---------- Comments (3.4) ----------

export interface Comment {
  id: string;
  elementId?: NodeId;
  position: { x: number; y: number };
  text: string;
  author: string;
  avatarColor: string;
  timestamp: number;
  resolved: boolean;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  text: string;
  author: string;
  avatarColor: string;
  timestamp: number;
}

// ---------- SEO (4.3) ----------

export interface PageSEO {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  favicon?: string;
  canonicalUrl?: string;
  robots?: string;
  analyticsId?: string;
}

// ---------- CMS (4.4) ----------

export type CMSFieldType = "text" | "richText" | "image" | "number" | "boolean" | "date" | "list";

export interface CMSField {
  id: string;
  name: string;
  type: CMSFieldType;
  required: boolean;
  defaultValue?: string;
}

export interface CMSContentType {
  id: string;
  name: string;
  slug: string;
  fields: CMSField[];
}

export interface CMSBinding {
  elementId: NodeId;
  fieldId: string;
  contentTypeId: string;
}

// ---------- E-commerce (4.5) ----------

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  inStock: boolean;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

// ---------- Core Style (extended) ----------

export interface Style {
  fill?: string; // hex or "transparent"
  gradient?: GradientFill; // Linear / radial gradient fill override
  opacity: number; // 0-1
  border?: BorderStyle;
  cornerRadius?: number;
  typography?: TypographyStyle;
  shadow?: ShadowStyle;

  // Polygon, Star & Curve shape extensions
  sides?: number; // Number of sides for regular polygon (3-30)
  starPoints?: number; // Number of points for star (3-20)
  innerRadius?: number; // Ratio 0.1-0.9 for star inner radius
  curvature?: number; // Curvature intensity for curve shapes (-100 to 100)

  // 3D Visual Design extensions
  depth3d?: number; // Extrude depth in px (0-100)
  tiltX3d?: number; // 3D Tilt X angle (-60 to 60 deg)
  tiltY3d?: number; // 3D Tilt Y angle (-60 to 60 deg)
  color3d?: string; // Extrude face shadow color

  // Freehand Brush & Pencil extensions
  brushSize?: number; // 1-100px

  // Effects & Filters (2.4)
  blur?: number; // Gaussian blur (0-50px)
  backgroundBlur?: number; // Backdrop-filter blur for glassmorphism (0-50px)
  innerShadow?: ShadowStyle;
  borders?: BorderStyle[]; // Multiple borders
  fills?: FillLayer[]; // Multiple layered fills
}

export interface TextContent {
  kind: "text";
  text: string;
}

export interface ImageContent {
  kind: "image";
  assetUrl: string; // plain image URL / data-URL
  fit: "cover" | "contain" | "fill";
}

export interface NodeOverride {
  geometry?: Partial<Geometry>;
  style?: Partial<Style>;
}

export interface CanvasNode {
  id: NodeId;
  parentId: NodeId | null; // null = top-level; non-null = inside a group
  type: ElementType;
  name: string; // layer name, e.g. "Rectangle 1", "Text 2", "Group 1"
  order: number; // stacking order among siblings, lower = further back
  geometry: Geometry;
  style: Style;
  content?: TextContent | ImageContent;
  children?: NodeId[]; // only present if type === "group"
  breakpoints?: Partial<Record<"tablet" | "mobile", NodeOverride>>;
  pathData?: string; // SVG path data for freehand brush and pencil strokes
  visible?: boolean; // false = hidden on canvas
  locked?: boolean; // true = locked from selection and editing

  // Pen tool (2.3)
  penPoints?: PenPoint[];
  closedPath?: boolean;

  // Mask/clip (2.3)
  maskId?: NodeId; // ID of shape used as mask
  clipPath?: string; // SVG clip-path data

  // Component system (2.1)
  componentId?: string; // Reference to ComponentDefinition ID (for instances)
  componentOverrides?: ComponentOverride; // Instance-level overrides

  // Layout (2.5)
  layout?: LayoutConstraints;

  // Interactions (2.6)
  interactions?: ElementInteractions;

  // CMS binding (4.4)
  cmsBinding?: CMSBinding;

  // Product reference (4.5)
  productId?: string;

  // Scroll & Motion effects (Phase 3)
  scrollEffects?: {
    entrance?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scaleUp" | "blurIn" | "none";
    scrollBehavior?: "parallax" | "sticky" | "revealOnScroll" | "none";
    parallaxSpeed?: number; // 0.1-2.0
    duration?: number; // ms
    delay?: number; // ms
    easing?: string;
  };

  // Advanced Motion & Physics
  motionSequenceId?: string;
  springConfig?: SpringConfig;

  // Localization & RTL
  localeRules?: LocaleVisibilityRule;
  translationKey?: string;

  // Webhook action link
  webhookId?: string;

  // Image editing filters (Phase 2)
  imageFilters?: {
    brightness?: number; // 0-200
    contrast?: number; // 0-200
    saturation?: number; // 0-200
    blur?: number; // 0-20
    grayscale?: number; // 0-100
    sepia?: number; // 0-100
    hueRotate?: number; // 0-360
  };

  // Embed data (Phase 1)
  embedData?: {
    code?: string; // raw HTML/CSS/JS
    iframeSrc?: string; // iframe URL
    embedType?: "youtube" | "maps" | "spotify" | "twitter" | "custom";
  };

  // Icon data (Phase 1)
  iconData?: {
    iconName: string;
    svgPath: string;
    iconColor?: string;
    iconSize?: number;
  };
}

// The canvas holds a flat map of nodes, not a nested tree:
export type NodesById = Record<NodeId, CanvasNode>;

// Multi-Page Support
export interface CanvasPage {
  id: string;
  name: string;
  slug: string;
  nodes: NodesById;
  seo?: PageSEO; // Per-page SEO settings (4.3)
  backgroundColor?: string; // Full page background color (transparent, hex, gradient)
}

export type PagesById = Record<string, CanvasPage>;

// ---------- Alignment & Snapping Types ----------

export interface AlignmentGuide {
  id: string;
  type: "vertical" | "horizontal";
  position: number; // X coordinate for vertical, Y coordinate for horizontal
  start: number; // Start extent on perpendicular axis
  end: number; // End extent on perpendicular axis
}

// ---------- Editor-only types (not part of the persisted schema) ----------

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number; // 1.0 = 100%
}

export type ActiveTool =
  | "select"
  | "rectangle"
  | "text"
  | "image"
  | "line"
  | "polygon"
  | "circle"
  | "curve"
  | "star"
  | "shape3d"
  | "brush"
  | "pencil"
  | "pen"
  | "fill"
  | "eraser"
  | "comment";

/** Which resize handle is being dragged */
export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

/** For line endpoint dragging */
export type LineEndpointHandle = "start" | "end";

// ---------- Design Tokens (2.2) ----------

export interface ColorToken {
  id: string;
  name: string;
  value: string; // hex color
}

export interface TextStyleToken {
  id: string;
  name: string;
  style: TypographyStyle;
}

// ---------- Version History (3.3) ----------

export interface VersionCheckpoint {
  id: string;
  name: string;
  timestamp: number;
  pages: PagesById;
  thumbnail?: string;
}

// ---------- Asset (3.2) ----------

export interface AssetItem {
  id: string;
  name: string;
  type: "image" | "svg" | "video";
  dataUrl: string;
  thumbnail?: string;
  size: number; // bytes
  width?: number;
  height?: number;
  uploadedAt: number;
}

// ---------- Project (3.1) ----------

export interface ProjectMeta {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectData {
  meta: ProjectMeta;
  pages: PagesById;
  activePageId: string;
  colorTokens: ColorToken[];
  textStyleTokens: TextStyleToken[];
  components: Record<string, ComponentDefinition>;
  seo: Record<string, PageSEO>;
  assets: AssetItem[];
}

// ---------- Advanced Motion & Keyframe Timelines ----------

export type KeyframeProperty = "x" | "y" | "opacity" | "scale" | "rotation" | "blur";
export type KeyframeEasing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";

export interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
  stiffness?: number;
  damping?: number;
}

export interface MotionKeyframe {
  id: string;
  timeMs: number;
  property: KeyframeProperty;
  value: number;
  easing: KeyframeEasing;
  springConfig?: SpringConfig;
}

export interface AnimationTrack {
  id: string;
  nodeId: NodeId;
  property: KeyframeProperty;
  keyframes: MotionKeyframe[];
}

export interface TimelineSequence {
  id: string;
  name: string;
  durationMs: number;
  loop: boolean;
  autoPlay: boolean;
  scrollScrub: boolean;
  scrollTriggerOffset: number;
  tracks: AnimationTrack[];
}

// ---------- Localization & Multi-Language Architecture ----------

export interface Locale {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  currency: string;
  dateFormat: string;
  isDefault?: boolean;
}

export interface TranslationKey {
  id: string;
  key: string;
  translations: Record<string, string>;
}

export interface LocaleVisibilityRule {
  targetLocaleCodes: string[];
  targetCountries: string[];
  condition: "showIf" | "hideIf";
}

// ---------- Extension Ecosystem & Developer APIs ----------

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  category: "tools" | "generators" | "assets" | "integrations";
  status: "installed" | "active" | "disabled";
  permissions: string[];
  mainScript?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  service: "zapier" | "supabase" | "make" | "custom";
  url: string;
  events: ("form_submit" | "cms_update" | "ecom_order")[];
  headers: Record<string, string>;
  enabled: boolean;
  createdAt: number;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  timestamp: number;
  status: "success" | "error";
  statusCode?: number;
  responseBody?: string;
  payload: Record<string, any>;
}
