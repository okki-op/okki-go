---
name: OKKI Go
version: 1.2.0
description: "B2B lead prospecting and outreach via the Okki Go platform. Use this skill to (1) search global companies, (2) find decision-maker contact emails, (3) send cold outreach emails/EDM, (4) check email delivery status, (5) check credits/quota balance, or (6) upgrade plans/buy credits. Do NOT trigger if the user wants to search ON a DIFFERENT platform (e.g. 'search 1688 for suppliers', 'find products on Alibaba'). Having a product listing on another platform is fine — only skip when the search action itself targets another platform. Also NOT for: reading incoming emails, CRM management, or account settings."
homepage: "https://go.okki.ai"
requires:
  - curl
  - jq
env:
  OKKIGO_API_KEY:
    required: true
    description: "API Key for Okki Go platform"
---

# OKKI Go — B2B Lead Prospecting & Outreach Skill

Helps sales teams and businesses rapidly discover and analyze potential customers and execute outreach campaigns via AI Agent, taking B2B customer acquisition efficiency to the next level.

For complete API parameter documentation and response schemas, see [references/api-reference.md](./references/api-reference.md).

## Quick Start

This skill requires an API Key to function. Before the first API call, check if `OKKIGO_API_KEY` is configured. If not, guide the user through email verification to obtain one (see Authentication section below).

## Routing

### Use this skill when

- User wants to find companies or customers — search by industry, country, keywords
- User wants to get contact emails for a company — find decision-makers
- User wants to search contacts by name, title, or email
- User wants to draft or send outreach or cold emails (EDM)
- User wants to check email delivery status
- User wants to check remaining credits or EDM quota
- User needs the full prospecting workflow: search → contacts → outreach
- User wants to upgrade plan or buy credit packs

### Do NOT use this skill when

- Reading or receiving incoming emails — this skill is outbound-only
- CRM pipeline management, deal tracking, or sales forecasting
- User explicitly names another platform (1688, Alibaba, Google Maps, Amazon, etc.)

---

## Capabilities

| # | Feature | Description | Cost |
|---|---------|-------------|------|
| 1 | Search Companies | Portrait-based multi-dimensional filtering by company type, product, industry, country | Free |
| 2 | Unlock Company | Resolve domain to companyHashId for subsequent queries | 1 credit (30-day domain dedup) |
| 3 | View Company Profile | Full business info and trade data (requires unlock first) | Free |
| 4 | Get Company Contact Emails | Contact email list for a given company (requires unlock first) | Free |
| 5 | Search Contacts | Cross-company search by name, title, email | 1 credit/request |
| 6 | Send Batch Outreach | Same template to multiple recipients, with variable substitution | 1 EDM quota/email |
| 7 | Send Personalized Outreach | Unique content per recipient | 1 EDM quota/email |
| 8 | Check Email Status | Task list, per-email status, failure reasons | Free |
| 9 | Check Credits & EDM Balance | Remaining search credits and email quota | Free |

---

## Authentication & API Key Setup

All endpoints use API Key authentication. Each user has an independent `sk-` prefixed key. Request header format:

```
Authorization: ApiKey <resolved API key>
X-Okki-Install-Id: <anonymous install id>
X-Okki-Skill-Version: 1.2.0
X-Okki-Skill-Runtime: <agent runtime>
X-Hostname: xxx
```

### Credential resolution

Use four-tier credential resolution so this skill works across the widest range of agent platforms:

1. **Platform config/secrets injection** — preferred. This is the platform config/secrets path. Agent platforms should inject the key into the session as `OKKIGO_API_KEY`, `OKKI_GO_API_KEY`, or `OKKIGO_SKILL_API_KEY`.
2. **Accio Work account config** — when running in Accio, the resolver also checks `~/.accio/accounts/<accountId>/skills/skills_config.json` for the `OKKI Go` or `okki-go` entry.
3. **Standard environment variable** — `OKKIGO_API_KEY` is the public cross-platform contract for CLIs, CI, local shells, and hosted agents.
4. **Local credentials file fallback** — `~/.config/okki-go/credentials.json` for platforms that cannot inject secrets. The file must be mode `0600` and contain JSON such as `{"apiKey":"sk-..."}`.

Do not store API Keys in `SKILL.md`, repositories, transcripts, logs, examples, or command history beyond the explicit user-approved save command.

### First-use check

Before the first API call in each session, use the resolver script. It checks platform-injected secrets, Accio account config when applicable, standard environment variables, then the secure local credentials file:

```bash
bash scripts/resolve-api-key.sh --check
```

- **`KEY_SET`** → Proceed directly with the user's request
- **`NO_KEY`** → Follow the email verification flow below

The resolver reports `ApiKeyConfigured` or `SkillInvokedWithoutApiKey` as best-effort analytics using only `install_id`, runtime, version, and credential source. Set `OKKIGO_ANALYTICS_DISABLED=1` to disable local Skill analytics.

If `NO_KEY` but the user has explicitly provided an API Key in context, skip to **Step 3: Save the API Key** below.

For API calls, resolve the key immediately before `curl` and avoid printing it:

```bash
OKKIGO_API_KEY="$(bash scripts/resolve-api-key.sh --print)" && \
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X GET "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.0}" \
  -H "X-Okki-Skill-Runtime: ${OKKIGO_SKILL_RUNTIME:-agent}" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"}
```

For debugging configuration only, use `bash scripts/resolve-api-key.sh --source`; it prints the source name, not the secret value.

### Email Verification to Obtain API Key

1. Show the legal documents and require explicit acceptance. **Do not ask for or submit the user's email before this confirmation.** Report `AgentSignupLegalConsentShown` when the text is shown and `AgentSignupLegalConsentAccepted` only after the exact acceptance sentence is received.

   ```text
   Before creating an OKKI Go account and API Key, please read:

   Terms of Service v2026-04-23: https://go.okki.ai/legal/terms
   Privacy Policy v2026-04-23: https://go.okki.ai/legal/privacy

   If you agree to continue, reply:
   I have read and agree to the Terms of Service and acknowledge the Privacy Policy.
   ```

   In Chinese, use:

   ```text
   创建 OKKI Go 账号和 API Key 前，请先阅读：

   服务条款 v2026-04-23: https://go.okki.ai/legal/terms
   隐私政策 v2026-04-23: https://go.okki.ai/legal/privacy

   如同意继续，请回复：
   我已阅读并同意《服务条款》，并确认已阅读《隐私政策》。
   ```

   Only proceed after explicit acceptance. Do not treat vague replies such as "OK", "continue", "send the code", "好的", "继续", or "发验证码吧" as valid acceptance. If the reply is ambiguous, ask the user to reply with the exact confirmation sentence.

2. After acceptance, ask the user for their email address. Report `AgentSignupEmailSubmitted` with only `email_domain`, never the full email.
3. Send verification code with `legalAcceptance`:

```bash
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/register-email" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.0}" \
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
      "skillVersion": "1.2.0",
      "locale": "en-US",
      "affirmationText": "I have read and agree to the Terms of Service and acknowledge the Privacy Policy."
    }
  }' | jq '.'
```

4. After the user provides the 6-digit code, exchange it for an API Key:

```bash
OKKIGO_INSTALL_ID="${OKKIGO_INSTALL_ID:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/install-id" 2>/dev/null || true)}" && \
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/verify-email" \
  ${OKKIGO_INSTALL_ID:+-H "X-Okki-Install-Id: $OKKIGO_INSTALL_ID"} \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.2.0}" \
  -H "X-Okki-Skill-Runtime: ${OKKIGO_SKILL_RUNTIME:-agent}" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "X-OpenClaw-Provision-Api-Key: true" \
  -H "Content-Type: application/json" \
  -d '{"email":"<user_email>","code":"<6_digit_code>"}' | jq '.'
```

### Save the API Key

After obtaining the `apiKey` (from verification or user input), persist it so future sessions skip re-verification. **Inform the user before saving and ask for explicit consent.** Report `AgentApiKeySavePromptShown`, then `AgentApiKeySaveAccepted`, `AgentApiKeySaveSucceeded`, or `AgentApiKeySaveFailed` with save method only; never report the key.

Saving the API Key is a separate confirmation from accepting the Terms of Service and acknowledging the Privacy Policy. Do not merge these confirmations.

**Before saving**, verify the API Key format:

```bash
# Validate API Key format (should start with 'sk-')
if [[ ! "$apiKey" =~ ^sk- ]]; then
  echo "Error: Invalid API Key format (should start with 'sk-')"
  exit 1
fi
```

#### Step 3a: Detect the user's environment

```bash
# Detect OS and shell
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) 
    echo "PLATFORM=windows"
    # Detect PowerShell vs CMD
    if [ -n "${PSVersionTable}" ] || command -v pwsh &>/dev/null || [ -n "${PSMODULEPATH}" ]; then
      echo "SHELL_TYPE=powershell"
    else
      echo "SHELL_TYPE=cmd"
    fi
    ;;
  Darwin*) echo "PLATFORM=macos" ;;
  *) echo "PLATFORM=linux" ;;
esac
echo "SHELL_NAME=$(basename "${SHELL:-unknown}")"
```

Use the detected platform to choose **one** saving method below. Do NOT present all methods — only show the one that matches.

#### Step 3b: Save using the best method for the user's environment

**Priority order** — use the first method that applies:

1. **Platform config command** (if available): If the host platform provides a dedicated config/secrets CLI (e.g., `openclaw config set`), prefer it — it survives shell changes and is the most portable within that platform.

2. **Local credentials file fallback** (macOS / Linux): Save the key to a user-only JSON file. Prefer this over shell profiles for desktop agents because many agent apps do not load `.zshrc` or `.bashrc`.

   ```bash
   mkdir -p "$HOME/.config/okki-go"
   umask 077
   printf '%s\n' '{"apiKey":"sk-xxxxxxxxxxxxxxxxxxxx"}' > "$HOME/.config/okki-go/credentials.json"
   chmod 600 "$HOME/.config/okki-go/credentials.json"
   ```

3. **Shell profile** (macOS / Linux CLI-only fallback): Append the export to the user's active shell profile only when the user is using a terminal-launched agent and no local credentials file is acceptable.

   ```bash
   # Detect the correct profile file
   case "$(basename "$SHELL")" in
     zsh)  PROFILE="$HOME/.zshrc"    ;;
     bash) PROFILE="$HOME/.bashrc"   ;;
     fish) PROFILE="$HOME/.config/fish/config.fish" ;;
     *)    PROFILE="$HOME/.profile"  ;;
   esac

   echo 'export OKKIGO_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"' >> "$PROFILE"
   echo "Saved to $PROFILE — run: source $PROFILE"
   ```

4. **Windows PowerShell**: Set a persistent user-level environment variable.

   ```powershell
   # Set for current session
   $env:OKKIGO_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxx"

   # Persist across sessions (user-level)
   [System.Environment]::SetEnvironmentVariable("OKKIGO_API_KEY", "sk-xxxxxxxxxxxxxxxxxxxx", "User")

   Write-Host "API Key saved. Restart your terminal or open a new PowerShell window to apply."
   ```

5. **Windows CMD**: Set a persistent user-level environment variable.

   ```cmd
   setx OKKIGO_API_KEY "sk-xxxxxxxxxxxxxxxxxxxx"
   ```

   Note: `setx` saves the variable permanently but does NOT update the current session. The user must open a new CMD window.

#### Step 3c: Fallback — manual instructions

If automatic saving fails or the environment cannot be detected, provide the key and a single instruction matching the user's platform:

> Your API Key: `sk-xxxxxxxxxxxxxxxxxxxx`
> Please save this key immediately — it is shown only once.

- **macOS / Linux**: Save `{"apiKey":"sk-xxxxxxxxxxxxxxxxxxxx"}` to `~/.config/okki-go/credentials.json`, then run `chmod 600 ~/.config/okki-go/credentials.json`.
- **Windows PowerShell**: Run `[System.Environment]::SetEnvironmentVariable("OKKIGO_API_KEY", "sk-xxxxxxxxxxxxxxxxxxxx", "User")` then restart your terminal.
- **Platform config**: Use your platform's secrets or environment variable management to set `OKKIGO_API_KEY`.

Once saved, future sessions should pass `bash scripts/resolve-api-key.sh --check` — no re-verification needed.

**Important**: After saving the API Key through platform config or user-level environment variables, prompt the user to restart their current session (close and reopen the AI assistant) so the new value is injected. The local credentials file fallback is available immediately to tools that can read the user's config directory.

---

## Billing Confirmation Rules

These rules protect users from being charged unknowingly. **All workflows must follow them.**

### Rule 1: Confirm before implicit paid API calls

"Implicit" means the user didn't explicitly ask to unlock a company, but the Agent decides to call `/companies/unlock` on its own. In this case, confirm first:

> I found some matching companies. Unlocking a company costs 1 credit per domain (free if unlocked within the last 30 days). Shall I proceed?

**Exception (no confirmation needed):** If the user explicitly said "unlock this company", "get company details", "find emails for this company", etc., treat it as an active request. Call `/companies/unlock` first (if not already unlocked), then proceed to profile/profileEmails directly — these are now free.

### Rule 2: Report charges after every paid API call

After each successful paid API call, include the cost summary at the end of your response:

> This unlock used 1 credit. Remaining balance: XX (monthly) + YY (add-on).

For multiple companies:

> Unlocked 3 companies, using 2 credits (1 was already unlocked within 30 days — no charge). Remaining: XX.

If unsure about the balance, call `GET /api/v1/credit/balance` after the paid call to get the latest numbers.

### Rule 3: First-session confirmation for contact search

Before the **first** call to `POST /contacts/search` in the current session, regardless of whether the user explicitly asked, inform and confirm:

> Contact search costs 1 credit per query. Proceed with the search?

After confirmation, subsequent calls in the same session do not need re-confirmation.

---

## Local State Helper

Use `skill/scripts/okki-state.js` for all local OKKI Go state reads and writes. Do not hand-edit `profile.json` or `viewed.json` with ad hoc shell redirection, `jq`, or inline JSON file writes.

State files:

- Merchant Profile: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/profile.json`, schema v1.1, mode `0600`
- Viewed results: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/viewed.json`, schema v1.1, mode `0600`

Profile helper commands:

```bash
node skill/scripts/okki-state.js profile read
node skill/scripts/okki-state.js profile redact
node skill/scripts/okki-state.js profile upsert --json '<json patch>'
node skill/scripts/okki-state.js profile update-history --json '<axes json>'
node skill/scripts/okki-state.js profile reset
```

Viewed helper commands:

```bash
node skill/scripts/okki-state.js viewed classify --results-json '<api results json>' --window-days 30
node skill/scripts/okki-state.js viewed mark-shown --results-json '<displayed results json>' --brief-summary '<brief summary>'
node skill/scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>'
node skill/scripts/okki-state.js viewed reset
```

The helper only manages local JSON state. It does not authenticate, call OKKI Go APIs, unlock companies, search contacts, or send emails. All API calls still require the Authentication & API Key Setup rules, Billing Confirmation Rules, contact-search confirmation rule, and email-send confirmation rule.

---

## Merchant Profile

The Merchant Profile is the long-term, source-aware business profile for prospecting defaults. Full rules are in [merchant-profile-playbook.md](./references/merchant-profile-playbook.md).

Core behavior:

- Load Profile with `node skill/scripts/okki-state.js profile read` before Prospecting Brief Discovery unless the user is only checking balance, checking email status, or handling authentication.
- Use Lite Onboarding when there is no profile or `completeness < 0.3`, unless the user explicitly requests direct free search and enough search parameters exist.
- Lite Onboarding must collect L0 `profile.company.country`; it anchors dynamic `trade_mode`.
- B class fields such as USPs, applications, certifications, target regions, decision roles, and industry blacklist carry `source` metadata.
- Only `user_confirmed` and `imported` B class values can become Discovery defaults. `agent_inferred` values must be labeled, confirmed, or ignored as defaults.
- Use `profile upsert --json` for confirmed Profile updates and `profile update-history --json` after completed searches to track axes such as geography, industry, and decision role.

Management workflow:

- View/export profiles with `profile redact` by default. Do not print full `sender_email` or other semi-sensitive Profile values unless the user explicitly asks.
- Edit/import values with `profile upsert --json`, preserving source metadata rules.
- Reset with `profile reset` only after explicit confirmation.

Outreach reuse:

- Profile fields may help draft outreach identity, signature, USP, preferred language, and sales context.
- `outreach_identity.preferred_language` is lazy-loaded. Infer a default only when entering outreach, show it to the user, and save it only after confirmation.
- Profile reuse cannot replace recipient/content confirmation and cannot authorize `/emails/send/batch` or `/emails/send/personalized`.

---

## Prospecting Brief Discovery

Prospecting Brief Discovery is the soft gate that turns vague B2B prospecting requests into a session Brief. Full rules are in [discovery-playbook.md](./references/discovery-playbook.md).

When to run:

- Run the Sufficiency Check for company/customer discovery requests.
- Enter Discovery by default when the request lacks clear product/category, geography, role, scale, industry, or target-count dimensions.
- Skip full Discovery when the request already has at least three explicit dimensions, the user says "direct search" / "直接搜" / "skip discovery", or a current-session Brief is already complete.
- If direct search lacks the minimum free-search fields, ask only for product/category and target geography.

Discovery sequence:

1. Load confirmed/imported Profile defaults with `profile read`.
2. If Sales Mentor Mode is enabled, run Business Context BC1/BC2 before the Brief unless direct search defers them.
3. Ask the Five Gray Areas in order: Product and Company Anchor, Industry Context, Geography, Scale and Result Shape, Decision Roles.
4. Use Profile defaults only when source rules allow them.
5. Build the session Brief and map only supported fields to `POST /api/v1/companies/search-advanced`.
6. Derive `trade_mode` from `profile.company.country` and `brief.geo_include`; never persist it.
7. Run Blind-Spot Checklist before the Pre-Search Statement when Sales Mentor Mode is enabled and `trade_mode` permits it.
8. Route through Tier 1 Efficiency Mode, Tier 2 Standard Confirmation, or Tier 3 First-Use Mode.

Hard Guardrails:

- Discovery is a soft gate, not a safety gate.
- Direct-search override can skip Brief questions for free company search only. It cannot authorize `/companies/unlock`, `/contacts/search`, or email sending.
- Authentication, billing confirmation, contact-search confirmation, email-send confirmation, privacy rules, and legal/compliance warnings remain mandatory.
- When `trade_mode = unknown`, free company search may continue if the request is direct and constructible; trade-mode-dependent mentor hooks are skipped or weakened.

Local-only filters:

- `employee_range` and other unsupported search dimensions must be filtered locally after `search-advanced`.
- If local filters produce too few results, scan additional pages as described in `discovery-playbook.md` before deciding that recall is poor.
- Use filtered result count, not raw API total, for Expansion decisions.

---

## Prospecting Expansion

Prospecting Expansion broadens or diversifies company discovery after the first free company search. Full rules are in [expansion-playbook.md](./references/expansion-playbook.md).

Every first-round company search must choose exactly one mode after local-only filtering:

- **Broadening Ladder** when effective results are below 5 and the user did not request strict-only matching. It can make at most one extra free `search-advanced` call for the current Brief.
- **Full Expansion** when effective results remain below `brief.target_count`. Show candidates across the fixed expansion dimensions and wait for user selection before any expanded search.
- **Lite Expansion** when effective results meet or exceed `brief.target_count`. Show exactly two compact "you may not have considered" dimensions after the result table.

Rules:

- Expansion never implies paid unlock, paid contact search, or email sending.
- Full Expansion must include at least 20% reverse recommendations under [sales-mentor-playbook.md](./references/sales-mentor-playbook.md).
- Candidate selections append to a copied expanded Brief and use `crossFieldOperator: "or"`; do not destructively overwrite the original Brief.
- Full Expansion has a maximum of 3 rounds per Brief. Ladder and Lite do not count as Full Expansion rounds unless a Lite candidate starts a later expanded search.

---

## Anti-Staleness Mechanisms

Anti-Staleness prevents repetitive prospecting output and aligns with OKKI Go's 30-day company unlock semantics. Viewed-state rules are in [discovery-playbook.md](./references/discovery-playbook.md#6-result-classification-and-viewed-lifecycle).

Before displaying final company results:

```bash
node skill/scripts/okki-state.js viewed classify --results-json '<final results json>' --window-days 30
```

Display companies in three groups:

1. `unlocked`: paid-unlocked in the active window; free to revisit before the 30-day window expires.
2. `seen`: shown in the active window but not unlocked.
3. `new`: not shown in the active window.

After displaying results:

```bash
node skill/scripts/okki-state.js viewed mark-shown --results-json '<displayed results json>' --brief-summary '<brief summary>'
```

After a successful `/companies/unlock` call:

```bash
node skill/scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>'
```

Rotation Hint:

- Before Brief confirmation, compare the current Brief axes with `profile.history.last_used_axes`.
- Suggest one alternate geography, industry/application, product wording, or decision-role axis when the current axis is repetitive.
- Do not invent axes outside Profile, current-session user input, Brief, or Expansion candidates.
- The user may ignore the hint; it is not a confirmation gate.

Users may ask to reset viewed history. Run `viewed reset` only after explicit confirmation.

---

## Sales Mentor Mode

Sales Mentor Mode adds practical B2B sales reasoning across Discovery, Expansion, and result review. Full rules are in [sales-mentor-playbook.md](./references/sales-mentor-playbook.md).

Default mode:

- Enabled for prospecting workflows unless the user says "关闭导师模式", "neutral search only", or equivalent.
- Keep advice tied to Profile fields, current-session user statements, Brief fields, actual result fields, or fixed playbook logic.
- Apply B'' protection: default sourced advice, at most two `personal inference` items per response, Must NOT Say self-check, and country-agnostic static rules.

Execution hooks:

- Run BC1/BC2 before Discovery unless direct search defers them. Save confirmed answers to `profile.sales_context` with `profile upsert --json`.
- Derive `trade_mode` after the Brief exists.
- Run BC3 only after `trade_mode` is derived and only when mentor mode is enabled.
- Run Blind-Spot Checklist after Brief generation and before Pre-Search Statement or Tier 2 confirmation.
- Enforce reverse recommendations during Full Expansion.
- Run Sales Journey Preview after results are classified into `unlocked`, `seen`, and `new`, and before asking the user what to do next.

When `trade_mode = unknown`, do not invent domestic/cross-border guidance. Continue direct free search when allowed, skip or weaken trade-mode-dependent mentor hooks, and ask for company country later if useful.

---

## User Input Guidance

**Language rule**: Always respond in the same language the user is using. If the user writes in Chinese, reply in Chinese. If the user writes in English, reply in English. This applies to all clarification prompts, result displays, and next-step suggestions.

Route user input by intent:

- **Company/customer discovery:** Run the Sufficiency Check in `discovery-playbook.md`. If the request is vague, use Lite Onboarding, BC1/BC2, and Five Gray Areas instead of inventing ad hoc clarification questions.
- **Direct free search:** Honor explicit direct-search wording when enough free-search fields exist. If not enough fields exist, ask only for product/category and target geography.
- **Contact discovery for selected companies:** Use Workflow A/C company selection and unlock/profileEmails flow. If the user asks for cross-company contact search instead, follow Workflow B and Billing Rule 3.
- **Outreach drafting or sending:** Reuse Profile and Sales Mentor context for drafting, but always confirm recipients and email content before sending.
- **Balance, pricing, authentication, and email status:** Do not run Prospecting Brief Discovery. Execute the direct workflow after authentication where required.
- **Merchant Profile management:** Use the Profile management workflow with redacted view/export by default.

When the user's prospecting request is clear enough, proceed through the appropriate workflow without asking extra questions. When asking a question, use compact options from the playbooks and keep the prompt focused on the next missing decision.

---

## Output Formatting

Present API results in user-friendly format, not raw JSON.

### Company search results

Classify final company results before display with `viewed classify`. Show key info in grouped tables for quick scanning:

### Unlocked

| # | Company | Country | Industry | Employees |
|---|---------|---------|----------|-----------|
| 1 | Example Corp | CN | Manufacturing | 500-1000 |

### Seen

| # | Company | Country | Industry | Employees |
|---|---------|---------|----------|-----------|
| 2 | TechPrint AG | DE | Electronics | 100-500 |

### New

| # | Company | Country | Industry | Employees |
|---|---------|---------|----------|-----------|
| 3 | Northstar Components | US | Auto Parts | 100-500 |

**Important**:
- **DO NOT display the `domain` field to users** — it is an internal identifier used only for calling `/companies/unlock` to obtain `companyHashId`. Exposing it allows users to bypass the system.
- Store the `domain` value internally for each company in the search results, but never include it in the displayed table or text output.
- After displaying results, run `viewed mark-shown` for the displayed companies.
- For 10+ results, show the first 10, state the total, and offer "say 'next page' to see more"
- For zero results, suggest broadening criteria (different keywords, removing country filter, etc.)

**Next Steps Guidance**: After displaying search results, proactively suggest:
- "Select a company to view detailed profile and contact information"
- "I can unlock companies to get decision-maker emails (1 credit per domain)"
- "Refine your search with different keywords or filters"

### Merchant Profile output

Use `profile redact` for profile view/export by default. Show source labels for B class fields and mark `agent_inferred` values as not used for Discovery defaults. Do not print full `sender_email` or other semi-sensitive values unless the user explicitly asks.

### Contact information

| Name | Title | Email | LinkedIn |
|------|-------|-------|----------|
| Hans Mueller | Procurement Manager | hans@techcorp.de | Yes |
| Lisa Schmidt | CEO | — | Yes |

**Next Steps Guidance**: After displaying contacts, proactively ask:
- "Would you like to send outreach emails to these contacts?"
- "I can help you draft a personalized email template"
- "Need to search for more contacts at other companies?"

### Balance information

> **Current Account Balance**
> - Search credits: 80 (monthly) + 400 (add-on) = **480 available**
> - EDM quota: 200 (monthly) + 2000 (add-on) = **2200 available**
> - Monthly quota resets: 2026-04-30

If `monthlyExpiresAt` is null, show:
> - Monthly quota resets: N/A (no active monthly plan)

**Next Steps Guidance**: After displaying balance, suggest based on quota levels:
- If quota is sufficient: "You have enough credits to proceed with your prospecting"
- If quota is low: "Your credits are running low. Would you like to upgrade your plan or purchase credit packs? Visit go.okki.ai/pricing"
- Always offer: "Ready to search for companies or contacts?"

### Email send feedback

After sending:

> Submitted 2 emails (task ID: 1001), status: pending
> Emails are sent asynchronously — actual delivery takes seconds to minutes. Let me know if you'd like to check status later.

When checking status:

> **Task 1001 results**: 48 sent / 2 failed / 50 total
> Failed: bob@globex.com — Invalid email address

**Next Steps Guidance**: After email submission, proactively suggest:
- "I can check the delivery status in a few minutes once processing completes"
- "Would you like to send emails to additional contacts?"
- "Need to search for more prospects in other companies or regions?"

---

## Workflow Orchestration

User requests often span multiple workflows. The Agent needs to understand when to chain steps and when to pause for user decisions.

### Workflow A: Exploration — "Help me find target customers"

1. **Profile load:** Run `node skill/scripts/okki-state.js profile read`. If needed, run Lite Onboarding from Merchant Profile before full Discovery unless the user explicitly requested direct free search.
2. **BC1/BC2:** If Sales Mentor Mode is enabled, collect or reuse Business Context Lite BC1/BC2 before the Brief, unless direct search defers them.
3. **Discovery:** Run the Sufficiency Check and Five Gray Areas from `discovery-playbook.md`, using only confirmed/imported Profile defaults.
4. **Rotation Hint:** Compare current axes with `profile.history.last_used_axes`; show one concise alternate axis if useful.
5. **Derive `trade_mode`:** Use `profile.company.country` plus `brief.geo_include`. Do not persist `trade_mode`.
6. **BC3:** If Sales Mentor Mode is enabled and `trade_mode` is known, ask the trade-mode-aware BC3 channel/approach question.
7. **Blind-Spot Checklist:** Run the Sales Mentor blind-spot check before the Pre-Search Statement or Tier 2 confirmation.
8. **Tier/direct-search routing:** Apply Tier 1, Tier 2, or Tier 3. Direct search can proceed only for free company search and cannot bypass authentication, billing, contact-search, or email-send confirmations.
9. **Search companies:** Call free `POST /api/v1/companies/search-advanced` (see [api-reference.md §2](./references/api-reference.md#2)) after the required tier routing. Request at most `size: 50` per page. For `target_count > 50`, use free pagination (`from: 0`, `from: 50`, then increment by 50) until the effective result target or scan limit is reached.
10. **Local-only filters and pagination:** Apply unsupported filters such as employee range locally and scan extra free `search-advanced` pages within `discovery-playbook.md` limits before judging recall. Do not call `/contacts/search` or `/companies/unlock` to satisfy company-count targets.
11. **Viewed classification:** Run `node skill/scripts/okki-state.js viewed classify --results-json '<effective results json>' --window-days 30` before result presentation.
12. **Expansion decision:** Use the effective filtered result count to run Broadening Ladder, Full Expansion, or Lite Expansion from `expansion-playbook.md`. If Expansion adds or changes final results, run `viewed classify` again on the final merged result set.
13. **Grouped display:** Show `unlocked`, `seen`, and `new` company groups. Keep internal `domain` hidden.
14. **Mark shown:** After display, run `node skill/scripts/okki-state.js viewed mark-shown --results-json '<displayed results json>' --brief-summary '<brief summary>'`.
15. **Sales Journey Preview:** If Sales Mentor Mode is enabled, summarize priority advice, approach advice, and first action using only sourced or bounded inference.
16. **Update axes:** Run `node skill/scripts/okki-state.js profile update-history --json '<geo/industry/decision_role axes>'`.
17. **Wait for user selection:** Do not proactively call paid APIs.
18. **Unlock selected company:** When the user selects a company for details/contacts, follow Billing Rule 1, call `/companies/unlock` (see [api-reference.md §3](./references/api-reference.md#3)), and report charges under Billing Rule 2.
19. **Mark unlocked:** After a successful unlock, run `node skill/scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>'`.
20. **Get contact emails:** Use free profile/profileEmails endpoints after unlock (see [api-reference.md §5](./references/api-reference.md#5)), display contacts, then ask whether the user wants outreach or more searching.

### Workflow B: Contact Search — "Find a specific person"

1. Before the **first** `POST /contacts/search` call in the session, inform the user: "Contact search costs 1 credit per query." Wait for user confirmation before proceeding.
2. Use `POST /contacts/search` to search by name, title, email, or company (see [api-reference.md §6](./references/api-reference.md#6))
3. After confirmation, subsequent calls in the same session do not need re-confirmation.
- Supports filtering by country, has_email, employee count, etc.
- After displaying results, **proactively ask**: "Would you like to send outreach emails to these contacts, or refine the search criteria?"

### Workflow C: Precision — "Send outreach to procurement managers in German auto parts companies"

1. **Front half uses Workflow A discovery/contact finding:** Load Profile, run Discovery or direct-search fallback, apply Sales Mentor hooks, search companies, apply local filters/Expansion, classify with `viewed classify`, display grouped results, mark shown, and update axes.
2. User selects companies → unlock each selected company under Billing Rule 1/2, then run `viewed mark-unlocked` for each successful unlock.
3. Get contacts with the free profile/profileEmails flow and filter by relevant titles or roles from the Brief.
4. Display contact list → **ask user to confirm recipients and email content**.
5. **Never send emails before user confirms** — use `POST /emails/send/batch` for same-template sends (see [api-reference.md §7](./references/api-reference.md#7)).
6. After sending, **proactively suggest**: "Emails submitted successfully. I can check delivery status in a few minutes, or help you search for additional prospects in other regions or industries."

### Workflow D: Personalized Outreach — "Send each company a tailored email"

- Same flow as Workflow C, but use `POST /emails/send/personalized` for unique content per recipient (see [api-reference.md §8](./references/api-reference.md#8))
- Each email should reference the recipient's company/industry context
- After sending, **proactively suggest**: "Personalized emails submitted. Would you like to check delivery status later, or start prospecting a new batch of companies?"

### Workflow E: Check Balance

- Call `GET /api/v1/credit/balance` (free, see [api-reference.md §1](./references/api-reference.md#1))
- Display using the balance format from Output Formatting section
- If quota is low, direct user to [go.okki.ai/pricing](https://go.okki.ai/pricing)
- After displaying, **proactively suggest**: "Would you like to start searching for companies or contacts?"

### Workflow F: Check Email Status — "How did my last batch go?"

- Only call when user asks ("did they send?", "which ones failed?") — do NOT proactively poll
- Use `GET /emails/tasks` for task list, `GET /emails/tasks/:taskId` for details (see [api-reference.md §9-12](./references/api-reference.md#9))
- Task status flow: `pending` → `requested` → `completed` / `partial` / `failed`
- If no email tasks exist, display:
  > No email tasks found. You haven't sent any outreach emails yet.
  > Would you like to start a prospecting workflow?
- After displaying status, **proactively suggest**: "Would you like to resend to failed addresses, or start a new outreach campaign?"

### Core Principles

- **Free operations can be executed proactively**: search companies, check balance, check email status
- **Profile/detail/profileEmails are free but require unlock first** — always call `/companies/unlock` to obtain `companyHashId` before querying these endpoints
- **Paid operations strictly follow Billing Confirmation Rules** — unlock and contact search require confirmation
- **Sending emails always requires explicit user confirmation** of content and recipients
- When in doubt, **show information and let the user decide** rather than deciding for them

---

## Error Handling

For HTTP error codes, handling guidance, and RFC 7807 response format, see [api-reference.md §14](./references/api-reference.md#14).

Key cases to handle gracefully:
- **401**: API Key invalid → guide re-configuration (see Authentication section)
- **402**: Insufficient credits → inform user and direct to [go.okki.ai/pricing](https://go.okki.ai/pricing)
- **403**: Free plan has no EDM access → guide user to upgrade

---

## Pricing

When users ask about plans, upgrades, or credit packs, direct them to the pricing page: [go.okki.ai/pricing](https://go.okki.ai/pricing)

---

## Advanced Reference

For complete request/response schemas, all parameter constraints, and pagination details, see [references/api-reference.md](./references/api-reference.md).

---

## Changelog

### 1.2.0 (2026-05-28)

- Add Merchant Profile with source metadata, sales context, preferred-language lazy load, and local profile state helper support.
- Add Prospecting Brief Discovery with five gray areas, three-tier routing, direct-search fallback, local-only pagination, and session-derived trade_mode.
- Add Prospecting Expansion with Broadening Ladder, Full Expansion, Lite Expansion, reverse recommendations, and bounded multi-round rules.
- Add Anti-Staleness viewed-state lifecycle with unlocked, seen, and new result groups aligned to the 30-day unlock window.
- Add Sales Mentor Mode with country-agnostic rules, Business Context Lite, Blind-Spot Checklist, Sales Journey Preview, Must NOT Say rules, and B'' protection.
- Rewrite Workflow A and the Workflow C discovery/contact-finding front half while preserving billing, contact-search, recipient/content, and email-send confirmations.
