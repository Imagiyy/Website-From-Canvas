// SEO Store — 4.3 SEO & Analytics per page
import { create } from "zustand";
import type { PageSEO } from "../types/canvas";

interface SEOStoreState {
  pageSEO: Record<string, PageSEO>; // keyed by pageId
  isSEOPanelOpen: boolean;
  globalAnalyticsId: string;
  globalFavicon: string;
}

interface SEOStoreActions {
  openSEOPanel: () => void;
  closeSEOPanel: () => void;
  updatePageSEO: (pageId: string, seo: Partial<PageSEO>) => void;
  getPageSEO: (pageId: string) => PageSEO;
  setGlobalAnalyticsId: (id: string) => void;
  setGlobalFavicon: (url: string) => void;
  generateSitemap: (pages: { slug: string; name: string }[], baseUrl: string) => string;
  loadSEO: (seo: Record<string, PageSEO>) => void;
}

type SEOStore = SEOStoreState & SEOStoreActions;

const DEFAULT_SEO: PageSEO = {
  title: "",
  description: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  robots: "index, follow",
};

export const useSEOStore = create<SEOStore>((set, get) => ({
  pageSEO: {},
  isSEOPanelOpen: false,
  globalAnalyticsId: "",
  globalFavicon: "",

  openSEOPanel: () => set({ isSEOPanelOpen: true }),
  closeSEOPanel: () => set({ isSEOPanelOpen: false }),

  updatePageSEO: (pageId, seo) => {
    set((s) => ({
      pageSEO: {
        ...s.pageSEO,
        [pageId]: { ...(s.pageSEO[pageId] || DEFAULT_SEO), ...seo },
      },
    }));
  },

  getPageSEO: (pageId) => {
    return get().pageSEO[pageId] || { ...DEFAULT_SEO };
  },

  setGlobalAnalyticsId: (id) => set({ globalAnalyticsId: id }),
  setGlobalFavicon: (url) => set({ globalFavicon: url }),

  generateSitemap: (pages, baseUrl) => {
    const urls = pages
      .map(
        (p) => `  <url>
    <loc>${baseUrl}/${p.slug === "index" ? "" : p.slug + ".html"}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <priority>${p.slug === "index" ? "1.0" : "0.8"}</priority>
  </url>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  },

  loadSEO: (seo) => set({ pageSEO: seo }),
}));
