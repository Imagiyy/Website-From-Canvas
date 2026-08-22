// Collaboration Store — 3.5 Real-Time Collaboration (UI Shell with simulated presence)
import { create } from "zustand";

export interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  x: number;
  y: number;
  isActive: boolean;
  lastSeen: number;
}

interface CollaborationStoreState {
  isCollaborationEnabled: boolean;
  collaborators: CollaboratorCursor[];
  shareLink: string | null;
  shareMode: "view" | "edit";
  isShareDialogOpen: boolean;
}

interface CollaborationStoreActions {
  enableCollaboration: () => void;
  disableCollaboration: () => void;
  updateCursorPosition: (id: string, x: number, y: number) => void;
  addCollaborator: (name: string, color: string) => string;
  removeCollaborator: (id: string) => void;
  generateShareLink: (mode: "view" | "edit") => string;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  startDemoMode: () => void;
  stopDemoMode: () => void;
}

type CollaborationStore = CollaborationStoreState & CollaborationStoreActions;

// Mock collaborators for demo mode
const MOCK_COLLABORATORS: Omit<CollaboratorCursor, "id">[] = [
  { name: "Alex Chen", color: "#3B82F6", x: 400, y: 300, isActive: true, lastSeen: Date.now() },
  { name: "Sarah Kim", color: "#EF4444", x: 600, y: 200, isActive: true, lastSeen: Date.now() },
  { name: "Jordan Lee", color: "#10B981", x: 300, y: 500, isActive: false, lastSeen: Date.now() - 120000 },
];

let demoInterval: ReturnType<typeof setInterval> | null = null;

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  isCollaborationEnabled: false,
  collaborators: [],
  shareLink: null,
  shareMode: "view",
  isShareDialogOpen: false,

  enableCollaboration: () => set({ isCollaborationEnabled: true }),
  disableCollaboration: () => {
    get().stopDemoMode();
    set({ isCollaborationEnabled: false, collaborators: [] });
  },

  updateCursorPosition: (id, x, y) => {
    set((s) => ({
      collaborators: s.collaborators.map((c) =>
        c.id === id ? { ...c, x, y, lastSeen: Date.now() } : c
      ),
    }));
  },

  addCollaborator: (name, color) => {
    const id = crypto.randomUUID();
    const collaborator: CollaboratorCursor = {
      id,
      name,
      color,
      x: 0,
      y: 0,
      isActive: true,
      lastSeen: Date.now(),
    };
    set((s) => ({
      collaborators: [...s.collaborators, collaborator],
    }));
    return id;
  },

  removeCollaborator: (id) => {
    set((s) => ({
      collaborators: s.collaborators.filter((c) => c.id !== id),
    }));
  },

  generateShareLink: (mode) => {
    const link = `https://canvassite.app/share/${crypto.randomUUID().slice(0, 8)}?mode=${mode}`;
    set({ shareLink: link, shareMode: mode });
    return link;
  },

  openShareDialog: () => set({ isShareDialogOpen: true }),
  closeShareDialog: () => set({ isShareDialogOpen: false }),

  startDemoMode: () => {
    const collaborators = MOCK_COLLABORATORS.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
    }));
    set({ collaborators, isCollaborationEnabled: true });

    // Simulate cursor movement
    demoInterval = setInterval(() => {
      set((s) => ({
        collaborators: s.collaborators.map((c) => ({
          ...c,
          x: c.x + (Math.random() - 0.5) * 20,
          y: c.y + (Math.random() - 0.5) * 20,
          lastSeen: c.isActive ? Date.now() : c.lastSeen,
        })),
      }));
    }, 800);
  },

  stopDemoMode: () => {
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }
  },
}));
