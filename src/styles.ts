import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    /* Default mode follows the active Home Assistant theme. */
    --dcf-text: var(--primary-text-color, #212121);
    --dcf-text-secondary: var(--secondary-text-color, #727272);
    --dcf-node-bg: color-mix(in srgb, var(--dcf-text) 4%, transparent);
    --dcf-node-border: color-mix(in srgb, var(--dcf-text) 22%, transparent);
    --dcf-icon: var(--dcf-text);
    --dcf-line: color-mix(in srgb, var(--dcf-text) 32%, transparent);
    --dcf-arrow: color-mix(in srgb, var(--dcf-text) 55%, transparent);
    --dcf-accent: var(--primary-color, #03a9f4);
    --dcf-glow: color-mix(in srgb, var(--dcf-accent) 50%, transparent);
    --dcf-ok: var(--success-color, #3ccf6e);
    --dcf-warning: var(--warning-color, #f5b83d);
    --dcf-error: var(--error-color, #f05454);
  }

  ha-card {
    display: block;
    overflow: hidden;
    padding: 14px 12px 10px;
    color: var(--dcf-text);
  }

  /* theme: deye — fixed dark palette of the Deye Cloud app. */
  ha-card.deye {
    --dcf-text: #ffffff;
    --dcf-text-secondary: #8a9099;
    --dcf-node-bg: #22252b;
    --dcf-node-border: #3a3f47;
    --dcf-icon: #e8eaed;
    --dcf-line: #4a505a;
    --dcf-arrow: #6b727d;
    --dcf-accent: #2f7cf6;
    --dcf-glow: rgba(47, 124, 246, 0.5);
    --dcf-ok: #3ccf6e;
    --dcf-warning: #f5b83d;
    --dcf-error: #f05454;
    background: #17191d;
    color: var(--dcf-text);
  }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 0 4px 4px;
  }
  .title {
    font-size: 16px;
    font-weight: 600;
    line-height: 22px;
  }
  .production {
    display: flex;
    flex-direction: column;
  }
  .production .label {
    font-size: 12px;
    line-height: 16px;
    color: var(--dcf-text-secondary);
  }
  .production .number {
    font-size: 20px;
    font-weight: 600;
    line-height: 26px;
  }
  .production .unit,
  .updated {
    font-size: 12px;
    color: var(--dcf-text-secondary);
  }
  .production .unit {
    margin-left: 3px;
    font-weight: 400;
  }
  .updated {
    white-space: nowrap;
    line-height: 22px;
  }
  .updated.stale {
    color: var(--dcf-warning);
  }

  /* Diagram */
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 480px;
    overflow: visible;
  }
  text {
    text-anchor: middle;
    font-family: inherit;
  }
  .value {
    font-size: 20px;
    font-weight: 600;
    fill: var(--dcf-text);
  }
  .unit {
    font-size: 12px;
    font-weight: 400;
  }
  .caption {
    font-size: 12px;
    fill: var(--dcf-text-secondary);
  }

  .box {
    fill: var(--dcf-node-bg);
    stroke: var(--dcf-node-border);
    stroke-width: 1.5;
  }
  .node.highlight .box {
    stroke: var(--dcf-accent);
    stroke-width: 2;
    filter: drop-shadow(0 0 6px var(--dcf-glow));
  }
  .icon {
    fill: none;
    stroke: var(--dcf-icon);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon .terminal {
    stroke-width: 2.5;
  }
  .icon .bar {
    stroke: none;
    fill: none;
  }
  .icon .bar.on {
    fill: var(--dcf-soc, var(--dcf-accent));
  }
  .dim {
    opacity: 0.4;
  }

  .soc {
    text-anchor: start;
    font-size: 15px;
    font-weight: 600;
    fill: var(--dcf-soc, var(--dcf-accent));
  }
  .soc .unit {
    font-size: 11px;
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

  .grid-status {
    font-size: 12px;
    font-weight: 500;
  }
  .grid-status.on,
  .badge.on circle {
    fill: var(--dcf-ok);
  }
  .grid-status.off,
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

  /* Lines and flow dots */
  .track {
    fill: none;
    stroke: var(--dcf-line);
    stroke-width: 1.5;
  }
  .line.idle .track {
    opacity: 0.45;
  }
  .arrow {
    fill: none;
    stroke: var(--dcf-arrow);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .dots {
    fill: none;
    stroke: var(--dcf-accent);
    stroke-width: 6;
    stroke-linecap: round;
    animation: dcf-flow var(--dur) linear infinite;
  }
  @keyframes dcf-flow {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: calc(var(--len) * -1px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dots {
      display: none;
    }
  }
`;
