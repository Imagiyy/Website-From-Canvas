import { BREAKPOINT_WIDTHS, type CanvasNode, type BreakpointKey } from "../types/canvas";

/**
 * Resolves and merges a CanvasNode's base properties with active breakpoint overrides.
 * - If activeBreakpoint === "desktop", returns the base node.
 * - If an explicit override exists for tablet/mobile, merges geometry & style overrides over base node.
 * - If no explicit override exists yet, computes a smart proportional auto-fit for tablet (768px) or mobile (375px)
 *   so elements dynamically adapt to mobile/tablet device width without spilling out!
 */
export function getEffectiveNode(
  node: CanvasNode,
  activeBreakpoint: BreakpointKey
): CanvasNode {
  if (activeBreakpoint === "desktop") {
    return node;
  }

  const baseWidth = BREAKPOINT_WIDTHS.desktop ?? 1200;
  const targetWidth = BREAKPOINT_WIDTHS[activeBreakpoint] ?? 375;
  const ratio = targetWidth / baseWidth;

  const override = node.breakpoints?.[activeBreakpoint];

  if (override) {
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

  // No explicit override exists yet — compute smart proportional auto-fit for mobile/tablet frame
  const autoW = Math.max(20, Math.min(targetWidth - 10, Math.round(node.geometry.width * ratio)));
  const autoH = Math.max(15, Math.round(node.geometry.height * Math.max(0.7, ratio)));
  const rawX = Math.round(node.geometry.x * ratio);
  const autoX = Math.max(5, Math.min(targetWidth - autoW - 5, rawX));
  const autoY = Math.round(node.geometry.y * Math.max(0.75, ratio));

  const autoFontSize = node.style.typography
    ? Math.max(12, Math.round(node.style.typography.fontSize * Math.max(0.7, ratio)))
    : undefined;

  return {
    ...node,
    geometry: {
      ...node.geometry,
      x: autoX,
      y: autoY,
      width: autoW,
      height: autoH,
    },
    style: {
      ...node.style,
      typography: node.style.typography
        ? {
            ...node.style.typography,
            fontSize: autoFontSize!,
          }
        : node.style.typography,
    },
  };
}

/**
 * Helper to get all effective nodes mapped by NodeId for a given breakpoint.
 * Performs smart automatic responsive reflow for mobile viewports so side-by-side elements stack neatly.
 */
export function getEffectiveNodesMap(
  nodes: Record<string, CanvasNode>,
  activeBreakpoint: BreakpointKey
): Record<string, CanvasNode> {
  if (activeBreakpoint === "desktop") return nodes;

  const effectiveMap: Record<string, CanvasNode> = {};
  const nodeList = Object.values(nodes).map((n) => getEffectiveNode(n, activeBreakpoint));

  if (activeBreakpoint === "mobile") {
    // Sort top-to-bottom, left-to-right
    const sorted = [...nodeList].sort((a, b) => a.geometry.y - b.geometry.y || a.geometry.x - b.geometry.x);
    let currentY = sorted[0]?.geometry.y ?? 20;

    sorted.forEach((node) => {
      // If node width is large (>40% screen), stack vertically
      const isWide = node.geometry.width > 120;
      let newY = node.geometry.y;
      if (isWide && node.geometry.y < currentY) {
        newY = currentY + 15;
      }
      effectiveMap[node.id] = {
        ...node,
        geometry: { ...node.geometry, y: newY },
      };
      currentY = Math.max(currentY, newY + node.geometry.height);
    });
    return effectiveMap;
  }

  nodeList.forEach((node) => {
    effectiveMap[node.id] = node;
  });
  return effectiveMap;
}
