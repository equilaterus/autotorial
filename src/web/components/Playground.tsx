import React, {useEffect, useRef, useState} from 'react';
import type {PlaygroundExercise} from '../../core/types';
import type {ExecutionResult} from '../../core/executor';
import {CodeEditor} from './CodeEditor';

const CDN = 'https://cdn.jsdelivr.net';
const REACT = `${CDN}/npm/react@18.3.1/umd/react.production.min.js`;
const REACT_DOM = `${CDN}/npm/react-dom@18.3.1/umd/react-dom.production.min.js`;
const SUCRASE = `${CDN}/npm/sucrase@3.35.0/+esm`;

// The preview is a sandboxed frame: Sucrase turns the JSX into JavaScript and React renders the App component.
const FRAME = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${CDN}; style-src 'unsafe-inline'; img-src data:">
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#222;background:#fff;font-size:17px}button{font:inherit;padding:4px 12px;margin:2px}.error{color:#c0392b;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:14px}</style>
<div id="root"></div><div id="error" class="error"></div>
<script src="${REACT}"></script><script src="${REACT_DOM}"></script>
<script type="module">
import { transform } from '${SUCRASE}';
const root = ReactDOM.createRoot(document.getElementById('root'));
const errorBox = document.getElementById('error');
class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? React.createElement('div', { className: 'error' }, 'Error: ' + this.state.error.message) : this.props.children; }
}
let version = 0;
function run(code) {
  errorBox.textContent = '';
  try {
    const js = transform(code, { transforms: ['jsx'], jsxRuntime: 'classic', production: true }).code;
    const App = new Function('React', 'useState', 'useEffect', js + '\\n;return typeof App === "function" ? App : null;')(React, React.useState, React.useEffect);
    if (!App) throw new Error('Falta un componente llamado App');
    version += 1;
    ReactDOM.flushSync(() => root.render(React.createElement(Boundary, { key: version }, React.createElement(App))));
    return null;
  } catch (error) {
    ReactDOM.flushSync(() => root.render(null));
    errorBox.textContent = 'Error: ' + error.message;
    return error.message;
  }
}
window.escribir = async (texto, posicion = 0) => {
  const campo = document.querySelectorAll('input, textarea')[posicion];
  if (!campo) throw new Error('No encontré el campo de texto');
  const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(campo), 'value').set;
  set.call(campo, texto);
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 20));
};
window.clic = async (texto) => {
  const boton = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(texto));
  if (!boton) throw new Error('No encontré el botón ' + texto);
  boton.click();
  await new Promise((resolve) => setTimeout(resolve, 20));
};
addEventListener('message', async (event) => {
  const message = event.data;
  if (message.type === 'run') parent.postMessage({ type: 'ran', id: message.id, error: run(message.code) }, '*');
  if (message.type === 'check') {
    const error = run(message.code);
    const results = [];
    for (const check of message.checks) {
      if (error) { results.push({ name: check.name, expected: check.expected, passed: false, error }); continue; }
      try {
        // Checks may be async: clic() waits for React to redraw after the click.
        const actual = await new Function('return (async () => (' + check.expression + '))();')();
        results.push({ name: check.name, expected: check.expected, actual, passed: JSON.stringify(actual) === JSON.stringify(check.expected) });
      } catch (failure) {
        results.push({ name: check.name, expected: check.expected, passed: false, error: String(failure && failure.message || failure) });
      }
    }
    parent.postMessage({ type: 'checked', id: message.id, results }, '*');
  }
});
parent.postMessage({ type: 'ready' }, '*');
</script>`;

const TIMEOUT_MS = 4000;

/** Editor on the left, the running component on the right; it re-renders while the learner types. */
export function PlaygroundPanel({exercise, onComplete, label}: {exercise: PlaygroundExercise; onComplete: () => void; label: string}) {
  const [code, setCode] = useState(exercise.starter);
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<ExecutionResult>();
  const [error, setError] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const timer = useRef<number>();
  const completed = useRef(onComplete);
  completed.current = onComplete;

  const post = (message: object) => {
    window.clearTimeout(timer.current);
    // A program that never ends freezes the preview: replace the frame and tell the learner.
    timer.current = window.setTimeout(() => {
      setReady(false);
      setFrameKey((key) => key + 1);
      setError('El código tardó demasiado y se detuvo. ¿Hay un bucle que no termina?');
    }, TIMEOUT_MS);
    frame.current?.contentWindow?.postMessage(message, '*');
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === 'ready') setReady(true);
      if (message?.type === 'ran') { window.clearTimeout(timer.current); setError(''); }
      if (message?.type === 'checked') {
        window.clearTimeout(timer.current);
        const next = {passed: message.results.every((test: {passed: boolean}) => test.passed), output: [], tests: message.results};
        setResult(next);
        if (next.passed) completed.current();
      }
    };
    window.addEventListener('message', receive);
    return () => { window.removeEventListener('message', receive); window.clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    setResult(undefined);
    if (!ready) return;
    const wait = window.setTimeout(() => post({type: 'run', code}), 350);
    return () => window.clearTimeout(wait);
  }, [code, ready]);

  return <section className="exercise" aria-label={label}><span className="eyebrow">{label}</span>{exercise.title ? <><h2>{exercise.title}</h2><p className="exercise-description">{exercise.prompt}</p></> : <h2>{exercise.prompt}</h2>}
    <div className="playground">
      <CodeEditor value={code} onChange={setCode} language="javascript" label="Editor de React"/>
      <iframe key={frameKey} ref={frame} className="playground-preview" sandbox="allow-scripts" srcDoc={FRAME} title="Así se ve"/>
    </div>
    <button onClick={() => post({type: 'check', code, checks: exercise.checks})} disabled={!ready}>{ready ? 'Comprobar' : 'Preparando la vista previa…'}</button>
    {error && <p className="fail">{error}</p>}
    {result && <ul className="test-results">{result.tests.map((test) => <li key={test.name} className={test.passed ? 'pass' : 'fail'}>{test.passed ? '✓' : '×'} {test.name}{!test.passed && (test.error ? ` — ${test.error}` : ` — esperado ${JSON.stringify(test.expected)}, recibido ${JSON.stringify(test.actual)}`)}</li>)}</ul>}
    {result?.passed && <p className="pass">¡Correcto! {exercise.explanation}</p>}
  </section>;
}
