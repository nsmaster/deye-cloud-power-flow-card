import type { NodeId } from './config';

export interface Point {
  x: number;
  y: number;
}

export type LineId = Exclude<NodeId, 'inverter'>;

/**
 * Geometry measured from the Deye Cloud screen recording (iPhone, 3× scale),
 * in points. Text sizes in styles.ts use the same units.
 */
export const VIEW = { x: 30, y: 24, width: 333, height: 356 } as const;

export const NODE_SIZE = 57;
export const NODE_BORDER = 4;
export const NODE_RADIUS = 14;
export const INVERTER_SIZE = 52;
export const INVERTER_RADIUS = 11;
export const CORNER_RADIUS = 10;
export const ARROW_LENGTH = 7;
export const ARROW_HALF_WIDTH = 3.8;

/** Node centres. */
export const NODE_POS: Record<NodeId, Point> = {
  pv: { x: 78, y: 61 },
  grid: { x: 315, y: 61 },
  inverter: { x: 196.5, y: 185.5 },
  battery: { x: 78, y: 307.5 },
  ups: { x: 196.5, y: 307.5 },
  load: { x: 315, y: 307.5 },
};

/** Offsets of value and caption baselines below a node's bottom edge. */
export const VALUE_GAP = 21;
export const CAPTION_GAP = 35;

/**
 * Orthogonal polylines, always listed from the outer node to the inverter.
 * They stop short of the nodes, as in the app; the arrow tip sits on the end point.
 */
export const LINE_POINTS: Record<LineId, readonly Point[]> = {
  pv: [
    { x: 115, y: 61 },
    { x: 135, y: 61 },
    { x: 135, y: 178.5 },
    { x: 168.5, y: 178.5 },
  ],
  grid: [
    { x: 278.5, y: 61 },
    { x: 258.5, y: 61 },
    { x: 258.5, y: 178.5 },
    { x: 229.5, y: 178.5 },
  ],
  battery: [
    { x: 111.5, y: 307.5 },
    { x: 135, y: 307.5 },
    { x: 135, y: 190.5 },
    { x: 164.5, y: 190.5 },
  ],
  ups: [
    { x: 196.5, y: 279.5 },
    { x: 196.5, y: 222.5 },
  ],
  load: [
    { x: 281.5, y: 307.5 },
    { x: 258.5, y: 307.5 },
    { x: 258.5, y: 190.5 },
    { x: 229.5, y: 190.5 },
  ],
};

/** Grid status badge (check / cross) on the grid line. */
export const GRID_BADGE: Point = { x: 258.5, y: 119.5 };
export const GRID_BADGE_RADIUS = 6.3;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const length = (a: Point): number => Math.hypot(a.x, a.y);
const unit = (a: Point): Point => {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0 } : scale(a, 1 / len);
};
const round = (n: number): number => Math.round(n * 100) / 100;
const fmt = (p: Point): string => `${round(p.x)} ${round(p.y)}`;

function cornerRadius(points: readonly Point[], i: number, r: number): number {
  const before = length(sub(points[i], points[i - 1]));
  const after = length(sub(points[i + 1], points[i]));
  return Math.min(r, before / 2, after / 2);
}

/** Moves the last point back along the last segment (to end the line at the arrow base). */
export function trimEnd(points: readonly Point[], by: number): Point[] {
  const result = [...points];
  const end = result[result.length - 1];
  const dir = unit(sub(end, result[result.length - 2]));
  result[result.length - 1] = sub(end, scale(dir, by));
  return result;
}

/** Polyline path with corners rounded by circular arcs. */
export function roundedPath(points: readonly Point[], r: number): string {
  if (points.length === 0) return '';
  let d = `M${fmt(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i];
    const rr = cornerRadius(points, i, r);
    const inDir = unit(sub(corner, points[i - 1]));
    const outDir = unit(sub(points[i + 1], corner));
    const sweep = inDir.x * outDir.y - inDir.y * outDir.x > 0 ? 1 : 0;
    d += ` L${fmt(sub(corner, scale(inDir, rr)))} A${round(rr)} ${round(rr)} 0 0 ${sweep} ${fmt(add(corner, scale(outDir, rr)))}`;
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
    total += rr * (Math.PI / 2 - 2); // quarter circle replaces two legs of rr
  }
  return total;
}

/** Filled triangle whose tip is the last point, pointing along the last segment. */
export function arrowPath(points: readonly Point[]): string {
  const tip = points[points.length - 1];
  const dir = unit(sub(tip, points[points.length - 2]));
  const normal = { x: -dir.y, y: dir.x };
  const base = sub(tip, scale(dir, ARROW_LENGTH));
  return `M${fmt(tip)} L${fmt(add(base, scale(normal, ARROW_HALF_WIDTH)))} L${fmt(sub(base, scale(normal, ARROW_HALF_WIDTH)))} Z`;
}

/** Detail panel, sized after the app's Load panel; centred on the diagram. */
export const PANEL = {
  minWidth: 150,
  padX: 14,
  /** Approximate advance per character of 12 px text, to size the panel without measuring. */
  charWidth: 6.1,
  firstBaseline: 25,
  rowStep: 22,
  /** Space below the last row baseline that holds the × button. */
  closeArea: 32.5,
  closeFromBottom: 12.4,
} as const;
