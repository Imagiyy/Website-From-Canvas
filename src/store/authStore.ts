// Auth Store — 3.6 Backend & Auth (UI Shell)
import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "email" | "google";
}

export interface TeamWorkspace {
  id: string;
  name: string;
  members: { userId: string; name: string; role: "owner" | "editor" | "viewer" }[];
}

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: "login" | "signup";
  workspaces: TeamWorkspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
}

interface AuthStoreActions {
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: "login" | "signup") => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (id: string) => void;
  // Demo mode
  loginAsDemo: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const DEMO_USER: User = {
  id: "demo-user-1",
  email: "demo@canvassite.app",
  name: "Demo User",
  provider: "email",
};

const DEMO_WORKSPACES: TeamWorkspace[] = [
  {
    id: "ws-personal",
    name: "Personal",
    members: [{ userId: "demo-user-1", name: "Demo User", role: "owner" }],
  },
  {
    id: "ws-team",
    name: "Design Team",
    members: [
      { userId: "demo-user-1", name: "Demo User", role: "owner" },
      { userId: "user-2", name: "Alex Chen", role: "editor" },
      { userId: "user-3", name: "Sarah Kim", role: "viewer" },
    ],
  },
];

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authMode: "login",
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,

  openAuthModal: (mode = "login") => set({ isAuthModalOpen: true, authMode: mode }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode }),

  loginWithEmail: async (_email, _password) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: DEMO_USER,
      isAuthenticated: true,
      isAuthModalOpen: false,
      isLoading: false,
      workspaces: DEMO_WORKSPACES,
      activeWorkspaceId: "ws-personal",
    });
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: { ...DEMO_USER, provider: "google" },
      isAuthenticated: true,
      isAuthModalOpen: false,
      isLoading: false,
      workspaces: DEMO_WORKSPACES,
      activeWorkspaceId: "ws-personal",
    });
  },

  signup: async (name, email, _password) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({
      user: { id: crypto.randomUUID(), email, name, provider: "email" },
      isAuthenticated: true,
      isAuthModalOpen: false,
      isLoading: false,
      workspaces: [{ id: "ws-personal", name: "Personal", members: [] }],
      activeWorkspaceId: "ws-personal",
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      workspaces: [],
      activeWorkspaceId: null,
    });
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  loginAsDemo: () => {
    set({
      user: DEMO_USER,
      isAuthenticated: true,
      isAuthModalOpen: false,
      workspaces: DEMO_WORKSPACES,
      activeWorkspaceId: "ws-personal",
    });
  },
}));
