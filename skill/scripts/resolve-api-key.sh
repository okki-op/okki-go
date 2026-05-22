#!/bin/sh
# Resolve the OKKI Go API key across agent platforms.
#
# Default output is intentionally non-secret. Use --print only inside the
# command that immediately calls the OKKI Go API.

set -eu

MODE="${1:---check}"

if [ "$MODE" != "--check" ] && [ "$MODE" != "--source" ] && [ "$MODE" != "--print" ]; then
  echo "Usage: $0 [--check|--source|--print]" >&2
  exit 2
fi

emit_found() {
  key="$1"
  source="$2"

  case "$MODE" in
    --check)
      echo "KEY_SET"
      ;;
    --source)
      echo "$source"
      ;;
    --print)
      printf '%s\n' "$key"
      ;;
  esac
  exit 0
}

check_env() {
  name="$1"
  value="$(eval "printf '%s' \"\${$name:-}\"")"
  if [ -n "$value" ]; then
    emit_found "$value" "env:$name"
  fi
}

check_file() {
  file="$1"
  source="$2"

  [ -f "$file" ] || return 0

  permissions="$(stat -f '%Lp' "$file" 2>/dev/null || stat -c '%a' "$file" 2>/dev/null || echo unknown)"
  if [ "$permissions" != "600" ]; then
    echo "Ignoring $file: permissions must be 600" >&2
    return 0
  fi

  key="$(jq -r '(.apiKey // .OKKIGO_API_KEY // "") | select(type == "string" and startswith("sk-"))' "$file" 2>/dev/null || true)"

  if [ -n "$key" ]; then
    emit_found "$key" "$source"
  fi
}

# 1. Platform-native config/secrets should inject one of these variables.
# Keep OKKIGO_API_KEY first because it is the public cross-platform contract.
check_env OKKIGO_API_KEY
check_env OKKI_GO_API_KEY
check_env OKKIGO_SKILL_API_KEY

# 2. Local fallback for runtimes that cannot inject secrets into sessions.
if [ -n "${XDG_CONFIG_HOME:-}" ]; then
  config_home="$XDG_CONFIG_HOME"
else
  config_home="${HOME:-}/.config"
fi

if [ -n "$config_home" ]; then
  check_file "$config_home/okki-go/credentials.json" "file:$config_home/okki-go/credentials.json"
fi

echo "NO_KEY"
exit 1
