export interface Point {
  x: number;
  y: number;
}

/**
 * Converts an array of freehand points into a smooth SVG quadratic Bezier path data string
 * and computes the bounding box geometry for node positioning.
 */
export function processFreehandPoints(points: Point[]): {
  pathData: string;
  bounds: { x: number; y: number; width: number; height: number; rotation: number };
} {
  if (points.length === 0) {
    return {
      pathData: "",
      bounds: { x: 0, y: 0, width: 10, height: 10, rotation: 0 },
    };
  }

  // 1. Compute bounding box
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);

  // 2. Normalize points relative to (minX, minY)
  const localPts = points.map((p) => ({
    x: Number((p.x - minX).toFixed(2)),
    y: Number((p.y - minY).toFixed(2)),
  }));

  // 3. Generate smooth Bezier path string
  if (localPts.length === 1) {
    const p = localPts[0];
    return {
      pathData: `M ${p.x} ${p.y} L ${(p.x + 0.1).toFixed(2)} ${(p.y + 0.1).toFixed(2)}`,
      bounds: { x: minX, y: minY, width, height, rotation: 0 },
    };
  }

  if (localPts.length === 2) {
    const p0 = localPts[0];
    const p1 = localPts[1];
    return {
      pathData: `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`,
      bounds: { x: minX, y: minY, width, height, rotation: 0 },
    };
  }

  const d: string[] = [`M ${localPts[0].x} ${localPts[0].y}`];

  for (let i = 1; i < localPts.length - 1; i++) {
    const cp = localPts[i];
    const np = localPts[i + 1];
    const midX = Number(((cp.x + np.x) / 2).toFixed(2));
    const midY = Number(((cp.y + np.y) / 2).toFixed(2));
    d.push(`Q ${cp.x} ${cp.y} ${midX} ${midY}`);
  }

  const last = localPts[localPts.length - 1];
  d.push(`L ${last.x} ${last.y}`);

  return {
    pathData: d.join(" "),
    bounds: { x: minX, y: minY, width, height, rotation: 0 },
  };
}
