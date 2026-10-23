import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {parseLesson, validateLesson} from '../src/core/parser';

describe('lesson parsing and validation', () => {
  it('parses frontmatter and the embedded structured block', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'aitutorial-parser-'));
    await mkdir(path.join(root, 'lessons', 'one'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'one', 'INDEX.md'), `---
title: Tiny lesson
language: en
objectives: [Learn one thing]
prerequisites: []
---
\n\`\`\`aitutorial
{"scenes":[{"id":"intro","type":"concept","title":"Intro","body":"Body","narration":"Hello"}],"exercises":[]}
\`\`\`
`);
    const {lesson} = await parseLesson(root, 'one');
    expect(lesson.title).toBe('Tiny lesson');
    expect(lesson.scenes[0].type).toBe('concept');
    expect(validateLesson(lesson)).toEqual([]);
  });

  it('reports invalid references and malformed choice answers', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'aitutorial-invalid-'));
    await mkdir(path.join(root, 'lessons', 'bad'), {recursive: true});
    await writeFile(path.join(root, 'lessons', 'bad', 'INDEX.md'), `---
title: Bad
language: en
objectives: [Find errors]
---
\n\`\`\`aitutorial
{"scenes":[{"id":"intro","type":"concept","title":"Intro","body":"Body","narration":"Hello"}],"exercises":[{"id":"q","type":"multiple-choice","prompt":"Question","explanation":"Why","afterScene":"missing","choices":["one"],"answer":4}]}
\`\`\`
`);
    const {lesson} = await parseLesson(root, 'bad');
    expect(validateLesson(lesson).map((issue) => issue.path)).toEqual(expect.arrayContaining(['exercises[0].afterScene', 'exercises[0]']));
  });
});
