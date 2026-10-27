import React, {useState} from 'react';
import type {Exercise} from '../../core/types';
import type {ExecutionResult} from '../../core/executor';
import {runInSandbox} from './Sandbox';

export function ExercisePanel({exercise, onComplete, label = 'Práctica interactiva', done = false}: {exercise: Exercise; onComplete: () => void; label?: string; done?: boolean}) {
  const [choice, setChoice] = useState<number | undefined>(done && (exercise.type === 'multiple-choice' || exercise.type === 'output-prediction') ? exercise.answer : undefined);
  const [code, setCode] = useState(exercise.type === 'code-completion' ? exercise.starter : '');
  const [result, setResult] = useState<ExecutionResult>();
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState(done);
  const isCopyExercise = exercise.type === 'prompt-copy' || exercise.type === 'authorization';
  const answered = exercise.type === 'code-completion' ? result?.passed : isCopyExercise ? copied : choice !== undefined;
  const correct = exercise.type === 'code-completion' ? result?.passed : isCopyExercise ? copied : choice === (exercise.type === 'checkpoint' ? undefined : exercise.answer);
  const execute = async () => {
    if (exercise.type !== 'code-completion') return;
    setError('');
    try { const next = await runInSandbox(code, exercise.tests); setResult(next); if (next.passed) onComplete(); }
    catch (failure) { setError((failure as Error).message); }
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
  return <section className="exercise" aria-label={label}><span className="eyebrow">{label}</span><h2>{exercise.prompt}</h2>
    {exercise.type === 'code-completion' ? <><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="JavaScript editor"/><button onClick={execute}>Ejecutar pruebas</button>{result && <ul className="test-results">{result.tests.map((test) => <li key={test.name} className={test.passed ? 'pass' : 'fail'}>{test.passed ? '✓' : '×'} {test.name}{!test.passed && ` — esperado ${JSON.stringify(test.expected)}, recibido ${JSON.stringify(test.actual)}`}</li>)}</ul>}{error && <p className="fail">{error}</p>}</>
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
