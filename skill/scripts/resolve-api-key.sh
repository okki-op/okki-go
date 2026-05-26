#!/bin/sh
# Resolve the OKKI Go API key across agent platforms.
#
# Default output is intentionally non-secret. Use --print only inside the
# command that immediately calls the OKKI Go API.

set -eu

MODE="${1:---check}"
ANALYTICS_URL="${OKKIGO_ANALYTICS_URL:-https://datasink-sensorsdata.okki.ai/sa?project=production}"
SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.0.12}"
SKILL_RUNTIME="${OKKIGO_SKILL_RUNTIME:-unknown}"

if [ "$MODE" != "--check" ] && [ "$MODE" != "--source" ] && [ "$MODE" != "--print" ]; then
  echo "Usage: $0 [--check|--source|--print]" >&2
  exit 2
fi

script_dir() {
  CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd
}

resolve_install_id() {
  if [ -n "${OKKIGO_INSTALL_ID:-}" ]; then
    printf '%s\n' "$OKKIGO_INSTALL_ID"
    return 0
  fi
  if [ -n "${OKKI_GO_INSTALL_ID:-}" ]; then
    printf '%s\n' "$OKKI_GO_INSTALL_ID"
    return 0
  fi

  dir="$(script_dir || pwd)"
  manifest="$dir/../.okki-go-manifest.json"
  if [ -f "$manifest" ]; then
    id="$(jq -r '(.installId // .install_id // "") | select(type == "string" and length > 0)' "$manifest" 2>/dev/null || true)"
    if [ -n "$id" ]; then
      printf '%s\n' "$id"
      return 0
    fi
  fi

  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    config_home="$XDG_CONFIG_HOME"
  else
    config_home="${HOME:-}/.config"
  fi
  if [ -f "$config_home/okki-go/install-id" ]; then
    head -n 1 "$config_home/okki-go/install-id" 2>/dev/null || true
  fi
}

analytics_disabled() {
  value="$(printf '%s' "${OKKIGO_ANALYTICS_DISABLED:-${ANALYTICS_DISABLED:-}}" | tr '[:upper:]' '[:lower:]')"
  [ "$value" = "1" ] || [ "$value" = "true" ] || [ "$value" = "yes" ]
}

track_event() {
  event="$1"
  source="${2:-}"
  analytics_disabled && return 0
  command -v curl >/dev/null 2>&1 || return 0
  command -v jq >/dev/null 2>&1 || return 0

  install_id="$(resolve_install_id | head -n 1)"
  [ -n "$install_id" ] || return 0

  payload="$(jq -n \
    --arg event "$event" \
    --arg distinct_id "$install_id" \
    --arg install_id "$install_id" \
    --arg runtime "$SKILL_RUNTIME" \
    --arg skill_version "$SKILL_VERSION" \
    --arg credential_source "$source" \
    '{event:$event, distinct_id:$distinct_id, properties:{app_name:"okki-go", product_line:"okki_go_plg", app_platform:"skill", install_id:$install_id, runtime:$runtime, skill_version:$skill_version, credential_source:$credential_source}}' 2>/dev/null || true)"
  [ -n "$payload" ] || return 0
  (curl -sS --max-time 1 -H "Content-Type: application/json" -d "$payload" "$ANALYTICS_URL" >/dev/null 2>&1 || true) &
}

emit_found() {
  key="$1"
  source="$2"
  track_event "ApiKeyConfigured" "$source"

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

check_accio_config_file() {
  file="$1"
  source="$2"

  [ -f "$file" ] || return 0

  permissions="$(stat -f '%Lp' "$file" 2>/dev/null || stat -c '%a' "$file" 2>/dev/null || echo unknown)"
  case "$permissions" in
    600|640|644) ;;
    *)
      echo "Ignoring $file: permissions must be 600, 640, or 644" >&2
      return 0
      ;;
  esac

  key="$(jq -r '
    (
      .["OKKI Go"].apiKey //
      .["OKKI Go"].OKKIGO_API_KEY //
      ."okki-go".apiKey //
      ."okki-go".OKKIGO_API_KEY //
      .okkiGo.apiKey //
      .okkiGo.OKKIGO_API_KEY //
      .skills."OKKI Go".apiKey //
      .skills."OKKI Go".OKKIGO_API_KEY //
      .skills."okki-go".apiKey //
      .skills."okki-go".OKKIGO_API_KEY //
      ""
    ) | select(type == "string" and startswith("sk-"))
  ' "$file" 2>/dev/null || true)"

  if [ -n "$key" ]; then
    emit_found "$key" "$source"
  fi
}

check_accio_account_config() {
  if [ -n "${ACCIO_ACCOUNT_DIR:-}" ]; then
    account_dir="$ACCIO_ACCOUNT_DIR"
    check_accio_config_file "$account_dir/skills/skills_config.json" "accio:$account_dir/skills/skills_config.json"
    return 0
  fi

  if [ -n "${ACCIO_CONFIG_DIR:-}" ]; then
    accio_root="$ACCIO_CONFIG_DIR"
  else
    accio_root="${HOME:-}/.accio"
  fi

  [ -n "$accio_root" ] || return 0

  accounts_dir="$accio_root/accounts"
  if [ -n "${ACCIO_ACCOUNT_ID:-}" ]; then
    check_accio_config_file "$accounts_dir/$ACCIO_ACCOUNT_ID/skills/skills_config.json" "accio:$accounts_dir/$ACCIO_ACCOUNT_ID/skills/skills_config.json"
    return 0
  fi

  [ -d "$accounts_dir" ] || return 0

  for account_dir in "$accounts_dir"/*; do
    [ -d "$account_dir" ] || continue
    check_accio_config_file "$account_dir/skills/skills_config.json" "accio:$account_dir/skills/skills_config.json"
  done
}

# 1. Platform-native config/secrets should inject one of these variables.
# Keep OKKIGO_API_KEY first because it is the public cross-platform contract.
check_env OKKIGO_API_KEY
check_env OKKI_GO_API_KEY
check_env OKKIGO_SKILL_API_KEY

# 2. Accio Work can keep skill-specific config at the account level without
# injecting it into shell environment variables.
case "$(printf '%s' "$SKILL_RUNTIME" | tr '[:upper:]' '[:lower:]')" in
  accio|acciowork|accio-work)
    check_accio_account_config
    ;;
esac

# 3. Local fallback for runtimes that cannot inject secrets into sessions.
if [ -n "${XDG_CONFIG_HOME:-}" ]; then
  config_home="$XDG_CONFIG_HOME"
else
  config_home="${HOME:-}/.config"
fi

if [ -n "$config_home" ]; then
  check_file "$config_home/okki-go/credentials.json" "file:$config_home/okki-go/credentials.json"
fi

track_event "SkillInvokedWithoutApiKey" "none"
echo "NO_KEY"
exit 1
