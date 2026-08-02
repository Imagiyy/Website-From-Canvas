import type {
  Geometry,
  NodesById,
  NodeId,
  AlignmentGuide,
  CanvasNode,
} from "../types/canvas";

export interface SnappingResult {
  snappedX: number;
  snappedY: number;
  snappedWidth?: number;
  snappedHeight?: number;
  guides: AlignmentGuide[];
}

const SNAP_THRESHOLD_SCREEN_PX = 6;

/** Get bounding box for a node in world space */
function getNodeBounds(node: CanvasNode): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (node.type === "line") {
    const x1 = node.geometry.x;
    const y1 = node.geometry.y;
    const x2 = node.geometry.x + node.geometry.width;
    const y2 = node.geometry.y + node.geometry.height;
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const width = Math.abs(node.geometry.width);
    const height = Math.abs(node.geometry.height);
    return { x: minX, y: minY, width, height };
  }
  return {
    x: node.geometry.x,
    y: node.geometry.y,
    width: node.geometry.width,
    height: node.geometry.height,
  };
}

/**
 * Calculates snapped X and Y coordinates and active alignment guide lines
 * when moving or resizing a node.
 */
export function computeSnapping(
  movingGeom: Geometry,
  movingNodeIds: Set<NodeId>,
  nodes: NodesById,
  zoom: number,
  disabled: boolean = false
): SnappingResult {
  if (disabled) {
    return {
      snappedX: movingGeom.x,
      snappedY: movingGeom.y,
      snappedWidth: movingGeom.width,
      snappedHeight: movingGeom.height,
      guides: [],
    };
  }

  const threshold = SNAP_THRESHOLD_SCREEN_PX / zoom;

  // Filter target nodes (top-level nodes that are not being moved)
  const targetNodes = Object.values(nodes).filter((node) => {
    if (movingNodeIds.has(node.id)) return false;
    if (node.parentId !== null && movingNodeIds.has(node.parentId)) return false;
    return node.parentId === null;
  });

  if (targetNodes.length === 0) {
    return {
      snappedX: movingGeom.x,
      snappedY: movingGeom.y,
      snappedWidth: movingGeom.width,
      snappedHeight: movingGeom.height,
      guides: [],
    };
  }

  let snappedX = movingGeom.x;
  let snappedY = movingGeom.y;
  let minDiffX = threshold + 1;
  let minDiffY = threshold + 1;

  const guides: AlignmentGuide[] = [];

  const movingXPoints = [
    { type: "start", val: movingGeom.x },
    { type: "center", val: movingGeom.x + movingGeom.width / 2 },
    { type: "end", val: movingGeom.x + movingGeom.width },
  ];

  const movingYPoints = [
    { type: "start", val: movingGeom.y },
    { type: "center", val: movingGeom.y + movingGeom.height / 2 },
    { type: "end", val: movingGeom.y + movingGeom.height },
  ];

  // 1. Vertical alignment (X axis)
  targetNodes.forEach((target) => {
    const tb = getNodeBounds(target);
    const targetXPoints = [
      { type: "start", val: tb.x },
      { type: "center", val: tb.x + tb.width / 2 },
      { type: "end", val: tb.x + tb.width },
    ];

    movingXPoints.forEach((mPoint) => {
      targetXPoints.forEach((tPoint) => {
        const diff = Math.abs(mPoint.val - tPoint.val);
        if (diff < minDiffX) {
          minDiffX = diff;
          const shift = tPoint.val - mPoint.val;
          snappedX = movingGeom.x + shift;

          const minY = Math.min(movingGeom.y, tb.y) - 10 / zoom;
          const maxY = Math.max(movingGeom.y + movingGeom.height, tb.y + tb.height) + 10 / zoom;

          guides.push({
            id: `v-${tPoint.val}`,
            type: "vertical",
            position: tPoint.val,
            start: minY,
            end: maxY,
          });
        }
      });
    });
  });

  // 2. Horizontal alignment (Y axis)
  targetNodes.forEach((target) => {
    const tb = getNodeBounds(target);
    const targetYPoints = [
      { type: "start", val: tb.y },
      { type: "center", val: tb.y + tb.height / 2 },
      { type: "end", val: tb.y + tb.height },
    ];

    movingYPoints.forEach((mPoint) => {
      targetYPoints.forEach((tPoint) => {
        const diff = Math.abs(mPoint.val - tPoint.val);
        if (diff < minDiffY) {
          minDiffY = diff;
          const shift = tPoint.val - mPoint.val;
          snappedY = movingGeom.y + shift;

          const minX = Math.min(movingGeom.x, tb.x) - 10 / zoom;
          const maxX = Math.max(movingGeom.x + movingGeom.width, tb.x + tb.width) + 10 / zoom;

          guides.push({
            id: `h-${tPoint.val}`,
            type: "horizontal",
            position: tPoint.val,
            start: minX,
            end: maxX,
          });
        }
      });
    });
  });

  // Deduplicate and filter guides to only those matching snapped position
  const activeGuides: AlignmentGuide[] = [];
  const guideSet = new Set<string>();

  guides.forEach((g) => {
    if (g.type === "vertical") {
      const currentMovingXPoints = [
        snappedX,
        snappedX + movingGeom.width / 2,
        snappedX + movingGeom.width,
      ];
      if (currentMovingXPoints.some((x) => Math.abs(x - g.position) < 0.01)) {
        if (!guideSet.has(g.id)) {
          guideSet.add(g.id);
          activeGuides.push(g);
        }
      }
    } else {
      const currentMovingYPoints = [
        snappedY,
        snappedY + movingGeom.height / 2,
        snappedY + movingGeom.height,
      ];
      if (currentMovingYPoints.some((y) => Math.abs(y - g.position) < 0.01)) {
        if (!guideSet.has(g.id)) {
          guideSet.add(g.id);
          activeGuides.push(g);
        }
      }
    }
  });

  return {
    snappedX,
    snappedY,
    snappedWidth: movingGeom.width,
    snappedHeight: movingGeom.height,
    guides: activeGuides,
  };
}
