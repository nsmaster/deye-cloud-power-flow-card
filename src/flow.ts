/** Direction relative to the inverter: `in` flows towards it, `out` away from it. */
export type FlowDirection = 'in' | 'out' | 'none';

/**
 * - `source`: positive power flows into the inverter (PV).
 * - `sink`: positive power flows out of the inverter (UPS, load).
 * - `bidirectional`: positive = in, negative = out (grid import/export, battery discharge/charge).
 */
export type LineKind = 'source' | 'sink' | 'bidirectional';

/** One dot cycle, the same on every line (measured from the app: ~3 s). */
export const FLOW_CYCLE_S = 3;

export function flowDirection(powerW: number | null, kind: LineKind, minFlowW: number, enabled = true): FlowDirection {
  if (!enabled || powerW === null || !Number.isFinite(powerW) || Math.abs(powerW) <= minFlowW) return 'none';
  switch (kind) {
    case 'source':
      return powerW > 0 ? 'in' : 'none';
    case 'sink':
      return powerW > 0 ? 'out' : 'none';
    case 'bidirectional':
      return powerW > 0 ? 'in' : 'out';
  }
}
