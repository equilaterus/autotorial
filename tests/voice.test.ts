import {mkdtemp} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {generateNarration} from '../src/voice';
import type {LessonScene} from '../src/core/types';

const scenes: LessonScene[] = [{id: 'intro', type: 'concept', title: 'Intro', body: 'Body', narration: 'Hola, esta es una prueba local.'}];
const hasEspeak = spawnSync('espeak-ng', ['--version'], {stdio: 'ignore'}).status === 0 || spawnSync('espeak', ['--version'], {stdio: 'ignore'}).status === 0;

describe('voice generation', () => {
  it.skipIf(!hasEspeak)('caches local narration by text and configuration hash', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-voice-'));
    const first = await generateNarration(scenes, root, {provider: 'espeak', voice: 'es'});
    const second = await generateNarration(scenes, root, {provider: 'espeak', voice: 'es'});
    expect(first.generated).toBe(1);
    expect(first.segments[0].duration).toBeGreaterThan(0);
    expect(second).toMatchObject({generated: 0, reused: 1});
  });

  it('requires an exact per-batch manifest before paid generation', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'autotorial-eleven-'));
    await expect(generateNarration(scenes, root, {provider: 'elevenlabs', voice: 'voice', model: 'model'})).rejects.toThrow(/explicit approval[\s\S]*--approve-manifest [a-f0-9]{64}/);
  });
});
