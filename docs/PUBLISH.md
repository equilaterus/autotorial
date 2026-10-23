Implement GitHub Pages deployment for AutoTorial.

Use this workflow as a reference:
https://github.com/TheScienceOfCode/thescienceofcode.github.io/blob/master/.github/workflows/gh-pages.yml

### Requirements

1. Create `.github/workflows/gh-pages.yml`.
2. Trigger deployment automatically on pushes to `main`, and support manual execution through `workflow_dispatch`.
3. Build the project using its existing build process, ensuring `bin/` contains the complete, deployable static website.
4. Publish the **contents** of `bin/` (not the directory itself) to the root of the `gh-pages` branch.
5. Use `peaceiris/actions-gh-pages@v4` with:
   - `github_token: ${{ secrets.GITHUB_TOKEN }}`
   - `publish_dir: ./bin`
   - `publish_branch: gh-pages`
   - `keep_files: false`
   - `force_orphan: true`
6. Grant the workflow `contents: write` permission.
7. Use concurrency to prevent overlapping deployments from interfering with each other.

### Branch hygiene

The `gh-pages` branch is exclusively for generated deployment artifacts, including `.mp4` videos and other potentially large files.

- Every deployment must completely replace the previous published content.
- Never preserve obsolete files from earlier deployments.
- Never accumulate deployment history: use an orphan commit so only the latest deployment remains in the branch history.
- Never merge `gh-pages` into `main`.
- Keep generated build outputs and videos out of `main` unless explicitly required.
- Do not use Git LFS for deployment assets.

### Validation

- Verify that the generated site works when hosted at the repository's GitHub Pages URL, including correct asset paths.
- Ensure `.mp4` assets are included and accessible.
- Ensure stale assets disappear after subsequent deployments.
- Ensure the `gh-pages` branch contains only the latest published files and a single reachable commit.
- Document any required one-time GitHub repository settings, including configuring Pages to deploy from the `gh-pages` branch at `/ (root)`.

Keep the implementation minimal. Reuse existing build scripts and avoid introducing unnecessary dependencies or duplicate build logic.