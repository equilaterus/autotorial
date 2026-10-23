import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import type {ProducedLesson} from '../core/types';
import {ExercisePanel} from './components/ExercisePanel';
import {FPS, LessonComposition, sceneFrames} from './components/LessonComposition';

interface Course {sessions: Array<{slug: string; title: string; href: string}>}

export default function App() {
  const [course, setCourse] = useState<Course>();
  const [lesson, setLesson] = useState<ProducedLesson>();
  const [currentScene, setCurrentScene] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const player = useRef<PlayerRef>(null);
  useEffect(() => { fetch('./course.json').then((value) => value.json()).then((value: Course) => {setCourse(value); if (value.sessions[0]) return fetch(`./${value.sessions[0].href}`).then((item) => item.json()).then(setLesson);}).catch((failure) => setError(String(failure))); }, []);
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
    setCompleted(new Set(lesson.exercises.filter((item) => localStorage.getItem(`aitutorial:${lesson.slug}:${item.id}`) === 'complete').map((item) => item.id)));
  }, [lesson]);
  const exercise = useMemo(() => lesson?.exercises.find((item) => item.afterScene === lesson.scenes[currentScene]?.id), [lesson, currentScene]);
  useEffect(() => { if (exercise) player.current?.pause(); }, [exercise]);
  if (error) return <main><h1>No se pudo cargar el curso</h1><pre>{error}</pre></main>;
  if (!course || !lesson) return <main><p>Cargando la lección…</p></main>;
  const duration = lesson.scenes.reduce((total, scene) => total + sceneFrames(scene), 0);
  const go = (index: number) => {
    const frame = lesson.scenes.slice(0, index).reduce((total, scene) => total + sceneFrames(scene), 0);
    player.current?.seekTo(frame); setCurrentScene(index);
  };
  return <><header><div><span className="brand">aitutorial</span><h1>{lesson.title}</h1></div><select value={lesson.slug} onChange={(event) => {const session = course.sessions.find((item) => item.slug === event.target.value); if (session) fetch(`./${session.href}`).then((item) => item.json()).then(setLesson);}}>{course.sessions.map((session) => <option key={session.slug} value={session.slug}>{session.title}</option>)}</select></header>
    <main><div className="player-shell"><Player ref={player} component={LessonComposition} inputProps={{lesson}} durationInFrames={duration} compositionWidth={1280} compositionHeight={720} fps={FPS} controls style={{width: '100%', aspectRatio: '16 / 9'}}/></div>
      <nav className="scene-nav" aria-label="Scene navigation">{lesson.scenes.map((scene, index) => { const sceneExercises = lesson.exercises.filter((item) => item.afterScene === scene.id); const done = sceneExercises.length > 0 && sceneExercises.every((item) => completed.has(item.id)); return <button key={scene.id} className={index === currentScene ? 'active' : ''} onClick={() => go(index)}><span>{done ? '✓' : index + 1}</span>{scene.title}</button>; })}</nav>
      {exercise && <ExercisePanel key={exercise.id} exercise={exercise} onComplete={() => {localStorage.setItem(`aitutorial:${lesson.slug}:${exercise.id}`, 'complete'); setCompleted((previous) => new Set(previous).add(exercise.id)); player.current?.play();}}/>}<p className="subtitle">{lesson.scenes[currentScene]?.narration}</p>
    </main></>;
}
