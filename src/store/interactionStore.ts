// Interaction Store — 2.6 Interactions & Animations
import { create } from "zustand";
import type { NodeId, ElementInteractions, HoverState, ClickAction, EntranceAnimation, ScrollAnimation } from "../types/canvas";

interface InteractionStoreState {
  interactions: Record<NodeId, ElementInteractions>;
}

interface InteractionStoreActions {
  setHoverState: (nodeId: NodeId, hover: HoverState | undefined) => void;
  setClickAction: (nodeId: NodeId, click: ClickAction | undefined) => void;
  setEntranceAnimation: (nodeId: NodeId, entrance: EntranceAnimation | undefined) => void;
  setScrollAnimation: (nodeId: NodeId, scroll: ScrollAnimation | undefined) => void;
  getInteractions: (nodeId: NodeId) => ElementInteractions | undefined;
  removeAllInteractions: (nodeId: NodeId) => void;
  loadInteractions: (interactions: Record<NodeId, ElementInteractions>) => void;
}

type InteractionStore = InteractionStoreState & InteractionStoreActions;

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  interactions: {},

  setHoverState: (nodeId, hover) => {
    set((s) => {
      const current = s.interactions[nodeId] || {};
      return {
        interactions: {
          ...s.interactions,
          [nodeId]: { ...current, hover },
        },
      };
    });
  },

  setClickAction: (nodeId, click) => {
    set((s) => {
      const current = s.interactions[nodeId] || {};
      return {
        interactions: {
          ...s.interactions,
          [nodeId]: { ...current, click },
        },
      };
    });
  },

  setEntranceAnimation: (nodeId, entrance) => {
    set((s) => {
      const current = s.interactions[nodeId] || {};
      return {
        interactions: {
          ...s.interactions,
          [nodeId]: { ...current, entrance },
        },
      };
    });
  },

  setScrollAnimation: (nodeId, scroll) => {
    set((s) => {
      const current = s.interactions[nodeId] || {};
      return {
        interactions: {
          ...s.interactions,
          [nodeId]: { ...current, scroll },
        },
      };
    });
  },

  getInteractions: (nodeId) => get().interactions[nodeId],

  removeAllInteractions: (nodeId) => {
    set((s) => {
      const updated = { ...s.interactions };
      delete updated[nodeId];
      return { interactions: updated };
    });
  },

  loadInteractions: (interactions) => set({ interactions }),
}));
