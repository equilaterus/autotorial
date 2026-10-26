import {access, mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {contentHash, parseLesson, validateLesson} from './parser';
import {runExerciseInNode} from './executor';
import type {ProducedLesson} from './types';
import {generateNarration, type VoiceOptions} from '../voice';

export const outputRoot = (hostRoot: string) => path.join(hostRoot, 'bin', 'autotorial');

async function writeCourseIndex(hostRoot: string): Promise<void> {
  const generatedDir = path.join(outputRoot(hostRoot), 'generated');
  const publicDir = path.join(outputRoot(hostRoot), 'public');
  await mkdir(publicDir, {recursive: true});
  let files: string[] = [];
  try { files = (await readdir(generatedDir)).filter((file) => file.endsWith('.json')).sort(); } catch { /* first lesson */ }
  const sessions = [];
  for (const file of files) {
    const lesson = JSON.parse(await readFile(path.join(generatedDir, file), 'utf8')) as ProducedLesson;
    sessions.push({slug: lesson.slug, title: lesson.title, language: lesson.language, objectives: lesson.objectives, href: `lessons/${file}`});
  }
  await mkdir(path.join(publicDir, 'lessons'), {recursive: true});
  for (const file of files) {
    await writeFile(path.join(publicDir, 'lessons', file), await readFile(path.join(generatedDir, file)));
  }
  await writeFile(path.join(publicDir, 'course.json'), JSON.stringify({schemaVersion: 1, sessions}, null, 2));
}

export async function validateSession(hostRoot: string, slug: string) {
  const {lesson} = await parseLesson(hostRoot, slug);
  return {lesson, issues: validateLesson(lesson)};
}

export async function produceSession(hostRoot: string, slug: string, voice: VoiceOptions): Promise<{lesson: ProducedLesson; voice: {generated: number; reused: number; provider: string}}> {
  const {lesson, source} = await parseLesson(hostRoot, slug);
  const issues = validateLesson(lesson);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length) throw new Error(errors.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
  for (const exercise of lesson.exercises) {
    if (exercise.type === 'code-completion' && exercise.solution) {
      const result = await runExerciseInNode(exercise.solution, exercise.tests);
      if (!result.passed) throw new Error(`Author solution for ${exercise.id} does not pass: ${JSON.stringify(result.tests)}`);
    }
  }
  for (let index = 0; index < lesson.scenes.length; index++) {
    const scene = lesson.scenes[index];
    if (scene.type !== 'terminal' || !/^node(?:\s|$)/.test(scene.command)) continue;
    const priorCode = lesson.scenes.slice(0, index).reverse().find((candidate) => candidate.type === 'code' && (!candidate.language || /^(js|javascript)$/i.test(candidate.language)));
    if (priorCode?.type === 'code') {
      const execution = await runExerciseInNode(priorCode.code, []);
      if (execution.output.join('\n').trim() !== scene.output.trim()) {
        throw new Error(`Terminal scene ${scene.id} expected ${JSON.stringify(scene.output)} but verified ${JSON.stringify(execution.output.join('\n'))}`);
      }
    }
  }
  const root = outputRoot(hostRoot);
  const publicDir = path.join(root, 'public');
  const generatedDir = path.join(root, 'generated');
  await mkdir(generatedDir, {recursive: true});
  const narration = await generateNarration(lesson.scenes, publicDir, voice);
  const durationByScene = new Map(narration.segments.map((segment) => [segment.sceneId, segment.duration]));
  const produced: ProducedLesson = {
    ...lesson,
    producedAt: new Date().toISOString(),
    sourceHash: contentHash(source),
    scenes: lesson.scenes.map((scene) => ({...scene, duration: scene.duration ?? Math.max(3, (durationByScene.get(scene.id) ?? 1) + 0.6)})),
    audio: narration.segments,
    totalDuration: lesson.scenes.reduce((total, scene) => total + (scene.duration ?? Math.max(3, (durationByScene.get(scene.id) ?? 1) + 0.6)), 0),
  };
  await writeFile(path.join(generatedDir, `${slug}.json`), JSON.stringify(produced, null, 2));
  await writeCourseIndex(hostRoot);
  return {lesson: produced, voice: narration};
}

export async function assertPublishable(hostRoot: string, slug?: string): Promise<ProducedLesson[]> {
  const generatedDir = path.join(outputRoot(hostRoot), 'generated');
  let files: string[];
  try { files = (await readdir(generatedDir)).filter((file) => file.endsWith('.json')); }
  catch { throw new Error('Nothing has been produced. Run `autotorial produce <session>` first.'); }
  if (slug && !files.includes(`${slug}.json`)) throw new Error(`Session ${slug} has not been produced`);
  if (!files.length) throw new Error('No produced sessions found');
  const lessons: ProducedLesson[] = [];
  for (const file of files) {
    const produced = JSON.parse(await readFile(path.join(generatedDir, file), 'utf8')) as ProducedLesson;
    const current = await parseLesson(hostRoot, produced.slug);
    const issues = validateLesson(current.lesson).filter((issue) => issue.severity === 'error');
    if (issues.length) throw new Error(`${produced.slug} fails validation`);
    if (contentHash(current.source) !== produced.sourceHash) throw new Error(`${produced.slug} changed since production; run produce again`);
    for (const segment of produced.audio) await access(path.join(outputRoot(hostRoot), 'public', segment.src));
    lessons.push(produced);
  }
  await writeCourseIndex(hostRoot);
  return lessons;
}
