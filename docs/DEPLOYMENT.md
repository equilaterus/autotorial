# GitHub Pages deployment

The final repository stores its already-generated deployable website directly
under the ignored root `bin/` directory. Deployment does not run the AutoTorial
CLI, synthesize speech, render video, rebuild the lesson, or copy from
`fixtures/`.

To inspect the exact snapshot that will be published without contacting the
remote repository:

```bash
./scripts/deploy-pages.sh --check-only
```

This checks the existing `bin/` snapshot, including at least one `.mp4` under
`bin/video/`, and verifies that `index.html` has project-Page-safe relative
asset paths. Missing files stop the deployment instead of regenerating them.

To publish that local snapshot:

```bash
./scripts/deploy-pages.sh
```

The script publishes the contents of `bin/` as the branch root and force-pushes
a new orphan commit to `gh-pages`. As a result, every deployment replaces all
previously published files, stale remote assets disappear, and the branch has
only one reachable commit. Generated files remain outside the source branch
and Git LFS is not used. Never merge `gh-pages` into the source branch.

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
deliberately initiated by this local script from the final repository that
contains the complete local `bin/` snapshot.
