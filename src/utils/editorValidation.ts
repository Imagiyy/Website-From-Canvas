import type { CanvasNode, NodesById } from "../types/canvas";

export function isValidNodeMap(nodes: unknown): nodes is NodesById {
  if (!nodes || typeof nodes !== "object") return false;
  return Object.values(nodes as Record<string, any>).every((node) => {
    if (!node || typeof node !== "object") return false;
    return typeof node.id === "string" && typeof node.type === "string" && typeof node.name === "string";
  });
}

export function sanitizeNodeChildren(nodes: NodesById): NodesById {
  const next: NodesById = { ...nodes };

  Object.values(next).forEach((node) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "group" && Array.isArray(node.children)) {
      next[node.id] = {
        ...node,
        children: node.children.filter((childId) => typeof childId === "string" && Boolean(next[childId])),
      };
    }

    if (node.parentId && !next[node.parentId]) {
      next[node.id] = { ...node, parentId: null };
    }
  });

  return next;
}

export function hasCircularGroupLink(nodes: NodesById, nodeId: string, seen = new Set<string>()): boolean {
  if (seen.has(nodeId)) return true;
  seen.add(nodeId);

  const node = nodes[nodeId] as CanvasNode | undefined;
  if (!node || node.parentId == null) return false;
  return hasCircularGroupLink(nodes, node.parentId, seen);
}
