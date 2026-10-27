import {spawn, spawnSync} from 'node:child_process';
import {appendFile, cp, mkdir, mkdtemp, readFile, readdir, stat, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterAll, describe, expect, it} from 'vitest';

const framework = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(framework, 'dist', 'cli.js');
const hasEspeak = spawnSync('espeak-ng', ['--version'], {stdio: 'ignore'}).status === 0 || spawnSync('espeak', ['--version'], {stdio: 'ignore'}).status === 0;
let preview: ReturnType<typeof spawn> | undefined;
afterAll(() => preview?.kill('SIGTERM'));

function run(args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8', timeout: 30_000, stdio: 'pipe'});
  if (result.error || result.status !== 0) throw new Error(`${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function runFailure(args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8', timeout: 30_000, stdio: 'pipe'});
  expect(result.status).not.toBe(0);
  return `${result.stdout}${result.stderr}`;
}

describe.skipIf(!hasEspeak)('Hello World host acceptance', () => {
  it('produces narration, verifies exercises, serves preview, and builds static Pages output', async () => {
    const host = await mkdtemp(path.join(os.tmpdir(), 'autotorial-acceptance-'));
    await cp(path.join(framework, 'samples', 'hello-world-host', 'lessons'), path.join(host, 'lessons'), {recursive: true});
    expect(run(['validate', 'session-0', '--host', host])).toContain('is valid');
    expect(run(['validate', 'session-1', '--host', host])).toContain('is valid');
    expect(run(['produce', 'session-0', '--host', host, '--voice', 'espeak'])).toContain('3 scenes, 2 exercises');
    expect(run(['produce', 'session-1', '--host', host, '--voice', 'espeak'])).toContain('4 scenes, 2 exercises');
    expect(run(['exercise', 'session-0', 'write-message', '--host', host])).toContain('"passed": true');
    expect(run(['exercise', 'session-1', 'fix-multiplicar', '--host', host])).toContain('"passed": true');
    await mkdir(path.join(host, 'bin', 'autotorial', 'video'), {recursive: true});
    await writeFile(path.join(host, 'bin', 'autotorial', 'video', 'session-1.mp4'), 'test-video');
    expect(run(['publish', '--host', host])).toContain('publication gate passed');
    const course = JSON.parse(await readFile(path.join(host, 'bin', 'autotorial', 'site', 'course.json'), 'utf8'));
    expect(course.sessions.map((session: {slug: string}) => session.slug)).toEqual(['session-0', 'session-1']);
    expect((await stat(path.join(host, 'bin', 'autotorial', 'site', 'index.html'))).size).toBeGreaterThan(100);
    expect((await stat(path.join(host, 'bin', 'autotorial', 'site', 'video', 'session-1.mp4'))).size).toBeGreaterThan(0);
    expect(course.sessions.find((session: {slug: string}) => session.slug === 'session-1').videoHref).toBe('video/session-1.mp4');
    const assetsDir = path.join(host, 'bin', 'autotorial', 'site', 'assets');
    const scripts = (await readdir(assetsDir)).filter((file) => file.endsWith('.js'));
    const publishedJavaScript = (await Promise.all(scripts.map((file) => readFile(path.join(assetsDir, file), 'utf8')))).join('\n');
    expect(publishedJavaScript).toContain('Comprueba lo aprendido');
    expect(publishedJavaScript).not.toContain('Versión audiovisual');
    expect(publishedJavaScript).toContain('Anterior');
    expect(publishedJavaScript).toContain('Lección siguiente');
    expect(publishedJavaScript).toContain('remotion_staticBase');
    const helloLesson = JSON.parse(await readFile(path.join(host, 'bin', 'autotorial', 'generated', 'session-0.json'), 'utf8'));
    const functionsLesson = JSON.parse(await readFile(path.join(host, 'bin', 'autotorial', 'generated', 'session-1.json'), 'utf8'));
    expect(helloLesson.audio).toHaveLength(3);
    expect(functionsLesson.audio).toHaveLength(4);
    expect(await readFile(path.join(host, 'bin', 'autotorial', 'public', helloLesson.audio[0].src), {encoding: 'ascii', flag: 'r'}).then((text) => text.slice(0, 4))).toBe('RIFF');

    const port = 43129;
    preview = spawn(process.execPath, [cli, 'preview', '--host', host, '--port', String(port)], {stdio: 'ignore'});
    let response: Response | undefined;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { response = await fetch(`http://127.0.0.1:${port}/`); if (response.ok) break; } catch { /* server still starting */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(response?.ok).toBe(true);
    expect(await response!.text()).toContain('<div id="root"></div>');
    await appendFile(path.join(host, 'lessons', 'session-1', 'INDEX.md'), '\n<!-- stale edit -->\n');
    expect(runFailure(['publish', '--host', host])).toContain('changed since production');
  });
});
