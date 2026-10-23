# Autotorial

**Autotorial** is a small, reusable harness for animated, narrated, interactive programming lessons. A host repository owns human-readable Markdown lessons; this submodule supplies validation, local TTS, a React/Remotion player, deterministic exercises, static GitHub Pages builds, and optional MP4 export. The technical CLI and content-format identifier remain `aitutorial` for compatibility.

Generated audio, sites, and videos always go under ignored `bin/aitutorial/`. No `.mp4` or image asset is part of this repository.

## Install in a course repository

Requirements: Git, an even-numbered supported Node.js release (20, 22, or 24+), npm, and one local TTS engine. Kokoro is preferred, Piper is the fallback, and `espeak-ng` is supported as the lightweight compatibility fallback used by CI.

```bash
git submodule add <aitutorial-url> lib/aitutorial
npm ci --prefix lib/aitutorial
npm run build --prefix lib/aitutorial
./lib/aitutorial/install.sh --dry-run
./lib/aitutorial/install.sh
```

The installer detects the superproject, creates relative project-only skill links under `.agents/skills/` and `.claude/skills/`, links `.aitutorial/aitutorial`, adds `/bin/` to the host `.gitignore`, and installs a Pages workflow only when that path is free. It never replaces unrelated files. Running it again is safe. The default workflow expects the conventional `lib/aitutorial` submodule path.

Update to an already known tag/ref with `./lib/aitutorial/update.sh <revision>`. The updater refuses dirty submodule/pointer state, fetches tags, checks out the exact commit, and reconciles links; it never commits or pushes. Inspect with `--dry-run` first.

## Author and produce

Only `lessons/<session>/INDEX.md` is required. See [the lesson format](docs/LESSON_FORMAT.md) and the complete samples for [JavaScript: Hola mundo](samples/hello-world-host/lessons/session-0/INDEX.md) and [JavaScript functions](samples/hello-world-host/lessons/session-1/INDEX.md).

```bash
.aitutorial/aitutorial validate session-0
.aitutorial/aitutorial produce session-0
.aitutorial/aitutorial produce session-1
.aitutorial/aitutorial preview --port 4173
```

`produce` validates content, verifies author solutions in a terminated worker, synthesizes each narration segment, measures its actual duration, and writes hash-cached assets. The browser runs learner JavaScript in a sandboxed opaque-origin iframe containing a disposable worker. Its CSP blocks network connections; its timeout destroys the frame and worker. Tests provide deterministic feedback rather than AI grading.

The React player uses the same Remotion composition as video export. It has play/pause/progress controls, previous/next session navigation whenever a course has multiple sessions, scene navigation, Spanish narration/subtitles, contextual practice, a persistent final assessment that is revealed automatically when playback ends, and per-exercise completion in local storage. Sessions appear in slug order, so `session-0` precedes `session-1`.

## Voices

Automatic selection is Kokoro → Piper → espeak. Configure provider details explicitly when needed:

```bash
.aitutorial/aitutorial produce session-1 --voice kokoro --speaker ef_dora
PIPER_MODEL=/path/to/es_ES-model.onnx .aitutorial/aitutorial produce session-1 --voice piper
```

If Piper lives in an isolated environment rather than on `PATH`, set `PIPER_BIN=/path/to/piper` as well. The model path is included in the audio cache key.

The voice verified for the published Spanish samples is Piper 1.8.0 with `es_MX-claude-high`. See the exact working installation, model-download, and production commands in [Voice setup](docs/VOICES.md).

Provider, voice, model, and text are part of every cache key, so one changed segment does not regenerate the rest. Kokoro CLI packaging is not standardized; this MVP expects `kokoro --voice <voice> --output <file> [--model <path>] <text>`. Piper uses its standard stdin interface.

ElevenLabs is optional. Keep the key only in `ELEVENLABS_API_KEY`. The first command intentionally fails after displaying provider/model/voice, new and cached segments, characters/estimated credits, cost availability, and an exact manifest hash. Only an explicit rerun with `--approve-manifest <hash>` authorizes that unchanged batch. CI cannot preapprove future batches.

## Publish and video

```bash
.aitutorial/aitutorial publish
.aitutorial/aitutorial render session-1 --format mp4
```

Publication refuses missing, invalid, stale, or incomplete audio output, then creates a backend-free site at `bin/aitutorial/site/` with relative asset paths suitable for project Pages. It does not deploy, commit, push, or invoke remote Git operations. In the final repository, the deployment script publishes the complete existing root `bin/` snapshot without producing the lesson again.

MP4 rendering is secondary and may download/use a compatible Chromium through Remotion on first use. It writes `bin/aitutorial/video/<session>.mp4`; narration and visuals come from the same produced lesson.

The already-generated root `bin/` snapshot can be published without regenerating it. See [GitHub Pages deployment](docs/DEPLOYMENT.md).

## Agent skills

The four project skills are `create-content`, `produce-session`, `voice`, and `publish-session`. They guide Codex/Claude but delegate all repeatable operations to the CLI. Publishing and paid generation remain explicit user actions.

## Development and acceptance test

```bash
npm ci
npm run check
```

The acceptance test copies the separate sample host to a temporary repository, validates and produces both sessions with real local Spanish WAV narration, checks their exercises and course order, starts and requests the preview, and completes a GitHub Pages production build. Unit tests cover parsing, validation, isolation timeout, audio caching, paid-provider authorization, installation, update planning, and publication gating through the acceptance path.

## MVP limitations

- JavaScript is the only executable exercise runtime; lesson presentation remains language-independent.
- Syntax highlighting is deliberately lightweight, with line reveal/highlight rather than a grammar package.
- The sandbox is intended for short educational snippets, not adversarial untrusted multi-tenant computation.
- Kokoro/Piper model installation is external because models are large and platform-specific; espeak keeps the default workflow fully local and free when they are absent.
- MP4 export needs Remotion's browser/runtime prerequisites and is not exercised by the default acceptance test. ElevenLabs network generation is intentionally not tested or called without user approval.
