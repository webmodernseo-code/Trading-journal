import { describe, it, expect } from 'vitest';
import { calculatePositionSize } from '../position-size';

describe('calculatePositionSize', () => {
  it('computes quantity from risk amount, stop distance, and point value', () => {
    // risk 50, stop distance 0.005, point value 10 per unit per point
    // quantity = 50 / (0.005 * 10) = 1000
    const result = calculatePositionSize({
      riskAmount: 50,
      stopDistance: 0.005,
      pointValue: 10,
    });
    expect(result).toBeCloseTo(1000, 5);
  });

  it('throws when stop distance is zero', () => {
    expect(() =>
      calculatePositionSize({ riskAmount: 50, stopDistance: 0, pointValue: 10 })
    ).toThrow('stopDistance must be greater than zero');
  });
});
