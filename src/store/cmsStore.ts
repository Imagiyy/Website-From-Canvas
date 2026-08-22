// CMS Store — 4.4 CMS Integration (UI Shell)
import { create } from "zustand";
import type { CMSContentType, CMSField, CMSBinding, NodeId } from "../types/canvas";

export type CMSProvider = "none" | "strapi" | "contentful" | "custom";

interface CMSStoreState {
  provider: CMSProvider;
  apiEndpoint: string;
  apiKey: string;
  contentTypes: CMSContentType[];
  bindings: CMSBinding[];
  isCMSPanelOpen: boolean;
  isConnected: boolean;
  mockData: Record<string, Record<string, string>[]>; // contentTypeId -> array of field values
}

interface CMSStoreActions {
  openCMSPanel: () => void;
  closeCMSPanel: () => void;
  setProvider: (provider: CMSProvider) => void;
  setApiEndpoint: (endpoint: string) => void;
  setApiKey: (key: string) => void;
  addContentType: (name: string) => CMSContentType;
  updateContentType: (id: string, updates: Partial<Pick<CMSContentType, "name" | "slug">>) => void;
  deleteContentType: (id: string) => void;
  addField: (contentTypeId: string, name: string, type: CMSField["type"]) => void;
  updateField: (contentTypeId: string, fieldId: string, updates: Partial<CMSField>) => void;
  deleteField: (contentTypeId: string, fieldId: string) => void;
  addBinding: (elementId: NodeId, fieldId: string, contentTypeId: string) => void;
  removeBinding: (elementId: NodeId) => void;
  getBindingForElement: (elementId: NodeId) => CMSBinding | undefined;
  testConnection: () => Promise<boolean>;
  loadCMS: (data: { contentTypes: CMSContentType[]; bindings: CMSBinding[] }) => void;
}

type CMSStore = CMSStoreState & CMSStoreActions;

// Default mock data for demo
const DEFAULT_MOCK_DATA: Record<string, Record<string, string>[]> = {
  "blog-posts": [
    { title: "Getting Started with CanvasSite", excerpt: "Learn how to build beautiful websites...", author: "Alex Chen", date: "2025-01-15", image: "" },
    { title: "Design Systems 101", excerpt: "Understanding the fundamentals of design systems...", author: "Sarah Kim", date: "2025-01-10", image: "" },
    { title: "Advanced CSS Animations", excerpt: "Create stunning animations with CSS...", author: "Jordan Lee", date: "2025-01-05", image: "" },
  ],
};

export const useCMSStore = create<CMSStore>((set, get) => ({
  provider: "none",
  apiEndpoint: "",
  apiKey: "",
  contentTypes: [],
  bindings: [],
  isCMSPanelOpen: false,
  isConnected: false,
  mockData: DEFAULT_MOCK_DATA,

  openCMSPanel: () => set({ isCMSPanelOpen: true }),
  closeCMSPanel: () => set({ isCMSPanelOpen: false }),

  setProvider: (provider) => set({ provider }),
  setApiEndpoint: (endpoint) => set({ apiEndpoint: endpoint }),
  setApiKey: (key) => set({ apiKey: key }),

  addContentType: (name) => {
    const ct: CMSContentType = {
      id: crypto.randomUUID(),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      fields: [],
    };
    set((s) => ({ contentTypes: [...s.contentTypes, ct] }));
    return ct;
  },

  updateContentType: (id, updates) => {
    set((s) => ({
      contentTypes: s.contentTypes.map((ct) =>
        ct.id === id ? { ...ct, ...updates } : ct
      ),
    }));
  },

  deleteContentType: (id) => {
    set((s) => ({
      contentTypes: s.contentTypes.filter((ct) => ct.id !== id),
      bindings: s.bindings.filter((b) => b.contentTypeId !== id),
    }));
  },

  addField: (contentTypeId, name, type) => {
    const field: CMSField = {
      id: crypto.randomUUID(),
      name,
      type,
      required: false,
    };
    set((s) => ({
      contentTypes: s.contentTypes.map((ct) =>
        ct.id === contentTypeId ? { ...ct, fields: [...ct.fields, field] } : ct
      ),
    }));
  },

  updateField: (contentTypeId, fieldId, updates) => {
    set((s) => ({
      contentTypes: s.contentTypes.map((ct) =>
        ct.id === contentTypeId
          ? {
              ...ct,
              fields: ct.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
            }
          : ct
      ),
    }));
  },

  deleteField: (contentTypeId, fieldId) => {
    set((s) => ({
      contentTypes: s.contentTypes.map((ct) =>
        ct.id === contentTypeId
          ? { ...ct, fields: ct.fields.filter((f) => f.id !== fieldId) }
          : ct
      ),
    }));
  },

  addBinding: (elementId, fieldId, contentTypeId) => {
    const binding: CMSBinding = { elementId, fieldId, contentTypeId };
    set((s) => ({
      bindings: [...s.bindings.filter((b) => b.elementId !== elementId), binding],
    }));
  },

  removeBinding: (elementId) => {
    set((s) => ({
      bindings: s.bindings.filter((b) => b.elementId !== elementId),
    }));
  },

  getBindingForElement: (elementId) => {
    return get().bindings.find((b) => b.elementId === elementId);
  },

  testConnection: async () => {
    // Simulated connection test
    await new Promise((r) => setTimeout(r, 1500));
    const { apiEndpoint, apiKey } = get();
    const success = apiEndpoint.length > 0 && apiKey.length > 0;
    set({ isConnected: success });
    return success;
  },

  loadCMS: (data) => {
    set({ contentTypes: data.contentTypes, bindings: data.bindings });
  },
}));
