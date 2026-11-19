import { LitElement, html, nothing, svg, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { renderLine } from './components/flow-line';
import { renderNode } from './components/flow-node';
import { resolveOptions, validateConfig, type CardConfig, type ResolvedOptions } from './config';
import { DEFAULT_DEMO, DEMO_SCENARIOS, isDemoScenario } from './demo';
import { lineFlow, type FlowOptions, type LineFlow } from './flow';
import { formatEnergy, formatPercent, formatPower, formatTime, type FormattedValue, type HaLocale } from './format';
import { batteryIcon, checkMark, crossMark, gridIcon, inverterIcon, loadIcon, pvIcon, upsIcon } from './icons';
import { GRID_BADGE, INVERTER_SIZE, NODE_POS, NODE_SIZE, VIEW, type LineId } from './layout';
import { batteryState, readData, socBars, socLevel, trackedEntityIds, type PowerFlowData } from './model';
import { detectSolarmanPrefix } from './presets/solarman';
import { STRINGS } from './strings';
import { cardStyles } from './styles';
import type { HomeAssistant } from './types';

const TAG = 'deye-cloud-power-flow-card';
const LOG_PREFIX = `[${TAG}]`;

/** Re-check staleness even when no tracked entity changes. */
const STALE_CHECK_MS = 30_000;

const valueLabel = (v: FormattedValue): string => (v.unit ? `${v.value} ${v.unit}` : v.value);

export class DeyeCloudPowerFlowCard extends LitElement {
  static override styles = cardStyles;

  static override properties = {
    _config: { state: true },
  };

  private declare _config?: CardConfig;
  private _options?: ResolvedOptions;
  private _hass?: HomeAssistant;
  private _tracked: string[] = [];
  private _staleTimer?: ReturnType<typeof setInterval>;
  private readonly _warned = new Set<string>();

  /**
   * Home Assistant sets this on every state change anywhere; only re-render
   * when one of our entities or the locale changed.
   */
  set hass(hass: HomeAssistant) {
    const old = this._hass;
    this._hass = hass;
    if (!old || old.locale !== hass.locale || this._tracked.some((id) => old.states[id] !== hass.states[id])) {
      this.requestUpdate();
    }
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  setConfig(config: unknown): void {
    const valid = validateConfig(config);
    if (valid.demo !== undefined && !isDemoScenario(valid.demo)) {
      throw new Error(`Unknown demo scenario "${valid.demo}". Use one of: ${Object.keys(DEMO_SCENARIOS).join(', ')}`);
    }
    this._config = valid;
    this._options = resolveOptions(valid, STRINGS.nodes);
    this._tracked = valid.demo === undefined ? trackedEntityIds(this._options.entities) : [];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._staleTimer = setInterval(() => {
      if (this._config && this._config.demo === undefined) this.requestUpdate();
    }, STALE_CHECK_MS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._staleTimer);
  }

  getCardSize(): number {
    return 8;
  }

  getGridOptions(): Record<string, unknown> {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  static getStubConfig(hass?: HomeAssistant): Partial<CardConfig> {
    const prefix = hass ? detectSolarmanPrefix(Object.keys(hass.states)) : undefined;
    return prefix ? { preset: 'solarman', prefix } : { demo: DEFAULT_DEMO };
  }

  private get _locale(): HaLocale | undefined {
    return this._hass?.locale;
  }

  private _data(o: ResolvedOptions): PowerFlowData | undefined {
    const demo = this._config?.demo;
    if (demo !== undefined) return DEMO_SCENARIOS[isDemoScenario(demo) ? demo : DEFAULT_DEMO].data;
    const hass = this._hass;
    if (!hass) return undefined;
    for (const id of this._tracked) {
      if (!(id in hass.states) && !this._warned.has(id)) {
        this._warned.add(id);
        console.warn(LOG_PREFIX, `Entity "${id}" not found`);
      }
    }
    return readData(hass, o.entities, {
      noGridVoltage: o.noGridVoltage,
      staleAfterS: o.staleAfterS,
      invert: o.invert,
    });
  }

  protected override render(): TemplateResult | typeof nothing {
    const o = this._options;
    if (!this._config || !o) return nothing;
    try {
      const data = this._data(o);
      if (!data) return nothing;
      return html`
        <ha-card class=${classMap({ deye: o.theme === 'deye' })}>
          ${this._renderHeader(data, o)} ${this._renderDiagram(data, o)}
        </ha-card>
      `;
    } catch (err) {
      console.error(LOG_PREFIX, err);
      return nothing;
    }
  }

  private _renderHeader(data: PowerFlowData, o: ResolvedOptions): TemplateResult {
    const production = formatEnergy(data.productionToday, this._locale);
    return html`
      <div class="header">
        <div>
          ${o.title ? html`<div class="title">${o.title}</div>` : nothing}
          <div class="production">
            <span class="label">${STRINGS.header.productionToday}</span>
            <span><span class="number">${production.value}</span><span class="unit">${production.unit}</span></span>
          </div>
        </div>
        <div class=${classMap({ updated: true, stale: data.stale })} title=${data.stale ? STRINGS.header.stale : ''}>
          ${STRINGS.header.updated} ${formatTime(data.lastUpdated, this._locale)}
        </div>
      </div>
    `;
  }

  private _renderDiagram(data: PowerFlowData, o: ResolvedOptions): TemplateResult {
    const locale = this._locale;
    const flowOptions: FlowOptions = { minFlowW: o.minFlowW, maxPowerW: o.maxPowerW };
    const offGrid = data.gridOnline === false;
    const flows: Record<LineId, LineFlow> = {
      pv: lineFlow(data.pv, 'source', flowOptions),
      grid: lineFlow(data.grid, 'bidirectional', flowOptions, !offGrid),
      battery: lineFlow(data.battery, 'bidirectional', flowOptions),
      ups: lineFlow(data.ups, 'sink', flowOptions),
      load: lineFlow(data.load, 'sink', flowOptions, !offGrid),
    };
    const power = (w: number | null) => formatPower(w, locale, o.showSign);
    const visible = (id: LineId) => !o.hidden[id];

    const pv = power(data.pv);
    const grid = power(data.grid);
    const ups = power(data.ups);
    const load = power(data.load);
    const battery = power(data.battery);
    const soc = formatPercent(data.soc, locale);
    const bState = batteryState(data.battery, o.minFlowW);
    const level = socLevel(data.soc, o.socWarning, o.socCritical);
    const bStateText = STRINGS.battery[bState];
    const batteryCaption = bStateText ? `${o.names.battery} · ${bStateText}` : o.names.battery;

    const gridPos = NODE_POS.grid;
    const batteryPos = NODE_POS.battery;
    const gridStatus =
      data.gridOnline === null
        ? nothing
        : svg`<text class=${`grid-status ${offGrid ? 'off' : 'on'}`} x=${gridPos.x} y=${gridPos.y - NODE_SIZE / 2 - 10}>
            ${offGrid ? STRINGS.grid.off : STRINGS.grid.on}
          </text>`;
    const gridBadge =
      data.gridOnline === null || !visible('grid')
        ? nothing
        : svg`<g class=${`badge ${offGrid ? 'off' : 'on'}`} transform="translate(${GRID_BADGE.x} ${GRID_BADGE.y})">
            <circle r="7" />${offGrid ? crossMark : checkMark}
          </g>`;
    const socText = svg`<text class="soc" x=${batteryPos.x + NODE_SIZE / 2 + 6} y=${batteryPos.y + 5}>
        ${soc.value}${soc.unit ? svg`<tspan class="unit">${soc.unit}</tspan>` : nothing}
      </text>`;

    const lineIds: LineId[] = ['pv', 'grid', 'battery', 'ups', 'load'];

    return html`
      <svg viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="group" aria-label=${STRINGS.cardName}>
        ${lineIds.filter(visible).map((id) => renderLine(id, flows[id], id === 'load' && offGrid))}
        ${gridBadge}
        ${visible('pv')
          ? renderNode({
              id: 'pv',
              icon: pvIcon,
              value: pv,
              caption: o.names.pv,
              dim: flows.pv.direction === 'none',
              ariaLabel: `${o.names.pv}: ${valueLabel(pv)}`,
            })
          : nothing}
        ${visible('grid')
          ? renderNode({
              id: 'grid',
              icon: gridIcon,
              value: grid,
              caption: o.names.grid,
              extra: svg`${gridStatus}`,
              ariaLabel: `${o.names.grid}: ${valueLabel(grid)}`,
            })
          : nothing}
        ${renderNode({
          id: 'inverter',
          icon: inverterIcon,
          size: INVERTER_SIZE,
          highlight: true,
          ariaLabel: o.names.inverter,
        })}
        ${visible('battery')
          ? svg`<g class=${`battery level-${level}`}>
              ${renderNode({
                id: 'battery',
                icon: batteryIcon(socBars(data.soc)),
                value: battery,
                caption: batteryCaption,
                extra: socText,
                ariaLabel: `${batteryCaption}: ${valueLabel(soc)}, ${valueLabel(battery)}`,
              })}
            </g>`
          : nothing}
        ${visible('ups')
          ? renderNode({
              id: 'ups',
              icon: upsIcon,
              value: ups,
              caption: o.names.ups,
              ariaLabel: `${o.names.ups}: ${valueLabel(ups)}`,
            })
          : nothing}
        ${visible('load')
          ? renderNode({
              id: 'load',
              icon: loadIcon,
              value: load,
              caption: o.names.load,
              dim: offGrid,
              ariaLabel: `${o.names.load}: ${valueLabel(load)}`,
            })
          : nothing}
      </svg>
    `;
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, DeyeCloudPowerFlowCard);
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type: TAG,
    name: STRINGS.cardName,
    description: STRINGS.cardDescription,
    preview: true,
    documentationURL: 'https://github.com/nsmaster/deye-cloud-power-flow-card',
  });
  console.info(
    `%c DEYE-CLOUD-POWER-FLOW-CARD %c v${__CARD_VERSION__} `,
    'color:#fff;background:#2f7cf6;font-weight:600',
    'color:#2f7cf6;background:#17191d',
  );
}
