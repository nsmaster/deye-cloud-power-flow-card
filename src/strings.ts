/** All user-facing English strings live here. */
export const STRINGS = {
  cardName: 'Deye Cloud Power Flow Card',
  cardDescription: 'Power flow in the style of the Deye Cloud app',
  nodes: {
    pv: 'Production',
    grid: 'Grid',
    inverter: 'Inverter',
    battery: 'Battery',
    ups: 'UPS-Load',
    load: 'Load',
  },
  battery: {
    charging: 'Charging',
    discharging: 'Discharging',
    idle: 'Idle',
    unknown: '',
  },
  grid: {
    on: 'On grid',
    off: 'Off grid',
  },
  panel: {
    details: 'details',
    close: 'Close',
  },
  header: {
    productionToday: 'Production Today',
    updated: 'Updated',
    stale: 'Data is out of date',
  },
} as const;
