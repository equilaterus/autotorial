import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {parseLesson, validateLesson} from '../src/core/parser';

describe('lesson parsing and validation', () => {
  it('parses frontmatter and the embedded structured block', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-parser-'));
    await mkdir(path.join(root, 'lessons', 'one'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'one', 'INDEX.md'), `---
title: Tiny lesson
language: en
objectives: [Learn one thing]
prerequisites: []
---
\n\`\`\`autotorial
{"scenes":[{"id":"intro","type":"concept","title":"Intro","body":"Body","narration":"Hello"}],"exercises":[]}
\`\`\`
`);
    const {lesson} = await parseLesson(root, 'one');
    expect(lesson.title).toBe('Tiny lesson');
    expect(lesson.scenes[0].type).toBe('concept');
    expect(validateLesson(lesson)).toEqual([]);
  });

  it('reports invalid references and malformed choice answers', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-invalid-'));
    await mkdir(path.join(root, 'lessons', 'bad'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'bad', 'INDEX.md'), `---
title: Bad
language: en
objectives: [Find errors]
---
\n\`\`\`autotorial
{"scenes":[{"id":"intro","type":"concept","title":"Intro","body":"Body","narration":"Hello"}],"exercises":[{"id":"q","type":"multiple-choice","prompt":"Question","explanation":"Why","afterScene":"missing","choices":["one"],"answer":4}]}
\`\`\`
`);
    const {lesson} = await parseLesson(root, 'bad');
    expect(validateLesson(lesson).map((issue) => issue.path)).toEqual(expect.arrayContaining(['exercises[0].afterScene', 'exercises[0]']));
  });

  it('validates copy prompts and explicit authorization data', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-copy-'));
    await mkdir(path.join(root, 'lessons', 'copy'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'copy', 'INDEX.md'), `---
title: Copy prompts
language: es
objectives: [Copiar un prompt]
---
\n\`\`\`autotorial
{"scenes":[{"id":"intro","type":"concept","title":"Intro","body":"Body","narration":"Hola"}],"exercises":[{"id":"copy","type":"prompt-copy","prompt":"Copia","explanation":"Listo","afterScene":"intro","copyText":"Haz un cambio"},{"id":"allow","type":"authorization","prompt":"Autoriza","explanation":"Listo","afterScene":"intro","notice":"Puede instalar software","consentLabel":"Acepto","copyText":"Construye el proyecto"}]}
\`\`\`
`);
    const {lesson} = await parseLesson(root, 'copy');
    expect(validateLesson(lesson)).toEqual([]);
  });

  it('reads the single-source layout: prose is narration, scene and exercise blocks belong to their section', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-parts-'));
    await mkdir(path.join(root, 'lessons', 'parts'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'parts', 'INDEX.md'), `---
title: Partes
language: es
objectives: [Aprender]
---

# Notas

## Partes

### 1. Primera parte

Hola. Esto se escucha.

Y esto también.

\`\`\`scene
type: concept
body: Cuerpo
\`\`\`

\`\`\`exercise
type: multiple-choice
prompt: ¿Listo?
choices: [Sí, No]
answer: 0
explanation: Claro.
\`\`\`

### 2. Segunda parte

Adiós.

## Notas finales

Ignorado.
`);
    const {lesson} = await parseLesson(root, 'parts');
    expect(lesson.scenes.map((scene) => [scene.id, scene.title, scene.narration])).toEqual([
      ['primera-parte', 'Primera parte', 'Hola. Esto se escucha. Y esto también.'],
      ['segunda-parte', 'Segunda parte', 'Adiós.'],
    ]);
    expect(lesson.exercises).toMatchObject([{id: 'primera-parte-1', afterScene: 'primera-parte', answer: 0}]);
    expect(validateLesson(lesson)).toEqual([]);
  });

  it('groups #### scenes into one part and attaches part-level exercises to its last scene', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-group-'));
    await mkdir(path.join(root, 'lessons', 'grouped'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'grouped', 'INDEX.md'), `---
title: Grupos
language: es
objectives: [Aprender]
---

## Partes

### 1. Tema

#### Uno

Primera.

\`\`\`exercise
type: checkpoint
prompt: Hecho
explanation: Bien
\`\`\`

#### Dos

Segunda.

### 2. Aparte

Sola.
`);
    const {lesson} = await parseLesson(root, 'grouped');
    expect(lesson.scenes.map((scene) => [scene.id, scene.group, scene.groupTitle])).toEqual([
      ['uno', 'tema', 'Tema'],
      ['dos', 'tema', 'Tema'],
      ['aparte', undefined, undefined],
    ]);
    expect(lesson.exercises).toMatchObject([{id: 'uno-1', afterScene: 'uno'}]);
    expect(validateLesson(lesson)).toEqual([]);
  });
});
