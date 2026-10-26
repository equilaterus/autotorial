#!/usr/bin/env node
import {mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertPublishable, outputRoot, produceSession, validateSession} from './core/production';
import {buildSite, previewSite} from './core/site';
import {runExerciseInNode} from './core/executor';
import type {ProducedLesson} from './core/types';
import type {VoiceProviderName} from './voice';

const ownDir = path.dirname(fileURLToPath(import.meta.url));
const frameworkRoot = path.resolve(ownDir, '..');

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const options = new Map<string, string | boolean>();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) positional.push(arg);
    else if (arg.includes('=')) {
      const [key, ...value] = arg.slice(2).split('='); options.set(key, value.join('='));
    } else if (argv[index + 1] && !argv[index + 1].startsWith('--')) options.set(arg.slice(2), argv[++index]);
    else options.set(arg.slice(2), true);
  }
  return {positional, options};
}

const usage = `autotorial <command> [session] [options]

Commands:
  validate <session>             Parse and validate a lesson
  produce <session>              Validate, verify solutions, and generate narration
  preview                        Start the interactive local preview
  publish [session]              Gate and build the static GitHub Pages site
  render <session> --format mp4  Render the same Remotion composition to MP4
  exercise <session> <id>        Verify an author solution (diagnostic)

Common options: --host <path>
Voice options: --voice auto|kokoro|piper|espeak|elevenlabs --speaker <id> --model <id>
Paid approval: --approve-manifest <exact-hash>`;

async function renderMp4(hostRoot: string, slug: string): Promise<string> {
  const [{bundle}, {selectComposition, renderMedia}] = await Promise.all([import('@remotion/bundler'), import('@remotion/renderer')]);
  const lessonFile = path.join(outputRoot(hostRoot), 'generated', `${slug}.json`);
  const lesson = JSON.parse(await readFile(lessonFile, 'utf8')) as ProducedLesson;
  await assertPublishable(hostRoot, slug);
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
  const serveUrl = await bundle({entryPoint: path.join(frameworkRoot, 'src', 'remotion', 'index.tsx'), publicDir: path.join(outputRoot(hostRoot), 'public')});
  const inputProps = {lesson};
  const composition = await selectComposition({serveUrl, id: 'Lesson', inputProps, browserExecutable});
  const output = path.join(outputRoot(hostRoot), 'video', `${slug}.mp4`);
  await mkdir(path.dirname(output), {recursive: true});
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: output, inputProps, browserExecutable, enforceAudioTrack: true});
  return output;
}

async function main() {
  const {positional, options} = parseArgs(process.argv.slice(2));
  const [command, slug] = positional;
  const hostRoot = path.resolve(String(options.get('host') || process.cwd()));
  if (!command || options.has('help')) { console.log(usage); return; }
  if (command === 'validate') {
    if (!slug) throw new Error('validate requires a session slug');
    const {issues} = await validateSession(hostRoot, slug);
    for (const issue of issues) console.log(`${issue.severity.toUpperCase()} ${issue.path}: ${issue.message}`);
    if (issues.some((issue) => issue.severity === 'error')) process.exitCode = 1;
    else console.log(`✓ ${slug} is valid`);
    return;
  }
  if (command === 'produce') {
    if (!slug) throw new Error('produce requires a session slug');
    const result = await produceSession(hostRoot, slug, {
      provider: String(options.get('voice') || 'auto') as VoiceProviderName,
      voice: typeof options.get('speaker') === 'string' ? String(options.get('speaker')) : undefined,
      model: typeof options.get('model') === 'string' ? String(options.get('model')) : undefined,
      approvedManifest: typeof options.get('approve-manifest') === 'string' ? String(options.get('approve-manifest')) : undefined,
    });
    console.log(`✓ produced ${slug}: ${result.lesson.scenes.length} scenes, ${result.lesson.exercises.length} exercises`);
    console.log(`✓ narration: ${result.voice.provider}, ${result.voice.generated} generated, ${result.voice.reused} cached`);
    return;
  }
  if (command === 'preview') {
    await assertPublishable(hostRoot, slug);
    const server = await previewSite(frameworkRoot, hostRoot, Number(options.get('port') || 4173), options.has('open'));
    const shutdown = async () => { await server.close(); process.exit(0); };
    process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
    return;
  }
  if (command === 'publish') {
    const lessons = await assertPublishable(hostRoot, slug);
    const output = await buildSite(frameworkRoot, hostRoot, String(options.get('base') || './'));
    console.log(`✓ publication gate passed for ${lessons.length} session(s)`);
    console.log(`✓ static site: ${output}`);
    console.log('No deployment, commit, or push was performed.');
    return;
  }
  if (command === 'exercise') {
    const id = positional[2];
    if (!slug || !id) throw new Error('exercise requires a session and exercise id');
    const lesson = JSON.parse(await readFile(path.join(outputRoot(hostRoot), 'generated', `${slug}.json`), 'utf8')) as ProducedLesson;
    const exercise = lesson.exercises.find((item) => item.id === id);
    if (!exercise || exercise.type !== 'code-completion' || !exercise.solution) throw new Error('No code exercise with an author solution found');
    const result = await runExerciseInNode(exercise.solution, exercise.tests);
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
    return;
  }
  if (command === 'render') {
    if (!slug || options.get('format') !== 'mp4') throw new Error('render requires a session and --format mp4');
    console.log(`✓ rendered ${await renderMp4(hostRoot, slug)}`);
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}

main().catch((error) => { console.error(`autotorial: ${(error as Error).message}`); process.exitCode = 1; });
