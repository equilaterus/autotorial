import React, {useState} from 'react';
import type {Exercise} from '../../core/types';
import type {ExecutionResult} from '../../core/executor';
import {runInSandbox} from './Sandbox';
import {CodeEditor} from './CodeEditor';
import {PlaygroundPanel} from './Playground';
import {csharpSession, type CSharpRunResult} from './CSharpRunner';
import {composeCSharp, sameOutput} from '../../core/csharp';

export function ExercisePanel({exercise, onComplete, label = 'Práctica interactiva', done = false}: {exercise: Exercise; onComplete: () => void; label?: string; done?: boolean}) {
  if (exercise.type === 'playground') return <PlaygroundPanel exercise={exercise} onComplete={onComplete} label={label}/>;
  return <ChallengePanel exercise={exercise} onComplete={onComplete} label={label} done={done}/>;
}

function ChallengePanel({exercise, onComplete, label, done}: {exercise: Exclude<Exercise, {type: 'playground'}>; onComplete: () => void; label: string; done: boolean}) {
  const [choice, setChoice] = useState<number | undefined>(done && (exercise.type === 'multiple-choice' || exercise.type === 'output-prediction') ? exercise.answer : undefined);
  const [code, setCode] = useState(exercise.type === 'code-completion' ? exercise.starter : '');
  const [result, setResult] = useState<ExecutionResult>();
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState(done);
  const [busy, setBusy] = useState('');
  const isCopyExercise = exercise.type === 'prompt-copy' || exercise.type === 'authorization';
  const answered = exercise.type === 'code-completion' ? result?.passed : isCopyExercise ? copied : choice !== undefined;
  const correct = exercise.type === 'code-completion' ? result?.passed : isCopyExercise ? copied : choice === (exercise.type === 'checkpoint' ? undefined : exercise.answer);
  const execute = async () => {
    if (exercise.type !== 'code-completion') return;
    setError('');
    try {
      if (exercise.language === 'csharp') {
        setBusy('Preparando el compilador de C#… (la primera vez descarga unos 40 MB)');
        const runs = await csharpSession.run(
          exercise.tests.map((test) => composeCSharp(code, test.expression)),
          (loaded, total) => setBusy(`Preparando el compilador de C#… ${Math.min(100, Math.round((loaded / Math.max(1, total)) * 100))} % (descarga única)`),
        );
        setBusy('');
        const next = csharpResult(exercise.tests, runs);
        setResult(next);
        if (next.passed) onComplete();
        return;
      }
      const next = await runInSandbox(code, exercise.tests);
      setResult(next);
      if (next.passed) onComplete();
    } catch (failure) { setBusy(''); setError((failure as Error).message); }
  };
  const copyPrompt = async () => {
    if (!isCopyExercise || (exercise.type === 'authorization' && !accepted)) return;
    setError('');
    try {
      await navigator.clipboard.writeText(exercise.copyText);
      setCopied(true);
      onComplete();
    } catch {
      setError('No se pudo copiar automáticamente. Revisa el permiso del portapapeles e inténtalo de nuevo.');
    }
  };
  if (exercise.type === 'checkpoint') {
    return <section className={`exercise checkpoint${checked ? ' checked' : ''}`} aria-label={label}>
      <span className="eyebrow">{label}</span>
      <button type="button" className="check-toggle" aria-pressed={checked} onClick={() => {if (!checked) {setChecked(true); onComplete();}}}>
        <span className="check-box" aria-hidden="true">{checked ? '✓' : ''}</span><span>{exercise.prompt}</span>
      </button>
      {checked && <p className="pass">{exercise.explanation}</p>}
    </section>;
  }
  return <section className="exercise" aria-label={label}><span className="eyebrow">{label}</span>{exercise.title ? <><h2>{exercise.title}</h2><p className="exercise-description">{exercise.prompt}</p></> : <h2>{exercise.prompt}</h2>}
    {exercise.type === 'code-completion' ? <><CodeEditor value={code} onChange={setCode} language={exercise.language === 'csharp' ? 'csharp' : 'javascript'} label={exercise.language === 'csharp' ? 'C# editor' : 'JavaScript editor'}/><button onClick={execute} disabled={!!busy}>{busy ? 'Ejecutando…' : 'Ejecutar pruebas'}</button>{busy && <p className="hint">{busy}</p>}{result && <ul className="test-results">{result.tests.map((test) => <li key={test.name} className={test.passed ? 'pass' : 'fail'}>{test.passed ? '✓' : '×'} {test.name}{!test.passed && (test.error ? ` — ${test.error}` : ` — esperado ${JSON.stringify(test.expected)}, recibido ${JSON.stringify(test.actual)}`)}</li>)}</ul>}{error && <p className="fail">{error}</p>}</>
      : isCopyExercise ? <div className="copy-prompt">
        {exercise.type === 'authorization' && <><p className="authorization-notice">{exercise.notice}</p><label className="consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/><span>{exercise.consentLabel}</span></label></>}
        <pre>{exercise.copyText}</pre>
        <button className="copy-button" disabled={exercise.type === 'authorization' && !accepted} onClick={copyPrompt}>{copied ? 'Prompt copiado' : exercise.buttonLabel ?? 'Copiar prompt'}</button>
        {error && <p className="fail">{error}</p>}
      </div>
      : <div className="choices">{exercise.choices.map((item, index) => <button key={item} className={choice === index ? 'selected' : ''} onClick={() => {setChoice(index); if (index === exercise.answer) onComplete();}}>{item}</button>)}</div>}
    {answered && <p className={correct ? 'pass' : 'fail'}>{correct ? '¡Correcto! ' : 'Inténtalo otra vez. '}{exercise.explanation}</p>}
  </section>;
}

function csharpResult(tests: Array<{name: string; expected?: unknown}>, runs: CSharpRunResult[]): ExecutionResult {
  const results = tests.map((test, index) => {
    const run = runs[index];
    const compileError = run?.diagnostics?.find((diagnostic) => diagnostic.severity === 'Error');
    if (!run || compileError) return {name: test.name, expected: test.expected, passed: false, error: `Error de compilación: ${compileError?.message ?? 'no se pudo compilar'}`};
    if (!run.success || (run.stdErr ?? '').trim()) {
      const stderr = run.stdErr ?? '';
      const exception = /--->\s*(?:[\w.]+\.)?(\w+Exception)/.exec(stderr)?.[1] ?? /^(?:[\w.]+\.)?(\w+Exception)/.exec(stderr)?.[1];
      return {name: test.name, expected: test.expected, passed: false, error: exception ? `El programa falló con ${exception}` : `El programa falló: ${stderr.split('\n')[0].trim() || 'error al ejecutar'}`};
    }
    const actual = (run.stdOut ?? '').trim();
    return {name: test.name, expected: test.expected, actual, passed: sameOutput(run.stdOut, test.expected)};
  });
  return {passed: results.every((test) => test.passed), output: [], tests: results};
}
