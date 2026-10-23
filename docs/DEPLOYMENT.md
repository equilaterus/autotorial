# GitHub Pages deployment

The deployable lesson is already generated under
`fixtures/hello-world-host/bin/aitutorial/`. Deployment does not run the
AutoTorial CLI, synthesize speech, render video, or rebuild the lesson.

To inspect the exact snapshot that will be published without contacting the
remote repository:

```bash
./scripts/deploy-pages.sh --prepare-only
```

This replaces the ignored root `bin/` directory with the contents of the
existing `site/` directory, copies every existing `.mp4` from `video/`, and
checks that the site has project-Page-safe relative asset paths. Missing site
files or videos stop the deployment instead of regenerating them.

To publish that local snapshot:

```bash
./scripts/deploy-pages.sh
```

The script force-pushes a new orphan commit to `gh-pages`. As a result, every
deployment replaces all previous files, stale assets disappear, and the branch
has only one reachable commit. Generated files remain outside the source
branch and Git LFS is not used. Never merge `gh-pages` into the source branch.

## One-time repository setting

In **Settings → Pages**, select **Deploy from a branch**, choose `gh-pages`, and
choose `/ (root)`. The site will then be available at:

```text
https://equilaterus.github.io/autotorial/
```

The current lesson video will be available at:

```text
https://equilaterus.github.io/autotorial/video/session-1.mp4
```

The repository currently uses `dev` and has no remote `main` branch. A hosted
GitHub Actions run also cannot read ignored local files, so deployment is
deliberately initiated by this local script rather than by regenerating the
lesson in CI.
