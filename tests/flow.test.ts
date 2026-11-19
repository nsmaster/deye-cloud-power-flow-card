import { describe, expect, it } from 'vitest';
import { flowDirection } from '../src/flow';

describe('flowDirection', () => {
  it('stays idle at or below the threshold', () => {
    expect(flowDirection(50, 'bidirectional', 50)).toBe('none');
    expect(flowDirection(-50, 'bidirectional', 50)).toBe('none');
    expect(flowDirection(19, 'bidirectional', 50)).toBe('none'); // grid in the recording
    expect(flowDirection(0, 'source', 50)).toBe('none');
  });

  it('treats unavailable values as idle', () => {
    expect(flowDirection(null, 'sink', 50)).toBe('none');
    expect(flowDirection(Number.NaN, 'sink', 50)).toBe('none');
  });

  it('only lets PV flow into the inverter', () => {
    expect(flowDirection(948, 'source', 50)).toBe('in');
    expect(flowDirection(-500, 'source', 50)).toBe('none');
  });

  it('only lets loads flow out of the inverter', () => {
    expect(flowDirection(503, 'sink', 50)).toBe('out');
    expect(flowDirection(-503, 'sink', 50)).toBe('none');
  });

  it('follows the sign on grid and battery', () => {
    expect(flowDirection(640, 'bidirectional', 50)).toBe('in'); // import / discharge
    expect(flowDirection(-389, 'bidirectional', 50)).toBe('out'); // export / charge
  });

  it('can be disabled (e.g. off grid)', () => {
    expect(flowDirection(500, 'bidirectional', 50, false)).toBe('none');
  });
});
