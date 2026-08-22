export type FeatureFlagKey =
  | "projects"
  | "auth"
  | "collaboration"
  | "comments"
  | "interactions"
  | "seo"
  | "cms"
  | "ecommerce"
  | "deployment"
  | "versionHistory"
  | "assetManager"
  | "designTokens"
  | "componentLibrary";

export interface FeatureFlags {
  projects: boolean;
  auth: boolean;
  collaboration: boolean;
  comments: boolean;
  interactions: boolean;
  seo: boolean;
  cms: boolean;
  ecommerce: boolean;
  deployment: boolean;
  versionHistory: boolean;
  assetManager: boolean;
  designTokens: boolean;
  componentLibrary: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  projects: true,
  auth: false,
  collaboration: false,
  comments: true,
  interactions: false,
  seo: true,
  cms: false,
  ecommerce: false,
  deployment: false,
  versionHistory: true,
  assetManager: true,
  designTokens: true,
  componentLibrary: true,
};

export const PRODUCT_SCOPE = {
  v1: {
    goal: "Visual website editor with project persistence and export",
    keep: [
      "canvasEditor",
      "layerPanel",
      "propertyPanel",
      "projectManager",
      "exportFlow",
      "assetManager",
      "designTokens",
      "components",
    ],
    postpone: [
      "collaboration",
      "cms",
      "ecommerce",
      "deployment",
      "fullAuthBackend",
    ],
  },
  v2: {
    goal: "Team collaboration, CMS bindings, and real content workflows",
    keep: [
      "sharedProjects",
      "contentModels",
      "commenting",
      "seo",
      "commentaryReview",
    ],
    postpone: [
      "deployPipeline",
      "marketplaceIntegrations",
      "fullCommerceDashboard",
    ],
  },
} as const;

export function getEnabledFeatures(flags: Partial<FeatureFlags> = {}): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...flags };
}
