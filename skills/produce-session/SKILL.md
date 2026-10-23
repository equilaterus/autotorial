---
name: produce-session
description: Validate and produce an interactive aitutorial session with scenes, narration, and verified exercises.
---

# Produce a session

Read the lesson first. Do not duplicate parsing, test execution, voice caching, or build logic in the agent. Delegate deterministic work to:

```bash
.aitutorial/aitutorial validate <session>
.aitutorial/aitutorial produce <session>
.aitutorial/aitutorial preview
```

Report CLI errors and warnings faithfully. Confirm the local preview URL and explain that generated artifacts are under ignored `bin/aitutorial/`. Never publish automatically.
