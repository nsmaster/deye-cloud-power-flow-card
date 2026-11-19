# Deye Cloud Power Flow Card

A Home Assistant Lovelace card that shows the power flow of a Deye hybrid inverter the way the **Deye Cloud** app does: six nodes around the inverter, orthogonal lines with animated flow dots, and detail panels.

<img src="https://raw.githubusercontent.com/nsmaster/deye-cloud-power-flow-card/main/docs/images/card.png" alt="Deye Cloud Power Flow Card" width="366" />

> **Unofficial.** This project is not affiliated with, endorsed by or connected to Deye.

## Features

- Production, Grid, Inverter, Battery, UPS-Load and Load nodes, laid out like the app.
- Flow direction from the sign of each power; idle lines show no arrow and no dot.
- On grid / Off grid with a check or cross on the grid line; SOC inside the battery node, coloured by thresholds.
- Tap Production, Grid, Inverter, Battery or Load for a detail panel; tap a row to open the entity's history (more-info).
- Missing or unavailable entities show "—"; the update time turns orange when data is stale.
- `theme: deye` for the app's dark palette, or follow your Home Assistant theme. Works in masonry and sections dashboards.

## Installation (HACS custom repository)

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/nsmaster/deye-cloud-power-flow-card`, type **Dashboard**.
2. Find **Deye Cloud Power Flow Card** → **Download**. HACS adds the dashboard resource.
3. Reload the browser and add the card.

## Configuration

### Solarman Stick Logger (ha-solarman)

With [davidrapan/ha-solarman](https://github.com/davidrapan/ha-solarman) and the `deye_hybrid` profile, the preset fills in every entity. `prefix` is the device name in Home Assistant (`inverter` by default).

```yaml
type: custom:deye-cloud-power-flow-card
preset: solarman
prefix: inverter
theme: deye
```

The preset uses the external CT (`sensor.<prefix>_external_power`) as grid power. Without an external CT, point it at the inverter's grid port instead:

```yaml
grid:
  power: sensor.inverter_grid_power
  inner_power: null   # null removes a preset entity
```

### Any other source (ESPHome, MQTT, …)

Set the entities yourself. Only `unit_of_measurement` and the value matter; W/kW and Wh/kWh/MWh are converted automatically.

```yaml
type: custom:deye-cloud-power-flow-card
pv:
  power: sensor.deye_pv_power          # or computed: pv1_power + pv2_power
  energy_today: sensor.deye_pv_energy_today
grid:
  power: sensor.deye_grid_power        # + import / − export
  status: binary_sensor.deye_grid_connected
battery:
  power: sensor.deye_battery_power     # + discharge / − charge, or computed: voltage × current
  soc: sensor.deye_battery_soc
  invert: false                        # flip the sign if your source differs
ups:
  power: sensor.deye_ups_load_power
load:
  power: sensor.deye_grid_side_load    # optional, otherwise grid.power − grid.inner_power
```

Explicit keys always override the preset.

Nothing is required. A node with no configured or computable value is not drawn; a configured but unavailable entity shows "—". Computed when there is no entity:

- `pv.power` = `pv1_power` + `pv2_power`, and each string's power = its voltage × current;
- `battery.power` = `battery.voltage` × `battery.current`;
- `load.power` = `grid.power` − `grid.inner_power`.

### Detail panels

Rows appear only when their entity is configured (or can be computed).

| Panel | Rows (entity key) |
| --- | --- |
| Production | DC Power / Voltage / Current PV1, PV2 (`pv.pv1_*`, `pv.pv2_*`), Grid Tie Power (`inverter.power`) |
| Grid | Grid Status (`grid.status` or voltage), Frequency, Total Grid Power, Voltage L1, Daily / Cumulative Import and Export |
| Inverter | Inverter Voltage L1, Output Power L1, Frequency (`inverter.*`) |
| Battery | Battery Status (`battery.status` or computed), Power, Voltage, Current, Temperature |
| Load | Total Load Power (grid-side load), Load Power L1 (UPS + grid-side), Load Voltage L1 (`ups.voltage`), Daily / Cumulative Load |

UPS-Load has no panel, as in the app.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | — | Station name in the header |
| `theme` | `ha` | `ha` follows the HA theme, `deye` forces the Deye Cloud dark palette |
| `preset` / `prefix` | `none` / `inverter` | Entity preset and device name |
| `min_flow_w` | `50` | Lines at or below this power stay idle (no arrow, no dot) |
| `stale_after_s` | `300` | Header time turns orange when data is older than this |
| `show_sign` | `true` | Show the sign of power, as the app does (`-389.00 W`) |
| `grid.no_grid_voltage` | `100` | Off grid below this voltage when `grid.status` is not set |
| `battery.soc_warning` / `battery.soc_critical` | `50` / `20` | SOC colour thresholds |
| `<node>.name` | — | Custom label (`pv`, `grid`, `battery`, `ups`, `load`) |
| `<node>.icon` | — | mdi icon instead of the built-in one, e.g. `mdi:solar-power` |
| `<node>.hidden` | `false` | Hide a node and its line |
| `<node>.invert` | `false` | Flip the sign of the node's power |
| `demo` | — | Built-in sample data instead of entities: `day_charge`, `night_discharge`, `export`, `off_grid`, `low_battery`, `offline` |

## Development

```bash
npm install
npm run dev        # http://localhost:5173/dev/ — simulated entities and demo scenarios
npm test           # unit tests (Vitest)
npm run lint
npm run build      # dist/deye-cloud-power-flow-card.js
```

Releases: publishing a GitHub release `vX.Y.Z` builds the card and attaches `deye-cloud-power-flow-card.js` to it; HACS picks it up from there.

## License

MIT
