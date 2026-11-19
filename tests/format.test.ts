import { describe, expect, it } from 'vitest';
import { DASH, formatEnergy, formatPercent, formatPower, formatTime } from '../src/format';

const en = { language: 'en', number_format: 'comma_decimal' };
const de = { language: 'de', number_format: 'decimal_comma' };

describe('formatPower', () => {
  it('shows whole watts below 1000 W', () => {
    expect(formatPower(948, en)).toEqual({ value: '948', unit: 'W' });
    expect(formatPower(19.4, en)).toEqual({ value: '19', unit: 'W' });
  });

  it('switches to kW with two decimals from 1000 W', () => {
    expect(formatPower(1250, en)).toEqual({ value: '1.25', unit: 'kW' });
    expect(formatPower(999.6, en)).toEqual({ value: '1.00', unit: 'kW' });
    expect(formatPower(12345, de)).toEqual({ value: '12,35', unit: 'kW' });
  });

  it('hides the sign unless asked', () => {
    expect(formatPower(-389, en)).toEqual({ value: '389', unit: 'W' });
    expect(formatPower(-389, en, true)).toEqual({ value: '-389', unit: 'W' });
    expect(formatPower(-0.2, en, true)).toEqual({ value: '0', unit: 'W' });
  });

  it('shows a dash for missing values', () => {
    expect(formatPower(null, en)).toEqual({ value: DASH, unit: '' });
    expect(formatPower(Number.NaN, en)).toEqual({ value: DASH, unit: '' });
  });
});

describe('formatEnergy', () => {
  it('uses kWh with two decimals and MWh from 1000 kWh', () => {
    expect(formatEnergy(1.2, en)).toEqual({ value: '1.20', unit: 'kWh' });
    expect(formatEnergy(1534.5, en)).toEqual({ value: '1.53', unit: 'MWh' });
  });

  it('respects the number format', () => {
    expect(formatEnergy(1.2, de)).toEqual({ value: '1,20', unit: 'kWh' });
  });
});

describe('formatPercent', () => {
  it('rounds to whole percent', () => {
    expect(formatPercent(95.6, en)).toEqual({ value: '96', unit: '%' });
  });
});

describe('formatTime', () => {
  it('honours the 24h setting', () => {
    const date = new Date(2026, 10, 19, 12, 10);
    expect(formatTime(date, { language: 'en', time_format: '24' })).toBe('12:10');
    expect(formatTime(null)).toBe(DASH);
  });
});
