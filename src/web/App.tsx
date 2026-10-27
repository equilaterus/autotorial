import React, {useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import type {ProducedLesson} from '../core/types';
import {ExercisePanel} from './components/ExercisePanel';
import {FPS, LessonComposition, sceneFrames} from './components/LessonComposition';

interface CourseSession {slug: string; title: string; href: string}
interface Course {sessions: CourseSession[]}

export default function App() {
  const [course, setCourse] = useState<Course>();
  const [lesson, setLesson] = useState<ProducedLesson>();
  const [currentScene, setCurrentScene] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const stepTop = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const loadSession = (session: CourseSession) => {
    setError('');
    return fetch(`./${session.href}`).then((item) => item.json()).then((value: ProducedLesson) => {
      setLesson(value);
      setCurrentScene(0);
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
    const showQuestion = () => questionsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    current.addEventListener('ended', showQuestion);
    return () => current.removeEventListener('ended', showQuestion);
  }, [lesson, currentScene]);
  if (error) return <main><h1>No se pudo cargar el curso</h1><pre>{error}</pre></main>;
  if (!course || !lesson) return <main><p>Cargando la lección…</p></main>;
  const scene = lesson.scenes[currentScene];
  const stepLesson = {...lesson, scenes: [scene], audio: lesson.audio.filter((segment) => segment.sceneId === scene.id)};
  const stepExercises = lesson.exercises.filter((item) => item.afterScene === scene.id);
  const questions = stepExercises.filter((item) => item.type === 'multiple-choice' || item.type === 'output-prediction' || item.type === 'code-completion');
  const canContinue = questions.every((item) => completed.has(item.id));
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
  const complete = (id: string) => {
    localStorage.setItem(`autotorial:${lesson.slug}:${id}`, 'complete');
    setCompleted((previous) => new Set(previous).add(id));
  };
  const stepDone = (id: string) => { const own = lesson.exercises.filter((item) => item.afterScene === id && item.type !== 'authorization' && item.type !== 'prompt-copy'); return own.length > 0 && own.every((item) => completed.has(item.id)); };
  return <><header className="app-header">
    <a className="site-logo" href="https://thescienceofcode.com/" target="_blank" rel="noreferrer" aria-label="The Science of Code">
      <img src="https://thescienceofcode.com/images/the-science-of-code.png" alt="The Science of Code" />
    </a>
    <div className="lesson-heading">{lesson.courseTitle ? <h1>{lesson.courseTitle.split('\n').map((line, index) => <span key={line} className={index === 0 ? 'course-kicker' : undefined}>{line}</span>)}</h1> : <h1>{lesson.title}</h1>}</div>
    <div className="session-controls">
      <label className="lesson-picker"><span>Seleccionar lección</span><select value={lesson.slug} onChange={(event) => {const session = course.sessions.find((item) => item.slug === event.target.value); if (session) void loadSession(session);}}>{course.sessions.map((session) => <option key={session.slug} value={session.slug}>{session.title}</option>)}</select></label>
      {course.sessions.length > 1 && <nav className="session-pagination" aria-label="Navegación entre sesiones"><button disabled={sessionIndex <= 0} onClick={() => goToSession(sessionIndex - 1)}>← Anterior</button><span>{sessionIndex + 1} / {course.sessions.length}</span><button disabled={sessionIndex >= course.sessions.length - 1} onClick={() => goToSession(sessionIndex + 1)}>Siguiente →</button></nav>}
    </div>
  </header>
    <main>
      <nav className="scene-nav" aria-label="Partes de la lección">{lesson.scenes.map((item, index) => <button key={item.id} className={index === currentScene ? 'active' : ''} aria-current={index === currentScene ? 'true' : undefined} title={item.title} aria-label={`Parte ${index + 1}: ${item.title}`} onClick={() => go(index)}>{stepDone(item.id) ? '✓' : index + 1}</button>)}</nav>
      <div ref={stepTop} className="step-head"><span className="eyebrow">Parte {currentScene + 1} de {lesson.scenes.length}</span></div>
      <div className="player-shell"><Player ref={player} key={`${lesson.slug}:${scene.id}`} component={LessonComposition} inputProps={{lesson: stepLesson}} durationInFrames={sceneFrames(scene)} compositionWidth={1280} compositionHeight={720} fps={FPS} controls autoPlay={autoPlay} style={{width: '100%', aspectRatio: '16 / 9'}}/></div>
      <p className="subtitle">{scene.narration}</p>
      <div ref={questionsRef} className="step-questions">{stepExercises.map((exercise) => <ExercisePanel key={exercise.id} exercise={exercise} label={exercise.type === 'authorization' ? 'Autorización' : exercise.type === 'prompt-copy' ? 'Elige y prueba' : 'Comprueba lo aprendido'} onComplete={() => complete(exercise.id)}/>)}</div>
      <div className="step-actions">
        <button className="secondary" disabled={currentScene === 0} onClick={() => go(currentScene - 1)}>← Anterior</button>
        {isLast ? <span className={canContinue ? 'assessment-complete' : 'step-hint'}>{canContinue ? '✓ Lección completada' : 'Responde la pregunta para terminar'}</span>
          : <>{!canContinue && <span className="step-hint">Responde la pregunta para continuar</span>}<button className="primary" disabled={!canContinue} onClick={() => go(currentScene + 1, true)}>Continuar →</button></>}
      </div>
    </main></>;
}
