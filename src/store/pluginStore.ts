import { create } from "zustand";
import type { Plugin, WebhookEndpoint, WebhookLog } from "../types/canvas";

export const BUILTIN_MARKETPLACE_PLUGINS: Plugin[] = [
  {
    id: "plugin-ai-copilot",
    name: "AI Layout & Copy Copilot",
    version: "1.4.0",
    author: "CanvasAI Labs",
    description: "Generate headlines, hero sections, and UI copy using AI prompts directly on your canvas.",
    icon: "✨",
    category: "generators",
    status: "active",
    permissions: ["readCanvas", "writeCanvas", "network"],
  },
  {
    id: "plugin-blob-generator",
    name: "SVG Vector Blob Generator",
    version: "2.1.0",
    author: "DesignUtils",
    description: "Create smooth organic vector blob shapes and wave dividers with random seeds.",
    icon: "🌊",
    category: "tools",
    status: "installed",
    permissions: ["writeCanvas"],
  },
  {
    id: "plugin-supabase-sync",
    name: "Supabase Headless Backend Sync",
    version: "1.0.2",
    author: "Supabase Community",
    description: "Connect form controls and CMS collections live to Supabase PostgreSQL database tables.",
    icon: "⚡",
    category: "integrations",
    status: "active",
    permissions: ["readCanvas", "webhooks", "network"],
  },
  {
    id: "plugin-unsplash-assets",
    name: "Unsplash Pro Assets Browser",
    version: "3.0.1",
    author: "Unsplash",
    description: "Search 3M+ high-resolution royalty-free photos and drop them directly onto canvas.",
    icon: "📷",
    category: "assets",
    status: "active",
    permissions: ["writeCanvas", "network"],
  },
  {
    id: "plugin-zapier-bridge",
    name: "Zapier Automation Action Pipeline",
    version: "1.2.0",
    author: "Zapier Inc",
    description: "Send website leads, newsletter signups, and store purchases into 5,000+ Zapier apps.",
    icon: "🧡",
    category: "integrations",
    status: "installed",
    permissions: ["webhooks"],
  },
];

export const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "wh-zapier-leads",
    name: "Zapier CRM Lead Pipeline",
    service: "zapier",
    url: "https://hooks.zapier.com/hooks/catch/123456/abcde",
    events: ["form_submit"],
    headers: { "Content-Type": "application/json" },
    enabled: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "wh-supabase-insert",
    name: "Supabase Form Submissions",
    service: "supabase",
    url: "https://xyz.supabase.co/rest/v1/form_submissions",
    events: ["form_submit", "cms_update"],
    headers: { apikey: "public-anon-key-12345", Prefer: "return=representation" },
    enabled: true,
    createdAt: Date.now() - 172800000,
  },
];

interface PluginStoreState {
  plugins: Plugin[];
  webhooks: WebhookEndpoint[];
  webhookLogs: WebhookLog[];

  // Actions
  togglePluginStatus: (id: string) => void;
  addCustomPlugin: (plugin: Omit<Plugin, "id">) => string;
  addWebhook: (endpoint: Omit<WebhookEndpoint, "id" | "createdAt">) => string;
  updateWebhook: (id: string, updates: Partial<WebhookEndpoint>) => void;
  deleteWebhook: (id: string) => void;
  triggerWebhook: (event: "form_submit" | "cms_update" | "ecom_order", payload: Record<string, any>) => Promise<void>;
  clearLogs: () => void;
}

export const usePluginStore = create<PluginStoreState>((set, get) => ({
  plugins: BUILTIN_MARKETPLACE_PLUGINS,
  webhooks: INITIAL_WEBHOOKS,
  webhookLogs: [
    {
      id: "log-1",
      webhookId: "wh-zapier-leads",
      event: "form_submit",
      timestamp: Date.now() - 3600000,
      status: "success",
      statusCode: 200,
      responseBody: '{"status":"success","id":"zap-987"}',
      payload: { email: "user@example.com", name: "Alex Rivers", formId: "contact-form" },
    },
  ],

  togglePluginStatus: (id) =>
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== id) return p;
        const nextStatus = p.status === "active" ? "disabled" : "active";
        return { ...p, status: nextStatus };
      }),
    })),

  addCustomPlugin: (plugin) => {
    const id = "plugin-" + crypto.randomUUID().slice(0, 8);
    const newPlugin: Plugin = { ...plugin, id };
    set((state) => ({ plugins: [...state.plugins, newPlugin] }));
    return id;
  },

  addWebhook: (endpoint) => {
    const id = "wh-" + crypto.randomUUID().slice(0, 8);
    const newWh: WebhookEndpoint = {
      ...endpoint,
      id,
      createdAt: Date.now(),
    };
    set((state) => ({ webhooks: [...state.webhooks, newWh] }));
    return id;
  },

  updateWebhook: (id, updates) =>
    set((state) => ({
      webhooks: state.webhooks.map((wh) => (wh.id === id ? { ...wh, ...updates } : wh)),
    })),

  deleteWebhook: (id) =>
    set((state) => ({
      webhooks: state.webhooks.filter((wh) => wh.id !== id),
    })),

  triggerWebhook: async (event, payload) => {
    const { webhooks } = get();
    const matching = webhooks.filter((wh) => wh.enabled && wh.events.includes(event));

    for (const wh of matching) {
      const logId = "log-" + crypto.randomUUID().slice(0, 8);
      try {
        // Simulated network fetch
        const responseStatus = 200;
        const respBody = JSON.stringify({ received: true, event, timestamp: Date.now() });

        const logEntry: WebhookLog = {
          id: logId,
          webhookId: wh.id,
          event,
          timestamp: Date.now(),
          status: "success",
          statusCode: responseStatus,
          responseBody: respBody,
          payload,
        };

        set((state) => ({ webhookLogs: [logEntry, ...state.webhookLogs].slice(0, 50) }));
      } catch (err: any) {
        const logEntry: WebhookLog = {
          id: logId,
          webhookId: wh.id,
          event,
          timestamp: Date.now(),
          status: "error",
          statusCode: 500,
          responseBody: String(err?.message || err),
          payload,
        };
        set((state) => ({ webhookLogs: [logEntry, ...state.webhookLogs].slice(0, 50) }));
      }
    }
  },

  clearLogs: () => set({ webhookLogs: [] }),
}));
