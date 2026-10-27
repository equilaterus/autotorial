import React, {useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import type {Exercise, ProducedLesson} from '../core/types';
import {ExercisePanel} from './components/ExercisePanel';
import {FPS, LessonComposition, sceneFrames} from './components/LessonComposition';
import {SiteFooter} from './components/SiteFooter';

interface CourseSession {slug: string; title: string; href: string}
interface Course {sessions: CourseSession[]}

const isGate = (item: Exercise) => item.type !== 'authorization' && item.type !== 'prompt-copy';

export default function App() {
  const [course, setCourse] = useState<Course>();
  const [lesson, setLesson] = useState<ProducedLesson>();
  const [currentScene, setCurrentScene] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [reached, setReached] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const stepTop = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const loadSession = (session: CourseSession) => {
    setError('');
    return fetch(`./${session.href}`).then((item) => item.json()).then((value: ProducedLesson) => {
      const saved = Number(localStorage.getItem(`autotorial:${value.slug}:reached`)) || 0;
      const resume = Math.min(Math.max(0, saved), value.scenes.length - 1);
      setLesson(value);
      setReached(resume);
      setCurrentScene(resume);
    }).catch((failure) => setError(String(failure)));
  };
  useEffect(() => { fetch('./course.json').then((value) => value.json()).then((value: Course) => {setCourse(value); if (value.sessions[0]) return loadSession(value.sessions[0]);}).catch((failure) => setError(String(failure))); }, []);
  useEffect(() => {
    if (!lesson) return;
    setCompleted(new Set(lesson.exercises.filter((item) => localStorage.getItem(`autotorial:${lesson.slug}:${item.id}`) === 'complete').map((item) => item.id)));
  }, [lesson]);
  useEffect(() => {
    const current = player.current;
    if (!current) return;
    let finished = false;
    const showQuestion = () => questionsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    const onEnded = () => { finished = true; showQuestion(); };
    const onPlay = () => { finished = false; };
    const onFullscreen = (event: {detail: {isFullscreen: boolean}}) => { if (!event.detail.isFullscreen && finished) window.setTimeout(showQuestion, 150); };
    current.addEventListener('ended', onEnded);
    current.addEventListener('play', onPlay);
    current.addEventListener('fullscreenchange', onFullscreen);
    return () => { current.removeEventListener('ended', onEnded); current.removeEventListener('play', onPlay); current.removeEventListener('fullscreenchange', onFullscreen); };
  }, [lesson, currentScene]);
  if (error) return <main><h1>No se pudo cargar el curso</h1><pre>{error}</pre></main>;
  if (!course || !lesson) return <main><p>Cargando la lección…</p></main>;
  const scene = lesson.scenes[currentScene];
  const stepLesson = {...lesson, scenes: [scene], audio: lesson.audio.filter((segment) => segment.sceneId === scene.id)};
  const stepExercises = lesson.exercises.filter((item) => item.afterScene === scene.id);
  const gates = stepExercises.filter(isGate);
  const canContinue = gates.every((item) => completed.has(item.id));
  const pendingCheck = stepExercises.some((item) => item.type === 'checkpoint' && !completed.has(item.id));
  const isLast = currentScene === lesson.scenes.length - 1;
  const sessionIndex = course.sessions.findIndex((session) => session.slug === lesson.slug);
  const goToSession = (index: number) => {
    const session = course.sessions[index];
    if (session) void loadSession(session);
  };
  const go = (index: number, play = false) => {
    setAutoPlay(play);
    setCurrentScene(index);
    stepTop.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const advance = () => {
    const next = currentScene + 1;
    if (next > reached) { setReached(next); localStorage.setItem(`autotorial:${lesson.slug}:reached`, String(next)); }
    go(next, true);
  };
  const complete = (id: string) => {
    localStorage.setItem(`autotorial:${lesson.slug}:${id}`, 'complete');
    setCompleted((previous) => new Set(previous).add(id));
  };
  const stepDone = (id: string, index: number) => { const own = lesson.exercises.filter((item) => item.afterScene === id && isGate(item)); return own.length > 0 ? own.every((item) => completed.has(item.id)) : index < reached; };
  const doneCount = lesson.scenes.filter((item, index) => stepDone(item.id, index)).length;
  const resetProgress = () => {
    Object.keys(localStorage).filter((key) => key.startsWith(`autotorial:${lesson.slug}:`)).forEach((key) => localStorage.removeItem(key));
    setCompleted(new Set());
    setReached(0);
    setResetCount((count) => count + 1);
    setConfirmReset(false);
    go(0);
  };
  const titleLines = lesson.courseTitle ? lesson.courseTitle.split('\n') : [lesson.title];
  return <><header className="site-bar"><div className="site-bar-inner">
    <a className="site-logo" href="https://thescienceofcode.com/" aria-label="The Science of Code">
      <img src="https://thescienceofcode.com/images/the-science-of-code.png" alt="The Science of Code" />
    </a>
    <h1 className="bar-title">{titleLines.length > 1 && <span className="kicker">{titleLines[0]}</span>}<span>{titleLines[titleLines.length - 1]}</span></h1>
    <div className="bar-lessons">
      <select aria-label="Seleccionar lección" value={lesson.slug} onChange={(event) => {const session = course.sessions.find((item) => item.slug === event.target.value); if (session) void loadSession(session);}}>{course.sessions.map((session) => <option key={session.slug} value={session.slug}>{session.title}</option>)}</select>
      {course.sessions.length > 1 && <nav className="session-pagination" aria-label="Navegación entre sesiones"><button disabled={sessionIndex <= 0} onClick={() => goToSession(sessionIndex - 1)} aria-label="Lección anterior">←</button><span>{sessionIndex + 1} / {course.sessions.length}</span><button disabled={sessionIndex >= course.sessions.length - 1} onClick={() => goToSession(sessionIndex + 1)} aria-label="Lección siguiente">→</button></nav>}
    </div>
  </div></header>
    <main>
      <p className="mobile-title">{titleLines.join(' ')}</p>
      <div className="lesson-layout">
      <aside className="parts" aria-label="Partes de la lección">
        <div className="parts-head"><span className="eyebrow">Parte {currentScene + 1} de {lesson.scenes.length}</span><div className="parts-progress" role="progressbar" aria-valuemin={0} aria-valuemax={lesson.scenes.length} aria-valuenow={doneCount} aria-label="Partes completadas"><i style={{width: `${(doneCount / lesson.scenes.length) * 100}%`}}/></div></div>
        <ol>{lesson.scenes.map((item, index) => <li key={item.id}><button type="button" className={`part${index === currentScene ? ' active' : ''}${stepDone(item.id, index) ? ' done' : ''}`} aria-current={index === currentScene ? 'true' : undefined} onClick={() => go(index)}><span className="part-num">{stepDone(item.id, index) ? '✓' : index + 1}</span><span className="part-title">{item.title}</span></button></li>)}</ol>
      </aside>
      <div ref={stepTop} className="lesson-main">
      <div className="player-shell"><Player ref={player} key={`${lesson.slug}:${scene.id}`} component={LessonComposition} inputProps={{lesson: stepLesson}} durationInFrames={sceneFrames(scene)} compositionWidth={1280} compositionHeight={720} fps={FPS} controls autoPlay={autoPlay} style={{width: '100%', aspectRatio: '16 / 9'}}/></div>
      <p className="subtitle">{scene.narration}</p>
      <div ref={questionsRef} className="step-questions">{stepExercises.map((exercise) => <ExercisePanel key={`${exercise.id}:${resetCount}`} exercise={exercise} done={completed.has(exercise.id)} label={exercise.type === 'authorization' ? 'Autorización' : exercise.type === 'prompt-copy' ? 'Elige y prueba' : exercise.type === 'checkpoint' ? 'Tu turno' : 'Comprueba lo aprendido'} onComplete={() => complete(exercise.id)}/>)}</div>
      <div className="step-actions">
        <button className="secondary" disabled={currentScene === 0} onClick={() => go(currentScene - 1)}>← Anterior</button>
        {isLast ? <span className={canContinue ? 'assessment-complete' : 'step-hint'}>{canContinue ? '✓ Lección completada' : pendingCheck ? 'Marca la casilla cuando lo hayas hecho' : 'Responde la pregunta para terminar'}</span>
          : <>{!canContinue && <span className="step-hint">{pendingCheck ? 'Marca la casilla cuando lo hayas hecho para continuar' : 'Responde la pregunta para continuar'}</span>}<button className="primary" disabled={!canContinue} onClick={() => advance()}>Continuar →</button></>}
      </div>
      <div className="reset-row"><button type="button" className="reset-button" onClick={() => setConfirmReset(true)}>Reiniciar progreso</button></div>
      </div>
      </div>
    </main>
    {confirmReset && <div className="modal-backdrop" role="presentation" onClick={() => setConfirmReset(false)} onKeyDown={(event) => {if (event.key === 'Escape') setConfirmReset(false);}}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="reset-title">¿Reiniciar el progreso?</h2>
        <p>Se borrará el progreso guardado en este navegador para esta lección y volverás a la parte 1.</p>
        <div className="modal-actions"><button type="button" className="secondary" autoFocus onClick={() => setConfirmReset(false)}>Cancelar</button><button type="button" className="danger-button" onClick={resetProgress}>Sí, reiniciar</button></div>
      </div>
    </div>}
    <SiteFooter/></>;
}
