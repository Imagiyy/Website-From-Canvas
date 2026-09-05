export interface Point {
  x: number;
  y: number;
}

/**
 * Generates point coordinates string for a regular polygon with N sides centered inside bounding box.
 */
export function getPolygonPoints(width: number, height: number, sides: number): string {
  const n = Math.max(3, Math.min(30, sides));
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const points: string[] = [];
  // Start from top point (angle -PI/2)
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(" ");
}

/**
 * Generates point coordinates string for a star shape centered inside bounding box.
 */
export function getStarPoints(
  width: number,
  height: number,
  pointsCount: number,
  innerRadiusRatio: number
): string {
  const n = Math.max(3, Math.min(20, pointsCount));
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * Math.max(0.1, Math.min(0.9, innerRadiusRatio));
  const innerRy = outerRy * Math.max(0.1, Math.min(0.9, innerRadiusRatio));

  const points: string[] = [];
  const totalVertices = n * 2;

  for (let i = 0; i < totalVertices; i++) {
    const angle = (i * Math.PI) / n - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(" ");
}

/**
 * Generates vertex points array for a 3D regular polygon centered inside bounding box.
 */
export function getPolygonVertices(width: number, height: number, sides: number): Point[] {
  const n = Math.max(3, Math.min(30, sides));
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;

  const vertices: Point[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    vertices.push({ x: Number(px.toFixed(2)), y: Number(py.toFixed(2)) });
  }
  return vertices;
}
