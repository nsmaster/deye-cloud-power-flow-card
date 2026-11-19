import { LitElement, html, nothing, svg, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { renderPanel } from './components/detail-panel';
import { renderLine } from './components/flow-line';
import { renderNode } from './components/flow-node';
import { resolveOptions, validateConfig, type CardConfig, type ResolvedOptions } from './config';
import { DEFAULT_DEMO, DEMO_SCENARIOS, demoDetail, isDemoScenario } from './demo';
import { flowDirection, type FlowDirection } from './flow';
import { formatDateTime, formatEnergy, formatPercent, formatPower, type FormattedValue, type HaLocale } from './format';
import { batteryIcon, checkMark, clockIcon, crossMark, gridIcon, inverterIcon, loadIcon, pvIcon, upsIcon } from './icons';
import { GRID_BADGE, GRID_BADGE_RADIUS, INVERTER_RADIUS, INVERTER_SIZE, NODE_POS, NODE_SIZE, VIEW, type LineId } from './layout';
import { batteryState, entityId, presence, readData, socLevel, trackedEntityIds, type PowerFlowData, type Presence } from './model';
import { PANEL_ROWS, buildPanel, type PanelRow, type RowSource } from './panels';
import type { NodeId } from './config';
import { detectSolarmanPrefix } from './presets/solarman';
import { STRINGS } from './strings';
import { cardStyles } from './styles';
import type { HassEntity, HomeAssistant } from './types';

const TAG = 'deye-cloud-power-flow-card';
const LOG_PREFIX = `[${TAG}]`;

/** Re-check staleness even when no tracked entity changes. */
const STALE_CHECK_MS = 30_000;

const valueLabel = (v: FormattedValue): string => (v.unit ? `${v.value} ${v.unit}` : v.value);

export class DeyeCloudPowerFlowCard extends LitElement {
  static override styles = cardStyles;

  static override properties = {
    _config: { state: true },
    _selected: { state: true },
  };

  private declare _config?: CardConfig;
  /** Node whose detail panel is open; one panel at a time. */
  private declare _selected?: NodeId;
  private _options?: ResolvedOptions;
  private _hass?: HomeAssistant;
  private _tracked: string[] = [];
  /** Nodes with data; nodes without any configured or computable value are not drawn. */
  private _presence?: Presence;
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
    this._presence = valid.demo === undefined ? presence(this._options.entities) : undefined;
  }

  private readonly _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._selected) this._close();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKeyDown);
    this._staleTimer = setInterval(() => {
      if (this._config && this._config.demo === undefined) this.requestUpdate();
    }, STALE_CHECK_MS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKeyDown);
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

  private _select(node: NodeId): void {
    this._selected = this._selected === node ? undefined : node;
  }

  private _close(): void {
    const node = this._selected;
    this._selected = undefined;
    // Return focus to the node that opened the panel.
    if (node) this.updateComplete.then(() => this.renderRoot.querySelector<SVGElement>(`.node.${node}`)?.focus());
  }

  private _moreInfo(entityId: string): void {
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
  }

  /** Entity behind a node key, or demo values in demo mode. */
  private _lookup(node: NodeId, key: string): RowSource {
    const demo = this._config?.demo;
    if (demo !== undefined) {
      const value = isDemoScenario(demo) ? demoDetail(demo, `${node}.${key}`) : undefined;
      if (!value) return {};
      const entity: HassEntity = {
        entity_id: '',
        state: String(value[0]),
        attributes: value[1] ? { unit_of_measurement: value[1] } : {},
        last_updated: '',
      };
      return { entity };
    }
    const id = this._options ? entityId(this._options.entities, node, key) : undefined;
    return id ? { entityId: id, entity: this._hass?.states[id] } : {};
  }

  private _panelRows(node: NodeId, data: PowerFlowData, o: ResolvedOptions): PanelRow[] {
    return buildPanel(node, {
      data,
      lookup: (n, k) => this._lookup(n, k),
      invert: o.invert,
      minFlowW: o.minFlowW,
      noGridVoltage: o.noGridVoltage,
      showSign: o.showSign,
      locale: this._locale,
    });
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
        <ha-card class=${classMap({ deye: o.theme === 'deye' })} @click=${() => this._selected && this._close()}>
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
        ${o.title ? html`<div class="title">${o.title}</div>` : nothing}
        <div class="production-label">${STRINGS.header.productionToday}</div>
        <div class="production">${production.value}<span class="unit">${production.unit}</span></div>
        <div class=${classMap({ updated: true, stale: data.stale })} title=${data.stale ? STRINGS.header.stale : ''}>
          ${clockIcon}<span>${formatDateTime(data.lastUpdated)}</span>
        </div>
      </div>
    `;
  }

  private _renderDiagram(data: PowerFlowData, o: ResolvedOptions): TemplateResult {
    const locale = this._locale;
    const min = o.minFlowW;
    const offGrid = data.gridOnline === false;
    const flows: Record<LineId, FlowDirection> = {
      pv: flowDirection(data.pv, 'source', min),
      grid: flowDirection(data.grid, 'bidirectional', min, !offGrid),
      battery: flowDirection(data.battery, 'bidirectional', min),
      ups: flowDirection(data.ups, 'sink', min),
      load: flowDirection(data.load, 'sink', min, !offGrid),
    };
    const power = (w: number | null) => formatPower(w, locale, o.showSign);
    const present = this._presence;
    const visible = (id: LineId) => !o.hidden[id] && (present?.[id] ?? true);

    const pv = power(data.pv);
    const grid = power(data.grid);
    const ups = power(data.ups);
    const load = power(data.load);
    const battery = power(data.battery);
    const soc = formatPercent(data.soc, locale);
    const bState = STRINGS.battery[batteryState(data.battery, min)];
    const level = socLevel(data.soc, o.socWarning, o.socCritical);

    const gridPos = NODE_POS.grid;
    const batteryPos = NODE_POS.battery;
    const statusText = offGrid ? STRINGS.grid.off : STRINGS.grid.on;
    const statusTop = gridPos.y - NODE_SIZE / 2;
    // Approximate text width; the backing hides the node border behind the label, as in the app.
    const statusWidth = statusText.length * 5.1 + 6;
    const gridStatus =
      data.gridOnline === null
        ? nothing
        : svg`<rect class="grid-status-bg" x=${gridPos.x - statusWidth / 2} y=${statusTop - 5} width=${statusWidth} height="10" />
            <text class=${`grid-status ${offGrid ? 'off' : 'on'}`} x=${gridPos.x} y=${statusTop + 3.4}>${statusText}</text>`;
    const gridBadge =
      data.gridOnline === null || !visible('grid')
        ? nothing
        : svg`<g class=${`badge ${offGrid ? 'off' : 'on'}`} transform="translate(${GRID_BADGE.x} ${GRID_BADGE.y})">
            <circle r=${GRID_BADGE_RADIUS} />${offGrid ? crossMark : checkMark}
          </g>`;
    const socText = svg`<text class="soc" x=${batteryPos.x} y=${batteryPos.y - 4.5}>${soc.value}${soc.unit}</text>`;

    const lineIds: LineId[] = ['pv', 'grid', 'battery', 'ups', 'load'];

    // A node opens a panel only if it has rows; UPS has none, as in the app.
    const rows: Partial<Record<NodeId, PanelRow[]>> = {};
    for (const id of Object.keys(PANEL_ROWS) as NodeId[]) rows[id] = this._panelRows(id, data, o);
    const interactive = (id: NodeId) => ({
      link: (rows[id]?.length ?? 0) > 0,
      onSelect: (rows[id]?.length ?? 0) > 0 ? () => this._select(id) : undefined,
      selected: this._selected === id,
    });
    const selected = this._selected;
    const panel =
      selected && rows[selected]?.length
        ? renderPanel(`${o.names[selected]} ${STRINGS.panel.details}`, rows[selected] ?? [], {
            onClose: () => this._close(),
            onRow: (id) => this._moreInfo(id),
          })
        : nothing;

    return html`
      <svg
        class="diagram"
        viewBox="${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}"
        role="group"
        aria-label=${STRINGS.cardName}
      >
        ${lineIds.filter(visible).map((id) => renderLine(id, flows[id], id === 'load' && offGrid))}
        ${gridBadge}
        ${visible('pv')
          ? renderNode({
              id: 'pv',
              icon: pvIcon,
              haIcon: o.icons.pv,
              value: pv,
              caption: o.names.pv,
              ...interactive('pv'),
              dim: data.pv === null || data.pv <= min,
              ariaLabel: `${o.names.pv}: ${valueLabel(pv)}`,
            })
          : nothing}
        ${visible('grid')
          ? renderNode({
              id: 'grid',
              icon: gridIcon,
              haIcon: o.icons.grid,
              value: grid,
              caption: o.names.grid,
              ...interactive('grid'),
              extra: svg`${gridStatus}`,
              ariaLabel: `${o.names.grid}: ${valueLabel(grid)}`,
            })
          : nothing}
        ${renderNode({
          id: 'inverter',
          icon: inverterIcon,
          iconScale: 1.05,
          haIcon: o.icons.inverter,
          size: INVERTER_SIZE,
          border: 2,
          radius: INVERTER_RADIUS,
          highlight: true,
          ...interactive('inverter'),
          ariaLabel: o.names.inverter,
        })}
        ${visible('battery')
          ? svg`<g class=${`battery level-${level}`}>
              ${renderNode({
                id: 'battery',
                icon: batteryIcon(data.soc),
                iconScale: 1,
                haIcon: o.icons.battery,
                value: battery,
                caption: o.names.battery,
                ...interactive('battery'),
                extra: o.icons.battery || present?.soc === false ? undefined : socText,
                ariaLabel: `${o.names.battery}${bState ? ` (${bState})` : ''}: ${valueLabel(soc)}, ${valueLabel(battery)}`,
              })}
            </g>`
          : nothing}
        ${visible('ups')
          ? renderNode({
              id: 'ups',
              icon: upsIcon,
              haIcon: o.icons.ups,
              value: ups,
              caption: o.names.ups,
              ariaLabel: `${o.names.ups}: ${valueLabel(ups)}`,
            })
          : nothing}
        ${visible('load')
          ? renderNode({
              id: 'load',
              icon: loadIcon,
              haIcon: o.icons.load,
              value: load,
              caption: o.names.load,
              ...interactive('load'),
              dim: offGrid,
              ariaLabel: `${o.names.load}: ${valueLabel(load)}`,
            })
          : nothing}
        ${panel}
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
