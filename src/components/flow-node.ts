import { nothing, svg, type SVGTemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import type { NodeId } from '../config';
import type { FormattedValue } from '../format';
import { CAPTION_GAP, NODE_BORDER, NODE_POS, NODE_RADIUS, NODE_SIZE, VALUE_GAP } from '../layout';

export interface NodeView {
  id: NodeId;
  icon: SVGTemplateResult;
  /** mdi icon (e.g. "mdi:solar-power") rendered with ha-icon instead of `icon`. */
  haIcon?: string;
  ariaLabel: string;
  value?: FormattedValue;
  caption?: string;
  /** Show the "›" hint that the node opens a detail panel. */
  link?: boolean;
  /** Built-in icons are drawn slightly small; the app's are ~10 % larger. */
  iconScale?: number;
  size?: number;
  border?: number;
  radius?: number;
  dim?: boolean;
  /** Blue frame with glow — only the inverter. */
  highlight?: boolean;
  /** Extra decorations positioned by the caller (SOC, grid status). */
  extra?: SVGTemplateResult;
  /** Makes the node a button that opens its detail panel. */
  onSelect?: () => void;
  selected?: boolean;
}

const HA_ICON_SIZE = 26;

export function renderNode(node: NodeView): SVGTemplateResult {
  const { x, y } = NODE_POS[node.id];
  const size = node.size ?? NODE_SIZE;
  const border = node.border ?? NODE_BORDER;
  const radius = node.radius ?? NODE_RADIUS;
  const half = size / 2;
  const inset = border / 2;
  const bottom = y + half;
  const select = node.onSelect;
  const hitBottom = node.caption ? bottom + CAPTION_GAP + 4 : bottom + 2;
  return svg`
    <g
      class=${classMap({
        node: true,
        [node.id]: true,
        dim: !!node.dim,
        highlight: !!node.highlight,
        clickable: !!select,
        selected: !!node.selected,
      })}
      role=${select ? 'button' : 'img'}
      tabindex=${select ? '0' : nothing}
      aria-label=${node.ariaLabel}
      aria-haspopup=${select ? 'dialog' : nothing}
      aria-expanded=${select ? String(!!node.selected) : nothing}
      @click=${select
        ? (e: Event) => {
            e.stopPropagation();
            select();
          }
        : nothing}
      @keydown=${select
        ? (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              select();
            }
          }
        : nothing}
    >
      ${select ? svg`<rect class="hit" x=${x - 46} y=${y - half - 2} width="92" height=${hitBottom - (y - half - 2)} />` : nothing}
      <rect
        class="box"
        x=${x - half + inset}
        y=${y - half + inset}
        width=${size - border}
        height=${size - border}
        rx=${radius - inset}
        style="stroke-width: ${border}px"
      />
      ${node.haIcon
        ? svg`<foreignObject class="ha-icon" x=${x - HA_ICON_SIZE / 2} y=${y - HA_ICON_SIZE / 2} width=${HA_ICON_SIZE} height=${HA_ICON_SIZE}>
            <ha-icon icon=${node.haIcon}></ha-icon>
          </foreignObject>`
        : svg`<g class="icon" transform="translate(${x} ${y}) scale(${node.iconScale ?? 1.1})">${node.icon}</g>`}
      ${node.value
        ? svg`<text class="value" x=${x} y=${bottom + VALUE_GAP}>${node.value.value}${node.value.unit
            ? svg`<tspan class="unit" dx="1">${node.value.unit}</tspan>`
            : nothing}</text>`
        : nothing}
      ${node.caption
        ? svg`<text class="caption" x=${x} y=${bottom + CAPTION_GAP}>${node.caption}${node.link ? ' >' : ''}</text>`
        : nothing}
      ${node.extra ?? nothing}
    </g>
  `;
}
