// Version History Store — 3.3 Named Checkpoints
import { create } from "zustand";
import type { VersionCheckpoint, PagesById } from "../types/canvas";

// ---- IndexedDB helpers ----
const DB_NAME = "canvassite_versions";
const DB_VERSION = 1;
const STORE_NAME = "checkpoints";

function openVersionDB(): Promise<IDBDatabase> {
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

async function saveCheckpointToDB(cp: VersionCheckpoint): Promise<void> {
  const db = await openVersionDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(cp);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCheckpointFromDB(id: string): Promise<void> {
  const db = await openVersionDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllCheckpointsFromDB(): Promise<VersionCheckpoint[]> {
  const db = await openVersionDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ---- Store ----

interface VersionStoreState {
  checkpoints: VersionCheckpoint[];
  isVersionHistoryOpen: boolean;
  selectedCheckpointId: string | null;
  isComparing: boolean;
  compareCheckpointId: string | null;
}

interface VersionStoreActions {
  openVersionHistory: () => void;
  closeVersionHistory: () => void;
  loadCheckpoints: () => Promise<void>;
  createCheckpoint: (name: string, pages: PagesById, thumbnail?: string) => Promise<VersionCheckpoint>;
  deleteCheckpoint: (id: string) => Promise<void>;
  renameCheckpoint: (id: string, name: string) => Promise<void>;
  selectCheckpoint: (id: string | null) => void;
  getCheckpoint: (id: string) => VersionCheckpoint | undefined;
  startCompare: (checkpointId: string) => void;
  stopCompare: () => void;
}

type VersionStore = VersionStoreState & VersionStoreActions;

export const useVersionStore = create<VersionStore>((set, get) => ({
  checkpoints: [],
  isVersionHistoryOpen: false,
  selectedCheckpointId: null,
  isComparing: false,
  compareCheckpointId: null,

  openVersionHistory: () => set({ isVersionHistoryOpen: true }),
  closeVersionHistory: () => set({ isVersionHistoryOpen: false }),

  loadCheckpoints: async () => {
    try {
      const cps = await loadAllCheckpointsFromDB();
      set({ checkpoints: cps.sort((a, b) => b.timestamp - a.timestamp) });
    } catch (e) {
      console.error("Failed to load checkpoints:", e);
    }
  },

  createCheckpoint: async (name, pages, thumbnail) => {
    const cp: VersionCheckpoint = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      pages: structuredClone(pages),
      thumbnail,
    };
    await saveCheckpointToDB(cp);
    set((s) => ({ checkpoints: [cp, ...s.checkpoints] }));
    return cp;
  },

  deleteCheckpoint: async (id) => {
    await deleteCheckpointFromDB(id);
    set((s) => ({
      checkpoints: s.checkpoints.filter((cp) => cp.id !== id),
      selectedCheckpointId: s.selectedCheckpointId === id ? null : s.selectedCheckpointId,
    }));
  },

  renameCheckpoint: async (id, name) => {
    const cp = get().checkpoints.find((c) => c.id === id);
    if (!cp) return;
    const updated = { ...cp, name };
    await saveCheckpointToDB(updated);
    set((s) => ({
      checkpoints: s.checkpoints.map((c) => (c.id === id ? updated : c)),
    }));
  },

  selectCheckpoint: (id) => set({ selectedCheckpointId: id }),

  getCheckpoint: (id) => get().checkpoints.find((c) => c.id === id),

  startCompare: (checkpointId) => set({ isComparing: true, compareCheckpointId: checkpointId }),
  stopCompare: () => set({ isComparing: false, compareCheckpointId: null }),
}));
