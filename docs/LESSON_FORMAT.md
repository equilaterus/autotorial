# Lesson format

Every lesson lives at `lessons/<slug>/INDEX.md`. YAML frontmatter holds the searchable metadata. The lesson itself is written once, , , , , , in reading order, under a `## Partes` heading:

````markdown
## Partes

### 1. Instálalo y ábrelo

Ahora instálalo. En Windows, abre el instalador… (this prose is the narration that is spoken)

```scene
id: install-editor        # optional; defaults to a slug of the title
type: visual
visual: installer
items: [...]
```

```exercise
id: quiz-install          # optional; defaults to <scene id>-<n>
type: multiple-choice
prompt: ¿Cómo instalas Visual Studio Code en macOS?
choices: [Arrastrándolo a Aplicaciones, Escribiendo sudo dnf install]
answer: 0
explanation: En macOS se arrastra la aplicación a Aplicaciones.
```
````

Each `###` heading is one scene and, in the player, one screen. The title loses its leading number, plain prose becomes `narration`, the `scene` block holds the remaining scene fields (`type` defaults to `concept`) and every `exercise` block is an exercise of that scene (`afterScene` is implied). Anything after the next `##` heading is free author notes. Nothing is defined twice.

Images live in `lessons/<slug>/assets/` and are copied to the site when the lesson is produced. Reference them by file name: a visual item takes `image`, and `cards` (`{label, detail, image}`) feeds the catalog shown by `app-preview` and `frontend`.

The older layout still works: one fenced `autotorial` JSON block with `scenes` and `exercises`, as below.

````markdown
---
title: JavaScript Functions
courseTitle: "Aprende JavaScript"  # optional page heading; use \n for a small first line
language: es
objectives:
  - Define and call a function
prerequisites:
  - JavaScript expressions
---

# Notes for the educator

```autotorial
{"scenes":[...],"exercises":[...]}
```
````

`courseTitle` is optional. When present it is the page heading instead of the lesson title (a `\n` makes the first line a small kicker); the lesson title still appears in the lesson picker. The page never embeds the exported MP4; it is only a deployment artifact.

Scene types are `concept`, `code`, `diagram`, `terminal`, and `visual`. A `visual` scene names an animated template in `visual` (`timeline`, `browser-download`, `installer`, `extensions`, `open-folder`, `open-chat`, `agent-work`, `app-preview`, `prompt-flow`, `choices`) and feeds it `items` (`{icon, label, detail, steps}`) and optional `steps`; prefer it over `concept` whenever the lesson shows a procedure. Every scene requires `id`, `type`, `title`, and Spanish or otherwise lesson-language `narration`. Type-specific fields are documented by the JSON schema in [`lesson.schema.json`](./lesson.schema.json).

Exercise types are `multiple-choice`, `output-prediction`, `code-completion`, `prompt-copy`, `authorization`, and `checkpoint`. Choice answers are zero-based indexes. Code tests are `{name, expression, expected}` records; the expression runs after the learner code in an isolated disposable browser frame. A `prompt-copy` exercise requires `copyText` and can customize `buttonLabel`. An `authorization` exercise additionally requires `notice` and `consentLabel`; its copy button remains disabled until the learner explicitly accepts. A `checkpoint` is a single «I did it» checkbox for steps where the learner must install or do something (`prompt` is the checkbox text, `explanation` the confirmation). Choice questions and checkpoints must be completed before the player enables Continue, and completed parts turn green. Progress is stored in the browser and a «Reiniciar progreso» button clears it.

## Multiple sessions

Add one `lessons/<slug>/INDEX.md` directory per session and run `produce` for each one before publishing. The generated course index sorts sessions by filename/slug. The web player shows a session selector and, when the course contains more than one session, explicit **Anterior** and **Siguiente** controls.

Use sortable slugs such as `session-0`, `session-1`, and `session-2` when sequence matters. The sample course starts with `session-0` (JavaScript: Hola mundo) and continues with `session-1` (Funciones en JavaScript).
