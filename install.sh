#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=0
HOST_ROOT=""

usage() { echo "Usage: ./install.sh [--dry-run] [--host <repository>]"; }
while (($#)); do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --host) HOST_ROOT="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if ! command -v git >/dev/null || ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "autotorial requires Git, Node.js 20+, and npm. Install them and run this script again." >&2
  exit 1
fi

if [[ -z "$HOST_ROOT" ]]; then
  HOST_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-superproject-working-tree 2>/dev/null || true)"
  [[ -n "$HOST_ROOT" ]] || HOST_ROOT="$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [[ -z "$HOST_ROOT" ]] || ! git -C "$HOST_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Cannot detect the host Git repository. Run from the host or pass --host <path>." >&2
  exit 1
fi
HOST_ROOT="$(cd "$HOST_ROOT" && pwd)"

do_mkdir() { if [[ $DRY_RUN == 1 ]]; then echo "mkdir -p $1"; else mkdir -p "$1"; fi; }
relative_target() { node -e 'const p=require("node:path"); console.log(p.relative(process.argv[1],process.argv[2]))' "$1" "$2"; }
ensure_link() {
  local target="$1" destination="$2" parent relative legacy_relative current
  parent="$(dirname "$destination")"; relative="$(relative_target "$parent" "$target")"
  legacy_relative="${relative//autotorial/aitutorial}"
  do_mkdir "$parent"
  if [[ -L "$destination" ]]; then
    current="$(readlink "$destination")"
    if [[ "$current" == "$relative" ]]; then echo "ok: $destination"; return; fi
    if [[ "$current" == "$legacy_relative" ]]; then
      if [[ $DRY_RUN == 1 ]]; then
        echo "replace legacy symlink $destination -> $relative"
      else
        rm "$destination"
        ln -s "$relative" "$destination"
      fi
      return
    fi
    echo "Refusing to replace unrelated symlink: $destination -> $current" >&2; exit 1
  fi
  if [[ -e "$destination" ]]; then echo "Refusing to overwrite existing path: $destination" >&2; exit 1; fi
  if [[ $DRY_RUN == 1 ]]; then echo "ln -s $relative $destination"; else ln -s "$relative" "$destination"; fi
}
migrate_legacy_cli() {
  local destination="$HOST_ROOT/.aitutorial/aitutorial" expected="../lib/aitutorial/dist/cli.js" current
  [[ -L "$destination" ]] || return
  current="$(readlink "$destination")"
  [[ "$current" == "$expected" ]] || { echo "Refusing to remove unrelated legacy symlink: $destination -> $current" >&2; exit 1; }
  if [[ $DRY_RUN == 1 ]]; then
    echo "remove legacy symlink $destination"
  else
    rm "$destination"
    rmdir "$HOST_ROOT/.aitutorial" 2>/dev/null || true
  fi
}
ensure_line() {
  local line="$1" file="$2"
  [[ -f "$file" ]] && grep -Fqx "$line" "$file" && { echo "ok: $line in $file"; return; }
  if [[ $DRY_RUN == 1 ]]; then echo "append '$line' to $file"; else printf '%s\n' "$line" >> "$file"; fi
}
ensure_file() {
  local source="$1" destination="$2"
  if [[ -e "$destination" ]]; then echo "ok: preserved existing $destination"; return; fi
  do_mkdir "$(dirname "$destination")"
  if [[ $DRY_RUN == 1 ]]; then echo "copy $source to $destination"; else cp "$source" "$destination"; fi
}

for skill in create-content produce-session voice publish-session; do
  ensure_link "$SCRIPT_DIR/skills/$skill" "$HOST_ROOT/.agents/skills/$skill"
  ensure_link "$SCRIPT_DIR/skills/$skill" "$HOST_ROOT/.claude/skills/$skill"
done
migrate_legacy_cli
ensure_link "$SCRIPT_DIR/dist/cli.js" "$HOST_ROOT/.autotorial/autotorial"
ensure_file "$SCRIPT_DIR/templates/autotorial-pages.yml" "$HOST_ROOT/.github/workflows/autotorial-pages.yml"
ensure_line "/bin/" "$HOST_ROOT/.gitignore"

if [[ ! -d "$SCRIPT_DIR/node_modules" || ! -f "$SCRIPT_DIR/dist/cli.js" ]]; then
  echo "Setup required in $SCRIPT_DIR: npm ci && npm run build"
fi
echo "autotorial installed for $HOST_ROOT"
