// Boolean Operations — 2.3 Advanced Shapes
// Implements Union, Subtract, Intersect, Exclude for SVG paths
// Uses a simplified polygon-based approach for the canvas tool

import type { CanvasNode, Geometry } from "../types/canvas";

/** Represents a 2D point */
interface Point {
  x: number;
  y: number;
}

/** Convert node geometry to precise shape polygon vertices */
function nodeToPolygon(node: CanvasNode): Point[] {
  const { x, y, width, height } = node.geometry;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;

  if (node.type === "circle") {
    const points: Point[] = [];
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
    return points;
  }

  if (node.type === "polygon") {
    const sides = Math.max(3, Math.min(30, node.style.sides ?? 5));
    const points: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
    return points;
  }

  if (node.type === "star") {
    const pointsCount = Math.max(3, Math.min(20, node.style.starPoints ?? 5));
    const innerRatio = node.style.innerRadius ?? 0.5;
    const points: Point[] = [];
    const n = pointsCount * 2;
    for (let i = 0; i < n; i++) {
      const angle = (i * Math.PI) / pointsCount - Math.PI / 2;
      const r = i % 2 === 0 ? 1 : innerRatio;
      points.push({ x: cx + rx * r * Math.cos(angle), y: cy + ry * r * Math.sin(angle) });
    }
    return points;
  }

  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

/** Convert polygon points to SVG path data */
function polygonToPathData(points: Point[]): string {
  if (points.length === 0) return "";
  const parts = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  parts.push("Z");
  return parts.join(" ");
}

/** Calculate bounding box of multiple polygons */
function getPolygonsBoundingBox(polygons: Point[][]): Geometry {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of polygons) {
    for (const p of poly) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, rotation: 0 };
}

/** Check if a point is inside a polygon using ray casting */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/** Line segment intersection */
function lineIntersection(
  p1: Point, p2: Point, p3: Point, p4: Point
): Point | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;

  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / cross;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / cross;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
  }
  return null;
}

/** Simplified Sutherland-Hodgman polygon clipping for intersection */
function clipPolygon(subject: Point[], clip: Point[]): Point[] {
  let output = [...subject];
  
  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return [];
    const input = [...output];
    output = [];
    const edgeStart = clip[i];
    const edgeEnd = clip[(i + 1) % clip.length];
    
    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j + input.length - 1) % input.length];
      
      const currentInside = isLeft(edgeStart, edgeEnd, current);
      const previousInside = isLeft(edgeStart, edgeEnd, previous);
      
      if (currentInside) {
        if (!previousInside) {
          const intersection = lineIntersection(previous, current, edgeStart, edgeEnd);
          if (intersection) output.push(intersection);
        }
        output.push(current);
      } else if (previousInside) {
        const intersection = lineIntersection(previous, current, edgeStart, edgeEnd);
        if (intersection) output.push(intersection);
      }
    }
  }
  
  return output;
}

function isLeft(a: Point, b: Point, c: Point): boolean {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) >= 0;
}

// ---- Public Boolean Operations ----

export interface BooleanResult {
  pathData: string;
  geometry: Geometry;
}

/** Union: Combine outer boundary of two shapes */
export function booleanUnion(nodeA: CanvasNode, nodeB: CanvasNode): BooleanResult {
  const polyA = nodeToPolygon(nodeA);
  const polyB = nodeToPolygon(nodeB);
  const bbox = getPolygonsBoundingBox([polyA, polyB]);
  
  // For simplified union, create a path that contains both shapes
  const pathA = polygonToPathData(polyA);
  const pathB = polygonToPathData(polyB);
  
  return {
    pathData: `${pathA} ${pathB}`,
    geometry: bbox,
  };
}

/** Subtract: Remove shape B from shape A */
export function booleanSubtract(nodeA: CanvasNode, nodeB: CanvasNode): BooleanResult {
  const polyA = nodeToPolygon(nodeA);
  const polyB = nodeToPolygon(nodeB);
  const bbox = getPolygonsBoundingBox([polyA]);
  
  // Create path with hole (even-odd fill rule)
  const pathA = polygonToPathData(polyA);
  const reversedB = [...polyB].reverse();
  const pathB = polygonToPathData(reversedB);
  
  return {
    pathData: `${pathA} ${pathB}`,
    geometry: bbox,
  };
}

/** Intersect: Keep only the overlapping area */
export function booleanIntersect(nodeA: CanvasNode, nodeB: CanvasNode): BooleanResult {
  const polyA = nodeToPolygon(nodeA);
  const polyB = nodeToPolygon(nodeB);
  
  const clipped = clipPolygon(polyA, polyB);
  const bbox = getPolygonsBoundingBox([clipped.length > 0 ? clipped : polyA]);
  
  return {
    pathData: clipped.length > 0 ? polygonToPathData(clipped) : "",
    geometry: bbox,
  };
}

/** Exclude: XOR — keep everything except the overlap */
export function booleanExclude(nodeA: CanvasNode, nodeB: CanvasNode): BooleanResult {
  const polyA = nodeToPolygon(nodeA);
  const polyB = nodeToPolygon(nodeB);
  const bbox = getPolygonsBoundingBox([polyA, polyB]);
  
  // XOR using even-odd fill rule with both paths
  const pathA = polygonToPathData(polyA);
  const pathB = polygonToPathData(polyB);
  
  return {
    pathData: `${pathA} ${pathB}`,
    geometry: bbox,
  };
}

/** Convert a node's shape to an SVG path for pen editing */
export function nodeToPath(node: CanvasNode): string {
  const poly = nodeToPolygon(node);
  return polygonToPathData(poly);
}
