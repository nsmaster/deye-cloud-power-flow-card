import { svg, type SVGTemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { FlowDirection } from '../flow';
import { ARROW_LENGTH, CORNER_RADIUS, LINE_POINTS, arrowPath, pathLength, roundedPath, trimEnd, type LineId } from '../layout';

/**
 * A line with an arrow and one flow dot. The dot element is always rendered
 * (hidden while idle) so every line's animation runs on the same clock — in the
 * app all dots start together and take the same time regardless of line length.
 */
export function renderLine(id: LineId, direction: FlowDirection, dim = false): SVGTemplateResult {
  const base = LINE_POINTS[id];
  const points = direction === 'out' ? [...base].reverse() : base;
  const active = direction !== 'none';
  const trackPoints = active ? trimEnd(points, ARROW_LENGTH - 0.5) : points;
  const d = roundedPath(trackPoints, CORNER_RADIUS);
  const travel = pathLength(trackPoints, CORNER_RADIUS);
  return svg`
    <g class=${classMap({ line: true, [id]: true, active, idle: !active, dim })}>
      <path class="track" d=${d} />
      ${active ? svg`<path class="arrow" d=${arrowPath(points)} />` : null}
      <path
        class="dot"
        d=${roundedPath(points, CORNER_RADIUS)}
        style=${styleMap({ '--travel': `${travel.toFixed(2)}`, 'stroke-dasharray': `0 ${(travel * 3).toFixed(2)}` })}
      />
    </g>
  `;
}
