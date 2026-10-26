Implement the MVP directly. Make reasonable technical decisions autonomously. Prioritize working code and end-to-end validation over elaborate planning. Keep the architecture minimal.

# Build aitutorial — Interactive AI Tutorial Harness

Build `aitutorial`, a reusable, lightweight harness for producing animated, narrated, interactive programming lessons using Codex or Claude Code.

The educational experience should resemble a polished animated programming tutorial, with narration, code visualization, diagrams, and interactive exercises.

**Build a functional end-to-end MVP. Keep it simple. Avoid unnecessary abstractions, orchestration frameworks, and dependencies.**

## 1. Architecture

Stack:

- Node.js + TypeScript for CLI, generation, and validation.
- React + Vite for the interactive website.
- Remotion for reusable animations, playback, and MP4 export.
- Browser-side sandboxed JavaScript execution for coding exercises.
- Kokoro TTS by default; Piper fallback; optional ElevenLabs.
- GitHub Pages for hosting.

The interactive website is the primary output. MP4 export is secondary.

Avoid databases, authentication, backend hosting, and unnecessary infrastructure.

Keep the content format independent of any specific programming language.

## 2. Git submodule integration

`aitutorial` will be installed inside other Git repositories:

```text
course-repo/
├── lib/autotorial/       # Git submodule
├── lessons/
│   └── session-1/
│       ├── INDEX.md
│       └── ...
├── .agents/skills/
└── .claude/skills/
```

Implement two scripts:

### install.sh

- Detect the host repository root.
- Install project-scoped Codex and Claude skills using relative symlinks pointing to `lib/autotorial/skills/`.
- Support repeated executions without side effects.
- Never overwrite unrelated files.
- Detect missing dependencies and provide setup instructions.
- Install or configure the local CLI and GitHub Pages workflow.
- Do not change global agent configurations.
- Support `--dry-run`.

### update.sh

- Safely update the `aitutorial` Git submodule.
- Support selecting a revision or tag.
- Refuse unsafe operations involving uncommitted changes.
- Reconcile installed skill symlinks.
- Never automatically commit, push, or overwrite host files.
- Support `--dry-run`.

Both scripts must work on Linux and macOS. Provide reasonable Windows Git Bash compatibility and diagnostics.

Document the installation and update commands.

## 3. Agent Skills

Create these four skills, each with a valid `SKILL.md` compatible with Codex and Claude Code.

### create-content

Help the educator write or improve lesson definitions.

- Define objectives, explanations, scene order, narration, and exercises.
- Write or update `lessons/<session>/INDEX.md` and optional supporting files.
- Prioritize clear pedagogical explanations.
- Review existing content before modifying it.

### produce-session

Read a lesson definition and produce its interactive experience.

- Validate the content.
- Generate structured scenes.
- Implement animations using reusable components.
- Verify executable code examples.
- Generate or reuse narration and timing metadata.
- Build interactive exercises.
- Run tests and render a local preview.
- Report any errors or warnings.

Never publish automatically.

### voice

Manage narration providers, voice configuration, audio generation, synchronization, caching, and previews.

Default to free local generation.

### publish-session

Publish an already produced and validated session.

- Verify build and test results.
- Produce the GitHub Pages static site.
- Update the course index.
- Optionally export MP4.
- Refuse publication when critical validation fails.
- Never regenerate paid audio.
- Never silently push or deploy without explicit user intent.

All skills must delegate deterministic operations to the shared CLI rather than duplicating implementation logic.

## 4. Lesson format

The host repository defines lessons through:

```text
lessons/session-1/
├── INDEX.md
├── scenes/          # Optional
├── examples/        # Optional
└── exercises/       # Optional
```

Only `INDEX.md` is mandatory.

Use straightforward Markdown with minimal YAML frontmatter and optional JSON files.

Support:

- Title, objectives, prerequisites, and language.
- Ordered scenes and narration.
- Visual instructions.
- Referenced code.
- Exercises with answers, tests, and explanations.

Implement a documented schema, parser, and validator.

Content remains human-readable and editable.

## 5. Animation and player

Implement reusable Remotion scenes:

- `concept`: explanations and titles.
- `code`: syntax-highlighted code with progressive reveals and highlights.
- `diagram`: animated boxes, connections, and arrows.
- `terminal`: simulated terminal playback using verified output.

Use a clean dark visual identity.

Reuse scene components between Remotion video rendering and the React web player.

The player must support:

- Play, pause, and navigation.
- Narration and subtitles.
- Scene synchronization.
- Playback progress.
- Pausing for interactive exercises.
- Local progress persistence.

The export pipeline must create narrated MP4 videos from the same scenes.

## 6. Executable exercises

Implement interactive JavaScript exercises inside the browser.

Students must be able to:

- Read and modify code.
- Execute it.
- See console output or test results.
- Receive explanatory feedback.

Support multiple-choice, output prediction, and code-completion exercises.

Use an isolated, disposable execution environment with timeout and termination controls. Do not execute student code in the main application context or grant access to the host page's origin, credentials, or storage.

Use deterministic tests rather than AI grading.

Prefer a lightweight implementation for the initial MVP. Sandpack may be used if it simplifies the solution.

The published exercises must work on GitHub Pages without a backend.

## 7. Narration

Implement a common TTS provider interface.

**Kokoro:** default, free, local, Spanish support.

**Piper:** local fallback with Spanish voices.

**ElevenLabs:** optional premium provider.

ElevenLabs requires explicit approval **before every generation batch consuming credits**, even when an API key exists.

Before requesting approval, show:

- Provider, model, and voice.
- Segments to generate.
- Character count.
- Estimated credit consumption and cost, if reliably known.
- Segments reused from cache.

Approval must apply only to the exact generation manifest and authorized budget. Changed or additional requests require new approval.

Never silently approve spending through configuration, CI, or unattended execution. Fail safely when interactive approval is unavailable.

Store API keys only in environment variables.

Generate separate audio segments, cache them using content/configuration hashes, and measure actual durations.

Use precise timing metadata when the provider supports it; otherwise synchronize using measured clip durations.

Changing one segment should not regenerate all narration.

## 8. CLI and publication

Provide a CLI callable directly from the submodule:

```bash
aitutorial validate session-1
aitutorial produce session-1
aitutorial preview session-1
aitutorial publish session-1
aitutorial render session-1 --format mp4
```

The CLI must operate on the host repository's `lessons/` directory.

Generate a GitHub Actions workflow for publishing the host repository to GitHub Pages.

Support multiple sessions, a course index, and correct asset paths for project Pages URLs.

Publishing must not depend on a running server.

No automatic remote Git operations.

## 9. Hello World — Functional acceptance test

Create a minimal sample host project, separate from the reusable framework, with:

```text
lessons/session-1/INDEX.md
```

**Topic: JavaScript Functions**

The first lesson must explain:

1. What a function is.
2. How parameters and `return` work.
3. How to call a function.
4. How to modify a function and verify its behavior.

Use a simple example:

```javascript
function multiplicar(a, b) {
  return a * b;
}

console.log(multiplicar(3, 2));
```

The generated lesson must include:

- At least three short animated scenes.
- Spanish narration generated locally.
- Animated code explanations.
- One multiple-choice comprehension question.
- One executable JavaScript exercise where the student implements or fixes `multiplicar(a, b)`.
- Automated tests with clear feedback.
- A working local interactive preview.
- A successful GitHub Pages production build.

This is a **sample lesson used to validate the harness**, not hardcoded functionality or a required part of every course.

## 10. Quality and deliverables

Implement automated tests for the most important behavior:

- Installation, updates, and symlinks.
- Lesson parsing and validation.
- Scene production.
- Exercise execution and isolation.
- Audio caching.
- ElevenLabs authorization.
- Static site build and publication gating.

Provide a README explaining installation, authoring, skills, voice configuration, preview, updates, and deployment.

Document the system's limitations.

Ensure the sample works from a host repository layout, not only from inside `aitutorial`.

**Acceptance criteria:**

A user can add `aitutorial` as a submodule, run `install.sh`, define `lessons/session-1/INDEX.md`, invoke `produce-session`, preview an animated narrated lesson with working exercises, and invoke `publish-session` to prepare publication on the host repository's GitHub Pages.

No paid services are required for the complete default workflow.

Implement the system end to end, run relevant tests, and report what actually works. Do not claim success for untested functionality or unavailable external services.

Prioritize a working, maintainable MVP over feature completeness. Do not add unrelated features.
