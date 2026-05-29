---
name: OKKI Go
version: 1.0.13
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
X-Okki-Skill-Version: 1.0.13
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
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.0.13}" \
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
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.0.13}" \
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
      "skillVersion": "1.0.13",
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
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.0.13}" \
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

## User Input Guidance

**Language rule**: Always respond in the same language the user is using. If the user writes in Chinese, reply in Chinese. If the user writes in English, reply in English. This applies to all clarification prompts, result displays, and next-step suggestions.

When user input is vague or incomplete, guide them to provide more specific information:

### Common vague inputs and how to clarify

| User says | Clarify by asking |
|-----------|-------------------|
| Find companies | What industry, country, or keywords? |
| Send email | Who should receive it? Any specific template or content? |
| Check balance | No clarification needed — execute directly |
| Find customers | What type of customers? Which industry or region? |
| Find contacts | Which company? What job title or role? |

### Suggest better phrasing

When clarifying, offer a concrete example in the user's language to help them refine:

- Vague: "Find companies" → Better: "Search for electronics suppliers in Japan with 100-500 employees"
- Vague: "Send email" → Better: "Send outreach to procurement managers at these 5 companies"
- Vague: "Find contacts" → Better: "Find email addresses for CEOs in the automotive industry"

When users provide clear, specific requests, proceed directly without asking for clarification.

---

## Output Formatting

Present API results in user-friendly format, not raw JSON.

### Company search results

Show key info in a table for quick scanning:

| # | Company | Country | Industry | Employees |
|---|---------|---------|----------|-----------|
| 1 | Example Corp | CN | Manufacturing | 500-1000 |
| 2 | TechPrint AG | DE | Electronics | 100-500 |

**Important**:
- **DO NOT display the `domain` field to users** — it is an internal identifier used only for calling `/companies/unlock` to obtain `companyHashId`. Exposing it allows users to bypass the system.
- Store the `domain` value internally for each company in the search results, but never include it in the displayed table or text output.
- For 10+ results, show the first 10, state the total, and offer "say 'next page' to see more"
- For zero results, suggest broadening criteria (different keywords, removing country filter, etc.)

**Next Steps Guidance**: After displaying search results, proactively suggest:
- "Select a company to view detailed profile and contact information"
- "I can unlock companies to get decision-maker emails (1 credit per domain)"
- "Refine your search with different keywords or filters"

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

1. **Search companies** (free, see [api-reference.md §2](./references/api-reference.md#2)) → display results table
2. **Wait for user to select** companies of interest → do NOT proactively call paid APIs
3. User selects → **Unlock company** (follow Billing Rule 1, see [api-reference.md §3](./references/api-reference.md#3)) to get `companyHashId`
4. **Get contact emails** (free, see [api-reference.md §5](./references/api-reference.md#5)) using the `companyHashId`
5. Display contacts → **proactively ask**: "Would you like to send outreach emails to these contacts, or continue searching for more companies?"

### Workflow B: Contact Search — "Find a specific person"

1. Before the **first** `POST /contacts/search` call in the session, inform the user: "Contact search costs 1 credit per query." Wait for user confirmation before proceeding.
2. Use `POST /contacts/search` to search by name, title, email, or company (see [api-reference.md §6](./references/api-reference.md#6))
3. After confirmation, subsequent calls in the same session do not need re-confirmation.
- Supports filtering by country, has_email, employee count, etc.
- After displaying results, **proactively ask**: "Would you like to send outreach emails to these contacts, or refine the search criteria?"

### Workflow C: Precision — "Send outreach to procurement managers in German auto parts companies"

1. Search companies → display results for user confirmation
2. Unlock selected companies (confirm billing) → get `companyHashId` for each
3. Get contacts (free) → filter by relevant titles
4. Display contact list → **ask user to confirm recipients and email content**
5. **Never send emails before user confirms** — use `POST /emails/send/batch` for same-template sends (see [api-reference.md §7](./references/api-reference.md#7))
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
