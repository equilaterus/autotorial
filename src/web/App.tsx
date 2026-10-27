import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import type {ProducedLesson} from '../core/types';
import {ExercisePanel} from './components/ExercisePanel';
import {FPS, LessonComposition, sceneFrames} from './components/LessonComposition';

interface CourseSession {slug: string; title: string; href: string; videoHref?: string}
interface Course {sessions: CourseSession[]}

export default function App() {
  const [course, setCourse] = useState<Course>();
  const [lesson, setLesson] = useState<ProducedLesson>();
  const [currentScene, setCurrentScene] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const player = useRef<PlayerRef>(null);
  const finalAssessment = useRef<HTMLDivElement>(null);
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
    const id = window.setInterval(() => {
      const frame = player.current?.getCurrentFrame() ?? 0;
      let offset = 0;
      const index = lesson.scenes.findIndex((scene) => { offset += sceneFrames(scene); return frame < offset; });
      setCurrentScene(Math.max(0, index));
    }, 150);
    return () => clearInterval(id);
  }, [lesson]);
  useEffect(() => {
    if (!lesson) return;
    setCompleted(new Set(lesson.exercises.filter((item) => localStorage.getItem(`autotorial:${lesson.slug}:${item.id}`) === 'complete').map((item) => item.id)));
  }, [lesson]);
  const finalExercise = useMemo(() => {
    if (!lesson) return undefined;
    const lastScene = lesson.scenes.at(-1);
    return lesson.exercises.find((item) => item.afterScene === lastScene?.id);
  }, [lesson]);
  const exercises = useMemo(() => lesson?.exercises.filter((item) => item.id !== finalExercise?.id && item.afterScene === lesson.scenes[currentScene]?.id) ?? [], [lesson, currentScene, finalExercise]);
  useEffect(() => {
    const current = player.current;
    if (!current || !finalExercise) return;
    const showAssessment = () => finalAssessment.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    current.addEventListener('ended', showAssessment);
    return () => current.removeEventListener('ended', showAssessment);
  }, [lesson, finalExercise]);
  if (error) return <main><h1>No se pudo cargar el curso</h1><pre>{error}</pre></main>;
  if (!course || !lesson) return <main><p>Cargando la lección…</p></main>;
  const duration = lesson.scenes.reduce((total, scene) => total + sceneFrames(scene), 0);
  const sessionIndex = course.sessions.findIndex((session) => session.slug === lesson.slug);
  const activeSession = course.sessions[sessionIndex];
  const goToSession = (index: number) => {
    const session = course.sessions[index];
    if (session) void loadSession(session);
  };
  const go = (index: number) => {
    const frame = lesson.scenes.slice(0, index).reduce((total, scene) => total + sceneFrames(scene), 0);
    player.current?.seekTo(frame); setCurrentScene(index);
  };
  const complete = (id: string) => {
    localStorage.setItem(`autotorial:${lesson.slug}:${id}`, 'complete');
    setCompleted((previous) => new Set(previous).add(id));
  };
  return <><header className="app-header">
    <a className="site-logo" href="https://thescienceofcode.com/" target="_blank" rel="noreferrer" aria-label="The Science of Code">
      <img src="https://thescienceofcode.com/images/the-science-of-code.png" alt="The Science of Code" />
    </a>
    <div className="lesson-heading"><span className="brand">Autotorial · Lección interactiva</span><h1>{lesson.title}</h1></div>
    <div className="session-controls">
      <label className="lesson-picker"><span>Seleccionar lección</span><select value={lesson.slug} onChange={(event) => {const session = course.sessions.find((item) => item.slug === event.target.value); if (session) void loadSession(session);}}>{course.sessions.map((session) => <option key={session.slug} value={session.slug}>{session.title}</option>)}</select></label>
      {course.sessions.length > 1 && <nav className="session-pagination" aria-label="Navegación entre sesiones"><button disabled={sessionIndex <= 0} onClick={() => goToSession(sessionIndex - 1)}>← Anterior</button><span>{sessionIndex + 1} / {course.sessions.length}</span><button disabled={sessionIndex >= course.sessions.length - 1} onClick={() => goToSession(sessionIndex + 1)}>Siguiente →</button></nav>}
    </div>
  </header>
    <main><div className="player-shell"><Player key={lesson.slug} ref={player} component={LessonComposition} inputProps={{lesson}} durationInFrames={duration} compositionWidth={1280} compositionHeight={720} fps={FPS} controls style={{width: '100%', aspectRatio: '16 / 9'}}/></div>
      <nav className="scene-nav" aria-label="Navegación entre escenas">{lesson.scenes.map((scene, index) => { const sceneExercises = lesson.exercises.filter((item) => item.afterScene === scene.id); const done = sceneExercises.length > 0 && sceneExercises.every((item) => completed.has(item.id)); return <button key={scene.id} className={index === currentScene ? 'active' : ''} onClick={() => go(index)}><span>{done ? '✓' : index + 1}</span>{scene.title}</button>; })}</nav>
      {exercises.map((exercise) => <ExercisePanel key={exercise.id} exercise={exercise} label={exercise.type === 'authorization' ? 'Autorización' : exercise.type === 'prompt-copy' ? 'Elige y prueba' : undefined} onComplete={() => complete(exercise.id)}/>)}<p className="subtitle">{lesson.scenes[currentScene]?.narration}</p>
      {finalExercise && <div className="final-assessment" ref={finalAssessment}><ExercisePanel exercise={finalExercise} label="Evaluación final" onComplete={() => complete(finalExercise.id)}/>{completed.has(finalExercise.id) && <p className="assessment-complete">✓ Evaluación completada</p>}</div>}
      {activeSession?.videoHref && <section className="video-export"><span className="eyebrow">Versión audiovisual</span><h2>Ver la lección completa</h2><video controls preload="metadata" src={`./${activeSession.videoHref}`}>Tu navegador no puede reproducir este video.</video></section>}
    </main></>;
}
