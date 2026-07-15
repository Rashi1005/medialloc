import { describe, it, expect } from 'vitest';
import { solveKnapsack } from '../algorithms/knapsack.js';

const normalCapacity = { icu: 6, ventilator: 4, medicine: 10 };

describe('solveKnapsack', () => {
  it('returns zero score for empty patient list', () => {
    const result = solveKnapsack([], normalCapacity);
    expect(result.maxScore).toBe(0);
    expect(result.selectedIndices).toHaveLength(0);
  });

  it('produces maxScore=28 for the default MediAlloc demo patients', () => {
    const patients = [
      { id: 1, survivalScore: 9, icu: 2, ventilator: 1, medicine: 3 },
      { id: 2, survivalScore: 7, icu: 1, ventilator: 1, medicine: 2 },
      { id: 3, survivalScore: 5, icu: 1, ventilator: 0, medicine: 2 },
      { id: 4, survivalScore: 8, icu: 2, ventilator: 1, medicine: 4 },
      { id: 5, survivalScore: 4, icu: 1, ventilator: 0, medicine: 1 },
    ];
    const result = solveKnapsack(patients, normalCapacity);
    expect(result.maxScore).toBe(28);
    expect(result.selectedIndices).not.toContain(2);
  });

  it('defers all patients when capacity is zero', () => {
    const patients = [{ id: 1, survivalScore: 9, icu: 1, ventilator: 1, medicine: 1 }];
    const result = solveKnapsack(patients, { icu: 0, ventilator: 0, medicine: 0 });
    expect(result.selectedIndices).toHaveLength(0);
    expect(result.maxScore).toBe(0);
  });

  it('allocates single patient when resources are exactly sufficient', () => {
    const patients = [{ id: 1, survivalScore: 7, icu: 2, ventilator: 1, medicine: 3 }];
    const result = solveKnapsack(patients, { icu: 2, ventilator: 1, medicine: 3 });
    expect(result.selectedIndices).toContain(0);
    expect(result.maxScore).toBe(7);
  });

  it('handles the Surge Crisis scenario (icu:3, vent:2, med:5)', () => {
    const patients = [
      { id: 1, survivalScore: 9, icu: 2, ventilator: 1, medicine: 3 },
      { id: 2, survivalScore: 7, icu: 1, ventilator: 1, medicine: 2 },
      { id: 3, survivalScore: 5, icu: 1, ventilator: 0, medicine: 2 },
    ];
    const result = solveKnapsack(patients, { icu: 3, ventilator: 2, medicine: 5 });
    expect(result.maxScore).toBeGreaterThanOrEqual(14);
  });
});
