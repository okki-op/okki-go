# Output Contracts

This reference owns compact stdout, detail, debug metadata, raw/export behavior, and field ownership across OKKI Go wrappers.

## Contents

1. Output Classes
2. Field Ownership
3. Wrapper Contracts
4. Routing Hints
5. Migration Rule

## 1. Output Classes

| Class | Use when | Model-visible behavior |
|---|---|---|
| Normal compact | Default for user workflows. | Answer-ready rows, short summaries, routing hints, and actionable warnings only. |
| Detail | User asks for fuller user-facing detail. | More profile/contact/status fields, still sanitized. |
| Debug metadata | User asks for debug, paths, IDs, budget details, or implementation details. | Use `--debug-metadata`; output appears under `debug_metadata`. |
| Raw/export | User explicitly asks for raw/export or tests require it. | Save raw data to files; print paths and concise summaries rather than large payloads when possible. |

## 2. Field Ownership

| Field or concept | Owner | Normal compact rule |
|---|---|---|
| `domain` | Scripts and saved batch/raw files. | Do not print; model does not copy or preserve it. |
| raw IDs / `companyHashId` / contact IDs | Scripts and raw/debug output. | Do not print. |
| `batch_id` | Scripts derive from saved path/latest pointer. | Under `debug_metadata` only. |
| `raw_path` | Scripts. | Under `debug_metadata` only; raw is still saved. |
| `private_mapping_saved` | Scripts. | Under `debug_metadata` only. |
| `output_budget` | Scripts. | Under `debug_metadata` only; keep `returned`, `available`, `truncated`, and `next_offset` in normal output. |
| `available` / `next_offset` / `truncated` | Scripts. | May appear when needed for pagination. |
| `discovery_health` / `health_action` | Scripts. | May appear when needed for pagination, recovery, diagnosis, or Expansion routing. |
| latest batch pointer | `batch-state.js`. | Model uses `--batch latest`; no visible batch ID required. |
| local viewed state | `okki-state.js` and unlock helper. | Warnings only; write failure does not invalidate successful unlock. |
| user-facing explanation | Model. | Same language as user; no raw/private fields. |

## 3. Wrapper Contracts

Company discovery:

- normal compact: `display_table_markdown` plus `rows`, localized country names, `has_email`, `has_whatsapp`, `available`, `next_offset`, `truncated`, `discovery_health`, `health_action`, `next_action`
- free-search result table: scripts render `display_table_markdown` with localized fixed columns `row`, `company_name`, `country_name`, `company_type`, `fit`, `has_email`, `more_info`; `more_info` displays WhatsApp availability, employee count, and founding time with labels; the model does not rebuild or reorder it
- debug metadata: raw path, batch ID, private mapping flag, output budget
- raw file only: domains, IDs, raw API rows, exact email counts, exact WhatsApp counts
- next user action: model writes natural-language guidance after the table based on `next_action` and `discovery_health`

Selected-company unlock:

- normal compact: charged count, balance when available, `company_details` for at most 5 companies, `details_markdown_path` for all unlocked company details, warnings
- debug metadata: raw path, batch ID, output budget
- raw file only: domains, company hash IDs, raw profile/email payloads
- user-facing detail artifact: Markdown document only; no normal JSON export recommendation
- local state failure: warning only

Contact search:

- normal compact: contact rows, role/company/country/email availability, charge summary when available
- debug metadata: raw path, batch ID, output budget
- raw file only: raw contact IDs and payloads

Email send:

- normal compact: task IDs, accepted/rejected counts, status, next status-check command
- hidden/detail: full email body unless explicitly requested

Email status:

- normal compact: summary counts, failed rows and reasons, task/mail statuses
- detail: single mail body only when explicitly requested

Local state:

- normal compact: updated/skipped counts and warnings
- raw/debug: full state only on explicit request

## 4. Routing Hints

Allowed `health_action` values:

- `show_results`
- `fetch_next_page`
- `run_light_recovery`
- `ask_refinement`
- `offer_guided_strategy`
- `offer_expansion`

Allowed `next_action` values should be small and imperative, for example:

- `ask_unlock_selection`
- `ask_paid_confirmation`
- `paginate_next`
- `offer_refinement`
- `check_email_status`
- `draft_outreach`

Add hints only when they remove real model guesswork.

## 5. Migration Rule

For script-owned metadata currently emitted in compact stdout:

1. Keep it in normal compact only if it is answer-critical or routing-critical.
2. Move it to debug metadata if it only helps debugging or tests.
3. Suppress it if latest batch state or another script-owned mechanism makes it redundant.

Do not replace deterministic script ownership with prompt instructions telling the model to copy, cache, hide, or transform private fields.
