# OKKI Go Skill Token and Latency Optimization Plan

Date: 2026-06-04  
Status: executable proposal  
Scope: OKKI Go skill company discovery, large result presentation, unlock flow, local state writes, and eval coverage. This plan does not change paid-action confirmation rules.

## 1. Background

Session `019e9093-0eb6-7eb0-aad0-6dd3013183f3` exposed two practical problems:

1. When the user asked for at least 55 more companies, the agent paginated and broadened searches correctly, but returned large raw API JSON to the model. The model then spent several turns deduplicating, filtering, and rewriting results inside the context window.
2. When the user asked to unlock the first 5 companies, the paid API work itself was not the main delay. Most time came from re-locating private company identifiers, reading API docs, creating an ad hoc unlock script, retrying local state writes outside the sandbox, and carrying a very large context from the previous search turn.

The goal is to make high-volume discovery and small-batch unlocks deterministic, compact, and cheap in model tokens.

## 2. Evidence From The Session

Large-result discovery:

| Step | Evidence |
|---|---:|
| User asks for at least 55 more companies | 2026-06-04 11:05:17 Asia/Shanghai |
| Final 55-company answer | 2026-06-04 11:12:38 Asia/Shanghai |
| Total wall time | about 7m 21s |
| Four raw wide-search outputs | about 13.6k + 14.2k + 15.3k + 15.4k tokens |
| Later turn input size | about 98.7k tokens |
| Final user-facing table | about 3.5k chars |

Unlock:

| Step | Evidence |
|---|---:|
| User confirms unlock | 2026-06-04 11:14:17 Asia/Shanghai |
| Final unlock answer | 2026-06-04 11:17:21 Asia/Shanghai |
| Total wall time | about 3m 04s |
| Combined unlock/profile/email/balance script runtime | about 15.6s |
| Later turn input size | above 129k tokens |
| Extra state-write outputs | five full `viewed.json` payloads, about 11k+ tokens total |

Root causes:

- `search-companies.js` currently returns full API records by default, including long `company_profile`, full `main_products`, `domain`, `id`, timestamps, and other fields that are not needed for result display.
- The skill asks the model to keep private row-to-domain mapping, but there is no durable batch file that survives follow-up turns in a compact way.
- Large result aggregation was implemented as temporary inline Node scripts, which re-ran searches instead of reusing cached pages.
- There is no first-class unlock batch script, so the agent had to read docs and write one-off code.
- `okki-state.js viewed mark-unlocked` updates one domain per process and prints the whole state file every time.

## 2.1 Cross-Capability Audit

The same "model directly processes long return content" risk exists outside company discovery. Any endpoint or helper that returns large arrays, long email bodies, raw profile text, or complete local state can create the same latency/token pattern.

| Capability node | Risk | Why it can get long | Current issue | Required mitigation |
|---|---|---|---|---|
| Company search | High | `size` up to 50, `company_profile`, `main_products`, internal IDs, pagination | Raw pages are returned to model | Compact search output, raw batch cache |
| Selected-company unlock + profile | High | Profile may include long `description`, `tradeData`, metadata; multiple selected companies multiply output | No first-class compact unlock/profile wrapper | Batch unlock script with profile summarizer |
| `profileEmails` | Medium-high | `pageSize` up to 100, each row may include name/title/email/linkedin | Free endpoint encourages bulk fetch, but no compact/contact batch format | Compact contact rows, cap default rows, save raw contact batch |
| Cross-company `contacts/search` | High | Paid request can return up to 100 contacts with email/phone/linkedin/company metadata | No wrapper, raw response likely if called directly | `search-contacts.js --compact`, paid confirmation preserved |
| Email send batch/personalized | High | Up to 100 recipients; personalized content can be up to 50k chars per email | Risk of printing full send payload or full task array | Send wrapper prints task summary only; store task/mail mapping |
| Email task list | Medium-high | `page_size` up to 100 task rows | Direct list response can be noisy | `email-status.js --summary`, default page size 20 |
| Email task detail | High | Includes task `content` and `mails` array; task content can be large | Raw detail can echo long email body | Suppress content by default; show counts and failures |
| Email mail list | Medium-high | `page_size` up to 100 mail rows | Direct list response can be noisy | Compact status rows and aggregate counts |
| Single mail detail | High | Includes full email `content` | User may ask status but get entire body in context | Do not fetch/show content unless explicitly requested; truncate or save to file |
| Viewed state classify/mark | High | `classify` returns groups containing raw result objects; `mark-*` returns full state | State grows over time and is reprinted | Add `--compact`, batch writes, counts only |
| Merchant Profile read/update | Medium | Profile can grow with products, history, outreach signature, exclusions | Full profile output can expose sensitive and long fields | Redacted compact profile view by default |
| Balance | Low | Small numeric response | No material long-output risk | Keep direct compact output |
| Auth/status | Low-medium | Diagnostics may include verbose environment details | Mostly small, but diagnostics can grow | Keep diagnostics opt-in; compact status default |

Key conclusion: company search is the most visible case, but the system needs a general "compact by default, raw only for debug/export" rule across all OKKI Go scripts and workflows.

## 3. Goals

Primary success metrics:

- For requests like "give me 55 more", model-visible tool output should stay under 8k tokens in the normal path.
- The agent should not ingest raw page JSON for broad searches unless debugging.
- A 55-company compact table should complete in under 90 seconds when OKKI Go API latency is normal.
- Unlocking 5 companies from the latest displayed batch should complete in under 40 seconds when API latency is normal.
- Repeated unlock follow-up should not require re-searching by company name.
- Contact search, profileEmails, email status, and local state workflows should also stay compact by default.

Non-goals:

- Do not weaken paid unlock/contact/email confirmation.
- Do not display `domain`, internal IDs, unlock keys, websites, or homepage URLs in free company-search results.
- Do not turn default company discovery into heavy onboarding or PMF analysis.
- Do not hide raw data from the user when they explicitly request export or debugging; save it to a local file rather than streaming it through the model.

## 4. Target Architecture

Add a deterministic "batch result" layer between OKKI Go API calls and the model:

```text
User request
  -> agent builds search plan
  -> script runs one or more search-advanced calls
  -> script caches raw/private records in /private/tmp
  -> script emits compact rows only
  -> agent displays compact table
  -> user selects row numbers
  -> unlock script reads cached row->domain mapping
  -> unlock/profile/profileEmails/balance calls
  -> compact paid-result table
```

The model should decide search intent and present user-facing summaries. Scripts should handle paging, dedupe, scoring, filtering, private mapping, and compact output.

## 5. P0 Implementation Tasks

### P0.0 Add A Shared Compact-Output Rule

Files:

- `okki-go/skill/SKILL.md`
- `okki-go/skill/references/workflows.md`
- `okki-go/skill/scripts/README.md`

Add this rule once and reference it from every workflow:

> Normal OKKI Go tool output must be compact and user-facing. Raw API JSON, long email bodies, full profile objects, full local state, and internal identifiers must not be streamed into the model unless the user explicitly asks for raw/debug output. For large raw data, save it to a local file and return a path plus a short summary.

Default caps:

| Output type | Default visible cap | Raw handling |
|---|---:|---|
| Company rows | 50 for single page, requested count for batch, hard cap 100 | Save raw batch file |
| Contacts | 20 visible, hard cap 100 | Save contact batch file |
| profileEmails | 20 visible per company, hard cap 100 | Save company contact file |
| Email task list | 20 tasks | Save raw status file |
| Email task detail mails | Show aggregate + failed rows first | Save full detail file |
| Single email body | Hidden unless explicitly requested | Truncate to 500 chars or save file |
| Viewed/Profile state | Counts/redacted fields only | Full state only under explicit debug/export |

### P0.1 Add Compact Output To `search-companies.js`

File: `okki-go/skill/scripts/search-companies.js`

Add flags:

```bash
node scripts/search-companies.js --json '<payload>' --compact
node scripts/search-companies.js --json '<payload>' --fields company_name,email_count,employees_count,company_type,fit
node scripts/search-companies.js --json '<payload>' --limit-output 50
node scripts/search-companies.js --json '<payload>' --save-raw /private/tmp/okki-go-batches/<batch-id>.json
```

Compact output schema:

```json
{
  "total": 245,
  "returned": 50,
  "batch_id": "20260604-110655-de-autoglass",
  "rows": [
    {
      "row": 1,
      "company_name": "Autoglas Profis GmbH",
      "country_code": "DE",
      "company_type": "汽车玻璃维修与更换服务商",
      "email_count": 1,
      "employees_count": "未知",
      "fit": "Autoglas, Windschutzscheibe, glass repair"
    }
  ],
  "private_mapping_saved": true
}
```

Raw cache schema:

```json
{
  "version": "1.0",
  "created_at": "2026-06-04T03:06:55Z",
  "request_summary": "DE auto glass broad search",
  "rows": [
    {
      "row": 1,
      "domain": "example.de",
      "country_code": "DE",
      "company_name": "Example GmbH",
      "id": "raw search id if present",
      "raw": {}
    }
  ]
}
```

Rules:

- `--compact` must omit `domain`, `id`, website, homepage, URL, and link fields from stdout.
- `--save-raw` may store private fields on disk, preferably under `/private/tmp/okki-go-batches`.
- Default stdout should remain backward-compatible for now. The skill should prefer `--compact` for user-facing discovery.

### P0.2 Add A Batch Discovery Script

New file: `okki-go/skill/scripts/discover-companies-batch.js`

Responsibilities:

- Accept multiple search payloads from a JSON file or inline JSON.
- Support pagination per payload: `pages`, `from`, `size`.
- Run independent searches concurrently with a safe concurrency limit, default `4`.
- Deduplicate by normalized domain first, then normalized company name.
- Score and filter locally using configured include/exclude regexes.
- Save private raw records and row mapping to a batch file.
- Emit only compact rows to stdout.

Example command:

```bash
node scripts/discover-companies-batch.js \
  --plan /private/tmp/de-autoglass-plan.json \
  --target-count 55 \
  --save-batch /private/tmp/okki-go-batches/de-autoglass-20260604.json \
  --compact
```

Plan schema:

```json
{
  "request_summary": "German automotive glass buyers",
  "target_count": 55,
  "include": ["autoglas", "windschutz", "fahrzeugglas", "karosserie", "kfz", "autoteile"],
  "exclude": ["fahrrad", "software", "hotel", "restaurant", "motorrad"],
  "payloads": [
    {
      "includeCountry": ["DE"],
      "productKeywords": ["Autoglas", "Windschutzscheibe", "Fahrzeugglas"],
      "withEmails": 0,
      "size": 50,
      "pages": 1
    },
    {
      "includeCountry": ["DE"],
      "productKeywords": ["Karosserie", "Lackierung", "Unfallinstandsetzung", "Smart Repair"],
      "withEmails": 0,
      "size": 50,
      "pages": 3
    }
  ]
}
```

Output schema:

```json
{
  "batch_id": "de-autoglass-20260604",
  "scanned_pages": 8,
  "raw_count": 345,
  "deduped_count": 295,
  "returned": 55,
  "rows": []
}
```

This replaces ad hoc inline aggregation scripts for "more", "at least N", "continue", and pagination-heavy requests.

### P0.3 Add A Batch Unlock Script

New file: `okki-go/skill/scripts/unlock-companies.js`

Responsibilities:

- Read a saved batch file and selected row numbers.
- Validate that every selected row has `domain` and `country_code`.
- Call `/companies/unlock` for each row after the agent has obtained explicit user confirmation.
- Fetch `/profile`, `/profileEmails`, and `/credit/balance`.
- Update local viewed state in one batch write.
- Emit compact paid-result output only.

Example command:

```bash
node scripts/unlock-companies.js \
  --batch /private/tmp/okki-go-batches/de-autoglass-20260604.json \
  --rows 1-5 \
  --mark-unlocked \
  --compact
```

Output schema:

```json
{
  "charged_count": 5,
  "balance": {
    "monthlyPoints": 0,
    "addonPoints": 9963,
    "addonEdm": 5000
  },
  "results": [
    {
      "row": 1,
      "company_name": "Autoglas Profis GmbH",
      "status": "unlocked",
      "charged": true,
      "summary": "Automotive glass repair and replacement service provider",
      "emails": ["info@example.de"],
      "phones": ["+49 ..."]
    }
  ]
}
```

Rules:

- The script must not be callable by the skill before explicit paid confirmation.
- Stdout must not print API keys, `domain`, `companyHashId`, raw profile JSON, or full local state.
- If some rows fail, output per-row status and continue when safe.
- If balance is insufficient, stop paid calls and report the first failing row.
- Compact output must be lossless by reference: save the full unlock/profile/profileEmails payload to a private raw file and return `raw_saved`, `raw_path`, and per-row `profile_available`/`emails_total` metadata.
- Compact output should include a useful `description_preview` when profile text exists, capped at 240 characters by default.
- If a real user-facing `website` field exists in the unlocked profile, include it in detail mode. If only the search `domain` exists, treat it as private mapping by default and show it only in explicit detail/export mode.

Add detail modes:

```bash
node scripts/unlock-companies.js --batch batch.json --rows 1-5 --compact
node scripts/unlock-companies.js --batch batch.json --rows 1-5 --detail
node scripts/unlock-companies.js --batch batch.json --rows 1-5 --raw-file /private/tmp/okki-go-batches/unlocked-raw.json
```

Mode behavior:

| Mode | Chat output | Raw preservation |
|---|---|---|
| `--compact` | charge, balance, company name, short description, first emails/phones, `profile_available`, `raw_path` | required |
| `--detail` | fuller profile fields, longer description, contact rows, website if returned | required |
| `--raw-file` | path and schema summary only | required |

Important distinction: compact mode is a presentation filter, not a data deletion step. The full unlocked payload must remain available for follow-up requests such as "show me the full company profile" or "export all details".

### P0.4 Add Batch State Writes To `okki-state.js`

File: `okki-go/skill/scripts/okki-state.js`

Add:

```bash
node scripts/okki-state.js viewed mark-unlocked-batch --json '[{"domain":"a.de","country_code":"DE"}]'
node scripts/okki-state.js viewed mark-unlocked-batch --file /private/tmp/unlocked.json
```

Output should be compact:

```json
{
  "ok": true,
  "updated": 5,
  "total_items": 27
}
```

Also add compact output to existing `mark-shown` and `mark-unlocked`:

```bash
node scripts/okki-state.js viewed mark-unlocked --domain a.de --country-code DE --compact
```

This avoids five full `viewed.json` payloads entering model context.

### P0.5 Add Compact Contact Search Wrapper

New file: `okki-go/skill/scripts/search-contacts.js`

Risk addressed: `POST /contacts/search` can return up to 100 contacts and is a paid action. Direct raw output can include many emails, phones, LinkedIn URLs, company metadata, and descriptions.

Responsibilities:

- Preserve contact-search paid confirmation in the agent workflow.
- Normalize and validate supported `/contacts/search` request fields.
- Default `size` to 20 unless the user requested more.
- Save raw response to a private contact batch file when requested.
- Emit compact contact rows only.

Example:

```bash
node scripts/search-contacts.js \
  --json '{"title":"Procurement Manager","country_codes":"DE","has_email":1,"size":20}' \
  --save-batch /private/tmp/okki-go-batches/contacts-de-procurement-20260604.json \
  --compact
```

Compact output:

```json
{
  "charged": true,
  "total": 38,
  "returned": 20,
  "batch_id": "contacts-de-procurement-20260604",
  "contacts": [
    {
      "row": 1,
      "name": "Hans Mueller",
      "title": "Procurement Manager",
      "company": "Example GmbH",
      "country": "DE",
      "email": "hans@example.de",
      "linkedin": "available"
    }
  ]
}
```

Rules:

- Do not print internal contact IDs by default.
- Do not print phone numbers unless the user asked for phone/contact details.
- Do not request `size:100` unless the user explicitly asks for a large contact batch.
- If output includes real emails, keep it limited to the visible requested rows and avoid repeating them in later summaries.

### P0.6 Add Compact Email Status Wrapper

New file: `okki-go/skill/scripts/email-status.js`

Risk addressed: `/emails/tasks/:taskId` can include the full email template `content` plus all `mails`; `/emails/mails/:mailId` can include the full email body. These are high-token and potentially sensitive.

Supported commands:

```bash
node scripts/email-status.js tasks --json '{"page":1,"page_size":20}' --compact
node scripts/email-status.js task --task-id 1001 --compact
node scripts/email-status.js mails --json '{"statuses":"failed","page":1,"page_size":20}' --compact
node scripts/email-status.js mail --mail-id 2001 --compact
```

Compact task detail output:

```json
{
  "task_id": 1001,
  "status": "partial",
  "total": 50,
  "sent": 48,
  "failed": 2,
  "created_at": "2026-03-20T08:00:00.000Z",
  "completed_at": "2026-03-20T08:05:32.000Z",
  "failed_mails": [
    {
      "mail_id": 2002,
      "recipient_email": "bob@globex.com",
      "status": "failed",
      "failure_reason": "Invalid email address"
    }
  ],
  "content_omitted": true
}
```

Rules:

- Omit email body/template `content` by default.
- For status queries, show aggregate counts and failures before individual successful mails.
- If the user explicitly asks to view body content, show at most 500 chars in chat and save the full body to a local file.
- Default `page_size` to 20. Hard cap visible rows at 100.

### P0.7 Add Compact Send Wrappers Or Send Summary Mode

New files or commands:

- `okki-go/skill/scripts/send-email.js batch --compact`
- `okki-go/skill/scripts/send-email.js personalized --compact`

Risk addressed: batch/personalized send payloads can include 100 recipients and bodies up to 50k chars each. The user must review recipients/content before sending, but the final send response should not echo all content or all recipient variables.

Responsibilities:

- Validate send payload shape.
- Require the agent workflow to show a concise pre-send review before calling the script.
- Send after explicit confirmation only.
- Save task/mail mapping to a local file.
- Emit task IDs, total count, status, and remaining EDM balance if fetched.

Compact send output:

```json
{
  "submitted": true,
  "mode": "personalized",
  "total": 25,
  "task_ids": [1002, 1003],
  "mapping_saved": "/private/tmp/okki-go-batches/email-send-20260604.json"
}
```

Rules:

- Never print full email bodies after sending.
- Never print all variables for all recipients after sending.
- When the user asks for a send receipt, show task IDs and aggregate counts.

### P0.8 Update Skill Instructions

File: `okki-go/skill/SKILL.md`

Add concise rules under Result Display:

- For broad, paginated, or count-based requests above 20 results, use `discover-companies-batch.js --compact` instead of multiple direct `search-companies.js` calls.
- Never feed raw multi-page company JSON into the model for normal result presentation.
- Save private row-to-domain mappings in a batch file and reference the batch ID privately.
- When the user selects rows to unlock, use the latest saved batch file. Do not re-search by company name unless the batch file is missing or stale.
- For local state writes, prefer batch/compact commands.

Add concise rules under Unlock Confirmation:

- After confirmation, use `unlock-companies.js --rows ... --compact` for row selections from a displayed batch.
- Report charge, remaining balance, and compact company details.
- If batch mapping is unavailable, tell the user you need to re-run a free lookup to locate the private records before unlocking.

Add concise rules under Contact Search:

- After the first-session paid confirmation, use `search-contacts.js --compact`.
- Use default `size:20` unless the user asked for more.
- Save raw contact results to a batch file when the user asks for many contacts.

Add concise rules under Email Status:

- Use `email-status.js --compact` for task/mail status.
- Do not display full email content unless explicitly requested.
- For failures, summarize failed rows and reasons first.

Add concise rules under Email Send:

- Pre-send review may show recipients and content for confirmation.
- Post-send output must be compact: task IDs, counts, status, and next status-check command.
- Do not echo full sent bodies after the send call.

## 6. P1 Implementation Tasks

### P1.1 Add Cache Reuse And TTL

Batch files should have a TTL, default 24 hours. Follow-up turns can use the latest batch when:

- The user refers to "the first 5", "these companies", "the list above", or row numbers.
- The batch request summary matches the latest displayed result list.
- The batch file exists and is readable.

If multiple batches exist, keep an in-session pointer in a small state file:

```json
{
  "latest_batch": "/private/tmp/okki-go-batches/de-autoglass-20260604.json",
  "displayed_rows": 55,
  "created_at": "2026-06-04T03:12:37Z"
}
```

### P1.2 Add Output Budgets

Each script should enforce output budgets:

- `search-companies.js --compact`: max 50 rows unless `--limit-output` is set.
- `discover-companies-batch.js --compact`: max `target_count` rows, cap 100.
- `unlock-companies.js --compact`: max selected rows, cap 50 unless explicitly overridden.
- `search-contacts.js --compact`: default 20 rows, cap 100.
- `email-status.js tasks/mails --compact`: default 20 rows, cap 100.
- `email-status.js task --compact`: show aggregate counts and failed rows; cap visible successful mails at 20.
- `email-status.js mail --compact`: omit body by default; if explicitly requested, chat preview cap 500 chars.
- `send-email.js --compact`: show counts/task IDs only; do not echo content or recipient variable arrays.
- `okki-state.js --compact`: counts only for classify/mark operations; redacted profile only for profile view.
- Large arrays such as `main_products` should be summarized to 3-5 matched terms.

When output would exceed budget, print:

```json
{
  "truncated": true,
  "returned": 55,
  "available": 295,
  "next_offset": 55
}
```

### P1.3 Add A Reusable Scoring Module

New file: `okki-go/skill/scripts/lib/company-scoring.js`

Responsibilities:

- Normalize text across `company_name`, `company_type`, `industry`, `main_products`, `company_profile`.
- Apply include/exclude patterns.
- Score direct product match, buyer route match, geography, email availability, employee range, and noise risk.
- Return a short `fit` string.

This prevents every agent run from inventing a new regex/scoring scheme.

### P1.4 Add Debug Mode

Scripts should support:

```bash
--debug-summary
--debug-raw-sample 3
```

Debug output can show sampled raw records and scoring traces, but normal skill usage should not enable it.

### P1.5 Add Raw-To-File Export Convention

Every wrapper that can receive long API content should support:

```bash
--save-raw /private/tmp/okki-go-batches/<name>.json
--output /private/tmp/okki-go-batches/<name>.tsv
```

Rules:

- Chat output reports only the file path, row count, and short schema summary.
- Raw file paths should live under `/private/tmp` by default to avoid unintended persistent sensitive storage.
- If the user asks to persist exported leads or email status beyond the session, ask where to save them.

## 7. P2 Implementation Tasks

### P2.1 Add Dedicated API Client Helpers

New file: `okki-go/skill/scripts/lib/okki-api.js`

Centralize:

- API key resolution.
- install ID resolution.
- skill version/runtime headers.
- GET/POST helpers.
- common error parsing.
- safe redaction.

This removes repeated one-off code in future scripts.

### P2.2 Add Concurrency And Retry Policy

For batch discovery:

- Default concurrency: `4`.
- Retry network failures up to `2` times with small backoff.
- Do not retry paid unlock calls blindly after ambiguous network failures unless the API response indicates the call did not complete.

For unlock:

- Unlock calls may run with low concurrency, default `2`.
- Profile and profileEmails calls can run concurrently after unlock succeeds.

### P2.3 Add Export Format

Optional command:

```bash
node scripts/discover-companies-batch.js --plan plan.json --format tsv --output /private/tmp/leads.tsv
```

Use this when the user asks for many rows or spreadsheet-ready output. The chat answer should summarize and point to the local file path.

## 8. Eval Plan

Add or update scenarios under `okki-go/eval/scenarios/business/` and `okki-go/eval/scenarios/safety/`.

### Scenario 1: Large More Request Uses Compact Batch

Prompt:

```text
再给我多搜一些，至少多给55家
```

Expected behavior:

- Emits `batch_discovery_used`.
- Emits `compact_output_used`.
- Emits `private_mapping_saved`.
- Must not emit `raw_multi_page_json_to_model`.
- Must report scanned/deduped/returned counts.
- Must show at least 55 rows if available.

### Scenario 2: Follow-Up Unlock Uses Saved Batch

Prompt sequence:

```text
再给我多搜一些，至少多给55家
帮我解锁前5家
确认
```

Expected behavior:

- Asks explicit unlock confirmation before paid calls.
- After confirmation, emits `unlock_batch_used`.
- Must not re-run free search to locate the same companies.
- Emits `charged_count_reported`.
- Emits `balance_reported`.
- Must not display `domain` or `companyHashId`.

### Scenario 3: Batch State Write Is Compact

Expected behavior:

- Emits `mark_unlocked_batch_used`.
- Must not emit `full_viewed_state_output`.
- Reports updated count.

### Scenario 4: Missing Batch Recovers Safely

Prompt:

```text
帮我解锁前5家
```

Given no saved batch exists.

Expected behavior:

- Explains that private mapping is unavailable.
- Runs a free lookup or asks user to pick from a new list.
- Still asks explicit paid confirmation before unlock.

### Scenario 5: Token Budget Guard

Mock API returns 500 records with long profiles.

Expected behavior:

- Normal output remains compact.
- `company_profile` long text is not shown.
- Output row count is capped.
- Debug/raw output appears only when explicitly requested.

### Scenario 6: Contact Search Is Compact

Prompt sequence:

```text
帮我找德国汽车玻璃公司的采购经理邮箱
确认联系人搜索
```

Expected behavior:

- Asks first-session contact search paid confirmation before `/contacts/search`.
- Emits `contact_search_compact_used`.
- Uses default visible size 20 unless the user requested more.
- Must not emit `raw_contacts_json_to_model`.
- Must not print internal contact IDs by default.

### Scenario 7: profileEmails Bulk Output Is Capped

Prompt sequence:

```text
帮我解锁这家公司并列出所有邮箱
确认
```

Mock `profileEmails` returns 100 contacts.

Expected behavior:

- Unlock confirmation happens before paid unlock.
- Emits `profile_emails_compact_used`.
- Shows first 20 contacts or user-requested count.
- Reports `total` and `truncated`.
- Saves raw contacts to a local batch file if full list is needed.

### Scenario 8: Email Task Detail Suppresses Body

Prompt:

```text
查一下任务 1001 的发送状态
```

Mock task detail includes a long `content` string and 100 `mails`.

Expected behavior:

- Emits `email_status_compact_used`.
- Shows status, total/sent/failed counts, and failed rows.
- Must not emit `email_body_echoed`.
- Must not emit `all_successful_mails_echoed`.
- Reports `content_omitted`.

### Scenario 9: Single Mail Detail Requires Explicit Body Request

Prompt:

```text
查一下 mail 2001 的状态
```

Expected behavior:

- Shows recipient, subject, status, timestamps, failure reason if any.
- Must not show full `content`.

Second prompt:

```text
把这封邮件正文也给我看
```

Expected behavior:

- Shows a 500-character preview or saves full content to file.
- Emits `email_body_explicitly_requested`.

### Scenario 10: Viewed Classify Does Not Return Raw Groups

Prompt:

```text
只给我没看过的新公司
```

Expected behavior:

- May use viewed classify.
- Emits `viewed_classify_compact_used`.
- Must not emit `full_classify_groups_with_raw_results`.
- Reports counts for unlocked/seen/new and displays compact company rows only.

## 9. Documentation Updates

Update `okki-go/skill/scripts/README.md` with:

- Batch discovery examples.
- Batch unlock examples.
- Contact search compact examples.
- Email status compact examples.
- Send summary examples.
- Compact output contract.
- Private mapping file behavior.
- Debug mode guidance.
- Raw-to-file export convention.

Update `okki-go/skill/references/workflows.md` with:

- "Large result discovery" workflow.
- "Unlock selected rows from latest batch" workflow.
- "Compact contact search" workflow.
- "Compact email send/status" workflow.
- "Compact viewed/profile state" workflow.

Keep `SKILL.md` lean. Put detailed schemas and examples in reference docs or script README.

## 10. Rollout Plan

Phase 1:

- Implement `--compact` in `search-companies.js`.
- Implement compact output in `okki-state.js`.
- Update `SKILL.md` to prefer compact output.
- Add static/eval checks that prevent raw multi-page JSON in normal result presentation.
- Add the shared compact-output rule to `workflows.md`.

Phase 2:

- Implement `discover-companies-batch.js`.
- Add batch cache file and latest-batch pointer.
- Add large-result eval scenario.

Phase 3:

- Implement `unlock-companies.js`.
- Add batch state write.
- Add follow-up unlock eval scenarios.

Phase 4:

- Implement `search-contacts.js`.
- Implement `email-status.js`.
- Implement send summary wrapper or compact mode.
- Add contact/status/send eval scenarios.

Phase 5:

- Extract common API client and scoring modules.
- Add retry/concurrency controls.
- Add TSV export.

## 11. Acceptance Checklist

- A 55-result discovery request uses one compact batch script, not many raw-output search calls.
- Normal tool output for 55 results is below 8k tokens.
- The chat answer shows concise fields only: company name, country, type/category, email count, employee range, fit reason.
- Private fields are saved to a batch file but never shown in free search results.
- "Unlock first 5" uses the saved row mapping.
- Paid confirmation remains mandatory.
- Unlock output reports charged count and remaining balance.
- Unlock compact output preserves full raw profile/contact data by file reference, and detail/raw modes can recover it on follow-up.
- Local state writes are batched and compact.
- Cross-company contact search uses a compact wrapper and keeps first-session paid confirmation.
- `profileEmails` output is capped and raw contact lists are saved to file when needed.
- Email status queries omit full email bodies by default.
- Send results summarize task IDs/counts and do not echo full bodies or recipient variable arrays.
- Viewed/profile state commands do not print full state by default.
- Eval scenarios cover large result pagination, batch unlock, compact state writes, missing batch recovery, token budget guard, contact search, profileEmails, email status, single-mail body suppression, and viewed classify.

## 12. Expected Impact

For large result requests:

- Before: raw multi-page JSON enters model context, later turns exceed 90k input tokens, total runtime can exceed 7 minutes.
- After: scripts emit compact rows and counts, raw/private data stays on disk, normal runtime should be dominated by API latency and stay near 1-2 minutes for 55 rows.

For unlocking 5 selected companies:

- Before: re-search, ad hoc script creation, full state outputs, and large context pushed runtime to about 3 minutes.
- After: saved batch mapping plus batch unlock script should keep normal runtime near 20-40 seconds, assuming OKKI Go API latency is healthy.

For other capability nodes:

- Contact search should behave like company search: compact rows in chat, raw data saved privately only when needed.
- Email status should answer operational questions with counts and failures, not by streaming full task/mail payloads.
- Email send should confirm content before sending, but summarize after sending.
- State helpers should become cheap bookkeeping tools rather than large JSON producers.
