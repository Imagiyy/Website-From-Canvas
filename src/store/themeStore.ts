import { create } from "zustand";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  mode: "dark" | "light";
  colors: ThemeColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight",
    name: "Midnight Neon",
    mode: "dark",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#ec4899",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f8fafc",
    },
  },
  {
    id: "ocean",
    name: "Oceanic Cyan",
    mode: "dark",
    colors: {
      primary: "#06b6d4",
      secondary: "#3b82f6",
      accent: "#10b981",
      background: "#082f49",
      surface: "#0c4a6e",
      text: "#f0f9ff",
    },
  },
  {
    id: "sunset",
    name: "Sunset Warmth",
    mode: "dark",
    colors: {
      primary: "#f97316",
      secondary: "#ef4444",
      accent: "#eab308",
      background: "#1c1917",
      surface: "#292524",
      text: "#fafaf9",
    },
  },
  {
    id: "clean-light",
    name: "Clean Minimalist",
    mode: "light",
    colors: {
      primary: "#2563eb",
      secondary: "#4f46e5",
      accent: "#0d9488",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
    },
  },
];

interface ThemeState {
  currentTheme: ThemePreset;
  mode: "dark" | "light";
  setTheme: (themeId: string) => void;
  setMode: (mode: "dark" | "light") => void;
  updateColors: (colors: Partial<ThemeColors>) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: THEME_PRESETS[0],
  mode: "dark",
  setTheme: (themeId) => {
    const found = THEME_PRESETS.find((t) => t.id === themeId);
    if (found) {
      set({ currentTheme: found, mode: found.mode });
    }
  },
  setMode: (mode) => set((s) => ({ mode, currentTheme: { ...s.currentTheme, mode } })),
  updateColors: (colors) =>
    set((s) => ({
      currentTheme: {
        ...s.currentTheme,
        colors: { ...s.currentTheme.colors, ...colors },
      },
    })),
}));
