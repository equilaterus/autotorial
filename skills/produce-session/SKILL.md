---
name: produce-session
description: Validate and produce an interactive autotorial session with scenes, narration, and verified exercises.
---

# Produce a session

Read the lesson first. Do not duplicate parsing, test execution, voice caching, or build logic in the agent. Delegate deterministic work to:

```bash
.autotorial/autotorial validate <session>
.autotorial/autotorial produce <session>
.autotorial/autotorial preview
```

Report CLI errors and warnings faithfully. Confirm the local preview URL and explain that generated artifacts are under ignored `bin/autotorial/`. Never publish automatically.
