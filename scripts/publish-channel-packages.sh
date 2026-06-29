#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGES_DIR="$ROOT_DIR/channel-packages/packages"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org/}"

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

npm_publish_args=(--access public --registry "$NPM_REGISTRY")
if [[ -n "${NPM_TOKEN:-}" ]]; then
  npm_publish_args+=("--//registry.npmjs.org/:_authToken=$NPM_TOKEN")
fi

package_dirs=()
while IFS= read -r package_dir; do
  package_dirs+=("$package_dir")
done < <(find "$PACKAGES_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

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

  matched=true
  echo "Publishing $package_name"
  if [[ "$DRY_RUN" == true ]]; then
    (cd "$package_dir" && npm publish "${npm_publish_args[@]}" --dry-run)
  else
    (cd "$package_dir" && npm publish "${npm_publish_args[@]}")
  fi
done

if [[ -n "$ONLY_PACKAGE" && "${matched:-false}" != true ]]; then
  echo "No generated channel package matched: $ONLY_PACKAGE" >&2
  exit 1
fi
