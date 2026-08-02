import type { CanvasNode, BreakpointKey } from "../types/canvas";

/**
 * Resolves and merges a CanvasNode's base properties with active breakpoint overrides.
 * - If activeBreakpoint === "desktop" or no override exists for the active breakpoint,
 *   returns the base node.
 * - Otherwise, merges geometry and style overrides over the base node.
 */
export function getEffectiveNode(
  node: CanvasNode,
  activeBreakpoint: BreakpointKey
): CanvasNode {
  if (activeBreakpoint === "desktop" || !node.breakpoints) {
    return node;
  }

  const override = node.breakpoints[activeBreakpoint];
  if (!override) {
    return node;
  }

  const mergedGeometry = override.geometry
    ? { ...node.geometry, ...override.geometry }
    : node.geometry;

  const mergedStyle = override.style
    ? {
        ...node.style,
        ...override.style,
        border: override.style.border
          ? { ...node.style.border, ...override.style.border }
          : node.style.border,
        typography: override.style.typography
          ? { ...node.style.typography, ...override.style.typography }
          : node.style.typography,
        shadow: override.style.shadow
          ? { ...node.style.shadow, ...override.style.shadow }
          : node.style.shadow,
      }
    : node.style;

  return {
    ...node,
    geometry: mergedGeometry,
    style: mergedStyle,
  };
}

/**
 * Helper to get all effective nodes mapped by NodeId for a given breakpoint.
 */
export function getEffectiveNodesMap(
  nodes: Record<string, CanvasNode>,
  activeBreakpoint: BreakpointKey
): Record<string, CanvasNode> {
  if (activeBreakpoint === "desktop") return nodes;

  const effectiveMap: Record<string, CanvasNode> = {};
  Object.keys(nodes).forEach((id) => {
    effectiveMap[id] = getEffectiveNode(nodes[id], activeBreakpoint);
  });
  return effectiveMap;
}
