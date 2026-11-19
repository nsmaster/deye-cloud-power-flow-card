/** Subset of `hass.locale` the card uses. */
export interface HaLocale {
  language: string;
  number_format?: string;
  time_format?: string;
}

export interface FormattedValue {
  value: string;
  unit: string;
}

export const DASH = '—';

const EMPTY: FormattedValue = { value: DASH, unit: '' };

interface NumberLocale {
  locales: string | string[] | undefined;
  grouping: boolean;
}

/** Mirrors Home Assistant's "Number format" profile setting. */
export function numberLocale(locale?: HaLocale): NumberLocale {
  switch (locale?.number_format) {
    case 'comma_decimal':
      return { locales: ['en-US', 'en'], grouping: true };
    case 'decimal_comma':
      return { locales: ['de', 'es', 'it'], grouping: true };
    case 'space_comma':
      return { locales: ['fr', 'sv', 'cs'], grouping: true };
    case 'system':
      return { locales: undefined, grouping: true };
    case 'none':
      return { locales: locale.language, grouping: false };
    default:
      return { locales: locale?.language, grouping: true };
  }
}

export function formatNumber(value: number, digits: number, locale?: HaLocale): string {
  const { locales, grouping } = numberLocale(locale);
  const normalized = value === 0 ? 0 : value; // avoid "-0"
  return new Intl.NumberFormat(locales, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: grouping,
  }).format(normalized);
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Two decimals like the app: "948.00 W", from 1000 W in kW ("1.25 kW"). */
export function formatPower(watts: number | null, locale?: HaLocale, showSign = true): FormattedValue {
  if (!isNumber(watts)) return EMPTY;
  const value = showSign ? watts : Math.abs(watts);
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded) < 1000) {
    return { value: formatNumber(rounded, 2, locale), unit: 'W' };
  }
  return { value: formatNumber(value / 1000, 2, locale), unit: 'kW' };
}

/** kWh with two decimals, MWh from 1000 kWh. */
export function formatEnergy(kwh: number | null, locale?: HaLocale): FormattedValue {
  if (!isNumber(kwh)) return EMPTY;
  if (Math.abs(kwh) < 1000) {
    return { value: formatNumber(kwh, 2, locale), unit: 'kWh' };
  }
  return { value: formatNumber(kwh / 1000, 2, locale), unit: 'MWh' };
}

export function formatPercent(percent: number | null, locale?: HaLocale): FormattedValue {
  if (!isNumber(percent)) return EMPTY;
  return { value: formatNumber(Math.round(percent), 0, locale), unit: '%' };
}

/** Date and time as in the app header: "2026-11-19 11:29:02" (local time). */
export function formatDateTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return DASH;
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}

export function formatTime(date: Date | null, locale?: HaLocale): string {
  if (!date || Number.isNaN(date.getTime())) return DASH;
  const hour12 = locale?.time_format === '12' ? true : locale?.time_format === '24' ? false : undefined;
  const locales = locale?.time_format === 'system' ? undefined : locale?.language;
  return new Intl.DateTimeFormat(locales, { hour: 'numeric', minute: '2-digit', hour12 }).format(date);
}
