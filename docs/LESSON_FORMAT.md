# Lesson format

Every lesson lives at `lessons/<slug>/INDEX.md`. YAML frontmatter holds the searchable metadata; one fenced `autotorial` JSON block holds deterministic scene and exercise data. Everything else is ordinary author-facing Markdown.

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

Scene types are `concept`, `code`, `diagram`, `terminal`, and `visual`. A `visual` scene names an animated template in `visual` (`timeline`, `os-download`, `editor-setup`, `app-preview`, `prompt-flow`, `choices`) and feeds it `items` (`{icon, label, detail}`) and optional `steps`; prefer it over `concept` whenever the lesson shows a procedure. Every scene requires `id`, `type`, `title`, and Spanish or otherwise lesson-language `narration`. Type-specific fields are documented by the JSON schema in [`lesson.schema.json`](./lesson.schema.json).

Exercise types are `multiple-choice`, `output-prediction`, `code-completion`, `prompt-copy`, and `authorization`. Choice answers are zero-based indexes. Code tests are `{name, expression, expected}` records; the expression runs after the learner code in an isolated disposable browser frame. A `prompt-copy` exercise requires `copyText` and can customize `buttonLabel`. An `authorization` exercise additionally requires `notice` and `consentLabel`; its copy button remains disabled until the learner explicitly accepts.

## Multiple sessions

Add one `lessons/<slug>/INDEX.md` directory per session and run `produce` for each one before publishing. The generated course index sorts sessions by filename/slug. The web player shows a session selector and, when the course contains more than one session, explicit **Anterior** and **Siguiente** controls.

Use sortable slugs such as `session-0`, `session-1`, and `session-2` when sequence matters. The sample course starts with `session-0` (JavaScript: Hola mundo) and continues with `session-1` (Funciones en JavaScript).
