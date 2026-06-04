# Workflow and Output Reference

Use this reference for OKKI Go workflow orchestration and output formats after `SKILL.md` routing and safety rules have been read.

## Output Formats

Present API results in user-friendly form, never raw JSON unless the user explicitly asks.

Normal OKKI Go tool output must be compact and user-facing. Raw API JSON, long email bodies, full profile objects, full local state, and internal identifiers must not be streamed into the model unless the user explicitly asks for raw/debug output. For large raw data, save it to a local file and return a path plus a short summary.

Compact wrappers include `output_budget`, `truncated`, `available`, and `next_offset`. When `truncated` is true, use `next_offset` for follow-up pagination; do not infer hidden rows from chat text.

Default visible caps:

| Output type | Default visible cap | Raw handling |
|---|---:|---|
| Company rows | 50 for single page, requested count for batch, hard cap 100 | Save raw batch file |
| Contacts | 20 visible, hard cap 100 | Save contact batch file |
| profileEmails | 20 visible per company, hard cap 100 | Save company contact file |
| Email task list | 20 tasks | Save raw status file |
| Email task detail mails | Show aggregate + failed rows first | Save full detail file |
| Single email body | Hidden unless explicitly requested | Truncate to 500 chars or save file |
| Viewed/Profile state | Counts/redacted fields only | Full state only under explicit debug/export |

### Company Search Results

Default free company-search display is light and direct. Do not classify historical viewed state or write mark-shown by default.

Suggested table:

```text
| # | Company | Country | Category/Industry | Products/Profile fit | Emails | Employees |
```

Rules:

- Show the API/default first page or the user-requested count when practical.
- Do not hard-code an 8-12 company limit.
- Do not display `domain`, website, homepage, URL, link fields, raw internal IDs, or unlock keys.
- Keep internal identifiers privately mapped to result numbers for later `/companies/unlock`.
- Use `node scripts/search-companies.js --json '<payload>' --compact --save-raw /private/tmp/okki-go-batches/<batch>.json` for normal display.
- Use `node scripts/discover-companies-batch.js --plan <plan.json> --target-count N --save-batch <batch.json> --compact` for broad, paginated, "more", or `N > 20` requests. This emits `private_mapping_saved`, `raw_path`, scanned/deduped/returned counts, latest batch pointer, and compact rows only.
- Batch files and the latest batch pointer have a default 24h TTL. Follow-up row selections such as "the first N", "these companies", "the list above", or explicit row numbers can reuse the latest batch if the pointer exists, is readable, and has not expired.
- For zero or weak results, use at most 3 automatic recovery searches for the current user request, then show the best current result set or ask whether to broaden target-side keywords, change route/company type, change geography, or require emails.

### Optional Viewed Deduplication

Use historical viewed state only when the user explicitly asks for new/non-repeated companies.

```bash
node scripts/okki-state.js viewed classify --results-file /tmp/okki-results.json --window-days 30
node scripts/okki-state.js viewed classify --results-file /tmp/okki-results.json --window-days 30 --compact
node scripts/okki-state.js viewed mark-shown --results-file /tmp/okki-displayed-results.json --brief-summary '<brief summary>' --compact
```

For small payloads, `--results-json` is acceptable. For large result arrays, write JSON to a temp file and use `--results-file PATH`; use `--results-file -` when piping JSON through stdin.

Display groups only in this optional mode:

```text
Unlocked
| # | Company | Country | Industry | Employees |

Seen
| # | Company | Country | Industry | Employees |

New
| # | Company | Country | Industry | Employees |
```

After a successful unlock, mark it when internal domain is available:

```bash
node scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>'
node scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>' --compact
node scripts/okki-state.js viewed mark-unlocked-batch --json '[{"domain":"a.de","country_code":"DE"}]'
```

### Merchant Profile Output

Use `node scripts/okki-state.js profile redact` for profile view/export by default. Do not print full `sender_email` or other semi-sensitive values unless the user explicitly asks.

### Contact Output

```text
| Name | Title | Email | LinkedIn |
```

After displaying contacts, ask whether the user wants outreach drafting, more contacts, or another search.

### Balance Output

```text
Current Account Balance
- Search credits: 80 monthly + 400 add-on = 480 available
- EDM quota: 200 monthly + 2000 add-on = 2200 available
- Monthly quota resets: 2026-04-30
```

If `monthlyExpiresAt` is null, show `N/A`.

### Email Send Feedback

After sending:

```text
Submitted 2 emails (task ID: 1001), status: pending.
Emails are sent asynchronously; delivery can take seconds to minutes.
```

When checking status, show sent/failed/total counts and failure reasons.

## Workflow A: Default Company Discovery

Use when the user asks to find target customers or companies.

1. Run the API key check from `SKILL.md`.
2. Read current-turn product/service, target company/category, geography, buyer route, exclusions, and requested count.
3. Optionally read Profile memory if it is cheap and useful, but do not block the first search on Profile completeness.
4. Build a target-side `search-advanced` payload using [discovery-playbook.md](./discovery-playbook.md).
5. Call free company search with `node scripts/search-companies.js --json '<api payload>'`.
6. If results are zero, sparse, or noisy, run at most 3 automatic recovery searches for this user request.
7. Display results without internal identifiers.
8. Wait for user selection or refinement. Do not proactively call paid APIs.

If the search is not constructible, ask only for the missing product/category or target geography/route.

## Workflow B: Selected Company Details and Emails

Use when the user selects a company and asks for details, emails, or contacts inside that company.

1. Ask explicit unlock confirmation using the wording in `SKILL.md`.
2. Call `/companies/unlock` only after confirmation.
3. Report whether the unlock charged credits and the remaining balance when available.
4. Run `viewed mark-unlocked` when internal domain is available.
5. Use free profile/detail/profileEmails endpoints after unlock.
6. Display contacts and ask for next step.

For row selections from a displayed batch, after confirmation use:

```bash
node scripts/unlock-companies.js --batch <batch.json> --rows 1-5 --mark-unlocked --compact
node scripts/unlock-companies.js --batch latest --rows 1-5 --mark-unlocked --compact
```

`--rows` accepts generic selectors such as `1`, `1,3,7`, or `2-6`; examples are not special cases.

The compact output includes charge count, balance, company names, description previews, first emails/phones, `profile_available`, `emails_total`, and `raw_path`. It must not display `domain` or `companyHashId`. The raw unlock/profile/profileEmails payload remains available through the saved `raw_path`, so compact output is a presentation filter, not data deletion. Use `--detail` only when the user asks for fuller details; show website only if the unlocked profile returns a user-facing website.

Latest batch reuse does not bypass paid confirmation: ask before every `/companies/unlock` call. If the batch file is missing or stale, explain that the private row mapping is unavailable. Re-run a free lookup or ask the user to pick from a new list, then ask explicit paid confirmation before unlocking.

## Workflow C: Cross-Company Contact Search

Use when the user searches people directly across companies.

Before the first `POST /contacts/search` call in the session, state that contact search costs 1 credit per query and wait for confirmation. Subsequent contact searches in the same session do not need re-confirmation unless the user refuses or the scope materially changes.

After confirmation, use:

```bash
node scripts/search-contacts.js --json '<payload>' --save-batch /private/tmp/okki-go-batches/<contacts>.json --compact
```

Default `size` is 20 even if an unconstrained payload says more. Do not print internal contact IDs by default. Do not print phone numbers unless the user asked for phone/contact details. For many contacts, save raw results to a batch file and show compact contact rows only.

## Workflow D: Outreach Drafting and Sending

Drafting is free. Sending is not automatic.

1. Draft from available company/contact/Profile context.
2. Show recipients and content.
3. Ask user to confirm both recipients and content.
4. Never send before explicit confirmation.
5. Use `node scripts/send-email.js batch --compact` for same-template sends or `node scripts/send-email.js personalized --compact` for unique content.

Post-send output must include task IDs/counts and mapping path only. Do not echo full sent bodies or all recipient variables after the send call.

## Workflow E: Explicit Advanced Refinement

Use only when the user asks for more precision, more routes, analysis, saved-profile reuse, or non-repeated companies.

Possible tools:

- Expansion: [expansion-playbook.md](./expansion-playbook.md)
- Sales analysis: [sales-mentor-playbook.md](./sales-mentor-playbook.md)
- Merchant Profile: [merchant-profile-playbook.md](./merchant-profile-playbook.md)
- Viewed deduplication: Optional Viewed Deduplication above

Advanced refinement cannot bypass unlock, contact-search, or email-send confirmations.

## Workflow F: Balance

Call `GET /api/v1/credit/balance`, display the balance format above, and direct low-quota users to https://go.okki.ai/pricing.

## Workflow G: Email Status

Only poll when the user asks. Use `GET /emails/tasks`, `GET /emails/tasks/:taskId`, `GET /emails/mails`, or `GET /emails/mails/:mailId` as needed.

Prefer:

```bash
node scripts/email-status.js tasks --json '{"page":1,"page_size":20}' --compact
node scripts/email-status.js task --task-id 1001 --compact
node scripts/email-status.js mails --json '{"statuses":"failed","page":1,"page_size":20}' --compact
node scripts/email-status.js mail --mail-id 2001 --compact
```

Do not display full email content unless explicitly requested. Task detail should show status, total/sent/failed counts, failed rows first, and `content_omitted`. If the user explicitly asks for body content, show at most a 500-character preview or save the full body to a file.

## Core Principles

- Free company search may be executed proactively after authentication.
- Profile/detail/profileEmails are free but require `/companies/unlock` first.
- Paid operations strictly follow the Billing Confirmation Rules in `SKILL.md`.
- Sending email always requires explicit recipient and content confirmation.
- When unsure, show information and let the user decide.

## Error Handling

For RFC 7807 details and all status codes, see [api-reference.md](./api-reference.md).

Key cases:

- `401`: API key invalid or missing; guide reconfiguration.
- `402`: insufficient credits; stop paid flow and direct to pricing.
- `403`: free plan has no EDM access; guide upgrade.
- `404`: company or task resource not found; confirm the ID came from a valid prior call.
