/** Hosted C# runner (Roslyn on .NET WebAssembly, WasmSharp): https://github.com/TheScienceOfCode/csharp-wasm */
export const CSHARP_RUNNER_URL = 'https://thescienceofcode.com/csharp-wasm/runner.js';

const USING = /^\s*using\s+[\w.]+\s*;\s*$/;

/**
 * Builds one program from the learner's code and a test. The learner's `using` lines go first, then the test's
 * statements, then the rest of the learner's code: C# wants top-level statements before type declarations, and local
 * functions and classes can be declared after the statements that use them.
 */
export function composeCSharp(learnerCode: string, testCode: string): string {
  const lines = learnerCode.split('\n');
  const usings = lines.filter((line) => USING.test(line));
  const rest = lines.filter((line) => !USING.test(line));
  return [...usings, testCode, ...rest].join('\n');
}

/** Output comparison used by C# exercises: line endings and trailing whitespace are ignored. */
export function sameOutput(actual: string | null | undefined, expected: unknown): boolean {
  const normalize = (text: string) => text.replace(/\r\n/g, '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim();
  return normalize(actual ?? '') === normalize(String(expected));
}
