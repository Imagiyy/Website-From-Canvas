// Design Tokens Store — 2.2 Named Colors & Text Styles
import { create } from "zustand";
import type { ColorToken, TextStyleToken, TypographyStyle } from "../types/canvas";

interface DesignTokenStoreState {
  colorTokens: ColorToken[];
  textStyleTokens: TextStyleToken[];
}

interface DesignTokenStoreActions {
  addColorToken: (name: string, value: string) => ColorToken;
  updateColorToken: (id: string, updates: Partial<Pick<ColorToken, "name" | "value">>) => void;
  deleteColorToken: (id: string) => void;
  addTextStyle: (name: string, style: TypographyStyle) => TextStyleToken;
  updateTextStyle: (id: string, updates: Partial<Pick<TextStyleToken, "name" | "style">>) => void;
  deleteTextStyle: (id: string) => void;
  loadTokens: (colors: ColorToken[], textStyles: TextStyleToken[]) => void;
}

type DesignTokenStore = DesignTokenStoreState & DesignTokenStoreActions;

const DEFAULT_COLOR_TOKENS: ColorToken[] = [
  { id: "tok-primary", name: "Primary Blue", value: "#3B82F6" },
  { id: "tok-secondary", name: "Secondary Purple", value: "#8B5CF6" },
  { id: "tok-success", name: "Success Green", value: "#10B981" },
  { id: "tok-warning", name: "Warning Amber", value: "#F59E0B" },
  { id: "tok-danger", name: "Danger Red", value: "#EF4444" },
  { id: "tok-neutral", name: "Neutral Gray", value: "#6B7280" },
  { id: "tok-surface", name: "Surface Dark", value: "#1E1E2E" },
  { id: "tok-text", name: "Text Light", value: "#E4E4F0" },
];

const DEFAULT_TEXT_STYLES: TextStyleToken[] = [
  {
    id: "ts-h1",
    name: "Heading 1",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 48,
      fontWeight: 700,
      color: "#E4E4F0",
      align: "left",
      lineHeight: 1.2,
      letterSpacing: -1,
    },
  },
  {
    id: "ts-h2",
    name: "Heading 2",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 36,
      fontWeight: 600,
      color: "#E4E4F0",
      align: "left",
      lineHeight: 1.3,
      letterSpacing: -0.5,
    },
  },
  {
    id: "ts-h3",
    name: "Heading 3",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 24,
      fontWeight: 600,
      color: "#E4E4F0",
      align: "left",
      lineHeight: 1.4,
    },
  },
  {
    id: "ts-body",
    name: "Body",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 16,
      fontWeight: 400,
      color: "#B4B4C8",
      align: "left",
      lineHeight: 1.6,
    },
  },
  {
    id: "ts-caption",
    name: "Caption",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 12,
      fontWeight: 400,
      color: "#8888A8",
      align: "left",
      lineHeight: 1.4,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  },
  {
    id: "ts-button",
    name: "Button Text",
    style: {
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      fontWeight: 600,
      color: "#FFFFFF",
      align: "center",
      lineHeight: 1.2,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  },
];

export const useDesignTokenStore = create<DesignTokenStore>((set, get) => ({
  colorTokens: DEFAULT_COLOR_TOKENS,
  textStyleTokens: DEFAULT_TEXT_STYLES,

  addColorToken: (name, value) => {
    const token: ColorToken = { id: crypto.randomUUID(), name, value };
    set((s) => ({ colorTokens: [...s.colorTokens, token] }));
    return token;
  },

  updateColorToken: (id, updates) => {
    set((s) => ({
      colorTokens: s.colorTokens.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteColorToken: (id) => {
    set((s) => ({
      colorTokens: s.colorTokens.filter((t) => t.id !== id),
    }));
  },

  addTextStyle: (name, style) => {
    const token: TextStyleToken = { id: crypto.randomUUID(), name, style };
    set((s) => ({ textStyleTokens: [...s.textStyleTokens, token] }));
    return token;
  },

  updateTextStyle: (id, updates) => {
    set((s) => ({
      textStyleTokens: s.textStyleTokens.map((t) =>
        t.id === id
          ? {
              ...t,
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.style !== undefined ? { style: { ...t.style, ...updates.style } } : {}),
            }
          : t
      ),
    }));
  },

  deleteTextStyle: (id) => {
    set((s) => ({
      textStyleTokens: s.textStyleTokens.filter((t) => t.id !== id),
    }));
  },

  loadTokens: (colors, textStyles) => {
    set({ colorTokens: colors, textStyleTokens: textStyles });
  },
}));
