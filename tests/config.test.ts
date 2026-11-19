import { describe, expect, it } from 'vitest';
import { resolveEntities, resolveOptions, validateConfig, type CardConfig } from '../src/config';
import { STRINGS } from '../src/strings';

const TYPE = 'custom:deye-cloud-power-flow-card';

const manual = {
  type: TYPE,
  pv: { power: 'sensor.pv' },
  grid: { power: 'sensor.grid' },
  battery: { power: 'sensor.bat', soc: 'sensor.soc' },
  ups: { power: 'sensor.ups' },
};

describe('validateConfig', () => {
  it('accepts a full manual config', () => {
    expect(() => validateConfig(manual)).not.toThrow();
  });

  it('names the missing required key', () => {
    const config = { ...manual, battery: { power: 'sensor.bat' } };
    expect(() => validateConfig(config)).toThrow('Missing required entity "battery.soc"');
  });

  it('accepts the Solarman preset on its own', () => {
    expect(() => validateConfig({ type: TYPE, preset: 'solarman' })).not.toThrow();
  });

  it('does not require entities in demo mode or for hidden nodes', () => {
    expect(() => validateConfig({ type: TYPE, demo: 'day_charge' })).not.toThrow();
    expect(() => validateConfig({ ...manual, ups: { hidden: true } })).not.toThrow();
  });

  it('rejects malformed entity ids and options', () => {
    expect(() => validateConfig({ ...manual, pv: { power: 'pv power' } })).toThrow('"pv.power" must be an entity id');
    expect(() => validateConfig({ ...manual, min_flow_w: -1 })).toThrow('"min_flow_w"');
    expect(() => validateConfig({ ...manual, max_power_w: 5 })).toThrow('"max_power_w"');
    expect(() => validateConfig({ ...manual, preset: 'sunsynk' })).toThrow('"preset"');
    expect(() => validateConfig(null)).toThrow('Invalid configuration');
  });
});

describe('resolveEntities', () => {
  it('fills keys from the preset with the given prefix', () => {
    const entities = resolveEntities({ type: TYPE, preset: 'solarman', prefix: 'deye' });
    expect(entities.pv?.power).toBe('sensor.deye_pv_power');
    expect(entities.battery?.soc).toBe('sensor.deye_battery');
    expect(entities.grid?.status).toBe('binary_sensor.deye_grid');
  });

  it('lets explicit keys override or remove preset entities', () => {
    const config: CardConfig = {
      type: TYPE,
      preset: 'solarman',
      grid: { power: 'sensor.deye_grid_power', inner_power: null },
    };
    const entities = resolveEntities(config);
    expect(entities.grid?.power).toBe('sensor.deye_grid_power');
    expect(entities.grid?.inner_power).toBeUndefined();
    expect(entities.pv?.power).toBe('sensor.inverter_pv_power');
  });

  it('ignores display options in node sections', () => {
    const entities = resolveEntities({ type: TYPE, pv: { power: 'sensor.pv', name: 'Roof' } });
    expect(entities.pv).toEqual({ power: 'sensor.pv' });
  });
});

describe('resolveOptions', () => {
  it('applies defaults and per-node overrides', () => {
    const o = resolveOptions({ ...manual, load: { hidden: true }, battery: { ...manual.battery, invert: true } }, STRINGS.nodes);
    expect(o.minFlowW).toBe(10);
    expect(o.noGridVoltage).toBe(100);
    expect(o.hidden.load).toBe(true);
    expect(o.invert.battery).toBe(true);
    expect(o.names.ups).toBe('UPS-Load');
  });
});
