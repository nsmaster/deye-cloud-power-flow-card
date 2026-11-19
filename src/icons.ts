import { svg, type SVGTemplateResult } from 'lit';

/** Own line icons drawn on a 32 × 32 grid, styled by `.icon` in styles.ts. */

export const pvIcon = svg`
  <path d="M7 9h18l3 12H4z" />
  <path d="M5.5 15h21M12.5 9l-1 12M19.5 9l1 12" />
  <path d="M16 21v5M11 27h10" />
`;

export const gridIcon = svg`
  <path d="M11 28 14.5 5h3L21 28" />
  <path d="M7 10h18M8.5 16h15" />
  <path d="M12.8 16l7.3 6M19.2 16l-7.3 6" />
  <path d="M7 10v2.5M25 10v2.5" />
`;

export const inverterIcon = svg`
  <rect x="7" y="4" width="18" height="24" rx="3" />
  <path d="M11 13c1.25-2.5 3.75-2.5 5 0s3.75 2.5 5 0" />
  <path d="M11 20h10M11 23h2.5M14.75 23h2.5M18.5 23h2.5" />
`;

export const upsIcon = svg`
  <path d="M12 4v6M20 4v6" />
  <path d="M8.5 10h15v4a7.5 7.5 0 0 1-15 0z" />
  <path d="M16 21.5V28" />
  <path d="M16.9 12.6l-2.2 3.4h2.6l-2.2 3.4" />
`;

export const loadIcon = svg`
  <path d="M4.5 15 16 5.5 27.5 15" />
  <path d="M8 12.5V27h16V12.5" />
  <path d="M13.5 27v-7h5v7" />
`;

const BAR_COUNT = 5;

/** Battery outline with `filled` of five bars painted in the SOC colour. */
export function batteryIcon(filled: number): SVGTemplateResult {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const x = 6.5 + i * 3.6;
    return svg`<rect class=${i < filled ? 'bar on' : 'bar'} x=${x} y="12.5" width="2.6" height="7" rx="0.6" />`;
  });
  return svg`
    <rect x="4" y="10" width="22" height="12" rx="2.5" />
    <path class="terminal" d="M28.5 14v4" />
    ${bars}
  `;
}

export const checkMark = svg`<path d="M-3 0.2l2 2 4-4.2" />`;
export const crossMark = svg`<path d="M-2.4-2.4l4.8 4.8M2.4-2.4l-4.8 4.8" />`;
