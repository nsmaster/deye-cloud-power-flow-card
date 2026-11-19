import { svg, type SVGTemplateResult } from 'lit';

/**
 * Own line icons in the style of the Deye Cloud app, drawn around (0, 0) in
 * points and styled by `.icon` in styles.ts.
 */

export const pvIcon = svg`
  <path d="M-3.3 -7.6a3.3 3.3 0 0 1 6.6 0" />
  <path d="M0 -14.2v1.9M-5.6 -12.3l1.3 1.3M5.6 -12.3l-1.3 1.3M-7.6 -7.6h1.6M7.6 -7.6h-1.6" />
  <path d="M-8.3 -4.6H8.3L10.6 10.6H-10.6Z" />
  <path d="M-9.5 3h19M-2.9 -4.6l-0.8 15.2M2.9 -4.6l0.8 15.2" />
`;

export const gridIcon = svg`
  <path d="M-2.6 -12.6h5.2M-9.6 -8.4h19.2M-6.6 -3.4h13.2" />
  <path d="M-2.6 -12.6L-7.4 12.4M2.6 -12.6L7.4 12.4" />
  <path d="M-6.4 -3.4L5.6 7.6M6.4 -3.4L-5.6 7.6" />
  <path d="M-9.6 -8.4v1.8M9.6 -8.4v1.8M-10 12.4h5.2M4.8 12.4h5.2" />
`;

export const inverterIcon = svg`
  <rect x="-10" y="-13" width="20" height="26" rx="0.6" />
  <path d="M-10 5.2h20" />
  <path d="M-5.6 -1.6v-3.4a5.6 5.6 0 0 1 11.2 0v3.4z" />
  <rect class="solid" x="-2.4" y="-5.4" width="4.8" height="2.4" rx="0.4" />
`;

export const upsIcon = svg`
  <rect x="-10.6" y="-10" width="21.2" height="14.6" rx="0.6" />
  <path d="M-2.2 4.6v4.8M2.2 4.6v4.8M-6.4 9.6h12.8" />
  <text class="icon-text" x="0" y="0.6">UPS</text>
`;

export const loadIcon = svg`
  <path d="M-11.2 -0.6L-0.6 -10.4L9.6 -1.4" />
  <path d="M-8 -3.4V10.6H1.6" />
  <path d="M5.8 0.4a3.6 3.6 0 0 1 2.2 6.4v1.6h-4.4v-1.6a3.6 3.6 0 0 1 2.2-6.4z" />
  <path d="M3.9 10.6h3.8" />
`;

/** Battery outline with a fill proportional to SOC; "96%" is drawn by the card above it. */
export function batteryIcon(soc: number | null): SVGTemplateResult {
  const inner = 28;
  const level = soc === null || !Number.isFinite(soc) ? 0 : Math.min(100, Math.max(0, soc)) / 100;
  return svg`
    <rect x="-17.4" y="0.6" width="32" height="15" rx="0.8" />
    <path class="terminal" d="M16.4 5v6.2" />
    ${level > 0 ? svg`<rect class="soc-fill" x="-15.4" y="2.6" width=${inner * level} height="11" />` : null}
  `;
}

export const checkMark = svg`<path d="M-3 0.2l2 2 4-4.2" />`;
export const crossMark = svg`<path d="M-2.4-2.4l4.8 4.8M2.4-2.4l-4.8 4.8" />`;

export const clockIcon = svg`
  <svg class="clock" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.6V8l2.4 1.6" />
  </svg>
`;
