# Deye Cloud Power Flow Card

A Home Assistant Lovelace card that shows the power flow of a Deye hybrid inverter the way the **Deye Cloud** app does: six nodes around the inverter, orthogonal lines and animated flow dots.

> **Unofficial.** This project is not affiliated with, endorsed by or connected to Deye.

> **Status: early development (stage 2 — live data).** Detail panels and the first HACS release are coming next.

## Installation (HACS custom repository)

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/nsmaster/deye-cloud-power-flow-card`, type **Dashboard**.
2. Find **Deye Cloud Power Flow Card** → **Download**. HACS adds the dashboard resource.
3. Reload the browser and add the card.

## Configuration

### Solarman Stick Logger (ha-solarman)

With [davidrapan/ha-solarman](https://github.com/davidrapan/ha-solarman) and the `deye_hybrid` profile, the preset fills in every entity. `prefix` is the device name in Home Assistant (`inverter` by default).

```yaml
type: custom:deye-cloud-power-flow-card
title: Home
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
  power: sensor.deye_pv_power          # required
  energy_today: sensor.deye_pv_energy_today
grid:
  power: sensor.deye_grid_power        # required, + import / − export
  status: binary_sensor.deye_grid_connected
battery:
  power: sensor.deye_battery_power     # required, + discharge / − charge
  soc: sensor.deye_battery_soc         # required
  invert: false                        # flip the sign if your source differs
ups:
  power: sensor.deye_ups_load_power    # required
load:
  power: sensor.deye_grid_side_load    # optional, otherwise grid.power − grid.inner_power
```

Explicit keys always override the preset.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | — | Station name in the header |
| `theme` | `ha` | `ha` follows the HA theme, `deye` forces the Deye Cloud dark palette |
| `preset` / `prefix` | `none` / `inverter` | Entity preset and device name |
| `min_flow_w` | `10` | Lines below this power stay idle |
| `max_power_w` | `6000` | Power at which the flow animation is fastest |
| `stale_after_s` | `300` | Header time turns orange when data is older than this |
| `show_sign` | `false` | Show the sign of grid / battery power |
| `grid.no_grid_voltage` | `100` | Off grid below this voltage when `grid.status` is not set |
| `battery.soc_warning` / `battery.soc_critical` | `50` / `20` | SOC colour thresholds |
| `<node>.name` | — | Custom label (`pv`, `grid`, `battery`, `ups`, `load`) |
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
