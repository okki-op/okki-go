---
name: OKKI Go
version: 1.2.1
description: "B2B lead prospecting and outreach via the Okki Go platform. Use this skill to (1) search global companies, (2) find decision-maker contact emails, (3) send cold outreach emails/EDM, (4) check email delivery status, (5) check credits/quota balance, or (6) upgrade plans/buy credits. Do NOT trigger if the user wants to search ON a DIFFERENT platform (e.g. 'search 1688 for suppliers', 'find products on Alibaba'). Having a product listing on another platform is fine - only skip when the search action itself targets another platform. Also NOT for: reading incoming emails, CRM management, or account settings."
homepage: "https://go.okki.ai"
requires:
  - node
  - curl
  - jq
env:
  OKKIGO_API_KEY:
    required: false
    description: "Optional API Key override for Okki Go platform; user-level credential cache is also supported"
---

# OKKI Go

OKKI Go helps users quickly find B2B prospect companies, unlock selected company details, find decision-maker emails, draft/send outbound email, and check balance or email status.

Default principle: translate the user's business description into target-company profile keywords, run the free company search quickly, and let paid unlock/contact/email actions wait for explicit confirmation.

References:

- Authentication, resolver, signup, and save-key details: [authentication.md](./references/authentication.md)
- API parameters, response schemas, and error details: [api-reference.md](./references/api-reference.md)
- Default company discovery and target-side keyword rules: [discovery-playbook.md](./references/discovery-playbook.md)
- Workflow and output details: [workflows.md](./references/workflows.md)
- Optional Merchant Profile memory: [merchant-profile-playbook.md](./references/merchant-profile-playbook.md)
- Explicitly triggered expansion: [expansion-playbook.md](./references/expansion-playbook.md)
- Explicitly triggered sales analysis: [sales-mentor-playbook.md](./references/sales-mentor-playbook.md)

## Routing

Use this skill when the user wants to:

- Find companies, customers, buyers, importers, distributors, channels, target accounts, or prospects.
- Get decision-maker emails for selected companies.
- Search contacts by name, title, company, country, or email.
- Draft or send outbound cold emails/EDM.
- Check credit/EDM balance, email task status, or delivery results.
- Upgrade plans or buy credit packs.

Do NOT use this skill when:

- Reading incoming email, managing inboxes, CRM pipelines, deals, or sales forecasts.
- The user explicitly wants to search on another platform such as 1688, Alibaba, Google Maps, Amazon, LinkedIn, or a marketplace. Having a product listing on another platform is fine; searching on that platform is out of scope.

## Quick Start

Before the first OKKI Go API call in each session:

```bash
bash scripts/resolve-api-key.sh --check
```

If it returns `NO_KEY`, follow [authentication.md](./references/authentication.md). Never print, log, or store API keys outside a user-approved secure save path.

For free company discovery, prefer the deterministic wrapper:

```bash
node scripts/search-companies.js --json '<search-advanced payload>' --compact --locale '<user-locale>'
```

The wrapper normalizes `withEmails`, `crossFieldOperator`, pagination, auth headers, and supported fields before calling the free `search-advanced` endpoint.

## Default Company Discovery

Default company discovery is the MVP path. Do not turn it into research, onboarding, or consultation unless the user explicitly asks.

## Mandatory Prospecting Preflight

Before prospecting, authenticate and use only current-turn facts plus optional Profile memory that is cheap to read. Profile memory can help but must not block the first free search.

First-search goal: get usable recall quickly. Translate the user's words into OKKI index-language target-company terms, then search with one keyword dimension plus geography if the user specified it. Do not add a separate visible validation step before the first free search.

Flow:

1. Authenticate.
2. Read the latest user request and optional Profile memory.
3. Treat the current user request as the source of truth for this search.
4. Build a recall-first target-side `search-advanced` payload.
5. Run the free company search.
6. Display the returned companies in a user-friendly list without internal identifiers.
7. Ask which company the user wants to unlock or what refinement they want next.

Do not run these by default before the first free company search:

- PMF Gate or full Brief confirmation.
- Lite Onboarding or Merchant Profile completeness checks.
- Query Plan Portfolio.
- Expansion or unbounded recovery searches.
- Sales Mentor analysis.
- Historical `viewed` classification or mark-shown writes.
- Large local scoring, ranking, or model-heavy deduplication.

First-search guardrails:

- Do not default to "email-only" results. Set `withEmails: 1` only when the user asks for companies with email addresses or makes email availability central to the request.
- Use exactly one keyword dimension by default: choose only one of `productKeywords`, `companyTypeKeywords`, or `industryKeywords`. Add `includeCountry` only when the user specifies geography.
- Prefer `productKeywords` for Round 1 unless the user's request is primarily a company-type/category search with no product or application terms.
- Put 2-5 same-dimension terms in that field when useful: synonyms, upstream category words, application words, service words, procurement language, or local-language words.
- Treat extra dimensions from the user, such as importer, manufacturer, distributor, certification, employee size, decision role, and abstract industry, as soft display or recovery clues instead of first-search hard filters.
- Do not use `industryKeywords` in Round 1 by default. It is usually a later refinement field.
- Do not use `crossFieldOperator: "AND"` in Round 1 by default.
- Do not copy the user's own company identity into target keywords. Convert merchant-side context into target-company categories, routes, or procurement language.
- Do not use `crossFieldOperator: "OR"` as the default recovery move. First change target-side terms, remove an over-narrow field, remove `withEmails`, or adjust route scope.
- Do not combine unrelated buyer routes in one payload.

Ask a short clarifying question only when the free search is not constructible, usually because both product/category and target geography or buyer route are missing. If the user already gave product/company type but not geography, ask only for target geography or buyer route.

Automatic recovery budget:

- If the first free search is zero, sparse, or clearly noisy, you may run lightweight free recovery searches before asking the user.
- Each additional `search-companies.js` invocation after the first search counts as one automatic recovery round.
- Run at most 3 automatic recovery rounds for one user request.
- Use the recovery gradient from [discovery-playbook.md](./references/discovery-playbook.md): first recover by target-side rewrite, then by buyer-route shift, then by narrow-field cleanup. Do not repeat the same failed keyword pattern.
- After the budget is used, stop and show the best current results or explain that the search is still weak, then ask the user whether to continue refining.
- A new user request such as "more", "continue", or "make it more precise" may start a new recovery budget.

## Keyword Rule

For company discovery, user-provided products, services, websites, certifications, and business descriptions are merchant-side context first.

Do not mechanically copy the user's own product/business term into `productKeywords`.

If the user directly names the target company profile, such as "Find German auto glass importers", treat that as a direct target-company request but still keep Round 1 recall-first. Use product/category index-language terms with the requested geography first; keep company type words such as `importer` for display filtering or recovery.

Generate concise target-side keywords that describe the target company's own profile:

- Products they sell, carry, service, install, distribute, procure, or list as business categories.
- Company types such as `importer`, `distributor`, `dealer`, `retailer`, `wholesaler`, `installer`, or `contractor`.
- Industries or application categories the target company belongs to.

Avoid long combined phrases such as `"auto glass importer"` inside `productKeywords`. Put route words in `companyTypeKeywords` and product/category words in `productKeywords`.
For Round 1, choose only one of those dimensions for the API payload. The other dimensions remain useful for later recovery or for explaining fit in the displayed results.

Examples:

| User says | Treat as | Better target-side payload direction |
|-----------|----------|--------------------------------------|
| "I am an auto glass manufacturer; find German customers." | Merchant product is auto glass. | Round 1: `productKeywords`: `["auto parts", "automotive glass", "vehicle parts", "Autoglas"]`; `includeCountry`: `["DE"]`. Use importer/distributor/dealer as soft or recovery clues. |
| "We sell door locks; find US prospects." | Merchant product is door locks. | Round 1: `productKeywords`: `["door hardware", "building hardware", "security hardware"]`; `includeCountry`: `["US"]`. Use distributor/dealer/installer later if needed. |
| "Find Middle East auto parts importers." | User directly names target companies. | Round 1: `productKeywords`: `["auto parts", "automotive aftermarket", "vehicle parts"]`; country codes for the chosen Middle East markets. Keep importer for display filtering or recovery. |

For details and country normalization, read [discovery-playbook.md](./references/discovery-playbook.md).

## Search Payload Rules

`POST /api/v1/companies/search-advanced` is free and supports only:

- `companyTypeKeywords`
- `productKeywords`
- `industryKeywords`
- `includeCountry`
- `excludeCountry`
- `withEmails`
- `crossFieldOperator`
- `from`
- `size`

Rules:

- Use ISO 3166-1 alpha-2 country codes.
- Use `size` from the user's requested count when practical; default wrapper behavior is acceptable when no count is specified.
- `size` must be at most 50. For larger requested counts, paginate free search with `from`.
- `withEmails` is `1` or `0`. Omit it or set `0` unless the user asked for email-only leads.
- `crossFieldOperator` is `"AND"` or `"OR"`. Omit it when a simple payload is enough. Use `"AND"` only when every chosen field should be required. Use `"OR"` only for a deliberate broad scan, not as the first recovery reflex.
- Do not invent unsupported filters such as `employee_range`, `decision_roles`, `website`, `homepage`, `contacts`, or `limit`.
- Employee range and similar unsupported dimensions are local-only filters.
- Decision roles are used later for contact lookup or email drafting, not company-search keywords.

## Result Display

Free search results should be fast and close to the API response.

Rules:

- Normal OKKI Go tool output must be compact and user-facing. Raw API JSON, long email bodies, full profile objects, full local state, and internal identifiers must not be streamed into the model unless the user explicitly asks for raw/debug output.
- If the user specifies a count, request and show that count when practical.
- If the user does not specify a count, show the API/default first page or a reasonable first page.
- Do not hard-code an 8-12 company display rule.
- Do not run historical viewed deduplication by default.
- Do not display `domain`, website, homepage, URL, link fields, raw internal IDs, or unlock keys in free company-search results.
- Apply display/privacy rules silently. Do not tell the user that domain, website, URL, ID, unlock, batch, raw, or private-mapping fields were hidden, omitted, filtered, or saved unless the user explicitly asks for raw/debug details.
- Do not show compact wrapper metadata such as `batch_id`, `raw_path`, `private_mapping_saved`, or `output_budget` in normal user replies; use it only internally for pagination and follow-up row selections.
- Keep internal identifiers privately mapped to result numbers for later unlock.
- Pass `--locale '<user-locale>'` to compact company-search, batch-discovery, and unlock commands when practical.
- Show country/region as the localized `country_name` that matches the user's language. Use `country_code` only as an internal fallback when no localized name is available.
- Show concise fields such as company name, localized country/region, industry/category, products/profile fit, email count, employee range, and why it may fit.
- For broad, paginated, "more", or count-based requests above 20 results, use `discover-companies-batch.js --compact --locale '<user-locale>'` instead of multiple direct `search-companies.js` calls.
- Never feed raw multi-page company JSON into the model for normal result presentation.
- Save private row-to-domain mappings in a batch file and reference the batch ID privately.
- Compact wrappers include `output_budget`, `truncated`, `available`, and `next_offset`; use those fields for "show more" pagination instead of guessing.
- When the user refers to row numbers, "the first N", "these companies", or "the list above", use the latest saved batch pointer within the 24h TTL. Do not re-search by company name unless the latest batch file is missing, unreadable, or expired.
- For local state writes, prefer batch/compact commands such as `mark-unlocked-batch`.

After results, present the companies directly in the user's language and ask one simple next step:

```text
Found <N> matching companies:

| # | Company | Country | Category/Industry | Products/Profile fit | Emails | Employees |
| 1 | ... | ... | ... | ... | ... | ... |

Pick a company number to unlock details and emails, or tell me how to refine the search.
```

Do not add a preface or footnote explaining which internal fields are not shown.

If the user explicitly asks for "new only", "not the same as last time", "exclude viewed", or similar, then use `scripts/okki-state.js viewed` as described in [workflows.md](./references/workflows.md). Otherwise skip it.

## Capabilities and Costs

| Feature | Endpoint Type | Cost |
|---------|---------------|------|
| Company search | `POST /companies/search-advanced` | Free |
| Unlock selected company | `POST /companies/unlock` | 1 credit, 30-day domain dedup |
| Company profile/detail | profile endpoints after unlock | Free |
| Selected-company emails | `profileEmails` after unlock | Free |
| Cross-company contact search | `POST /contacts/search` | 1 credit/request |
| Batch outreach | `POST /emails/send/batch` | 1 EDM quota/email |
| Personalized outreach | `POST /emails/send/personalized` | 1 EDM quota/email |
| Email status and balance | status/balance endpoints | Free |

## Billing and Send Guardrails

These rules are non-bypassable.

### Unlock Confirmation

Before every `/companies/unlock` call, ask for explicit credit confirmation unless the same user turn already names the selected company and explicitly accepts the unlock credit cost.

A user-selected company is not enough to spend credits; ask for explicit unlock confirmation first. "Find emails", "get contacts", "show details", Profile reuse, Direct Search, PMF Gate skip, Expansion, and Sales Mentor recommendations also cannot authorize `/companies/unlock` without a separate credit confirmation.

Use wording like:

```text
Unlocking this company costs 1 credit unless it was unlocked in the last 30 days. Proceed?
```

After every paid call, report the charge and remaining balance. If unsure, call `GET /api/v1/credit/balance`.

After confirmation, use `unlock-companies.js --rows ... --compact --locale '<user-locale>'` with `--batch latest` for row selections from the most recently displayed batch, or pass the explicit batch path when known. Report charge, remaining balance, and compact company details. If batch mapping is unavailable or expired, tell the user you need to re-run a free lookup to locate the private records before unlocking. Latest batch reuse never replaces the required paid confirmation.

### Contact Search Confirmation

Before the first `POST /contacts/search` in a session, state that contact search costs 1 credit per query and wait for confirmation.

After the first-session paid confirmation, use `search-contacts.js --compact`. Use default `size:20` unless the user asked for more. Save raw contact results to a batch file when the user asks for many contacts.

### Email Send Confirmation

Never send email before the user explicitly confirms both recipients and content. Profile, Discovery, Expansion, or Sales Mentor context can draft content but cannot replace send confirmation.

Pre-send review may show recipients and content for confirmation. Post-send output must be compact: task IDs, counts, status, and next status-check command. Do not echo full sent bodies after the send call; use `send-email.js ... --compact`.

### Email Status

Use `email-status.js --compact` for task/mail status. Do not display full email content unless explicitly requested. For failures, summarize failed rows and reasons first.

## Optional Profile Memory

Merchant Profile remains optional memory, not a default gate.

Rules:

- Current user input overrides Profile for the current search.
- Missing or incomplete Profile must not block the first free company search.
- Do not start Lite Onboarding during default company discovery.
- Use Profile only when it helps without delay, or when the user explicitly asks to save/reuse company information.
- Do not persist current-turn facts unless the user confirms saving.
- Profile reuse cannot authorize unlock, contact search, or email sending.

Use `scripts/okki-state.js` for local state; do not hand-edit OKKI Go state files.

Common commands:

```bash
node scripts/okki-state.js profile read
node scripts/okki-state.js profile redact
node scripts/okki-state.js profile upsert --json '<json patch>'
node scripts/okki-state.js viewed mark-unlocked --domain '<internal domain>' --country-code '<ISO>'
```

## Explicit Advanced Modes

Use advanced modes only when the user asks for them or the first simple search needs user-approved refinement.

Examples of explicit triggers:

- "Find more", "continue expanding", "try another route".
- "Make it more precise", "filter these", "analyze these customers".
- "Do not repeat companies from last time".
- "Save my company info" or "reuse my profile".
- "Write a cold email" or "help me send outreach".

Advanced capabilities:

- Expansion: read [expansion-playbook.md](./references/expansion-playbook.md).
- Sales analysis or journey advice: read [sales-mentor-playbook.md](./references/sales-mentor-playbook.md).
- Profile setup/save/reuse: read [merchant-profile-playbook.md](./references/merchant-profile-playbook.md).
- Historical viewed deduplication: read [workflows.md](./references/workflows.md).

Advanced modes still cannot bypass paid or send confirmations.

## Workflow Routing

- **Company/customer discovery:** use Default Company Discovery and [discovery-playbook.md](./references/discovery-playbook.md).
- **Selected-company details/emails:** ask unlock credit confirmation, call `/companies/unlock`, mark unlocked when internal domain is available, then use free profile/profileEmails endpoints.
- **Cross-company contact search:** follow first-session contact search confirmation.
- **Outreach drafting/sending:** draft from available company/contact/Profile context, then confirm recipients and content before sending.
- **Balance, pricing, authentication, and email status:** skip company discovery and execute the direct workflow.
- **Merchant Profile management:** use redacted profile view/export by default and explicit confirmation for reset or save.

## Language Rule

Reply in the same language the user uses. Chinese user requests get Chinese prompts, result displays, and next-step questions.

## Error Handling and Pricing

For HTTP errors and RFC 7807 formats, see [api-reference.md §14](./references/api-reference.md#14-错误码速查表).

Key handling:

- `401`: invalid or missing API key; follow authentication setup.
- `402`: insufficient credits; stop the paid flow and direct to https://go.okki.ai/pricing.
- `403`: no EDM access; guide upgrade.

When users ask about plans, upgrades, or credit packs, direct them to https://go.okki.ai/pricing.

## Changelog

### 1.2.1 (2026-06-03)

- Re-centered the default company discovery path on fast free search.
- Added the core merchant-side to target-side keyword rule.
- Removed PMF Gate, Lite Onboarding, Brief confirmation, Expansion, Sales Mentor, and viewed deduplication from the default first-search flow.
- Kept existing billing, contact-search, unlock, and email-send guardrails.
