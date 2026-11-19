/** Direction relative to the inverter: `in` flows towards it, `out` away from it. */
export type FlowDirection = 'in' | 'out' | 'none';

/**
 * - `source`: positive power flows into the inverter (PV).
 * - `sink`: positive power flows out of the inverter (UPS, load).
 * - `bidirectional`: positive = in, negative = out (grid import/export, battery discharge/charge).
 */
export type LineKind = 'source' | 'sink' | 'bidirectional';

export interface FlowOptions {
  minFlowW: number;
  maxPowerW: number;
}

export interface LineFlow {
  direction: FlowDirection;
  /** Seconds for a dot to travel the whole line; null when the line is idle. */
  durationS: number | null;
}

export const SLOWEST_S = 4;
export const FASTEST_S = 1;

export function flowDirection(powerW: number | null, kind: LineKind, minFlowW: number): FlowDirection {
  if (powerW === null || !Number.isFinite(powerW) || Math.abs(powerW) <= minFlowW) return 'none';
  switch (kind) {
    case 'source':
      return powerW > 0 ? 'in' : 'none';
    case 'sink':
      return powerW > 0 ? 'out' : 'none';
    case 'bidirectional':
      return powerW > 0 ? 'in' : 'out';
  }
}

/** Linear from SLOWEST_S at the threshold to FASTEST_S at max power. */
export function flowDuration(powerW: number, { minFlowW, maxPowerW }: FlowOptions): number {
  const range = maxPowerW - minFlowW;
  const t = range > 0 ? (Math.abs(powerW) - minFlowW) / range : 1;
  const clamped = Math.min(1, Math.max(0, t));
  return SLOWEST_S - (SLOWEST_S - FASTEST_S) * clamped;
}

export function lineFlow(powerW: number | null, kind: LineKind, options: FlowOptions, enabled = true): LineFlow {
  const direction = enabled ? flowDirection(powerW, kind, options.minFlowW) : 'none';
  if (direction === 'none' || powerW === null) return { direction: 'none', durationS: null };
  return { direction, durationS: flowDuration(powerW, options) };
}
