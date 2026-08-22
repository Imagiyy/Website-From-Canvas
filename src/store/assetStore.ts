// Asset Manager Store — 3.2 Centralized Image/Media Library
import { create } from "zustand";
import type { AssetItem } from "../types/canvas";

// ---- IndexedDB helpers ----
const DB_NAME = "canvassite_assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

function openAssetDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function saveAssetToDB(asset: AssetItem): Promise<void> {
  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(asset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteAssetFromDB(id: string): Promise<void> {
  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllAssetsFromDB(): Promise<AssetItem[]> {
  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ---- Store ----

interface AssetStoreState {
  assets: AssetItem[];
  isAssetManagerOpen: boolean;
  searchQuery: string;
  filterType: "all" | "image" | "svg" | "video";
}

interface AssetStoreActions {
  openAssetManager: () => void;
  closeAssetManager: () => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: AssetStoreState["filterType"]) => void;
  loadAssets: () => Promise<void>;
  addAsset: (file: File) => Promise<AssetItem>;
  addAssetFromUrl: (name: string, dataUrl: string, type: AssetItem["type"]) => Promise<AssetItem>;
  removeAsset: (id: string) => Promise<void>;
  renameAsset: (id: string, name: string) => void;
  getFilteredAssets: () => AssetItem[];
}

type AssetStore = AssetStoreState & AssetStoreActions;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  isAssetManagerOpen: false,
  searchQuery: "",
  filterType: "all",

  openAssetManager: () => set({ isAssetManagerOpen: true }),
  closeAssetManager: () => set({ isAssetManagerOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),

  loadAssets: async () => {
    try {
      const assets = await loadAllAssetsFromDB();
      set({ assets: assets.sort((a, b) => b.uploadedAt - a.uploadedAt) });
    } catch (e) {
      console.error("Failed to load assets:", e);
    }
  },

  addAsset: async (file) => {
    const dataUrl = await fileToDataUrl(file);
    const type: AssetItem["type"] = file.type.startsWith("image/svg") ? "svg" : file.type.startsWith("video/") ? "video" : "image";
    const dims = type === "image" || type === "svg" ? await getImageDimensions(dataUrl) : { width: 0, height: 0 };

    const asset: AssetItem = {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      dataUrl,
      thumbnail: dataUrl,
      size: file.size,
      width: dims.width,
      height: dims.height,
      uploadedAt: Date.now(),
    };

    await saveAssetToDB(asset);
    set((s) => ({ assets: [asset, ...s.assets] }));
    return asset;
  },

  addAssetFromUrl: async (name, dataUrl, type) => {
    const dims = type !== "video" ? await getImageDimensions(dataUrl) : { width: 0, height: 0 };
    const asset: AssetItem = {
      id: crypto.randomUUID(),
      name,
      type,
      dataUrl,
      thumbnail: dataUrl,
      size: dataUrl.length,
      width: dims.width,
      height: dims.height,
      uploadedAt: Date.now(),
    };
    await saveAssetToDB(asset);
    set((s) => ({ assets: [asset, ...s.assets] }));
    return asset;
  },

  removeAsset: async (id) => {
    await deleteAssetFromDB(id);
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
  },

  renameAsset: (id, name) => {
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, name } : a)),
    }));
  },

  getFilteredAssets: () => {
    const { assets, searchQuery, filterType } = get();
    return assets.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  },
}));
