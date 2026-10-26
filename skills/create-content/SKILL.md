---
name: create-content
description: Write or improve a human-readable aitutorial lesson definition and its deterministic exercises.
---

# Create lesson content

Read the existing `lessons/<session>/INDEX.md` and any referenced examples before editing. Use the format in `lib/autotorial/docs/LESSON_FORMAT.md`; keep explanations pedagogically direct, scene narration short, and objectives observable.

Define scene order, Spanish or configured lesson-language narration, visual intent, and exercises. Keep answers and deterministic tests in the lesson. Never invent passing results: after edits delegate validation to the shared CLI:

```bash
.aitutorial/aitutorial validate <session>
```

Do not produce, publish, deploy, commit, or push unless separately requested.
