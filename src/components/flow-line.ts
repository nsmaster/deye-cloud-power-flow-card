import { nothing, svg, type SVGTemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { LineFlow } from '../flow';
import { CORNER_RADIUS, LINE_POINTS, arrowPath, pathLength, roundedPath, type LineId } from '../layout';

/** Lines shorter than this carry a single dot instead of two. */
const SHORT_LINE = 60;

export function renderLine(id: LineId, flow: LineFlow, dim = false): SVGTemplateResult {
  const base = LINE_POINTS[id];
  const points = flow.direction === 'out' ? [...base].reverse() : base;
  const d = roundedPath(points, CORNER_RADIUS);
  const active = flow.direction !== 'none' && flow.durationS !== null;
  const len = pathLength(points, CORNER_RADIUS);
  const dots = len < SHORT_LINE ? 1 : 2;
  return svg`
    <g class=${classMap({ line: true, [id]: true, active, idle: !active, dim })}>
      <path class="track" d=${d} />
      ${active
        ? svg`
          <path class="arrow" d=${arrowPath(points)} />
          <path
            class="dots"
            d=${d}
            style=${styleMap({
              '--len': `${len}`,
              '--dur': `${flow.durationS}s`,
              'stroke-dasharray': `0 ${len / dots}`,
            })}
          />`
        : nothing}
    </g>
  `;
}
