# Authentication and API Key Setup

Use this reference when the OKKI Go skill needs an API key, first-use signup, key persistence, or authenticated `curl` examples.

## Credential Resolution

Before the first API call in each session, run:

```bash
bash scripts/resolve-api-key.sh --check
```

Results:

- `KEY_SET`: proceed.
- `NO_KEY`: follow email verification or use a user-provided `sk-` key.

Use a Codex-style credential flow: configure once, cache in the user-level OKKI Go config directory, then let future agent sessions check the cache before asking the user again.

Primary persistent storage:

- Credential cache: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/credentials.json`, mode `0600`.
- Registered source: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/auth-source.json`, mode `0600`, non-secret source metadata only.

Resolution order:

1. Registered source created by `node scripts/okki-auth.js login --with-api-key`; normally points to the user-level credential cache.
2. Explicit environment override: `OKKIGO_API_KEY`, `OKKI_GO_API_KEY`, or `OKKIGO_SKILL_API_KEY` for CLI/CI or platform-injected sessions.
3. Legacy local credentials file fallback: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/credentials.json`, mode `0600`, JSON `{"apiKey":"sk-..."}`.

The runtime resolver does not scan platform-specific config directories. Installers or platforms may register a source during setup or inject an explicit environment variable, but routine skill execution should not guess where a given agent stores secrets.

Never store API keys in `SKILL.md`, repositories, transcripts, logs, examples, or command history beyond an explicit user-approved save command.

For API calls, resolve the key immediately before `curl` and avoid printing it:

```bash
OKKIGO_API_KEY="$(bash scripts/resolve-api-key.sh --print)" && \
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X GET "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.1}" \
  -H "X-Okki-Skill-Runtime: ${OKKIGO_SKILL_RUNTIME:-agent}" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"}
```

For configuration debugging only, use `bash scripts/resolve-api-key.sh --source`; it prints the source name, not the secret.

For redacted diagnostics:

```bash
node scripts/okki-auth.js status --json
node scripts/okki-auth.js doctor --json
```

## Email Verification

1. Show legal documents and require exact acceptance before asking for email:

```text
Before creating an OKKI Go account and API Key, please read:

Terms of Service v2026-04-23: https://go.okki.ai/legal/terms
Privacy Policy v2026-04-23: https://go.okki.ai/legal/privacy

If you agree to continue, reply:
I have read and agree to the Terms of Service and acknowledge the Privacy Policy.
```

Chinese:

```text
创建 OKKI Go 账号和 API Key 前，请先阅读：

服务条款 v2026-04-23: https://go.okki.ai/legal/terms
隐私政策 v2026-04-23: https://go.okki.ai/legal/privacy

如同意继续，请回复：
我已阅读并同意《服务条款》，并确认已阅读《隐私政策》。
```

Do not treat vague replies such as "OK", "continue", "好的", "继续", or "发验证码吧" as valid acceptance.

2. After acceptance, ask for email. Report analytics with only `email_domain`, never the full email.

3. Send verification code:

```bash
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/register-email" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.1}" \
  -H "X-Okki-Skill-Runtime: ${OKKIGO_SKILL_RUNTIME:-agent}" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{
    "email":"<user email>",
    "legalAcceptance": {
      "accepted": true,
      "termsVersion": "2026-04-23",
      "privacyVersion": "2026-04-23",
      "termsUrl": "https://go.okki.ai/legal/terms",
      "privacyUrl": "https://go.okki.ai/legal/privacy",
      "channel": "agent",
      "skillVersion": "1.2.1",
      "locale": "en-US",
      "affirmationText": "I have read and agree to the Terms of Service and acknowledge the Privacy Policy."
    }
  }' | jq '.'
```

4. Exchange the 6-digit code for an API key:

```bash
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/verify-email" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.1}" \
  -H "X-Okki-Skill-Runtime: ${OKKIGO_SKILL_RUNTIME:-agent}" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "X-OpenClaw-Provision-Api-Key: true" \
  -H "Content-Type: application/json" \
  -d '{"email":"<user_email>","code":"<6_digit_code>"}' | jq '.'
```

## Save API Key

After obtaining `apiKey`, verify it starts with `sk-`, tell the user where it will be saved, and ask for explicit consent. Saving the key is separate from legal acceptance.

Preferred save order:

1. Platform config command, if the host supports one.
2. User-level OKKI Go credential cache on macOS/Linux:

```bash
printf '%s\n' 'sk-xxxxxxxxxxxxxxxxxxxx' | node scripts/okki-auth.js login --with-api-key
```

3. Shell profile only for terminal-launched agents when local credentials are not acceptable.
4. Windows PowerShell user-level environment variable:

```powershell
[System.Environment]::SetEnvironmentVariable("OKKIGO_API_KEY", "sk-xxxxxxxxxxxxxxxxxxxx", "User")
```

5. Windows CMD:

```cmd
setx OKKIGO_API_KEY "sk-xxxxxxxxxxxxxxxxxxxx"
```

After saving through platform config or user-level env vars, prompt the user to restart the assistant session. The local credentials file is available immediately to tools that can read user config.
