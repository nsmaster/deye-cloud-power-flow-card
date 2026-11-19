import { describe, expect, it } from 'vitest';
import { detectSolarmanPrefix, solarmanEntities } from '../src/presets/solarman';

describe('solarmanEntities', () => {
  it('defaults to the "inverter" device name', () => {
    const entities = solarmanEntities();
    expect(entities.ups?.power).toBe('sensor.inverter_load_power');
    expect(entities.grid?.power).toBe('sensor.inverter_external_power');
    expect(entities.pv?.energy_today).toBe('sensor.inverter_today_production');
  });
});

describe('detectSolarmanPrefix', () => {
  it('finds the device prefix from entity ids', () => {
    expect(detectSolarmanPrefix(['sensor.deye_battery_power', 'sensor.deye_pv_power', 'light.kitchen'])).toBe('deye');
  });

  it('returns undefined when nothing matches', () => {
    expect(detectSolarmanPrefix(['sensor.other_battery_power'])).toBeUndefined();
  });
});
