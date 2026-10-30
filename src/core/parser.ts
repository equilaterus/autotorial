import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type {LessonDefinition, ValidationIssue} from './types';

const DATA_BLOCK = /```autotorial\s*\n([\s\S]*?)\n```/m;
const PARTS_HEADING = /^## Partes\s*$/m;
const FENCE = /```(scene|exercise)[ \t]*\n([\s\S]*?)\n```/g;

const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Reads one block of prose: the prose is the narration; scene and exercise fences are lifted out of it. */
function readBlocks(file: string, title: string, text: string): {scene: Record<string, unknown>; exercises: Record<string, unknown>[]; narration: string} {
  let scene: Record<string, unknown> = {};
  const exercises: Record<string, unknown>[] = [];
  const prose = text.replace(FENCE, (_match, kind: string, source: string) => {
    let value: unknown;
    try { value = YAML.parse(source) ?? {}; } catch (error) { throw new Error(`${file}: invalid ${kind} block in "${title}": ${(error as Error).message}`); }
    if (kind === 'scene') scene = value as Record<string, unknown>;
    else exercises.push(value as Record<string, unknown>);
    return '';
  });
  const narration = prose.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).join(' ');
  return {scene, exercises, narration};
}

/**
 * Single-source layout. Every `### Title` under `## Partes` is one part (one screen in the player).
 * Without sub-headings the part is one scene: its plain prose is the narration, a ```scene block holds the
 * remaining scene fields and each ```exercise block is an exercise of that scene. With `#### Title`
 * sub-headings each one is a scene of the part, played in order; ```exercise blocks written directly under the
 * `###` heading belong to the part and come after its last scene.
 */
function parseParts(file: string, body: string): {scenes: unknown[]; exercises: unknown[]} {
  const start = body.search(PARTS_HEADING);
  const rest = body.slice(start).replace(PARTS_HEADING, '');
  const end = rest.search(/^## /m);
  const sections = (end < 0 ? rest : rest.slice(0, end)).split(/^### /m).slice(1);
  const scenes: Record<string, unknown>[] = [];
  const exercises: Record<string, unknown>[] = [];
  const counters = new Map<string, number>();
  const addExercises = (afterScene: string, list: Record<string, unknown>[]) => list.forEach((exercise) => {
    const n = (counters.get(afterScene) ?? 0) + 1;
    counters.set(afterScene, n);
    exercises.push({id: `${afterScene}-${n}`, afterScene, ...exercise});
  });
  const headingOf = (section: string) => {
    const newline = section.indexOf('\n');
    return {title: section.slice(0, newline < 0 ? undefined : newline).replace(/^\d+\.\s*/, '').trim(), text: section.slice(newline < 0 ? section.length : newline)};
  };
  for (const section of sections) {
    const {title: partTitle, text} = headingOf(section);
    const subsections = text.split(/^#### /m);
    if (subsections.length === 1) {
      const {scene, exercises: own, narration} = readBlocks(file, partTitle, text);
      const id = String(scene.id ?? slugify(partTitle));
      scenes.push({id, type: 'concept', title: partTitle, ...scene, narration});
      addExercises(id, own);
      continue;
    }
    const group = slugify(partTitle);
    let last = '';
    for (const sub of subsections.slice(1)) {
      const {title, text: subText} = headingOf(sub);
      const {scene, exercises: own, narration} = readBlocks(file, title, subText);
      const id = String(scene.id ?? slugify(title));
      scenes.push({id, type: 'concept', title, ...scene, group, groupTitle: partTitle, narration});
      addExercises(id, own);
      last = id;
    }
    addExercises(last, readBlocks(file, partTitle, subsections[0]).exercises);
  }
  return {scenes, exercises};
}

function parseFrontmatter(source: string): {attributes: Record<string, unknown>; body: string} {
  if (!source.startsWith('---\n')) return {attributes: {}, body: source};
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('Unclosed YAML frontmatter');
  return {
    attributes: (YAML.parse(source.slice(4, end)) ?? {}) as Record<string, unknown>,
    body: source.slice(end + 5),
  };
}

export async function parseLesson(hostRoot: string, slug: string): Promise<{lesson: LessonDefinition; source: string}> {
  const file = path.join(hostRoot, 'lessons', slug, 'INDEX.md');
  const source = await readFile(file, 'utf8');
  const {attributes, body} = parseFrontmatter(source);
  let structured: Record<string, unknown>;
  if (PARTS_HEADING.test(body)) {
    structured = parseParts(file, body);
  } else {
    const match = body.match(DATA_BLOCK);
    if (!match) throw new Error(`${file}: missing a "## Partes" section or \`\`\`autotorial JSON block`);
    try {
      structured = JSON.parse(match[1]) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`${file}: invalid autotorial JSON: ${(error as Error).message}`);
    }
  }
  return {
    source,
    lesson: {
      schemaVersion: 1,
      slug,
      title: String(attributes.title ?? ''),
      ...(typeof attributes.courseTitle === 'string' && attributes.courseTitle.trim() ? {courseTitle: attributes.courseTitle.trim()} : {}),
      language: String(attributes.language ?? 'en'),
      objectives: Array.isArray(attributes.objectives) ? attributes.objectives.map(String) : [],
      prerequisites: Array.isArray(attributes.prerequisites) ? attributes.prerequisites.map(String) : [],
      scenes: (structured.scenes ?? []) as LessonDefinition['scenes'],
      exercises: (structured.exercises ?? []) as LessonDefinition['exercises'],
    },
  };
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateLesson(lesson: LessonDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (path: string, message: string) => issues.push({path, message, severity: 'error'});
  if (!isText(lesson.title)) error('title', 'is required');
  if (!isText(lesson.language)) error('language', 'is required');
  if (!lesson.objectives.length) error('objectives', 'must contain at least one objective');
  if (!Array.isArray(lesson.scenes) || lesson.scenes.length < 1) error('scenes', 'must contain at least one scene');
  const sceneIds = new Set<string>();
  lesson.scenes.forEach((scene, index) => {
    const base = `scenes[${index}]`;
    if (!isText(scene.id)) error(`${base}.id`, 'is required');
    else if (sceneIds.has(scene.id)) error(`${base}.id`, 'must be unique');
    else sceneIds.add(scene.id);
    if (!['concept', 'code', 'diagram', 'terminal', 'visual'].includes(scene.type)) error(`${base}.type`, 'is invalid');
    if (!isText(scene.title)) error(`${base}.title`, 'is required');
    if (!isText(scene.narration)) error(`${base}.narration`, 'is required');
    if (scene.type === 'code' && !isText(scene.code)) error(`${base}.code`, 'is required');
    if (scene.type === 'diagram' && (!scene.nodes?.length || !Array.isArray(scene.edges))) error(base, 'diagram requires nodes and edges');
    if (scene.type === 'visual' && !['timeline', 'browser-download', 'installer', 'extensions', 'open-folder', 'open-chat', 'agent-work', 'browser-page', 'prompt-anatomy', 'model-picker', 'usage-panel', 'frontend', 'backend', 'database', 'docker', 'app-preview', 'prompt-flow', 'choices', 'swagger-mock'].includes(scene.visual)) error(`${base}.visual`, 'is invalid');
    if (scene.type === 'terminal' && (!isText(scene.command) || typeof scene.output !== 'string')) error(base, 'terminal requires command and output');
  });
  const exerciseIds = new Set<string>();
  lesson.exercises.forEach((exercise, index) => {
    const base = `exercises[${index}]`;
    if (!isText(exercise.id)) error(`${base}.id`, 'is required');
    else if (exerciseIds.has(exercise.id)) error(`${base}.id`, 'must be unique');
    else exerciseIds.add(exercise.id);
    if (!sceneIds.has(exercise.afterScene)) error(`${base}.afterScene`, 'must reference an existing scene');
    if (!isText(exercise.prompt) || !isText(exercise.explanation)) error(base, 'prompt and explanation are required');
    if (exercise.type === 'code-completion') {
      if (!isText(exercise.starter) || !exercise.tests?.length) error(base, 'code exercise requires starter code and tests');
      exercise.tests?.forEach((test, testIndex) => {
        if (!isText(test.name) || !isText(test.expression)) error(`${base}.tests[${testIndex}]`, 'name and expression are required');
      });
    } else if (exercise.type === 'multiple-choice' || exercise.type === 'output-prediction') {
      if (exercise.choices?.length < 2 || !Number.isInteger(exercise.answer) || exercise.answer < 0 || exercise.answer >= exercise.choices.length) {
        error(base, 'choice exercise requires choices and a valid zero-based answer');
      }
    } else if (exercise.type === 'prompt-copy') {
      if (!isText(exercise.copyText)) error(base, 'prompt-copy exercise requires copyText');
    } else if (exercise.type === 'authorization') {
      if (!isText(exercise.notice) || !isText(exercise.consentLabel) || !isText(exercise.copyText)) {
        error(base, 'authorization exercise requires notice, consentLabel, and copyText');
      }
    } else if (exercise.type !== 'checkpoint') {
      error(`${base}.type`, 'is invalid');
    }
  });
  return issues;
}

export function contentHash(value: string | object): string {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}
