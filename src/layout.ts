import type { NodeId } from './config';

export interface Point {
  x: number;
  y: number;
}

export type LineId = Exclude<NodeId, 'inverter'>;

/** SVG coordinate space. Text sizes in styles.ts are in these units. */
export const VIEW = { width: 340, height: 392 } as const;

export const NODE_SIZE = 64;
export const INVERTER_SIZE = 72;
export const NODE_RADIUS = 14;
export const CORNER_RADIUS = 6;
export const ICON_SIZE = 32;

/** Node centres. */
export const NODE_POS: Record<NodeId, Point> = {
  pv: { x: 60, y: 72 },
  grid: { x: 280, y: 72 },
  inverter: { x: 170, y: 196 },
  battery: { x: 60, y: 304 },
  ups: { x: 170, y: 304 },
  load: { x: 280, y: 304 },
};

/** Orthogonal polylines, always drawn from the node edge to the inverter edge. */
export const LINE_POINTS: Record<LineId, readonly Point[]> = {
  pv: [
    { x: 92, y: 72 },
    { x: 150, y: 72 },
    { x: 150, y: 160 },
  ],
  grid: [
    { x: 248, y: 72 },
    { x: 190, y: 72 },
    { x: 190, y: 160 },
  ],
  battery: [
    { x: 60, y: 272 },
    { x: 60, y: 196 },
    { x: 134, y: 196 },
  ],
  ups: [
    { x: 170, y: 272 },
    { x: 170, y: 232 },
  ],
  load: [
    { x: 280, y: 272 },
    { x: 280, y: 196 },
    { x: 206, y: 196 },
  ],
};

/** Grid status badge (check / cross) sits on the grid line. */
export const GRID_BADGE: Point = { x: 219, y: 72 };

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const length = (a: Point): number => Math.hypot(a.x, a.y);
const unit = (a: Point): Point => {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : scale(a, 1 / len);
};
const fmt = (p: Point): string => `${round(p.x)} ${round(p.y)}`;
const round = (n: number): number => Math.round(n * 100) / 100;

function cornerRadius(points: readonly Point[], i: number, r: number): number {
  const before = length(sub(points[i], points[i - 1]));
  const after = length(sub(points[i + 1], points[i]));
  return Math.min(r, before / 2, after / 2);
}

/** Polyline path with corners rounded by a quadratic curve. */
export function roundedPath(points: readonly Point[], r: number): string {
  if (points.length === 0) return '';
  let d = `M${fmt(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i];
    const rr = cornerRadius(points, i, r);
    const inDir = unit(sub(corner, points[i - 1]));
    const outDir = unit(sub(points[i + 1], corner));
    d += ` L${fmt(sub(corner, scale(inDir, rr)))} Q${fmt(corner)} ${fmt(add(corner, scale(outDir, rr)))}`;
  }
  if (points.length > 1) d += ` L${fmt(points[points.length - 1])}`;
  return d;
}

/** Length of roundedPath() for right-angle corners. */
export function pathLength(points: readonly Point[], r: number): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += length(sub(points[i], points[i - 1]));
  for (let i = 1; i < points.length - 1; i++) {
    const rr = cornerRadius(points, i, r);
    total += rr * (1.6232 - 2); // quarter-turn quadratic curve replaces two legs of rr
  }
  return total;
}

/** Chevron pointing along the last segment, its tip just short of the end point. */
export function arrowPath(points: readonly Point[], size = 5): string {
  const end = points[points.length - 1];
  const dir = unit(sub(end, points[points.length - 2]));
  const normal = { x: -dir.y, y: dir.x };
  const tip = sub(end, scale(dir, 1.5));
  const back = sub(tip, scale(dir, size));
  return `M${fmt(add(back, scale(normal, size * 0.8)))} L${fmt(tip)} L${fmt(sub(back, scale(normal, size * 0.8)))}`;
}
