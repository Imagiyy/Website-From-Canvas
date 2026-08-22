// Project Management Store — 3.1 Multiple Projects with IndexedDB
import { create } from "zustand";
import type { ProjectMeta, ProjectData } from "../types/canvas";

// ---- IndexedDB helpers ----
const DB_NAME = "canvassite_projects";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const META_STORE = "project_meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "meta.id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
    };
  });
}

async function saveProjectToDB(project: ProjectData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");
    tx.objectStore(STORE_NAME).put(project);
    tx.objectStore(META_STORE).put(project.meta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadProjectFromDB(id: string): Promise<ProjectData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteProjectFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.objectStore(META_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function listProjectMetasFromDB(): Promise<ProjectMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const request = tx.objectStore(META_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ---- Store ----

interface ProjectStoreState {
  projects: ProjectMeta[];
  currentProjectId: string | null;
  isProjectManagerOpen: boolean;
  isLoading: boolean;
}

interface ProjectStoreActions {
  openProjectManager: () => void;
  closeProjectManager: () => void;
  refreshProjectList: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
  saveCurrentProject: (data: Omit<ProjectData, "meta">, thumbnail?: string) => Promise<void>;
  loadProject: (id: string) => Promise<ProjectData | null>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;
  exportProject: (id: string) => Promise<string>;
  importProject: (jsonString: string) => Promise<string>;
  setCurrentProjectId: (id: string | null) => void;
}

type ProjectStore = ProjectStoreState & ProjectStoreActions;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isProjectManagerOpen: false,
  isLoading: false,

  openProjectManager: () => set({ isProjectManagerOpen: true }),
  closeProjectManager: () => set({ isProjectManagerOpen: false }),

  refreshProjectList: async () => {
    try {
      const metas = await listProjectMetasFromDB();
      set({ projects: metas.sort((a, b) => b.updatedAt - a.updatedAt) });
    } catch (e) {
      console.error("Failed to list projects:", e);
    }
  },

  createProject: async (name) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const meta: ProjectMeta = { id, name, createdAt: now, updatedAt: now };
    const project: ProjectData = {
      meta,
      pages: {
        "page-1": {
          id: "page-1",
          name: "Home",
          slug: "index",
          nodes: {},
        },
      },
      activePageId: "page-1",
      colorTokens: [],
      textStyleTokens: [],
      components: {},
      seo: {},
      assets: [],
    };
    await saveProjectToDB(project);
    set((s) => ({ projects: [meta, ...s.projects], currentProjectId: id }));
    return id;
  },

  saveCurrentProject: async (data, thumbnail) => {
    const state = get();
    const projectId = state.currentProjectId;
    if (!projectId) return;

    const existingMeta = state.projects.find((p) => p.id === projectId);
    const meta: ProjectMeta = {
      id: projectId,
      name: existingMeta?.name || "Untitled Project",
      thumbnail: thumbnail || existingMeta?.thumbnail,
      createdAt: existingMeta?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    const project: ProjectData = { meta, ...data };
    await saveProjectToDB(project);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? meta : p)),
    }));
  },

  loadProject: async (id) => {
    set({ isLoading: true });
    try {
      const project = await loadProjectFromDB(id);
      if (project) {
        set({ currentProjectId: id });
      }
      return project;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    await deleteProjectFromDB(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
    }));
  },

  renameProject: async (id, name) => {
    const project = await loadProjectFromDB(id);
    if (!project) return;
    project.meta.name = name;
    project.meta.updatedAt = Date.now();
    await saveProjectToDB(project);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  },

  duplicateProject: async (id) => {
    const project = await loadProjectFromDB(id);
    if (!project) throw new Error("Project not found");

    const newId = crypto.randomUUID();
    const now = Date.now();
    const newProject: ProjectData = {
      ...structuredClone(project),
      meta: {
        id: newId,
        name: `${project.meta.name} (Copy)`,
        thumbnail: project.meta.thumbnail,
        createdAt: now,
        updatedAt: now,
      },
    };
    await saveProjectToDB(newProject);
    set((s) => ({ projects: [newProject.meta, ...s.projects] }));
    return newId;
  },

  exportProject: async (id) => {
    const project = await loadProjectFromDB(id);
    if (!project) throw new Error("Project not found");
    return JSON.stringify(project, null, 2);
  },

  importProject: async (jsonString) => {
    const data = JSON.parse(jsonString) as ProjectData;
    const newId = crypto.randomUUID();
    const now = Date.now();
    data.meta.id = newId;
    data.meta.createdAt = now;
    data.meta.updatedAt = now;
    data.meta.name = `${data.meta.name} (Imported)`;
    await saveProjectToDB(data);
    set((s) => ({ projects: [data.meta, ...s.projects] }));
    return newId;
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
}));
