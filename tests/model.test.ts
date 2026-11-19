import { describe, expect, it } from 'vitest';
import type { EntityMap } from '../src/config';
import { batteryState, entityNumber, gridOnline, readData, socBars, socLevel } from '../src/model';
import type { HomeAssistant } from '../src/types';

describe('batteryState', () => {
  it('follows the Deye sign convention', () => {
    expect(batteryState(-389, 10)).toBe('charging');
    expect(batteryState(420, 10)).toBe('discharging');
    expect(batteryState(5, 10)).toBe('idle');
    expect(batteryState(null, 10)).toBe('unknown');
  });
});

describe('socLevel', () => {
  it('uses the warning and critical thresholds', () => {
    expect(socLevel(96, 50, 20)).toBe('ok');
    expect(socLevel(50, 50, 20)).toBe('ok');
    expect(socLevel(49, 50, 20)).toBe('warning');
    expect(socLevel(19, 50, 20)).toBe('critical');
    expect(socLevel(null, 50, 20)).toBe('unknown');
  });
});

describe('socBars', () => {
  it('fills the icon in five steps', () => {
    expect(socBars(0)).toBe(0);
    expect(socBars(1)).toBe(1);
    expect(socBars(20)).toBe(1);
    expect(socBars(21)).toBe(2);
    expect(socBars(96)).toBe(5);
    expect(socBars(150)).toBe(5);
    expect(socBars(null)).toBe(0);
  });
});

describe('entityNumber', () => {
  const entity = (state: string, unit?: string) => ({
    entity_id: 'sensor.x',
    state,
    attributes: unit ? { unit_of_measurement: unit } : {},
    last_updated: '2026-11-19T12:10:00Z',
  });

  it('converts power and energy units', () => {
    expect(entityNumber(entity('1.25', 'kW'), 'power')).toBe(1250);
    expect(entityNumber(entity('948', 'W'), 'power')).toBe(948);
    expect(entityNumber(entity('1200', 'Wh'), 'energy')).toBe(1.2);
    expect(entityNumber(entity('1.5', 'MWh'), 'energy')).toBe(1500);
  });

  it('inverts the sign on request', () => {
    expect(entityNumber(entity('389', 'W'), 'power', true)).toBe(-389);
  });

  it('returns null for unavailable or non-numeric states', () => {
    expect(entityNumber(undefined)).toBeNull();
    expect(entityNumber(entity('unavailable'))).toBeNull();
    expect(entityNumber(entity('unknown'))).toBeNull();
    expect(entityNumber(entity('charging'))).toBeNull();
    expect(entityNumber(entity(''))).toBeNull();
  });
});

describe('gridOnline', () => {
  const status = (state: string) => ({ entity_id: 'binary_sensor.grid', state, attributes: {}, last_updated: '' });

  it('prefers the status entity', () => {
    expect(gridOnline(status('on'), 0, 100)).toBe(true);
    expect(gridOnline(status('off'), 230, 100)).toBe(false);
    expect(gridOnline(status('Off-Grid'), 230, 100)).toBe(false);
  });

  it('falls back to the voltage threshold', () => {
    expect(gridOnline(undefined, 231, 100)).toBe(true);
    expect(gridOnline(status('unavailable'), 12, 100)).toBe(false);
    expect(gridOnline(undefined, null, 100)).toBeNull();
  });
});

describe('readData', () => {
  const now = Date.parse('2026-11-19T12:10:30Z');
  const fresh = '2026-11-19T12:10:00Z';
  const state = (value: string, unit = 'W', updated = fresh) => ({
    entity_id: '',
    state: value,
    attributes: { unit_of_measurement: unit },
    last_updated: updated,
  });
  const entities: EntityMap = {
    pv: { power: 'sensor.pv', energy_today: 'sensor.pv_today' },
    grid: { power: 'sensor.ct', inner_power: 'sensor.port', voltage: 'sensor.grid_v' },
    battery: { power: 'sensor.bat', soc: 'sensor.soc' },
    ups: { power: 'sensor.ups' },
  };
  const options = {
    noGridVoltage: 100,
    staleAfterS: 300,
    invert: { pv: false, grid: false, inverter: false, battery: false, ups: false, load: false },
  };
  const hass = (overrides: Record<string, ReturnType<typeof state>> = {}): HomeAssistant => ({
    states: {
      'sensor.pv': state('0.948', 'kW'),
      'sensor.pv_today': state('1.2', 'kWh'),
      'sensor.ct': state('19'),
      'sensor.port': state('-37'),
      'sensor.grid_v': state('231.4', 'V'),
      'sensor.bat': state('-389'),
      'sensor.soc': state('96', '%'),
      'sensor.ups': state('503'),
      ...overrides,
    },
  });

  it('reads and normalizes the recording values', () => {
    const data = readData(hass(), entities, options, now);
    expect(data).toMatchObject({ pv: 948, grid: 19, battery: -389, soc: 96, ups: 503, gridOnline: true, productionToday: 1.2 });
    expect(data.stale).toBe(false);
    expect(data.lastUpdated?.toISOString()).toBe('2026-11-19T12:10:00.000Z');
  });

  it('computes the grid-side load from CT and inverter grid port', () => {
    expect(readData(hass(), entities, options, now).load).toBe(56);
  });

  it('prefers an explicit load entity', () => {
    const withLoad = { ...entities, load: { power: 'sensor.load' } };
    expect(readData(hass({ 'sensor.load': state('60') }), withLoad, options, now).load).toBe(60);
  });

  it('applies per-node inversion', () => {
    const inverted = { ...options, invert: { ...options.invert, battery: true } };
    expect(readData(hass(), entities, inverted, now).battery).toBe(389);
  });

  it('marks data as stale when the core entities stop updating', () => {
    const old = '2026-11-19T12:00:00Z';
    const states = Object.fromEntries(
      ['sensor.pv', 'sensor.ct', 'sensor.bat', 'sensor.soc', 'sensor.ups'].map((id) => [id, state('1', 'W', old)]),
    );
    expect(readData(hass(states), entities, options, now).stale).toBe(true);
  });

  it('shows offline data as missing and stale', () => {
    const states = Object.fromEntries(
      ['sensor.pv', 'sensor.ct', 'sensor.port', 'sensor.bat', 'sensor.soc', 'sensor.ups', 'sensor.grid_v', 'sensor.pv_today'].map(
        (id) => [id, state('unavailable')],
      ),
    );
    const data = readData(hass(states), entities, options, now);
    expect(data).toMatchObject({ pv: null, grid: null, battery: null, soc: null, ups: null, load: null, gridOnline: null });
    expect(data.stale).toBe(true);
  });
});
