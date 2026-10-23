# Lesson format

Every lesson lives at `lessons/<slug>/INDEX.md`. YAML frontmatter holds the searchable metadata; one fenced `aitutorial` JSON block holds deterministic scene and exercise data. Everything else is ordinary author-facing Markdown.

````markdown
---
title: JavaScript Functions
language: es
objectives:
  - Define and call a function
prerequisites:
  - JavaScript expressions
---

# Notes for the educator

```aitutorial
{"scenes":[...],"exercises":[...]}
```
````

Scene types are `concept`, `code`, `diagram`, and `terminal`. Every scene requires `id`, `type`, `title`, and Spanish or otherwise lesson-language `narration`. Type-specific fields are documented by the JSON schema in [`lesson.schema.json`](./lesson.schema.json).

Exercise types are `multiple-choice`, `output-prediction`, and `code-completion`. Choice answers are zero-based indexes. Code tests are `{name, expression, expected}` records; the expression runs after the learner code in an isolated disposable browser frame.
