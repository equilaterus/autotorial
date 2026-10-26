import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type {LessonDefinition, ValidationIssue} from './types';

const DATA_BLOCK = /```autotorial\s*\n([\s\S]*?)\n```/m;

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
  const match = body.match(DATA_BLOCK);
  if (!match) throw new Error(`${file}: missing \`\`\`autotorial JSON block`);
  let structured: Record<string, unknown>;
  try {
    structured = JSON.parse(match[1]) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`${file}: invalid autotorial JSON: ${(error as Error).message}`);
  }
  return {
    source,
    lesson: {
      schemaVersion: 1,
      slug,
      title: String(attributes.title ?? ''),
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
    if (!['concept', 'code', 'diagram', 'terminal'].includes(scene.type)) error(`${base}.type`, 'is invalid');
    if (!isText(scene.title)) error(`${base}.title`, 'is required');
    if (!isText(scene.narration)) error(`${base}.narration`, 'is required');
    if (scene.type === 'code' && !isText(scene.code)) error(`${base}.code`, 'is required');
    if (scene.type === 'diagram' && (!scene.nodes?.length || !Array.isArray(scene.edges))) error(base, 'diagram requires nodes and edges');
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
    } else {
      error(`${base}.type`, 'is invalid');
    }
  });
  return issues;
}

export function contentHash(value: string | object): string {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}
