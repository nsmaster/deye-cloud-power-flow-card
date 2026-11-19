import type { EntityMap, NodeId } from './config';
import type { HassEntity, HomeAssistant } from './types';

/**
 * Normalized values the card renders. Powers are in W, energy in kWh.
 * Signs follow Deye: grid + import / − export, battery + discharge / − charge.
 * `null` means the source entity is missing, unavailable or not numeric.
 */
export interface PowerFlowData {
  pv: number | null;
  /** PV string powers (entity or voltage × current); used by the Production panel. */
  pv1?: number | null;
  pv2?: number | null;
  grid: number | null;
  battery: number | null;
  soc: number | null;
  ups: number | null;
  load: number | null;
  gridOnline: boolean | null;
  productionToday: number | null;
  lastUpdated: Date | null;
  stale: boolean;
}

export type BatteryState = 'charging' | 'discharging' | 'idle' | 'unknown';

export type SocLevel = 'ok' | 'warning' | 'critical' | 'unknown';

export function batteryState(powerW: number | null, idleW: number): BatteryState {
  if (powerW === null || !Number.isFinite(powerW)) return 'unknown';
  if (powerW > idleW) return 'discharging';
  if (powerW < -idleW) return 'charging';
  return 'idle';
}

export function socLevel(soc: number | null, warning: number, critical: number): SocLevel {
  if (soc === null || !Number.isFinite(soc)) return 'unknown';
  if (soc < critical) return 'critical';
  if (soc < warning) return 'warning';
  return 'ok';
}


// ---------------------------------------------------------------------------
// Reading Home Assistant entities
// ---------------------------------------------------------------------------


export type Quantity = 'power' | 'energy' | 'plain';

const POWER_UNITS: Record<string, number> = { mw: 1e6, kw: 1000, w: 1 };
const ENERGY_UNITS: Record<string, number> = { gwh: 1e6, mwh: 1000, kwh: 1, wh: 0.001 };

const MISSING_STATES = new Set(['unavailable', 'unknown', 'none', '']);

export function isAvailable(entity: HassEntity | undefined): entity is HassEntity {
  return entity !== undefined && !MISSING_STATES.has(entity.state.trim().toLowerCase());
}

/** Numeric state normalized to W (power) or kWh (energy); null if missing or not numeric. */
export function entityNumber(entity: HassEntity | undefined, quantity: Quantity = 'plain', invert = false): number | null {
  if (!isAvailable(entity)) return null;
  const value = Number(entity.state.trim());
  if (!Number.isFinite(value)) return null;
  let factor = 1;
  const unit = String(entity.attributes.unit_of_measurement ?? '').trim().toLowerCase();
  if (quantity === 'power') factor = POWER_UNITS[unit] ?? 1;
  if (quantity === 'energy') factor = ENERGY_UNITS[unit] ?? 1;
  const result = value * factor;
  return invert ? -result : result;
}

const ON_STATES = new Set(['on', 'true', '1', 'connected', 'online', 'on grid', 'on-grid', 'on_grid', 'grid']);
const OFF_STATES = new Set(['off', 'false', '0', 'disconnected', 'offline', 'off grid', 'off-grid', 'off_grid']);

/** Grid status from a binary_sensor / sensor, falling back to the grid voltage threshold. */
export function gridOnline(status: HassEntity | undefined, voltage: number | null, noGridVoltage: number): boolean | null {
  if (isAvailable(status)) {
    const state = status.state.trim().toLowerCase();
    if (ON_STATES.has(state)) return true;
    if (OFF_STATES.has(state)) return false;
  }
  if (voltage === null) return null;
  return voltage >= noGridVoltage;
}

export interface ReadOptions {
  noGridVoltage: number;
  staleAfterS: number;
  invert: Record<NodeId, boolean>;
}

/** Entities whose `last_updated` decides the header time and staleness. */
const CORE: readonly (readonly [NodeId, string])[] = [
  ['pv', 'power'],
  ['pv', 'pv1_power'],
  ['pv', 'pv2_power'],
  ['grid', 'power'],
  ['battery', 'power'],
  ['battery', 'soc'],
  ['ups', 'power'],
];

export function entityId(entities: EntityMap, node: NodeId, key: string): string | undefined {
  return (entities[node] as Record<string, string> | undefined)?.[key];
}

export function readData(hass: HomeAssistant, entities: EntityMap, options: ReadOptions, now = Date.now()): PowerFlowData {
  const get = (node: NodeId, key: string): HassEntity | undefined => {
    const id = entityId(entities, node, key);
    return id ? hass.states[id] : undefined;
  };
  const power = (node: NodeId, key = 'power') => entityNumber(get(node, key), 'power', options.invert[node]);
  const plain = (node: NodeId, key: string, invert = false) => entityNumber(get(node, key), 'plain', invert);
  const product = (a: number | null, b: number | null) => (a !== null && b !== null ? a * b : null);

  // Computed when there is no entity: string power = V × I, PV = PV1 + PV2, battery = V × I.
  const pv1 = power('pv', 'pv1_power') ?? product(plain('pv', 'pv1_voltage'), plain('pv', 'pv1_current'));
  const pv2 = power('pv', 'pv2_power') ?? product(plain('pv', 'pv2_voltage'), plain('pv', 'pv2_current'));
  const pv = power('pv') ?? (pv1 === null && pv2 === null ? null : (pv1 ?? 0) + (pv2 ?? 0));
  const battery =
    power('battery') ?? product(plain('battery', 'voltage'), plain('battery', 'current', options.invert.battery));

  const grid = power('grid');
  const inverterGridPort = entityNumber(get('grid', 'inner_power'), 'power', options.invert.grid);
  const explicitLoad = power('load');
  // Grid-side load = what the CT sees minus what goes through the inverter's grid port.
  // Clamped at 0: measurement noise of two sensors must not show as a negative load.
  const load = explicitLoad ?? (grid !== null && inverterGridPort !== null ? Math.max(0, grid - inverterGridPort) : null);

  let newest: number | null = null;
  let newestAny: number | null = null;
  for (const [node, key] of CORE) {
    const entity = get(node, key);
    if (!entity) continue;
    const time = Date.parse(entity.last_updated);
    if (!Number.isFinite(time)) continue;
    newestAny = Math.max(newestAny ?? time, time);
    if (entityNumber(entity) !== null) newest = Math.max(newest ?? time, time);
  }
  const updated = newest ?? newestAny;

  return {
    pv,
    pv1,
    pv2,
    grid,
    battery,
    soc: entityNumber(get('battery', 'soc')),
    ups: power('ups'),
    load,
    gridOnline: gridOnline(get('grid', 'status'), entityNumber(get('grid', 'voltage')), options.noGridVoltage),
    productionToday: entityNumber(get('pv', 'energy_today'), 'energy'),
    lastUpdated: updated === null ? null : new Date(updated),
    stale: newest === null || now - newest > options.staleAfterS * 1000,
  };
}

/** Which nodes have data: configured directly or computable from configured entities. */
export interface Presence {
  pv: boolean;
  grid: boolean;
  battery: boolean;
  soc: boolean;
  ups: boolean;
  load: boolean;
}

export function presence(entities: EntityMap): Presence {
  const has = (node: NodeId, key: string) => entityId(entities, node, key) !== undefined;
  const pvString = (n: number) => has('pv', `pv${n}_power`) || (has('pv', `pv${n}_voltage`) && has('pv', `pv${n}_current`));
  return {
    pv: has('pv', 'power') || pvString(1) || pvString(2),
    grid: has('grid', 'power'),
    battery: has('battery', 'power') || has('battery', 'soc') || (has('battery', 'voltage') && has('battery', 'current')),
    soc: has('battery', 'soc'),
    ups: has('ups', 'power'),
    load: has('load', 'power') || (has('grid', 'power') && has('grid', 'inner_power')),
  };
}

/** All entity ids the card depends on (for change detection). */
export function trackedEntityIds(entities: EntityMap): string[] {
  const ids = new Set<string>();
  for (const keys of Object.values(entities)) {
    for (const id of Object.values(keys as Record<string, string>)) ids.add(id);
  }
  return [...ids];
}
