#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGES_DIR="$ROOT_DIR/channel-packages/packages"

DRY_RUN=false
ONLY_PACKAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --package)
      ONLY_PACKAGE="${2:-}"
      shift 2
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: scripts/publish-channel-packages.sh [--dry-run] [--package <name-or-dir>]

Publishes generated OKKI Go channel wrapper packages.
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"
node scripts/generate-channel-packages.js

mapfile -t package_dirs < <(find "$PACKAGES_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [[ ${#package_dirs[@]} -eq 0 ]]; then
  echo "No generated channel packages found in $PACKAGES_DIR" >&2
  exit 1
fi

for package_dir in "${package_dirs[@]}"; do
  package_name="$(node -e "console.log(require(process.argv[1]).name)" "$package_dir/package.json")"
  package_base="$(basename "$package_dir")"

  if [[ -n "$ONLY_PACKAGE" && "$ONLY_PACKAGE" != "$package_name" && "$ONLY_PACKAGE" != "$package_base" ]]; then
    continue
  fi

  echo "Publishing $package_name"
  if [[ "$DRY_RUN" == true ]]; then
    (cd "$package_dir" && npm publish --access public --dry-run)
  else
    (cd "$package_dir" && npm publish --access public)
  fi
done
