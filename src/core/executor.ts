import {Worker} from 'node:worker_threads';
import type {CodeTest} from './types';

export interface TestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual?: unknown;
  error?: string;
}

export interface ExecutionResult {
  passed: boolean;
  output: string[];
  tests: TestResult[];
}

const WORKER_SOURCE = String.raw`
const {parentPort, workerData} = require('node:worker_threads');
const logs = [];
const safeConsole = {log: (...args) => logs.push(args.map(String).join(' '))};
try {
  const testExpressions = workerData.tests.map((test) =>
    'try { const actual = (' + test.expression + '); results.push({name:' + JSON.stringify(test.name) + ', expected:' + JSON.stringify(test.expected) + ', actual, passed:JSON.stringify(actual)===JSON.stringify(' + JSON.stringify(test.expected) + ')}); } catch(error) { results.push({name:' + JSON.stringify(test.name) + ', expected:' + JSON.stringify(test.expected) + ', passed:false, error:String(error && error.message || error)}); }'
  ).join('\n');
  const evaluate = new Function('console', '"use strict";\n' + workerData.code + '\nconst results=[];\n' + testExpressions + '\nreturn results;');
  const tests = evaluate(safeConsole);
  parentPort.postMessage({passed:tests.every((test) => test.passed), output:logs, tests});
} catch(error) {
  parentPort.postMessage({passed:false, output:logs, tests:[], error:String(error && error.message || error)});
}
`;

export function runExerciseInNode(code: string, tests: CodeTest[], timeoutMs = 1000): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SOURCE, {eval: true, workerData: {code, tests}});
    const timeout = setTimeout(() => {
      void worker.terminate();
      reject(new Error(`Exercise exceeded ${timeoutMs}ms and was terminated`));
    }, timeoutMs);
    worker.once('message', (result) => {
      clearTimeout(timeout);
      void worker.terminate();
      if (result.error) reject(new Error(result.error));
      else resolve(result as ExecutionResult);
    });
    worker.once('error', (error) => { clearTimeout(timeout); reject(error); });
  });
}
