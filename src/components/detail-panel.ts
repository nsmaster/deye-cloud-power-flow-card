import { svg, type SVGTemplateResult } from 'lit';
import type { PanelRow } from '../panels';
import { PANEL, VIEW } from '../layout';

export interface PanelHandlers {
  onClose: () => void;
  onRow: (entityId: string) => void;
}

const activateOnKey = (action: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

/** Detail panel over the diagram, as in the app: "Label: value" rows and a × at the bottom. */
export function renderPanel(title: string, rows: readonly PanelRow[], handlers: PanelHandlers): SVGTemplateResult {
  const longest = Math.max(...rows.map((r) => r.label.length + r.value.length + 2), 0);
  const width = Math.max(PANEL.minWidth, longest * PANEL.charWidth + PANEL.padX * 2);
  const height = PANEL.firstBaseline + (rows.length - 1) * PANEL.rowStep + PANEL.closeArea;
  // Centred on the diagram.
  const x = VIEW.x + (VIEW.width - width) / 2;
  const y = VIEW.y + (VIEW.height - height) / 2;
  const closeY = y + height - PANEL.closeFromBottom;
  return svg`
    <g class="panel" role="dialog" aria-label=${title} @click=${(e: Event) => e.stopPropagation()}>
      <rect class="panel-bg" x=${x} y=${y} width=${width} height=${height} rx="2" />
      ${rows.map((row, i) => {
        const baseline = y + PANEL.firstBaseline + i * PANEL.rowStep;
        const text = svg`<text class="panel-text" x=${x + PANEL.padX} y=${baseline}>${row.label}: ${row.value}</text>`;
        if (!row.entityId) return svg`<g class="row">${text}</g>`;
        const open = () => handlers.onRow(row.entityId as string);
        return svg`
          <g class="row link" role="button" tabindex="0" aria-label=${`${row.label}: ${row.value}`}
            @click=${open} @keydown=${activateOnKey(open)}>
            <rect class="hit" x=${x} y=${baseline - PANEL.rowStep + 6} width=${width} height=${PANEL.rowStep} />
            ${text}
          </g>`;
      })}
      <g class="close" role="button" tabindex="0" aria-label="Close" transform="translate(${x + width / 2} ${closeY})"
        @click=${handlers.onClose} @keydown=${activateOnKey(handlers.onClose)}>
        <rect class="hit" x="-11" y="-11" width="22" height="22" />
        <path d="M-3.4-3.4l6.8 6.8M3.4-3.4l-6.8 6.8" />
      </g>
    </g>
  `;
}
