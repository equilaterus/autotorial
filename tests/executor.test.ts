import {describe, expect, it} from 'vitest';
import {runExerciseInNode} from '../src/core/executor';

describe('disposable exercise execution', () => {
  it('returns deterministic per-test feedback', async () => {
    const result = await runExerciseInNode('function double(n) { return n * 2; }', [
      {name: 'positive', expression: 'double(3)', expected: 6},
      {name: 'negative', expression: 'double(-2)', expected: -4},
    ]);
    expect(result.passed).toBe(true);
    expect(result.tests).toHaveLength(2);
  });

  it('terminates non-responsive learner code', async () => {
    await expect(runExerciseInNode('while (true) {}', [], 50)).rejects.toThrow('terminated');
  });
});
