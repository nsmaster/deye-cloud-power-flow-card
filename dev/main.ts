import '../src/deye-cloud-power-flow-card';
import type { DeyeCloudPowerFlowCard } from '../src/deye-cloud-power-flow-card';
import { DEMO_SCENARIOS } from '../src/demo';
import type { HassEntity, HomeAssistant } from '../src/types';

/** Stand-in for Home Assistant's ha-card outside HA. */
class FakeHaCard extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host {
        display: block;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
      }
    </style><slot></slot>`;
  }
}
if (!customElements.get('ha-card')) customElements.define('ha-card', FakeHaCard);

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

const themeSelect = byId<HTMLSelectElement>('theme');
const widthSelect = byId<HTMLSelectElement>('width');
const signToggle = byId<HTMLInputElement>('sign');
const liveContainer = byId<HTMLElement>('live');
const demoContainer = byId<HTMLElement>('cards');

const TYPE = 'custom:deye-cloud-power-flow-card';
const locale = { language: 'en', number_format: 'comma_decimal', time_format: '24' };

// ---------------------------------------------------------------------------
// Simulated Home Assistant with ha-solarman entity ids (prefix "inverter")
// ---------------------------------------------------------------------------

const sim = { offGrid: false, offline: false, tick: 0 };

function simulatedStates(): Record<string, HassEntity> {
  const now = new Date().toISOString();
  const wave = (amp: number) => Math.round(Math.sin(sim.tick / 3) * amp);
  const pv = 948 + wave(120);
  const ups = 503 + wave(40);
  const battery = sim.offGrid ? ups - pv : -389 + wave(60);
  const values: Record<string, [string | number, string?]> = {
    pv_power: [pv, 'W'],
    pv1_power: [Math.round(pv * 0.55), 'W'],
    pv2_power: [Math.round(pv * 0.45), 'W'],
    today_production: [1.2, 'kWh'],
    external_power: [sim.offGrid ? 0 : 19 + wave(10), 'W'],
    grid_power: [sim.offGrid ? 0 : -37 + wave(5), 'W'],
    grid_l1_voltage: [sim.offGrid ? 0 : 231.4, 'V'],
    grid_frequency: [50.0, 'Hz'],
    battery_power: [battery, 'W'],
    battery: [96, '%'],
    battery_voltage: [53.1, 'V'],
    load_power: [ups, 'W'],
    power: [559, 'W'],
  };
  const states: Record<string, HassEntity> = {};
  for (const [suffix, [value, unit]] of Object.entries(values)) {
    const id = `sensor.inverter_${suffix}`;
    states[id] = {
      entity_id: id,
      state: sim.offline ? 'unavailable' : String(value),
      attributes: unit ? { unit_of_measurement: unit } : {},
      last_updated: now,
    };
  }
  states['binary_sensor.inverter_grid'] = {
    entity_id: 'binary_sensor.inverter_grid',
    state: sim.offline ? 'unavailable' : sim.offGrid ? 'off' : 'on',
    attributes: {},
    last_updated: now,
  };
  return states;
}

let hass: HomeAssistant = { states: simulatedStates(), locale };
const liveCards: DeyeCloudPowerFlowCard[] = [];

function pushHass(): void {
  sim.tick++;
  hass = { states: simulatedStates(), locale };
  for (const card of liveCards) card.hass = hass;
}

function figure(caption: string, content: HTMLElement, ...buttons: HTMLButtonElement[]): HTMLElement {
  const fig = document.createElement('figure');
  const cap = document.createElement('figcaption');
  cap.append(caption, ...buttons);
  fig.append(cap, content);
  return fig;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  b.addEventListener('click', () => {
    onClick();
    pushHass();
  });
  return b;
}

function makeCard(config: Record<string, unknown>, cardHass: HomeAssistant): HTMLElement {
  const card = document.createElement('deye-cloud-power-flow-card') as DeyeCloudPowerFlowCard;
  try {
    card.setConfig({ type: TYPE, theme: themeSelect.value === 'deye' ? 'deye' : 'ha', show_sign: signToggle.checked, ...config });
  } catch (err) {
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = (err as Error).message;
    return div;
  }
  card.hass = cardHass;
  return card;
}

function render(): void {
  document.body.dataset.theme = themeSelect.value;
  document.body.style.setProperty('--card-width', `${widthSelect.value}px`);

  liveCards.length = 0;
  const live = makeCard({ title: 'Home', preset: 'solarman', prefix: 'inverter' }, hass);
  if (live instanceof HTMLElement && live.tagName !== 'DIV') liveCards.push(live as DeyeCloudPowerFlowCard);
  liveContainer.replaceChildren(
    figure(
      'preset: solarman, updates every 2 s',
      live,
      button('toggle grid', () => (sim.offGrid = !sim.offGrid)),
      button('toggle offline', () => (sim.offline = !sim.offline)),
    ),
    figure('Invalid config: battery.soc missing', makeCard({ preset: 'solarman', battery: { soc: null } }, hass)),
  );

  demoContainer.replaceChildren(
    ...Object.entries(DEMO_SCENARIOS).map(([id, scenario]) =>
      figure(`${scenario.label} — demo: ${id}`, makeCard({ title: 'Home', demo: id }, { states: {}, locale })),
    ),
  );
}

themeSelect.addEventListener('change', render);
widthSelect.addEventListener('change', render);
signToggle.addEventListener('change', render);
render();
setInterval(pushHass, 2000);
