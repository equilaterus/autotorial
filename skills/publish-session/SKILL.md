---
name: publish-session
description: Gate, build, and explicitly deploy a previously produced autotorial session to GitHub Pages with the repository script, with optional MP4 export. Use for publish, deployment, Pages, or MP4 requests.
---

# Publish a session

Publishing means preparing output, not silently deploying it. Use the deterministic gate and builder:

```bash
.autotorial/autotorial publish [session]
```

The command refuses stale, invalid, or missing production artifacts and writes the static site to ignored `bin/autotorial/site/`. Only when explicitly requested, export video with `render <session> --format mp4`. Never regenerate paid narration, commit, push, or trigger a deployment without explicit user intent.

Deploy only through the installed project command:

```bash
.autotorial/deploy-pages --check-only
.autotorial/deploy-pages
```

The first command validates the complete local snapshot. The second force-pushes that snapshot as a single orphan commit on `gh-pages`, so run it only when the user explicitly asks to deploy.

Never create, generate, edit, recommend, or invoke a GitHub Actions workflow for AutoTorial deployment. Do not replace the deployment script with another action, CI job, build command, or ad hoc Git sequence. If `.autotorial/deploy-pages` is missing, run `lib/autotorial/install.sh`; if the script fails, report the failure instead of inventing another deployment path. Existing unrelated workflows belong to the host repository and must remain untouched.
