---
name: save-assets
description: Save or restore the generated lesson assets that Git ignores (narration audio, produced lesson JSON, MP4) in the `lessons` branch, as a save state. Use for save state, backup, restore, or "don't lose the narration" requests.
---

# Save and restore generated assets

Producing a lesson generates files under the ignored `bin/autotorial/`: narration audio, the produced lesson JSON and the exported MP4. They are expensive to recreate, so keep a snapshot in the orphan branch `lessons` with the installed project command:

```bash
.autotorial/save-assets            # snapshot bin/autotorial into the lessons branch and push it
.autotorial/save-assets --no-push  # commit locally only
.autotorial/save-assets --no-video # skip the MP4 (about two thirds of the size)
.autotorial/save-assets status     # show what the branch holds (manifest.json)
.autotorial/save-assets restore    # put the saved snapshot back into bin/autotorial
```

Only the audio that the produced lessons use is saved. The branch contains `autotorial/` (the files, with the same paths as `bin/autotorial/`), `manifest.json` (date, source commit, lesson source hashes) and a README. Lesson sources stay on the main branch.

After `restore`, run `.autotorial/autotorial produce <session>`, which reuses the saved narration without regenerating it, then `publish`. The branch is not the deployment: never use it for GitHub Pages and do not create workflows for it; deploy only with `.autotorial/deploy-pages`.

Save pushes a new branch to the remote, so do it only when the user asks. If `.autotorial/save-assets` is missing, run `lib/autotorial/install.sh`.
