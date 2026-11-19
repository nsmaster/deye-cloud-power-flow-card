import { solarmanEntities } from './presets/solarman';

export type NodeId = 'pv' | 'grid' | 'inverter' | 'battery' | 'ups' | 'load';

export const NODE_IDS: readonly NodeId[] = ['pv', 'grid', 'inverter', 'battery', 'ups', 'load'];

export type ThemeMode = 'ha' | 'deye';

/** Entity keys per node section, see docs/SPEC.md → "Источник данных". */
export const ENTITY_KEYS = {
  pv: [
    'power',
    'pv1_power',
    'pv1_voltage',
    'pv1_current',
    'pv2_power',
    'pv2_voltage',
    'pv2_current',
    'energy_today',
    'energy_total',
  ],
  grid: [
    'power',
    'inner_power',
    'status',
    'voltage',
    'frequency',
    'import_today',
    'export_today',
    'import_total',
    'export_total',
  ],
  inverter: ['power', 'voltage', 'frequency', 'temperature', 'status'],
  battery: ['power', 'soc', 'voltage', 'current', 'temperature', 'status', 'charge_today', 'discharge_today'],
  ups: ['power', 'voltage', 'energy_today'],
  load: ['power', 'total_power', 'energy_today', 'energy_total'],
} as const satisfies Record<NodeId, readonly string[]>;

export type EntityKey<N extends NodeId> = (typeof ENTITY_KEYS)[N][number];

/** Resolved entity ids per node and key. */
export type EntityMap = { [N in NodeId]?: Partial<Record<EntityKey<N>, string>> };

/** Per-node section: entity ids under ENTITY_KEYS plus display options. */
export interface NodeConfig {
  name?: string;
  icon?: string;
  hidden?: boolean;
  /** Flip the sign of this node's power (and current) if the source uses the opposite convention. */
  invert?: boolean;
  [key: string]: unknown;
}

export interface GridConfig extends NodeConfig {
  no_grid_voltage?: number;
}

export interface BatteryConfig extends NodeConfig {
  soc_warning?: number;
  soc_critical?: number;
}

export interface CardConfig {
  type: string;
  title?: string;
  theme?: ThemeMode;
  preset?: 'solarman' | 'none';
  prefix?: string;
  min_flow_w?: number;
  stale_after_s?: number;
  show_sign?: boolean;
  /** Render built-in sample data instead of entities (preview, screenshots). */
  demo?: string;
  pv?: NodeConfig;
  grid?: GridConfig;
  inverter?: NodeConfig;
  battery?: BatteryConfig;
  ups?: NodeConfig;
  load?: NodeConfig;
}

export interface ResolvedOptions {
  title?: string;
  theme: ThemeMode;
  minFlowW: number;
  staleAfterS: number;
  showSign: boolean;
  socWarning: number;
  socCritical: number;
  noGridVoltage: number;
  names: Record<NodeId, string>;
  hidden: Record<NodeId, boolean>;
  invert: Record<NodeId, boolean>;
  /** Optional mdi icon replacing the built-in line icon. */
  icons: Partial<Record<NodeId, string>>;
  entities: EntityMap;
}

export const DEFAULTS = {
  minFlowW: 50,
  staleAfterS: 300,
  socWarning: 50,
  socCritical: 20,
  noGridVoltage: 100,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkNumber(config: Record<string, unknown>, key: string, path = key): void {
  const value = config[key];
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    throw new Error(`"${path}" must be a non-negative number`);
  }
}

/** Throws a readable error; Home Assistant shows it as an error card. */
export function validateConfig(config: unknown): CardConfig {
  if (!isRecord(config)) {
    throw new Error('Invalid configuration');
  }
  for (const key of ['min_flow_w', 'stale_after_s']) {
    checkNumber(config, key);
  }
  if (config.theme !== undefined && config.theme !== 'ha' && config.theme !== 'deye') {
    throw new Error('"theme" must be "ha" or "deye"');
  }
  for (const id of NODE_IDS) {
    const section = config[id];
    if (section === undefined) continue;
    if (!isRecord(section)) {
      throw new Error(`"${id}" must be a mapping`);
    }
  }
  if (config.preset !== undefined && config.preset !== 'solarman' && config.preset !== 'none') {
    throw new Error('"preset" must be "solarman" or "none"');
  }
  if (config.prefix !== undefined && (typeof config.prefix !== 'string' || !config.prefix)) {
    throw new Error('"prefix" must be a device name, e.g. "inverter"');
  }
  for (const id of NODE_IDS) {
    const section = config[id];
    if (!isRecord(section)) continue;
    for (const key of ENTITY_KEYS[id]) {
      const value = section[key];
      if (value !== undefined && value !== null && (typeof value !== 'string' || !ENTITY_ID.test(value))) {
        throw new Error(`"${id}.${key}" must be an entity id like "sensor.inverter_pv_power"`);
      }
    }
  }
  for (const id of NODE_IDS) {
    const icon = (config[id] as Record<string, unknown> | undefined)?.icon;
    if (icon !== undefined && (typeof icon !== 'string' || !/^[a-z0-9-]+:[a-z0-9-]+$/.test(icon))) {
      throw new Error(`"${id}.icon" must be an icon like "mdi:solar-power"`);
    }
  }
  if (isRecord(config.battery)) {
    checkNumber(config.battery, 'soc_warning', 'battery.soc_warning');
    checkNumber(config.battery, 'soc_critical', 'battery.soc_critical');
  }
  if (isRecord(config.grid)) {
    checkNumber(config.grid, 'no_grid_voltage', 'grid.no_grid_voltage');
  }
  const valid = config as unknown as CardConfig;
  // Nothing is required: unset values are hidden or computed. Only a config
  // without a single entity is an error, since the card would be empty.
  if (valid.demo === undefined) {
    const entities = resolveEntities(valid);
    if (!Object.values(entities).some((keys) => Object.keys(keys ?? {}).length > 0)) {
      throw new Error('No entities configured: set at least one entity or use "preset: solarman"');
    }
  }
  return valid;
}

const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;

/** Preset entities overlaid with explicit keys; `key: null` removes a preset entity. */
export function resolveEntities(config: CardConfig): EntityMap {
  const base = config.preset === 'solarman' ? solarmanEntities(config.prefix) : {};
  const result: EntityMap = {};
  for (const id of NODE_IDS) {
    const merged = new Map<string, string>(Object.entries(base[id] ?? {}));
    const section = config[id] as Record<string, unknown> | undefined;
    for (const key of ENTITY_KEYS[id]) {
      const value = section?.[key];
      if (typeof value === 'string') merged.set(key, value);
      else if (value === null) merged.delete(key);
    }
    (result as Record<string, Record<string, string>>)[id] = Object.fromEntries(merged);
  }
  return result;
}

export function resolveOptions(config: CardConfig, defaultNames: Record<NodeId, string>): ResolvedOptions {
  const names = {} as Record<NodeId, string>;
  const hidden = {} as Record<NodeId, boolean>;
  const invert = {} as Record<NodeId, boolean>;
  const icons: Partial<Record<NodeId, string>> = {};
  for (const id of NODE_IDS) {
    const icon = config[id]?.icon;
    if (icon) icons[id] = icon;
    names[id] = config[id]?.name ?? defaultNames[id];
    hidden[id] = id !== 'inverter' && config[id]?.hidden === true;
    invert[id] = config[id]?.invert === true;
  }
  return {
    title: config.title,
    theme: config.theme ?? 'ha',
    minFlowW: config.min_flow_w ?? DEFAULTS.minFlowW,
    staleAfterS: config.stale_after_s ?? DEFAULTS.staleAfterS,
    showSign: config.show_sign !== false,
    socWarning: config.battery?.soc_warning ?? DEFAULTS.socWarning,
    socCritical: config.battery?.soc_critical ?? DEFAULTS.socCritical,
    noGridVoltage: config.grid?.no_grid_voltage ?? DEFAULTS.noGridVoltage,
    names,
    hidden,
    invert,
    icons,
    entities: resolveEntities(config),
  };
}
