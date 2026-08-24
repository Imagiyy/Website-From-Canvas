import { create } from "zustand";
import type { Locale, TranslationKey, LocaleVisibilityRule, CanvasNode } from "../types/canvas";

export const DEFAULT_LOCALES: Locale[] = [
  { code: "en-US", name: "English (US)", direction: "ltr", currency: "USD", dateFormat: "MM/DD/YYYY", isDefault: true },
  { code: "es-ES", name: "Spanish (Spain)", direction: "ltr", currency: "EUR", dateFormat: "DD/MM/YYYY" },
  { code: "ar-SA", name: "Arabic (Saudi Arabia)", direction: "rtl", currency: "SAR", dateFormat: "DD/MM/YYYY" },
  { code: "fr-FR", name: "French (France)", direction: "ltr", currency: "EUR", dateFormat: "DD/MM/YYYY" },
  { code: "de-DE", name: "German (Germany)", direction: "ltr", currency: "EUR", dateFormat: "DD.MM.YYYY" },
  { code: "ja-JP", name: "Japanese (Japan)", direction: "ltr", currency: "JPY", dateFormat: "YYYY/MM/DD" },
];

export const INITIAL_TRANSLATIONS: TranslationKey[] = [
  {
    id: "tk-hero-title",
    key: "hero.title",
    translations: {
      "en-US": "Build Modern Websites Canvas First",
      "es-ES": "Construye sitios web modernos visualmente",
      "ar-SA": "أنشئ مواقع إلكترونية حديثة عبر القماش التفاعلي",
      "fr-FR": "Créez des sites Web modernes en visuel",
      "de-DE": "Bauen Sie moderne Websites visuell",
      "ja-JP": "ビジュアルキャンバスで現代的なウェブサイトを構築",
    },
  },
  {
    id: "tk-cta-btn",
    key: "cta.button",
    translations: {
      "en-US": "Get Started Free",
      "es-ES": "Empieza gratis",
      "ar-SA": "ابدأ مجانًا",
      "fr-FR": "Commencer gratuitement",
      "de-DE": "Kostenlos starten",
      "ja-JP": "無料で始める",
    },
  },
];

interface LocalizationStoreState {
  locales: Locale[];
  activeLocaleCode: string;
  userDetectedCountry: string;
  translationKeys: TranslationKey[];

  // Actions
  addLocale: (locale: Locale) => void;
  removeLocale: (code: string) => void;
  setActiveLocale: (code: string) => void;
  updateLocale: (code: string, updates: Partial<Locale>) => void;
  setUserDetectedCountry: (country: string) => void;

  addTranslationKey: (key: string, defaultText: string) => string;
  setTranslation: (keyId: string, localeCode: string, value: string) => void;
  deleteTranslationKey: (keyId: string) => void;
  getTranslatedText: (keyOrId: string, fallback?: string) => string;

  formatCurrency: (amount: number, localeCode?: string) => string;
  formatDate: (dateInput: Date | string | number, localeCode?: string) => string;
  evaluateNodeVisibility: (node: CanvasNode) => boolean;
}

export const useLocalizationStore = create<LocalizationStoreState>((set, get) => ({
  locales: DEFAULT_LOCALES,
  activeLocaleCode: "en-US",
  userDetectedCountry: "US",
  translationKeys: INITIAL_TRANSLATIONS,

  addLocale: (locale) =>
    set((state) => {
      if (state.locales.some((l) => l.code === locale.code)) return state;
      return { locales: [...state.locales, locale] };
    }),

  removeLocale: (code) =>
    set((state) => {
      const filtered = state.locales.filter((l) => l.code !== code || l.isDefault);
      return {
        locales: filtered,
        activeLocaleCode: state.activeLocaleCode === code ? "en-US" : state.activeLocaleCode,
      };
    }),

  setActiveLocale: (code) => set({ activeLocaleCode: code }),

  updateLocale: (code, updates) =>
    set((state) => ({
      locales: state.locales.map((l) => (l.code === code ? { ...l, ...updates } : l)),
    })),

  setUserDetectedCountry: (country) => set({ userDetectedCountry: country.toUpperCase() }),

  addTranslationKey: (key, defaultText) => {
    const id = "tk-" + crypto.randomUUID().slice(0, 8);
    const newKey: TranslationKey = {
      id,
      key,
      translations: { "en-US": defaultText },
    };
    set((state) => ({ translationKeys: [...state.translationKeys, newKey] }));
    return id;
  },

  setTranslation: (keyId, localeCode, value) =>
    set((state) => ({
      translationKeys: state.translationKeys.map((tk) =>
        tk.id === keyId || tk.key === keyId
          ? { ...tk, translations: { ...tk.translations, [localeCode]: value } }
          : tk
      ),
    })),

  deleteTranslationKey: (keyId) =>
    set((state) => ({
      translationKeys: state.translationKeys.filter((tk) => tk.id !== keyId && tk.key !== keyId),
    })),

  getTranslatedText: (keyOrId, fallback = "") => {
    const { translationKeys, activeLocaleCode } = get();
    const found = translationKeys.find((tk) => tk.id === keyOrId || tk.key === keyOrId);
    if (!found) return fallback;
    return found.translations[activeLocaleCode] || found.translations["en-US"] || fallback;
  },

  formatCurrency: (amount, localeCode) => {
    const code = localeCode || get().activeLocaleCode;
    const localeObj = get().locales.find((l) => l.code === code) || DEFAULT_LOCALES[0];
    try {
      return new Intl.NumberFormat(code, {
        style: "currency",
        currency: localeObj.currency || "USD",
      }).format(amount);
    } catch {
      return `${localeObj.currency} ${amount.toFixed(2)}`;
    }
  },

  formatDate: (dateInput, localeCode) => {
    const code = localeCode || get().activeLocaleCode;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    try {
      return new Intl.DateTimeFormat(code, { dateStyle: "medium" }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  },

  evaluateNodeVisibility: (node) => {
    const { activeLocaleCode, userDetectedCountry } = get();
    const rules: LocaleVisibilityRule | undefined = node.localeRules;
    if (!rules) return true;

    const { targetLocaleCodes, targetCountries, condition } = rules;
    let matchesLocale = targetLocaleCodes.length === 0 || targetLocaleCodes.includes(activeLocaleCode);
    let matchesCountry = targetCountries.length === 0 || targetCountries.includes(userDetectedCountry);

    const isMatch = matchesLocale && matchesCountry;
    return condition === "showIf" ? isMatch : !isMatch;
  },
}));
