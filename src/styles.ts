import { css } from 'lit';

const NUMBER_FONT = css`'DIN Alternate', 'DIN Condensed', Bahnschrift, 'Roboto Condensed', 'Arial Narrow', sans-serif`;

export const cardStyles = css`
  :host {
    display: block;
    /* Default mode follows the active Home Assistant theme. */
    --dcf-bg: var(--ha-card-background, var(--card-background-color, #ffffff));
    --dcf-text: var(--primary-text-color, #212121);
    --dcf-text-secondary: var(--secondary-text-color, #727272);
    --dcf-node-bg: color-mix(in srgb, var(--dcf-text) 5%, transparent);
    --dcf-node-border: color-mix(in srgb, var(--dcf-text) 38%, transparent);
    --dcf-icon: var(--dcf-text);
    --dcf-line: var(--dcf-text);
    --dcf-accent: var(--primary-color, #3991ff);
    --dcf-glow: color-mix(in srgb, var(--dcf-accent) 45%, transparent);
    --dcf-ok: var(--success-color, #43c35e);
    --dcf-warning: var(--warning-color, #f5b83d);
    --dcf-error: var(--error-color, #f05454);
  }

  ha-card {
    display: block;
    overflow: hidden;
    padding: 16px 14px 12px;
    color: var(--dcf-text);
  }

  /* theme: deye — colours sampled from the Deye Cloud app. */
  ha-card.deye {
    --dcf-bg: #2c2c2c;
    --dcf-text: #ffffff;
    --dcf-text-secondary: #8c8c8c;
    --dcf-node-bg: #333333;
    --dcf-node-border: #6d6e71;
    --dcf-icon: #ffffff;
    --dcf-line: #ffffff;
    --dcf-accent: #3991ff;
    --dcf-glow: rgba(59, 146, 252, 0.45);
    --dcf-ok: #43c35e;
    --dcf-ok-text: #5bcb7a;
    --dcf-warning: #f5b83d;
    --dcf-error: #f05454;
    background: var(--dcf-bg);
  }

  /* Header */
  .header {
    padding: 0 2px 6px;
  }
  .title {
    font-size: 17px;
    font-weight: 600;
    line-height: 24px;
    margin-bottom: 6px;
  }
  .production-label {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }
  .production {
    font-family: ${NUMBER_FONT};
    font-size: 21px;
    font-weight: 700;
    line-height: 26px;
  }
  .production .unit {
    font-size: 11px;
    margin-left: 1px;
  }
  .updated {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--dcf-text-secondary);
  }
  .updated.stale {
    color: var(--dcf-warning);
  }
  .clock {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  /* Diagram */
  svg.diagram {
    display: block;
    width: 100%;
    height: auto;
    max-height: 520px;
    overflow: visible;
  }
  text {
    text-anchor: middle;
    font-family: inherit;
  }
  .value {
    font-family: ${NUMBER_FONT};
    font-size: 17.5px;
    font-weight: 700;
    fill: var(--dcf-text);
  }
  .value .unit {
    font-size: 9px;
    font-weight: 600;
  }
  .caption {
    font-size: 10.5px;
    fill: var(--dcf-text-secondary);
  }

  .box {
    fill: var(--dcf-node-bg);
    stroke: var(--dcf-node-border);
  }
  .node.highlight .box {
    stroke: var(--dcf-accent);
    filter: drop-shadow(0 0 3px var(--dcf-glow));
  }
  .icon {
    fill: none;
    stroke: var(--dcf-icon);
    stroke-width: 1.65;
    stroke-linecap: butt;
    stroke-linejoin: miter;
  }
  .icon .solid {
    fill: var(--dcf-icon);
    stroke: none;
  }
  .icon .terminal {
    stroke-width: 2.6;
  }
  .icon-text {
    fill: var(--dcf-icon);
    stroke: none;
    font-family: ${NUMBER_FONT};
    font-size: 8px;
    font-weight: 700;
  }
  .ha-icon ha-icon {
    display: block;
    --mdc-icon-size: 26px;
    color: var(--dcf-icon);
  }
  .dim {
    opacity: 0.4;
  }

  /* Battery: SOC text and fill inside the node */
  .soc {
    font-family: ${NUMBER_FONT};
    font-size: 16px;
    letter-spacing: 0.5px;
    font-weight: 700;
    fill: var(--dcf-soc);
  }
  .icon .soc-fill {
    fill: var(--dcf-soc);
    stroke: none;
  }
  .battery.level-ok,
  .battery.level-unknown {
    --dcf-soc: var(--dcf-accent);
  }
  .battery.level-warning {
    --dcf-soc: var(--dcf-warning);
  }
  .battery.level-critical {
    --dcf-soc: var(--dcf-error);
  }
  .battery.level-unknown .soc {
    fill: var(--dcf-text-secondary);
  }

  /* "On grid" sits on the grid node's top border, masking it like in the app */
  .grid-status {
    font-size: 9.5px;
    font-weight: 500;
  }
  .grid-status-bg {
    fill: var(--dcf-bg);
  }
  .grid-status.on {
    fill: var(--dcf-ok-text, var(--dcf-ok));
  }
  .grid-status.off {
    fill: var(--dcf-error);
  }
  .badge.on circle {
    fill: var(--dcf-ok);
  }
  .badge.off circle {
    fill: var(--dcf-error);
  }
  .badge path {
    fill: none;
    stroke: #ffffff;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Lines, arrows and flow dots */
  .track {
    fill: none;
    stroke: var(--dcf-line);
    stroke-width: 1px;
  }
  .arrow {
    fill: var(--dcf-line);
  }
  .dot {
    fill: none;
    stroke: var(--dcf-accent);
    stroke-width: 8px;
    stroke-linecap: round;
    animation: dcf-flow 3s linear infinite;
  }
  .line.idle .dot {
    visibility: hidden;
  }
  /* Measured from the app: the dot fades in at the line start, travels at constant
     speed, fades out just before the arrow, then the line stays empty briefly. */
  @keyframes dcf-flow {
    0% {
      stroke-dashoffset: 0;
      opacity: 0;
    }
    7% {
      opacity: 1;
    }
    82% {
      opacity: 1;
    }
    89% {
      stroke-dashoffset: calc(var(--travel) * -1px);
      opacity: 0;
    }
    100% {
      stroke-dashoffset: calc(var(--travel) * -1px);
      opacity: 0;
    }
  }
  /* Clickable nodes */
  .hit {
    fill: transparent;
    stroke: none;
  }
  .node.clickable,
  .row.link,
  .close {
    cursor: pointer;
    outline: none;
  }
  /* Keyboard focus only; the app does not highlight the tapped node. */
  .node.clickable:focus-visible .box {
    stroke: var(--dcf-accent);
  }

  /* Detail panel (app: translucent black, "Label: value" rows, × at the bottom) */
  .panel-bg {
    fill: rgba(0, 0, 0, 0.55);
  }
  ha-card:not(.deye) .panel-bg {
    fill: color-mix(in srgb, var(--dcf-bg) 25%, rgba(0, 0, 0, 0.72));
  }
  .panel-text {
    text-anchor: start;
    font-size: 12px;
    fill: #ffffff;
  }
  .row.link:hover .panel-text,
  .row.link:focus-visible .panel-text {
    fill: var(--dcf-accent);
  }
  .row.link:focus-visible .hit {
    fill: rgba(255, 255, 255, 0.06);
  }
  .close path {
    fill: none;
    stroke: #d7d7d7;
    stroke-width: 1;
    stroke-linecap: round;
  }
  .close:focus-visible path,
  .close:hover path {
    stroke: #ffffff;
    stroke-width: 1.4;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      display: none;
    }
  }
`;
