import { nothing, svg, type SVGTemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import type { NodeId } from '../config';
import type { FormattedValue } from '../format';
import { ICON_SIZE, NODE_POS, NODE_RADIUS, NODE_SIZE } from '../layout';

export interface NodeView {
  id: NodeId;
  icon: SVGTemplateResult;
  ariaLabel: string;
  value?: FormattedValue;
  caption?: string;
  size?: number;
  dim?: boolean;
  /** Blue frame with glow — only the inverter. */
  highlight?: boolean;
  /** Extra decorations positioned by the caller (SOC, grid status). */
  extra?: SVGTemplateResult;
}

const VALUE_GAP = 26;
const CAPTION_GAP = 44;

export function renderNode(node: NodeView): SVGTemplateResult {
  const { x, y } = NODE_POS[node.id];
  const size = node.size ?? NODE_SIZE;
  const half = size / 2;
  const iconOffset = ICON_SIZE / 2;
  return svg`
    <g
      class=${classMap({ node: true, [node.id]: true, dim: !!node.dim, highlight: !!node.highlight })}
      role="img"
      aria-label=${node.ariaLabel}
    >
      <rect class="box" x=${x - half} y=${y - half} width=${size} height=${size} rx=${NODE_RADIUS} />
      <g class="icon" transform="translate(${x - iconOffset} ${y - iconOffset})">${node.icon}</g>
      ${node.value
        ? svg`<text class="value" x=${x} y=${y + half + VALUE_GAP}>${node.value.value}${node.value.unit
            ? svg`<tspan class="unit" dx="3">${node.value.unit}</tspan>`
            : nothing}</text>`
        : nothing}
      ${node.caption ? svg`<text class="caption" x=${x} y=${y + half + CAPTION_GAP}>${node.caption} ›</text>` : nothing}
      ${node.extra ?? nothing}
    </g>
  `;
}
