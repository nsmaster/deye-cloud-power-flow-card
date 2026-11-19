import type { NodeId } from './config';
import { formatEnergy, formatNumber, formatPower, DASH, type HaLocale } from './format';
import { batteryState, entityNumber, gridOnline, isAvailable, type PowerFlowData } from './model';
import { STRINGS } from './strings';
import type { HassEntity } from './types';

/** How a row's value is read and formatted. */
type RowKind = 'power' | 'energy' | 'measure' | 'gridStatus' | 'batteryStatus';

interface RowDef {
  label: string;
  node: NodeId;
  key: string;
  kind: RowKind;
  /** Value used when no entity is configured (computed or core values). */
  fallback?: (data: PowerFlowData) => number | boolean | null;
}

/** Rows as listed in the Deye Cloud app panels (labels kept as in the app). */
export const PANEL_ROWS: Partial<Record<NodeId, readonly RowDef[]>> = {
  pv: [
    { label: 'DC Power PV1', node: 'pv', key: 'pv1_power', kind: 'power', fallback: (d) => d.pv1 ?? null },
    { label: 'DC Power PV2', node: 'pv', key: 'pv2_power', kind: 'power', fallback: (d) => d.pv2 ?? null },
    { label: 'DC Voltage PV1', node: 'pv', key: 'pv1_voltage', kind: 'measure' },
    { label: 'DC Voltage PV2', node: 'pv', key: 'pv2_voltage', kind: 'measure' },
    { label: 'DC Current PV1', node: 'pv', key: 'pv1_current', kind: 'measure' },
    { label: 'DC Current PV2', node: 'pv', key: 'pv2_current', kind: 'measure' },
    { label: 'Grid Tie Power', node: 'inverter', key: 'power', kind: 'power' },
  ],
  grid: [
    { label: 'Grid Status', node: 'grid', key: 'status', kind: 'gridStatus', fallback: (d) => d.gridOnline },
    { label: 'Frequency', node: 'grid', key: 'frequency', kind: 'measure' },
    { label: 'Total Grid Power', node: 'grid', key: 'power', kind: 'power', fallback: (d) => d.grid },
    { label: 'Voltage L1', node: 'grid', key: 'voltage', kind: 'measure' },
    { label: 'Daily Import', node: 'grid', key: 'import_today', kind: 'energy' },
    { label: 'Cumulative Import', node: 'grid', key: 'import_total', kind: 'energy' },
    { label: 'Daily Export', node: 'grid', key: 'export_today', kind: 'energy' },
    { label: 'Cumulative Export', node: 'grid', key: 'export_total', kind: 'energy' },
  ],
  inverter: [
    { label: 'Inverter Voltage L1', node: 'inverter', key: 'voltage', kind: 'measure' },
    { label: 'Output Power L1', node: 'inverter', key: 'power', kind: 'power' },
    { label: 'Frequency', node: 'inverter', key: 'frequency', kind: 'measure' },
  ],
  battery: [
    { label: 'Battery Status', node: 'battery', key: 'status', kind: 'batteryStatus', fallback: (d) => d.battery },
    { label: 'Power', node: 'battery', key: 'power', kind: 'power', fallback: (d) => d.battery },
    { label: 'Voltage', node: 'battery', key: 'voltage', kind: 'measure' },
    { label: 'Current', node: 'battery', key: 'current', kind: 'measure' },
    { label: 'Temperature', node: 'battery', key: 'temperature', kind: 'measure' },
  ],
  load: [
    // "Total Load Power" in the app is the grid-side load (56 W in the recording).
    { label: 'Total Load Power', node: 'load', key: 'power', kind: 'power', fallback: (d) => d.load },
    // "Load Power L1" is everything: UPS output + grid-side load (559 W).
    {
      label: 'Load Power L1',
      node: 'load',
      key: 'total_power',
      kind: 'power',
      fallback: (d) => (d.ups !== null && d.load !== null ? d.ups + d.load : null),
    },
    { label: 'Load Voltage L1', node: 'ups', key: 'voltage', kind: 'measure' },
    { label: 'Daily Load', node: 'load', key: 'energy_today', kind: 'energy' },
    { label: 'Cumulative Load', node: 'load', key: 'energy_total', kind: 'energy' },
  ],
};

/** What a panel needs to know about one entity key. */
export interface RowSource {
  entity?: HassEntity;
  /** Set when a real entity backs the row; tapping the row opens its more-info dialog. */
  entityId?: string;
}

export type RowLookup = (node: NodeId, key: string) => RowSource;

export interface PanelRow {
  label: string;
  value: string;
  entityId?: string;
}

export interface PanelContext {
  data: PowerFlowData;
  lookup: RowLookup;
  invert: Record<NodeId, boolean>;
  minFlowW: number;
  noGridVoltage: number;
  showSign: boolean;
  locale?: HaLocale;
}

const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
const joined = (v: { value: string; unit: string }): string => v.value + v.unit;

function formatRow(def: RowDef, source: RowSource, ctx: PanelContext): string | null {
  const { entity } = source;
  const fallback = def.fallback?.(ctx.data) ?? null;
  const hasEntity = source.entityId !== undefined || entity !== undefined;
  if (!hasEntity && fallback === null) return null;

  switch (def.kind) {
    case 'power': {
      const watts = hasEntity ? entityNumber(entity, 'power', ctx.invert[def.node]) : (fallback as number);
      return joined(formatPower(watts, ctx.locale, ctx.showSign));
    }
    case 'energy':
      return joined(formatEnergy(entityNumber(entity, 'energy'), ctx.locale));
    case 'measure': {
      const value = entityNumber(entity, 'plain', def.key === 'current' && ctx.invert[def.node]);
      if (value === null) return DASH;
      return formatNumber(value, 2, ctx.locale) + String(entity?.attributes.unit_of_measurement ?? '');
    }
    case 'gridStatus': {
      const online = hasEntity ? gridOnline(entity, null, ctx.noGridVoltage) : (fallback as boolean);
      if (online === null) return DASH;
      return online ? STRINGS.grid.on : STRINGS.grid.off;
    }
    case 'batteryStatus': {
      if (isAvailable(entity)) return capitalize(entity.state.replace(/_/g, ' '));
      const state = batteryState(ctx.data.battery, ctx.minFlowW);
      return state === 'unknown' ? DASH : STRINGS.battery[state];
    }
  }
}

export function buildPanel(node: NodeId, ctx: PanelContext): PanelRow[] {
  const rows: PanelRow[] = [];
  for (const def of PANEL_ROWS[node] ?? []) {
    const source = ctx.lookup(def.node, def.key);
    const value = formatRow(def, source, ctx);
    if (value !== null) rows.push({ label: def.label, value, entityId: source.entityId });
  }
  return rows;
}
