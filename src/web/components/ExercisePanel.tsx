import React, {useState} from 'react';
import type {Exercise} from '../../core/types';
import type {ExecutionResult} from '../../core/executor';
import {runInSandbox} from './Sandbox';

export function ExercisePanel({exercise, onComplete, label = 'Práctica interactiva'}: {exercise: Exercise; onComplete: () => void; label?: string}) {
  const [choice, setChoice] = useState<number>();
  const [code, setCode] = useState(exercise.type === 'code-completion' ? exercise.starter : '');
  const [result, setResult] = useState<ExecutionResult>();
  const [error, setError] = useState('');
  const answered = exercise.type === 'code-completion' ? result?.passed : choice !== undefined;
  const correct = exercise.type === 'code-completion' ? result?.passed : choice === exercise.answer;
  const execute = async () => {
    if (exercise.type !== 'code-completion') return;
    setError('');
    try { const next = await runInSandbox(code, exercise.tests); setResult(next); if (next.passed) onComplete(); }
    catch (failure) { setError((failure as Error).message); }
  };
  return <section className="exercise" aria-label={label}><span className="eyebrow">{label}</span><h2>{exercise.prompt}</h2>
    {exercise.type === 'code-completion' ? <><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="JavaScript editor"/><button onClick={execute}>Ejecutar pruebas</button>{result && <ul className="test-results">{result.tests.map((test) => <li key={test.name} className={test.passed ? 'pass' : 'fail'}>{test.passed ? '✓' : '×'} {test.name}{!test.passed && ` — esperado ${JSON.stringify(test.expected)}, recibido ${JSON.stringify(test.actual)}`}</li>)}</ul>}{error && <p className="fail">{error}</p>}</>
      : <div className="choices">{exercise.choices.map((item, index) => <button key={item} className={choice === index ? 'selected' : ''} onClick={() => {setChoice(index); if (index === exercise.answer) onComplete();}}>{item}</button>)}</div>}
    {answered && <p className={correct ? 'pass' : 'fail'}>{correct ? '¡Correcto! ' : 'Inténtalo otra vez. '}{exercise.explanation}</p>}
  </section>;
}
