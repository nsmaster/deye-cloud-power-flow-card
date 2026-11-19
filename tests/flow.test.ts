import { describe, expect, it } from 'vitest';
import { FASTEST_S, SLOWEST_S, flowDirection, flowDuration, lineFlow } from '../src/flow';

const opts = { minFlowW: 10, maxPowerW: 6000 };

describe('flowDirection', () => {
  it('stays idle at or below the threshold', () => {
    expect(flowDirection(10, 'bidirectional', 10)).toBe('none');
    expect(flowDirection(-10, 'bidirectional', 10)).toBe('none');
    expect(flowDirection(0, 'source', 10)).toBe('none');
  });

  it('treats unavailable values as idle', () => {
    expect(flowDirection(null, 'sink', 10)).toBe('none');
    expect(flowDirection(Number.NaN, 'sink', 10)).toBe('none');
  });

  it('only lets PV flow into the inverter', () => {
    expect(flowDirection(948, 'source', 10)).toBe('in');
    expect(flowDirection(-50, 'source', 10)).toBe('none');
  });

  it('only lets loads flow out of the inverter', () => {
    expect(flowDirection(503, 'sink', 10)).toBe('out');
    expect(flowDirection(-503, 'sink', 10)).toBe('none');
  });

  it('follows the sign on grid and battery', () => {
    expect(flowDirection(19, 'bidirectional', 10)).toBe('in'); // import / discharge
    expect(flowDirection(-389, 'bidirectional', 10)).toBe('out'); // export / charge
  });
});

describe('flowDuration', () => {
  it('is slowest at the threshold and fastest at max power', () => {
    expect(flowDuration(10, opts)).toBe(SLOWEST_S);
    expect(flowDuration(6000, opts)).toBe(FASTEST_S);
    expect(flowDuration(-6000, opts)).toBe(FASTEST_S);
  });

  it('is linear in between and clamped outside', () => {
    expect(flowDuration(3005, opts)).toBeCloseTo(2.5);
    expect(flowDuration(20000, opts)).toBe(FASTEST_S);
  });
});

describe('lineFlow', () => {
  it('returns no duration for idle lines', () => {
    expect(lineFlow(5, 'sink', opts)).toEqual({ direction: 'none', durationS: null });
  });

  it('can be disabled (e.g. off grid)', () => {
    expect(lineFlow(500, 'bidirectional', opts, false).direction).toBe('none');
  });

  it('combines direction and speed', () => {
    const flow = lineFlow(-389, 'bidirectional', opts);
    expect(flow.direction).toBe('out');
    expect(flow.durationS).toBeGreaterThan(FASTEST_S);
    expect(flow.durationS).toBeLessThan(SLOWEST_S);
  });
});
