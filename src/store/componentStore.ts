// Component System Store — 2.1 Symbols
import { create } from "zustand";
import type { ComponentDefinition, ComponentOverride, CanvasNode, NodesById } from "../types/canvas";

interface ComponentStoreState {
  components: Record<string, ComponentDefinition>;
}

interface ComponentStoreActions {
  createComponent: (name: string, sourceNode: CanvasNode, nodes: NodesById) => ComponentDefinition;
  deleteComponent: (id: string) => void;
  renameComponent: (id: string, name: string) => void;
  updateComponentDescription: (id: string, description: string) => void;
  updateComponentThumbnail: (id: string, thumbnail: string) => void;
  getComponent: (id: string) => ComponentDefinition | undefined;
  loadComponents: (components: Record<string, ComponentDefinition>) => void;
}

type ComponentStore = ComponentStoreState & ComponentStoreActions;

export const useComponentStore = create<ComponentStore>((set, get) => ({
  components: {},

  createComponent: (name, sourceNode, _nodes) => {
    const id = crypto.randomUUID();
    const component: ComponentDefinition = {
      id,
      name,
      sourceNodeId: sourceNode.id,
      createdAt: Date.now(),
    };
    set((s) => ({
      components: { ...s.components, [id]: component },
    }));
    return component;
  },

  deleteComponent: (id) => {
    set((s) => {
      const updated = { ...s.components };
      delete updated[id];
      return { components: updated };
    });
  },

  renameComponent: (id, name) => {
    set((s) => {
      const comp = s.components[id];
      if (!comp) return s;
      return {
        components: {
          ...s.components,
          [id]: { ...comp, name },
        },
      };
    });
  },

  updateComponentDescription: (id, description) => {
    set((s) => {
      const comp = s.components[id];
      if (!comp) return s;
      return {
        components: {
          ...s.components,
          [id]: { ...comp, description },
        },
      };
    });
  },

  updateComponentThumbnail: (id, thumbnail) => {
    set((s) => {
      const comp = s.components[id];
      if (!comp) return s;
      return {
        components: {
          ...s.components,
          [id]: { ...comp, thumbnail },
        },
      };
    });
  },

  getComponent: (id) => get().components[id],

  loadComponents: (components) => set({ components }),
}));

/** Helper: Create a component instance node from a component definition */
export function createComponentInstance(
  component: ComponentDefinition,
  masterNode: CanvasNode,
  x: number,
  y: number,
  overrides?: ComponentOverride
): CanvasNode {
  return {
    id: crypto.randomUUID(),
    parentId: null,
    type: "componentInstance",
    name: `${component.name} Instance`,
    order: 0,
    geometry: {
      ...masterNode.geometry,
      x,
      y,
    },
    style: { ...masterNode.style },
    content: masterNode.content ? { ...masterNode.content } : undefined,
    componentId: component.id,
    componentOverrides: overrides,
    children: masterNode.children ? [...masterNode.children] : undefined,
  };
}

/** Helper: Resolve effective properties for a component instance */
export function resolveComponentInstance(
  instance: CanvasNode,
  masterNode: CanvasNode
): CanvasNode {
  if (!instance.componentOverrides) return { ...masterNode, id: instance.id, geometry: instance.geometry };

  const overrides = instance.componentOverrides;
  return {
    ...masterNode,
    id: instance.id,
    name: instance.name,
    geometry: {
      ...masterNode.geometry,
      ...overrides.geometry,
    },
    style: {
      ...masterNode.style,
      ...overrides.style,
    },
    content: overrides.content || masterNode.content,
    componentId: instance.componentId,
    componentOverrides: instance.componentOverrides,
  };
}
