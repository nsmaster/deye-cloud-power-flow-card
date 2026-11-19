import { describe, expect, it } from 'vitest';
import type { NodeId } from '../src/config';
import type { PowerFlowData } from '../src/model';
import { buildPanel, type PanelContext, type RowSource } from '../src/panels';

const data: PowerFlowData = {
  pv: 948,
  grid: 19,
  battery: -389,
  soc: 96,
  ups: 503,
  load: 56,
  gridOnline: true,
  productionToday: 1.2,
  lastUpdated: null,
  stale: false,
};

const entity = (state: string, unit?: string) => ({
  entity_id: '',
  state,
  attributes: unit ? { unit_of_measurement: unit } : {},
  last_updated: '',
});

const states: Record<string, RowSource> = {
  'ups.voltage': { entityId: 'sensor.inverter_load_l1_voltage', entity: entity('232.6', 'V') },
  'load.energy_today': { entityId: 'sensor.inverter_today_load_consumption', entity: entity('5.1', 'kWh') },
  'load.energy_total': { entityId: 'sensor.inverter_total_load_consumption', entity: entity('23280', 'kWh') },
  'battery.status': { entityId: 'sensor.inverter_battery_state', entity: entity('charging') },
  'battery.current': { entityId: 'sensor.inverter_battery_current', entity: entity('7.31', 'A') },
  'grid.status': { entityId: 'binary_sensor.inverter_grid', entity: entity('off') },
  'pv.pv1_voltage': { entityId: 'sensor.inverter_pv1_voltage', entity: entity('unavailable', 'V') },
};

const ctx = (overrides: Partial<PanelContext> = {}): PanelContext => ({
  data,
  lookup: (node: NodeId, key: string) => states[`${node}.${key}`] ?? {},
  invert: { pv: false, grid: false, inverter: false, battery: false, ups: false, load: false },
  minFlowW: 50,
  noGridVoltage: 100,
  showSign: true,
  locale: { language: 'en', number_format: 'comma_decimal' },
  ...overrides,
});

describe('buildPanel', () => {
  it('reproduces the Load panel from the recording', () => {
    expect(buildPanel('load', ctx())).toEqual([
      { label: 'Total Load Power', value: '56.00W', entityId: undefined },
      { label: 'Load Power L1', value: '559.00W', entityId: undefined },
      { label: 'Load Voltage L1', value: '232.60V', entityId: 'sensor.inverter_load_l1_voltage' },
      { label: 'Daily Load', value: '5.10kWh', entityId: 'sensor.inverter_today_load_consumption' },
      { label: 'Cumulative Load', value: '23.28MWh', entityId: 'sensor.inverter_total_load_consumption' },
    ]);
  });

  it('hides rows without an entity or computed value', () => {
    expect(buildPanel('inverter', ctx())).toEqual([]);
    expect(buildPanel('ups', ctx())).toEqual([]);
  });

  it('shows a dash for a configured but unavailable entity', () => {
    expect(buildPanel('pv', ctx())).toEqual([{ label: 'DC Voltage PV1', value: '—', entityId: 'sensor.inverter_pv1_voltage' }]);
  });

  it('shows computed PV string power without a power entity', () => {
    const rows = buildPanel('pv', ctx({ data: { ...data, pv1: 600 } }));
    expect(rows[0]).toEqual({ label: 'DC Power PV1', value: '600.00W', entityId: undefined });
  });

  it('formats status rows', () => {
    const battery = buildPanel('battery', ctx());
    expect(battery[0]).toEqual({ label: 'Battery Status', value: 'Charging', entityId: 'sensor.inverter_battery_state' });
    expect(battery[1].value).toBe('-389.00W');
    expect(buildPanel('grid', ctx())[0].value).toBe('Off grid');
  });

  it('applies the node inversion to battery power and current', () => {
    const inverted = ctx({ invert: { ...ctx().invert, battery: true } });
    const rows = buildPanel('battery', inverted);
    expect(rows.find((r) => r.label === 'Current')?.value).toBe('-7.31A');
  });

  it('falls back to the computed battery state without a status entity', () => {
    const rows = buildPanel('battery', ctx({ lookup: () => ({}) }));
    expect(rows[0]).toEqual({ label: 'Battery Status', value: 'Charging', entityId: undefined });
  });
});
