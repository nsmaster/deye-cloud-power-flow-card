import type { PowerFlowData } from './model';

/** Built-in sample data for previews, screenshots and the stage-1 mock. */
export interface DemoScenario {
  label: string;
  data: PowerFlowData;
  /** Extra values for detail panels, keyed "node.key": [state, unit]. */
  details?: Record<string, readonly [number | string, string?]>;
}

const at = (hours: number, minutes: number): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const DEMO_SCENARIOS = {
  /** Values from the Deye Cloud screen recording, 19.11.2026 12:10. */
  day_charge: {
    label: 'Day, charging (recording)',
    data: {
      pv: 948,
      grid: 19,
      battery: -389,
      soc: 96,
      ups: 503,
      load: 56,
      gridOnline: true,
      productionToday: 1.2,
      lastUpdated: at(12, 10),
      stale: false,
    },
    details: {
      'pv.pv1_power': [521, 'W'],
      'pv.pv2_power': [427, 'W'],
      'pv.pv1_voltage': [312.4, 'V'],
      'pv.pv2_voltage': [298.7, 'V'],
      'pv.pv1_current': [1.67, 'A'],
      'pv.pv2_current': [1.43, 'A'],
      'grid.status': ['on'],
      'grid.frequency': [50.01, 'Hz'],
      'grid.voltage': [232.9, 'V'],
      'grid.import_today': [3.42, 'kWh'],
      'grid.import_total': [6120.5, 'kWh'],
      'grid.export_today': [0, 'kWh'],
      'grid.export_total': [41.3, 'kWh'],
      'inverter.voltage': [232.6, 'V'],
      'inverter.power': [559, 'W'],
      'inverter.frequency': [50.0, 'Hz'],
      'battery.status': ['charging'],
      'battery.voltage': [53.2, 'V'],
      'battery.current': [-7.31, 'A'],
      'battery.temperature': [21.4, '°C'],
      'ups.voltage': [232.6, 'V'],
      'load.energy_today': [5.1, 'kWh'],
      'load.energy_total': [23280, 'kWh'],
    },
  },
  night_discharge: {
    label: 'Night, discharging',
    data: {
      pv: 0,
      grid: 12,
      battery: 431,
      soc: 63,
      ups: 384,
      load: 47,
      gridOnline: true,
      productionToday: 9.84,
      lastUpdated: at(23, 5),
      stale: false,
    },
  },
  export: {
    label: 'Sunny, exporting',
    data: {
      pv: 5230,
      grid: -1840,
      battery: -2100,
      soc: 82,
      ups: 1040,
      load: 250,
      gridOnline: true,
      productionToday: 18.47,
      lastUpdated: at(13, 40),
      stale: false,
    },
  },
  off_grid: {
    label: 'Grid outage',
    data: {
      pv: 1210,
      grid: 0,
      battery: 160,
      soc: 41,
      ups: 1370,
      load: 0,
      gridOnline: false,
      productionToday: 4.03,
      lastUpdated: at(15, 22),
      stale: false,
    },
  },
  low_battery: {
    label: 'Low battery',
    data: {
      pv: 0,
      grid: 640,
      battery: 3,
      soc: 12,
      ups: 590,
      load: 50,
      gridOnline: true,
      productionToday: 2.11,
      lastUpdated: at(6, 15),
      stale: false,
    },
  },
  offline: {
    label: 'Logger offline',
    data: {
      pv: null,
      grid: null,
      battery: null,
      soc: null,
      ups: null,
      load: null,
      gridOnline: null,
      productionToday: null,
      lastUpdated: at(11, 42),
      stale: true,
    },
  },
} satisfies Record<string, DemoScenario>;

export type DemoScenarioId = keyof typeof DEMO_SCENARIOS;

export const DEFAULT_DEMO: DemoScenarioId = 'day_charge';

export function isDemoScenario(id: string): id is DemoScenarioId {
  return Object.prototype.hasOwnProperty.call(DEMO_SCENARIOS, id);
}

export function demoDetail(id: DemoScenarioId, key: string): readonly [number | string, string?] | undefined {
  const scenario: DemoScenario = DEMO_SCENARIOS[id];
  return scenario.details?.[key];
}
