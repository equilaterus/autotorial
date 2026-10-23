import {describe, expect, it} from 'vitest';
import {runExerciseInNode} from '../src/core/executor';

describe('disposable exercise execution', () => {
  it('returns deterministic per-test feedback', async () => {
    const result = await runExerciseInNode('function multiplicar(a, b) { return a * b; }', [
      {name: 'positive', expression: 'multiplicar(3, 2)', expected: 6},
      {name: 'negative', expression: 'multiplicar(-2, 4)', expected: -8},
    ]);
    expect(result.passed).toBe(true);
    expect(result.tests).toHaveLength(2);
  });

  it('terminates non-responsive learner code', async () => {
    await expect(runExerciseInNode('while (true) {}', [], 50)).rejects.toThrow('terminated');
  });
});
