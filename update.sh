#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=0
REVISION="origin/HEAD"
HOST_ROOT=""
while (($#)); do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --host) HOST_ROOT="${2:-}"; shift 2 ;;
    -h|--help) echo "Usage: ./update.sh [revision-or-tag] [--dry-run] [--host <repository>]"; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) REVISION="$1"; shift ;;
  esac
done
[[ -n "$HOST_ROOT" ]] || HOST_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-superproject-working-tree 2>/dev/null || true)"
if [[ -z "$HOST_ROOT" ]]; then echo "aitutorial is not running as a registered submodule; pass --host only for diagnostics." >&2; exit 1; fi
HOST_ROOT="$(cd "$HOST_ROOT" && pwd)"
if [[ -n "$(git -C "$SCRIPT_DIR" status --porcelain --untracked-files=normal)" ]]; then
  echo "Refusing to update: the aitutorial submodule has uncommitted changes." >&2; exit 1
fi
SUBMODULE_PATH="$(node -e 'const p=require("node:path"); console.log(p.relative(process.argv[1],process.argv[2]))' "$HOST_ROOT" "$SCRIPT_DIR")"
git -C "$HOST_ROOT" diff --quiet -- "$SUBMODULE_PATH" || { echo "Refusing to update: the host has unstaged submodule changes." >&2; exit 1; }
git -C "$HOST_ROOT" diff --cached --quiet -- "$SUBMODULE_PATH" || { echo "Refusing to update: the host has staged submodule changes." >&2; exit 1; }
if [[ $DRY_RUN == 1 ]]; then
  echo "git -C $SCRIPT_DIR fetch --tags origin"
  echo "git -C $SCRIPT_DIR checkout --detach $REVISION"
  echo "$SCRIPT_DIR/install.sh --host $HOST_ROOT"
  exit 0
fi
git -C "$SCRIPT_DIR" fetch --tags origin
TARGET="$(git -C "$SCRIPT_DIR" rev-parse --verify "${REVISION}^{commit}")"
git -C "$SCRIPT_DIR" checkout --detach "$TARGET"
git -C "$SCRIPT_DIR" submodule update --init --recursive
"$SCRIPT_DIR/install.sh" --host "$HOST_ROOT"
echo "Updated aitutorial to $TARGET. Review and commit the submodule pointer in the host repository."
