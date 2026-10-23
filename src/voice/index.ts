import {createHash} from 'node:crypto';
import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {spawn, spawnSync} from 'node:child_process';
import path from 'node:path';
import type {AudioSegment, LessonScene} from '../core/types';

export type VoiceProviderName = 'auto' | 'kokoro' | 'piper' | 'espeak' | 'elevenlabs';

export interface VoiceOptions {
  provider: VoiceProviderName;
  voice?: string;
  model?: string;
  approvedManifest?: string;
}

export interface VoiceResult {
  segments: AudioSegment[];
  generated: number;
  reused: number;
  provider: string;
}

interface SegmentRequest {
  sceneId: string;
  text: string;
  cacheKey: string;
  extension: 'wav' | 'mp3';
  output: string;
}

const exists = async (file: string) => access(file, constants.R_OK).then(() => true, () => false);
const hasCommand = (command: string) => (spawnSync(command, ['--help'], {stdio: 'ignore'}).error as NodeJS.ErrnoException | undefined)?.code !== 'ENOENT';

function chosenProvider(requested: VoiceProviderName): Exclude<VoiceProviderName, 'auto'> {
  if (requested !== 'auto') return requested;
  if (hasCommand('kokoro')) return 'kokoro';
  if ((process.env.PIPER_BIN || hasCommand('piper')) && process.env.PIPER_MODEL) return 'piper';
  if (hasCommand('espeak-ng') || hasCommand('espeak')) return 'espeak';
  throw new Error('No local TTS provider found. Install Kokoro (recommended), Piper, or espeak-ng.');
}

function run(command: string, args: string[], input?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: [input === undefined ? 'ignore' : 'pipe', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}: ${stderr.trim()}`)));
    if (input !== undefined) child.stdin?.end(input);
  });
}

async function wavDuration(file: string): Promise<number> {
  const data = await readFile(file);
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${file} is not a WAV file`);
  }
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;
  while (offset + 8 <= data.length) {
    const id = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (id === 'fmt ' && size >= 12) byteRate = data.readUInt32LE(offset + 8 + 8);
    if (id === 'data') { dataSize = size; break; }
    offset += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize) throw new Error(`Cannot measure WAV duration for ${file}`);
  return dataSize / byteRate;
}

async function mediaDuration(file: string): Promise<number> {
  if (file.endsWith('.wav')) return wavDuration(file);
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], {encoding: 'utf8'});
  const value = Number(result.stdout.trim());
  if (result.status !== 0 || !Number.isFinite(value)) throw new Error('ffprobe is required to measure ElevenLabs MP3 clips');
  return value;
}

function exactManifest(provider: string, model: string, voice: string, requests: SegmentRequest[]): string {
  return createHash('sha256').update(JSON.stringify({provider, model, voice, segments: requests.map(({sceneId, text, cacheKey}) => ({sceneId, text, cacheKey}))})).digest('hex');
}

async function generateLocal(provider: string, request: SegmentRequest, voice: string, model: string): Promise<void> {
  if (provider === 'espeak') {
    const command = hasCommand('espeak-ng') ? 'espeak-ng' : 'espeak';
    await run(command, ['-v', voice || 'es', '-s', '155', '-w', request.output, request.text]);
    return;
  }
  if (provider === 'piper') {
    const piperModel = model || process.env.PIPER_MODEL;
    if (!piperModel) throw new Error('Piper requires --model or PIPER_MODEL pointing to a Spanish voice model');
    await run(process.env.PIPER_BIN || 'piper', ['--model', piperModel, '--output_file', request.output], request.text);
    return;
  }
  const kokoroModel = model || process.env.KOKORO_MODEL || '';
  const args = ['--voice', voice || process.env.KOKORO_VOICE || 'ef_dora', '--output', request.output];
  if (kokoroModel) args.push('--model', kokoroModel);
  args.push(request.text);
  await run('kokoro', args);
}

async function generateElevenLabs(request: SegmentRequest, voice: string, model: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required');
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'xi-api-key': apiKey},
    body: JSON.stringify({text: request.text, model_id: model}),
  });
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}: ${await response.text()}`);
  await writeFile(request.output, Buffer.from(await response.arrayBuffer()));
}

export async function generateNarration(scenes: LessonScene[], publicDir: string, options: VoiceOptions): Promise<VoiceResult> {
  const provider = chosenProvider(options.provider);
  const voice = options.voice || (provider === 'elevenlabs' ? 'EXAVITQu4vr4xnSDxMaL' : provider === 'kokoro' ? 'ef_dora' : 'es');
  const model = options.model || (provider === 'elevenlabs' ? 'eleven_multilingual_v2' : provider === 'piper' ? process.env.PIPER_MODEL || '' : provider === 'kokoro' ? process.env.KOKORO_MODEL || 'default' : 'default');
  const audioDir = path.join(publicDir, 'audio');
  await mkdir(audioDir, {recursive: true});
  const extension = provider === 'elevenlabs' ? 'mp3' : 'wav';
  const requests: SegmentRequest[] = scenes.map((scene) => {
    const cacheKey = createHash('sha256').update(JSON.stringify({text: scene.narration, provider, voice, model})).digest('hex');
    return {sceneId: scene.id, text: scene.narration, cacheKey, extension, output: path.join(audioDir, `${cacheKey}.${extension}`)};
  });
  const uncached: SegmentRequest[] = [];
  for (const request of requests) if (!await exists(request.output)) uncached.push(request);

  if (provider === 'elevenlabs' && uncached.length) {
    const manifest = exactManifest(provider, model, voice, uncached);
    const characters = uncached.reduce((total, segment) => total + segment.text.length, 0);
    if (options.approvedManifest !== manifest) {
      throw new Error([
        'ElevenLabs generation requires explicit approval for this exact batch.',
        `Provider: ElevenLabs; model: ${model}; voice: ${voice}`,
        `New segments: ${uncached.length}; characters/estimated credits: ${characters}; cached segments: ${requests.length - uncached.length}`,
        'Cost: unknown (depends on the account plan).',
        `Re-run with --approve-manifest ${manifest}`,
      ].join('\n'));
    }
  }

  for (const request of uncached) {
    if (provider === 'elevenlabs') await generateElevenLabs(request, voice, model);
    else await generateLocal(provider, request, voice, model);
  }

  const segments: AudioSegment[] = [];
  for (const request of requests) {
    segments.push({
      sceneId: request.sceneId,
      src: `audio/${path.basename(request.output)}`,
      duration: await mediaDuration(request.output),
      provider,
      cacheKey: request.cacheKey,
    });
  }
  return {segments, generated: uncached.length, reused: requests.length - uncached.length, provider};
}
