import type { EntityMap } from '../config';

/**
 * davidrapan/ha-solarman, profile deye_hybrid.yaml (Deye SG0*LP1, single phase).
 * Entity ids are `<domain>.<prefix>_<slugified sensor name>`; the device is
 * called "Inverter" by default, hence prefix `inverter`.
 */
const SENSOR_SUFFIXES: EntityMap = {
  pv: {
    power: 'pv_power',
    pv1_power: 'pv1_power',
    pv1_voltage: 'pv1_voltage',
    pv1_current: 'pv1_current',
    pv2_power: 'pv2_power',
    pv2_voltage: 'pv2_voltage',
    pv2_current: 'pv2_current',
    energy_today: 'today_production',
    energy_total: 'total_production',
  },
  grid: {
    // "External Power" is the external CT at the grid entrance (Zero Export to CT).
    power: 'external_power',
    // "Grid Power" is the inverter's own grid port.
    inner_power: 'grid_power',
    voltage: 'grid_l1_voltage',
    frequency: 'grid_frequency',
    import_today: 'today_energy_import',
    export_today: 'today_energy_export',
    import_total: 'total_energy_import',
    export_total: 'total_energy_export',
  },
  battery: {
    power: 'battery_power',
    soc: 'battery',
    voltage: 'battery_voltage',
    current: 'battery_current',
    temperature: 'battery_temperature',
    status: 'battery_state',
    charge_today: 'today_battery_charge',
    discharge_today: 'today_battery_discharge',
  },
  inverter: {
    power: 'power',
    voltage: 'output_l1_voltage',
    frequency: 'output_frequency',
    temperature: 'temperature',
    status: 'device_state',
  },
  ups: {
    // Deye "Load" port = UPS / Backup output.
    power: 'load_power',
    voltage: 'load_l1_voltage',
  },
  load: {
    energy_today: 'today_load_consumption',
    energy_total: 'total_load_consumption',
  },
};

/** Keys that are not `sensor.*` in ha-solarman. */
const BINARY_SENSORS: EntityMap = {
  grid: { status: 'grid' },
};

export const SOLARMAN_DEFAULT_PREFIX = 'inverter';

export function solarmanEntities(prefix: string = SOLARMAN_DEFAULT_PREFIX): EntityMap {
  const result: EntityMap = {};
  for (const [domain, map] of [
    ['sensor', SENSOR_SUFFIXES],
    ['binary_sensor', BINARY_SENSORS],
  ] as const) {
    for (const [node, keys] of Object.entries(map)) {
      const target: Record<string, string> = (result[node as keyof EntityMap] ??= {});
      for (const [key, suffix] of Object.entries(keys as Record<string, string>)) {
        target[key] = `${domain}.${prefix}_${suffix}`;
      }
    }
  }
  return result;
}

/** Guesses the ha-solarman device prefix from existing entity ids. */
export function detectSolarmanPrefix(entityIds: Iterable<string>): string | undefined {
  const ids = new Set(entityIds);
  for (const id of ids) {
    const match = /^sensor\.(.+)_battery_power$/.exec(id);
    if (match && ids.has(`sensor.${match[1]}_pv_power`)) return match[1];
  }
  return undefined;
}
