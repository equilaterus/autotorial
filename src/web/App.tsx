import React, {useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {staticFile} from 'remotion';
import type {Exercise, ProducedLesson} from '../core/types';
import {ExercisePanel} from './components/ExercisePanel';
import {FPS, LessonComposition, sceneFrames} from './components/LessonComposition';
import {SiteFooter} from './components/SiteFooter';
import {Home, type ContentEntry} from './components/Home';
import {groupParts} from './parts';

interface CourseSession {slug: string; title: string; href: string}
interface Course {title?: string; contents?: ContentEntry[]; sessions: CourseSession[]}

const readRoute = () => window.location.hash.replace(/^#\/?/, '');
const navigate = (slug: string) => { window.location.hash = slug ? `#/${slug}` : '#/'; };

/** The black bar shared by the contents page and the lessons. */
function Bar({title, children}: {title: string; children?: React.ReactNode}) {
  return <header className="site-bar"><div className="site-bar-inner">
    <a className="site-logo" href="https://thescienceofcode.com/" aria-label="The Science of Code">
      <img src="https://thescienceofcode.com/images/the-science-of-code.png" alt="The Science of Code" />
    </a>
    <h1 className="bar-title"><a href="#/">{title}</a></h1>
    {children}
  </div></header>;
}

const isGate = (item: Exercise) => item.type !== 'authorization' && item.type !== 'prompt-copy';

export default function App() {
  const [course, setCourse] = useState<Course>();
  const [route, setRoute] = useState(readRoute);
  const [lesson, setLesson] = useState<ProducedLesson>();
  const [currentPart, setCurrentPart] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [reached, setReached] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const stepTop = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const loadSession = (session: CourseSession) => {
    setError('');
    return fetch(`./${session.href}`, {cache: 'no-cache'}).then((item) => item.json()).then((value: ProducedLesson) => {
      const saved = Number(localStorage.getItem(`autotorial:${value.slug}:reached`)) || 0;
      const resume = Math.min(Math.max(0, saved), groupParts(value).length - 1);
      setLesson(value);
      setReached(resume);
      setCurrentPart(resume);
    }).catch((failure) => setError(String(failure)));
  };
  useEffect(() => { fetch('./course.json', {cache: 'no-cache'}).then((value) => value.json()).then((value: Course) => setCourse(value)).catch((failure) => setError(String(failure))); }, []);
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!course || !route) return;
    const session = course.sessions.find((item) => item.slug === route);
    if (!session) { setError(`No existe la lección «${route}».`); return; }
    setError('');
    if (lesson?.slug !== route) void loadSession(session);
  }, [course, route]);
  useEffect(() => {
    if (!lesson) return;
    setCompleted(new Set(lesson.exercises.filter((item) => localStorage.getItem(`autotorial:${lesson.slug}:${item.id}`) === 'complete').map((item) => item.id)));
  }, [lesson]);
  useEffect(() => {
    if (!lesson) return;
    const next = groupParts(lesson)[currentPart + 1];
    if (!next) return;
    const warmed = next.scenes.flatMap((item) => lesson.audio.filter((segment) => segment.sceneId === item.id)).map((segment) => { const element = new Audio(staticFile(segment.src)); element.preload = 'auto'; return element; });
    return () => warmed.forEach((element) => { element.removeAttribute('src'); element.load(); });
  }, [lesson, currentPart]);
  useEffect(() => {
    const current = player.current;
    if (!current || !lesson) return;
    const scenes = groupParts(lesson)[currentPart]?.scenes ?? [];
    const onFrame = (event: {detail: {frame: number}}) => {
      let offset = 0;
      let index = scenes.length - 1;
      for (let i = 0; i < scenes.length; i++) { offset += sceneFrames(scenes[i]); if (event.detail.frame < offset) { index = i; break; } }
      setSubIndex((previous) => previous === index ? previous : index);
    };
    current.addEventListener('frameupdate', onFrame);
    return () => current.removeEventListener('frameupdate', onFrame);
  }, [lesson, currentPart]);
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
  }, [lesson, currentPart]);
  if (error) return <main><h1>No se pudo cargar el curso</h1><pre>{error}</pre></main>;
  if (!course) return <main><p>Cargando…</p></main>;
  const courseTitle = course.title ?? (lesson?.courseTitle ?? 'Cursos').replace('\n', ' ');
  document.title = courseTitle;
  if (!route) return <><Bar title={courseTitle}/><Home title={courseTitle} contents={course.contents ?? course.sessions.map((item, index) => ({number: index + 1, title: item.title, description: '', slug: item.slug, available: true}))}/><SiteFooter/></>;
  if (!lesson || lesson.slug !== route) return <><Bar title={courseTitle}/><main><p>Cargando la lección…</p></main><SiteFooter/></>;
  const parts = groupParts(lesson);
  const part = parts[currentPart];
  const sceneIds = new Set(part.scenes.map((item) => item.id));
  const stepLesson = {...lesson, scenes: part.scenes, audio: lesson.audio.filter((segment) => sceneIds.has(segment.sceneId))};
  const stepFrames = part.scenes.reduce((total, item) => total + sceneFrames(item), 0);
  const stepExercises = lesson.exercises.filter((item) => sceneIds.has(item.afterScene));
  const gates = stepExercises.filter(isGate);
  const canContinue = gates.every((item) => completed.has(item.id));
  const pendingCheck = stepExercises.some((item) => item.type === 'checkpoint' && !completed.has(item.id));
  const isLast = currentPart === parts.length - 1;
  const sessionIndex = course.sessions.findIndex((session) => session.slug === lesson.slug);
  const goToSession = (index: number) => {
    const session = course.sessions[index];
    if (session) navigate(session.slug);
  };
  const go = (index: number, play = false) => {
    setAutoPlay(play);
    setCurrentPart(index);
    setSubIndex(0);
    stepTop.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const advance = () => {
    const next = currentPart + 1;
    if (next > reached) { setReached(next); localStorage.setItem(`autotorial:${lesson.slug}:reached`, String(next)); }
    go(next, true);
  };
  const complete = (id: string) => {
    localStorage.setItem(`autotorial:${lesson.slug}:${id}`, 'complete');
    setCompleted((previous) => new Set(previous).add(id));
  };
  const stepDone = (index: number) => { const ids = new Set(parts[index].scenes.map((item) => item.id)); const own = lesson.exercises.filter((item) => ids.has(item.afterScene) && isGate(item)); return own.length > 0 ? own.every((item) => completed.has(item.id)) : index < reached; };
  const doneCount = parts.filter((item, index) => stepDone(index)).length;
  const resetProgress = () => {
    Object.keys(localStorage).filter((key) => key.startsWith(`autotorial:${lesson.slug}:`)).forEach((key) => localStorage.removeItem(key));
    setCompleted(new Set());
    setReached(0);
    setResetCount((count) => count + 1);
    setConfirmReset(false);
    go(0);
  };
  const options = course.contents ?? course.sessions.map((item, index) => ({number: index + 1, title: item.title, description: '', slug: item.slug, available: true}));
  return <><Bar title={courseTitle}>
    <div className="bar-lessons">
      <select aria-label="Seleccionar lección" value={lesson.slug} onChange={(event) => navigate(event.target.value)}>{options.map((entry) => <option key={entry.slug} value={entry.slug} disabled={!entry.available}>{entry.number}. {entry.title}{entry.available ? '' : ' (próximamente)'}</option>)}</select>
      {course.sessions.length > 1 && <nav className="session-pagination" aria-label="Navegación entre sesiones"><button disabled={sessionIndex <= 0} onClick={() => goToSession(sessionIndex - 1)} aria-label="Lección anterior">←</button><button disabled={sessionIndex >= course.sessions.length - 1} onClick={() => goToSession(sessionIndex + 1)} aria-label="Lección siguiente">→</button></nav>}
    </div>
  </Bar>
    <main>
      <a className="back-link" href="#/">← Contenidos</a>
      <p className="mobile-title">{courseTitle}</p>
      <div className="lesson-layout">
      <aside className="parts" aria-label="Partes de la lección">
        <div className="parts-head"><span className="eyebrow">Parte {currentPart + 1} de {parts.length}</span><div className="parts-progress" role="progressbar" aria-valuemin={0} aria-valuemax={parts.length} aria-valuenow={doneCount} aria-label="Partes completadas"><i style={{width: `${(doneCount / parts.length) * 100}%`}}/></div></div>
        <ol>{parts.map((item, index) => <li key={item.id}><button type="button" className={`part${index === currentPart ? ' active' : ''}${stepDone(index) ? ' done' : ''}`} aria-current={index === currentPart ? 'true' : undefined} onClick={() => go(index)}><span className="part-num">{stepDone(index) ? '✓' : index + 1}</span><span className="part-title">{item.title}</span></button></li>)}</ol>
      </aside>
      <div ref={stepTop} className="lesson-main">
      <div className="player-shell"><Player ref={player} key={`${lesson.slug}:${part.id}`} component={LessonComposition} inputProps={{lesson: stepLesson}} durationInFrames={stepFrames} compositionWidth={1280} compositionHeight={720} fps={FPS} controls autoPlay={autoPlay} style={{width: '100%', aspectRatio: '16 / 9'}}/></div>
      <p className="subtitle">{(part.scenes[subIndex] ?? part.scenes[0]).narration}</p>
      <div ref={questionsRef} className="step-questions">{stepExercises.map((exercise) => <ExercisePanel key={`${exercise.id}:${resetCount}`} exercise={exercise} done={completed.has(exercise.id)} label={exercise.type === 'authorization' ? 'Autorización' : exercise.type === 'prompt-copy' ? 'Elige y prueba' : exercise.type === 'checkpoint' ? 'Tu turno' : 'Comprueba lo aprendido'} onComplete={() => complete(exercise.id)}/>)}</div>
      <div className="step-actions">
        <button className="secondary" disabled={currentPart === 0} onClick={() => go(currentPart - 1)}>← Anterior</button>
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
