#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture_output="$repo_root/fixtures/hello-world-host/bin/aitutorial"
site_source="$fixture_output/site"
video_source="$fixture_output/video"
deploy_dir="$repo_root/bin"
prepare_only=false

if [[ "${1:-}" == "--prepare-only" ]]; then
  prepare_only=true
elif [[ $# -ne 0 ]]; then
  echo "Usage: scripts/deploy-pages.sh [--prepare-only]" >&2
  exit 2
fi

if [[ ! -f "$site_source/index.html" || ! -f "$site_source/course.json" ]]; then
  echo "Missing generated site in $site_source" >&2
  exit 1
fi

mapfile -t videos < <(find "$video_source" -maxdepth 1 -type f -name '*.mp4' -size +0c -print 2>/dev/null | sort)
if [[ ${#videos[@]} -eq 0 ]]; then
  echo "Missing generated MP4 in $video_source" >&2
  exit 1
fi

# bin/ is ignored and is only a disposable deployment snapshot. Replacing it
# guarantees that files removed from the fixture cannot survive a deployment.
rm -rf "$deploy_dir"
mkdir -p "$deploy_dir/video"
cp -R "$site_source/." "$deploy_dir/"
cp "${videos[@]}" "$deploy_dir/video/"
touch "$deploy_dir/.nojekyll"

if grep -Eiq "(src|href)=['\"]/[^/]" "$deploy_dir/index.html"; then
  echo "index.html contains a root-absolute asset path" >&2
  exit 1
fi

for video in "${videos[@]}"; do
  copied_video="$deploy_dir/video/$(basename "$video")"
  if [[ ! -s "$copied_video" ]]; then
    echo "Failed to copy $(basename "$video")" >&2
    exit 1
  fi
done

echo "Prepared local Pages snapshot in $deploy_dir"
if [[ "$prepare_only" == true ]]; then
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
