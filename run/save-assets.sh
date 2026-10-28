#!/usr/bin/env bash
# Saves the generated lesson assets that Git ignores (narration audio, produced lesson JSON, MP4) in an
# orphan branch, so a lesson can be restored without paying for the narration and the render again.
#
#   save-assets.sh [save]  [--no-push] [--no-video]   snapshot bin/autotorial into the branch
#   save-assets.sh restore                            put the saved snapshot back into bin/autotorial
#   save-assets.sh status                             show what the branch holds
set -euo pipefail

script_path="${BASH_SOURCE[0]}"
while [[ -L "$script_path" ]]; do
  script_dir="$(cd "$(dirname "$script_path")" && pwd)"
  script_path="$(readlink "$script_path")"
  [[ "$script_path" = /* ]] || script_path="$script_dir/$script_path"
done
framework_root="$(cd "$(dirname "$script_path")/.." && pwd)"
host_root="$(git -C "$framework_root" rev-parse --show-superproject-working-tree 2>/dev/null || true)"
repo_root="${host_root:-$framework_root}"
out="$repo_root/bin/autotorial"
branch="${AUTOTORIAL_ASSETS_BRANCH:-lessons}"

command="save"
push=true
video=true
for arg in "$@"; do
  case "$arg" in
    save|restore|status) command="$arg" ;;
    --no-push) push=false ;;
    --no-video) video=false ;;
    *) echo "Usage: save-assets.sh [save|restore|status] [--no-push] [--no-video]" >&2; exit 2 ;;
  esac
done

has_remote() { git -C "$repo_root" remote get-url origin >/dev/null 2>&1; }
fetch_branch() { has_remote && git -C "$repo_root" fetch -q origin "$branch" 2>/dev/null || true; }
# The newest copy of the branch: the local one when it is ahead of origin (unpushed saves), else origin's.
snapshot_ref() {
  local local_ok=false remote_ok=false
  git -C "$repo_root" rev-parse --verify -q "refs/heads/$branch" >/dev/null && local_ok=true
  git -C "$repo_root" rev-parse --verify -q "refs/remotes/origin/$branch" >/dev/null && remote_ok=true
  if [[ $local_ok == true && $remote_ok == true ]]; then
    if git -C "$repo_root" merge-base --is-ancestor "origin/$branch" "$branch"; then echo "$branch"; else echo "origin/$branch"; fi
  elif [[ $remote_ok == true ]]; then echo "origin/$branch"
  elif [[ $local_ok == true ]]; then echo "$branch"
  fi
}
# Saves only ever add commits. Refuse to continue if local and origin have diverged instead of dropping either side.
ensure_not_diverged() {
  if git -C "$repo_root" rev-parse --verify -q "refs/heads/$branch" >/dev/null && git -C "$repo_root" rev-parse --verify -q "refs/remotes/origin/$branch" >/dev/null \
     && ! git -C "$repo_root" merge-base --is-ancestor "origin/$branch" "$branch" && ! git -C "$repo_root" merge-base --is-ancestor "$branch" "origin/$branch"; then
    echo "Local $branch and origin/$branch have diverged. Reconcile them with git (merge or rebase) before saving; nothing was changed." >&2
    exit 1
  fi
}

save() {
  shopt -s nullglob
  local lessons=("$out"/generated/*.json)
  if [[ ${#lessons[@]} -eq 0 ]]; then
    echo "Nothing to save: no produced lessons in $out/generated. Run produce first." >&2
    exit 1
  fi
  stage="$(mktemp -d)"; wt="$(mktemp -d)"
  trap 'git -C "$repo_root" worktree remove --force "$wt" >/dev/null 2>&1 || true; rm -rf "$stage" "$wt"' EXIT

  mkdir -p "$stage/autotorial/generated" "$stage/autotorial/public/audio"
  cp "${lessons[@]}" "$stage/autotorial/generated/"
  # Only the audio that the produced lessons point at; older cached takes are not worth saving.
  while IFS= read -r audio; do
    if [[ -f "$out/public/$audio" ]]; then cp "$out/public/$audio" "$stage/autotorial/public/audio/"
    else echo "warning: missing audio $audio" >&2; fi
  done < <(node -e 'for (const f of process.argv.slice(1)) for (const a of JSON.parse(require("fs").readFileSync(f, "utf8")).audio ?? []) console.log(a.src)' "${lessons[@]}")
  if [[ $video == true && -d "$out/video" ]]; then
    local videos=("$out"/video/*.mp4)
    if [[ ${#videos[@]} -gt 0 ]]; then mkdir -p "$stage/autotorial/video"; cp "${videos[@]}" "$stage/autotorial/video/"; fi
  fi

  local main_commit main_branch
  main_commit="$(git -C "$repo_root" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  main_branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  (cd "$stage" && node -e '
    const fs = require("fs"), path = require("path");
    const files = [];
    const walk = (dir) => { for (const e of fs.readdirSync(dir, {withFileTypes: true})) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else files.push({path: p, bytes: fs.statSync(p).size}); } };
    walk("autotorial");
    const lessons = fs.readdirSync("autotorial/generated").filter((f) => f.endsWith(".json")).map((f) => {
      const l = JSON.parse(fs.readFileSync(path.join("autotorial/generated", f), "utf8"));
      return {slug: l.slug, title: l.title, sourceHash: l.sourceHash, producedAt: l.producedAt, scenes: l.scenes.length, narration: [...new Set((l.audio ?? []).map((a) => a.provider))].join(", ")};
    });
    fs.writeFileSync("manifest.json", JSON.stringify({savedAt: new Date().toISOString(), source: {branch: process.argv[1], commit: process.argv[2]}, lessons, files}, null, 2) + "\n");
  ' "$main_branch" "$main_commit")
  cat > "$stage/README.md" <<'EOF'
# Saved AutoTorial assets

Snapshot of the generated files that the host repository ignores (`bin/autotorial/`): produced lesson JSON,
the narration audio those lessons use and the exported MP4. Nothing here is source: lessons live in `lessons/`
on the main branch. `manifest.json` records when the snapshot was taken and from which commit.

Restore it with `.autotorial/save-assets restore`, then run `produce` and `publish` to rebuild the site.
EOF

  fetch_branch
  ensure_not_diverged
  local ref
  ref="$(snapshot_ref || true)"
  if [[ -n "$ref" ]]; then
    git -C "$repo_root" worktree add -q -B "$branch" "$wt" "$ref"
  else
    git -C "$repo_root" worktree add -q --orphan -b "$branch" "$wt"
  fi
  find "$wt" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  cp -R "$stage/." "$wt/"
  git -C "$wt" add -A
  # The manifest carries a timestamp, so it alone is not a change worth a commit.
  if [[ -z "$(git -C "$wt" diff --cached --name-only | grep -vx manifest.json || true)" ]]; then
    echo "Assets already saved in branch $branch; nothing new to commit."
  else
    git -C "$wt" commit -q -m "Save assets (main $main_commit)"
    echo "Saved $(find "$stage/autotorial" -type f | wc -l) files ($(du -sh "$stage/autotorial" | cut -f1)) in branch $branch"
  fi
  if [[ $push == true ]]; then
    if has_remote; then git -C "$wt" push -q origin "$branch" && echo "Pushed $branch to origin"
    else echo "No origin remote; the snapshot stays in the local branch $branch"; fi
  else
    echo "Not pushed (--no-push): branch $branch exists locally"
  fi
}

restore() {
  fetch_branch
  local ref
  ref="$(snapshot_ref || true)"
  if [[ -z "$ref" ]]; then echo "Branch $branch has no saved assets. Run save first." >&2; exit 1; fi
  mkdir -p "$repo_root/bin"
  git -C "$repo_root" archive "$ref" autotorial | tar -x -C "$repo_root/bin"
  echo "Restored the snapshot from $ref into $out"
  echo "Next: .autotorial/autotorial produce <session> (reuses the saved narration), then publish."
}

status() {
  fetch_branch
  local ref
  ref="$(snapshot_ref || true)"
  if [[ -z "$ref" ]]; then echo "Branch $branch has no saved assets yet."; exit 0; fi
  echo "Snapshot in $ref:"
  git -C "$repo_root" show "$ref:manifest.json"
}

case "$command" in
  save) save ;;
  restore) restore ;;
  status) status ;;
esac
