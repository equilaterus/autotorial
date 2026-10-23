---
name: publish-session
description: Gate and build a previously produced aitutorial session for GitHub Pages, with optional MP4 export.
---

# Publish a session

Publishing means preparing output, not silently deploying it. Use the deterministic gate and builder:

```bash
.aitutorial/aitutorial publish [session]
```

The command refuses stale, invalid, or missing production artifacts and writes the static site to ignored `bin/aitutorial/site/`. Only when explicitly requested, export video with `render <session> --format mp4`. Never regenerate paid narration, commit, push, or trigger a deployment without explicit user intent.
