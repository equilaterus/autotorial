#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
deploy_dir="$repo_root/bin"
check_only=false

if [[ "${1:-}" == "--check-only" ]]; then
  check_only=true
elif [[ $# -ne 0 ]]; then
  echo "Usage: run/deploy-pages.sh [--check-only]" >&2
  exit 2
fi

if [[ ! -f "$deploy_dir/index.html" || ! -f "$deploy_dir/course.json" ]]; then
  echo "Missing deployable site in $deploy_dir" >&2
  exit 1
fi

mapfile -t videos < <(find "$deploy_dir/video" -maxdepth 1 -type f -name '*.mp4' -size +0c -print 2>/dev/null | sort)
if [[ ${#videos[@]} -eq 0 ]]; then
  echo "Missing deployable MP4 in $deploy_dir/video" >&2
  exit 1
fi

touch "$deploy_dir/.nojekyll"

if grep -Eiq "(src|href)=['\"]/[^/]" "$deploy_dir/index.html"; then
  echo "index.html contains a root-absolute asset path" >&2
  exit 1
fi

echo "Validated local Pages snapshot in $deploy_dir"
if [[ "$check_only" == true ]]; then
  exit 0
fi

remote_url="${AUTOTORIAL_PAGES_REMOTE:-$(git -C "$repo_root" remote get-url origin)}"
stage_dir="$(mktemp -d)"
trap 'rm -rf "$stage_dir"' EXIT
cp -R "$deploy_dir/." "$stage_dir/"

git -C "$stage_dir" init --quiet
git -C "$stage_dir" checkout --quiet --orphan gh-pages
git -C "$stage_dir" config user.name "${GIT_AUTHOR_NAME:-Autotorial Pages}"
git -C "$stage_dir" config user.email "${GIT_AUTHOR_EMAIL:-pages@autotorial.invalid}"
git -C "$stage_dir" add --all
git -C "$stage_dir" commit --quiet -m "Deploy Autotorial"
git -C "$stage_dir" push --force "$remote_url" HEAD:refs/heads/gh-pages

echo "Published the local snapshot to gh-pages as a new orphan commit"
