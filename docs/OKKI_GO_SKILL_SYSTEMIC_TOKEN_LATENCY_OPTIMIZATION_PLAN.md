# OKKI Go Skill Systemic Token and Latency Optimization Plan

Date: 2026-06-11
Status: reviewed implementation proposal
Scope: system-wide skill architecture, references, wrapper outputs, workflow routing, and evaluation. This plan uses session `019eb67c-85e7-7710-8b67-c14f53104c20` only as a symptom sample. It does not optimize for that single conversation, and it must not reduce current search recall or weaken paid-action safeguards.

## 1. Goal

Reduce model-visible token use and response latency when agents use OKKI Go, while preserving the current skill's prospect-search quality, routing coverage, paid-action safety, and multilingual user experience.

The desired end state:

- Common user tasks load a small hot-path `SKILL.md` plus at most one targeted reference.
- Wrapper scripts emit compact, answer-ready outputs by default.
- Raw API responses, private identifiers, long profiles, local state files, and email bodies stay out of model context unless the user explicitly asks for raw/debug/export detail.
- Repetitive decisions are deterministic in scripts or small routing tables, not re-derived by the model on every turn.
- Advanced modes remain available, but are loaded only when triggered.
- Weak models can follow the skill by choosing from explicit modes and commands rather than interpreting long prose.

## 2. Evidence and Generalized Diagnosis

Session `019eb67c-85e7-7710-8b67-c14f53104c20` exposed four latency symptoms:

| Turn type | Observed duration | Generalized issue |
|---|---:|---|
| First prospect search | about 125 seconds | Model had to translate target-side terms, choose geographic strategy, run/interpret discovery, manually select good rows, and write a user table. |
| Unlock confirmation | about 88 seconds | Model spent a full turn re-locating confirmation rules and composing paid-action prompt text. |
| Confirmed unlock and contact presentation | about 163 seconds | Model had to check saved mappings, run unlock/profile/email/balance, inspect compact/raw structures, then manually summarize. |
| Follow-up explanation | about 85 seconds | Model re-opened and reconciled saved result structures to explain a data mismatch. |

These symptoms point to a system-level problem: the skill still asks the model to do too much orchestration and post-processing. The durable fix is not to patch one email-count edge case. The durable fix is to redesign the skill around progressive disclosure, lower degrees of freedom on fragile workflows, and compact deterministic tool contracts.

## 3. Skill-Creator Standards Applied

### 3.1 Concise Is Key

Current risk:

- The hot path contains default discovery, Mentor Mode, Expansion, Discovery Health, Brand Safety, Minimal Prospecting Profile, Web Research Add-on, output rules, billing rules, and changelog-style history.
- Several rules are duplicated between `SKILL.md`, `references/workflows.md`, and `scripts/README.md`.
- Common tasks such as "find buyers", "unlock 4,6,9", or "check balance" pay the context cost of advanced modes they do not use.

Optimization principle:

- Keep only routing-critical and safety-critical instructions in `SKILL.md`.
- Move advanced behavior to named references that are read only when triggered.
- Remove duplicated prose; keep one owner per rule.

### 3.2 Appropriate Degrees of Freedom

Current risk:

- High-stakes and repetitive workflows still rely on model judgment: when to paginate, how many recovery searches to run, how to map row selections, how to format confirmation prompts, how to rank rows, how to present compact outputs.
- Weak models can over-read references, browse unnecessarily, or run extra searches because the skill presents many valid-looking branches.
- Some prompt instructions still ask the model to manage fields that wrapper scripts already save, filter, or route. `domain` is the clearest example: company-search wrappers already save `domain` in raw batch rows and omit it from compact stdout, but `SKILL.md` and references still tell the model to keep row-to-domain mappings privately. Similar overlap exists for `batch_id`, `raw_path`, `private_mapping_saved`, `output_budget`, latest batch pointers, and local viewed-state bookkeeping.

Optimization principle:

- Use low freedom for fragile workflows: paid actions, row selection, compact output, pagination, local state writes, and raw-data handling.
- Use medium freedom for search-route construction: model chooses target-side terms within a small schema, scripts handle pagination, dedupe, metadata, and budgets.
- Use high freedom only for user-facing sales language, outreach drafting, and nuanced mentor advice after the data is already compact.
- Assign every field to one owner: script, model, or user-facing reply. If a script owns a field, prompt text should tell the model to rely on the script output, not recreate or manually manage that field.

### 3.3 Progressive Disclosure

Current risk:

- The skill has references, but `SKILL.md` still contains large advanced sections and detailed implementation rules.
- The reference list is descriptive but not a strict loading decision table.

Optimization principle:

- Introduce a "Read Only When" table in `SKILL.md`.
- Put all reference files one level below `SKILL.md`.
- Add table-of-contents blocks to references over 100 lines.
- Put grep/search hints in `SKILL.md` for large references.

### 3.4 Validation Integrity

Current risk:

- Existing evals focus heavily on search quality and safety. Token/latency behavior can regress without failing tests.
- Forward-testing can accidentally encode known fixes if prompts describe the suspected bug.

Optimization principle:

- Add cost-behavior evals that use raw task prompts and measure outputs/tool patterns.
- Forward-test with fresh agents using the skill artifact and generic user-like prompts, not the diagnosis.

## 4. Target Architecture

```text
User request
  -> SKILL.md chooses one mode from a short routing table
  -> only the mode-specific reference is read when needed
  -> wrapper script runs API calls and local processing
  -> script emits answer-ready compact JSON
  -> model presents rows, confirmation, summary, or advice
  -> raw/private detail remains saved for follow-up or explicit debug/export
```

The model remains responsible for:

- Understanding user intent.
- Building concise target-side search hypotheses.
- Communicating results naturally in the user's language.
- Applying business judgment in L1/L2 modes.
- Drafting outreach content when asked.

Scripts become responsible for:

- Authentication resolution and supported field normalization.
- Pagination and output budgets.
- Batch state and row-to-private-record mapping.
- Dedupe, local filters, and scoring metadata where deterministic.
- Compact output schemas.
- Paid-action result summarization after explicit confirmation.
- Local state read/write with compact stdout and warning-only degradation when appropriate.
- Field-level privacy transforms: storing private fields, omitting private fields from compact stdout, and exposing debug metadata only when requested.

## 5. Non-Negotiable Functional Requirements

These requirements protect current skill functionality while reducing cost:

1. Free company discovery remains available as the default path.
2. Current target-side keyword rules remain intact: Chinese index-language first, one primary keyword field first, recall before precision, no over-narrow Round 1.
3. Mentor Lite, Mentor Guided, Expansion, Merchant Profile, Web Research Add-on, contact search, email drafting/sending, balance, pricing, auth, and email status remain available.
4. Paid unlock, cross-company contact search, and email send still require explicit confirmation.
5. Search recall must not be reduced by shrinking default result counts or adding stricter API filters.
6. Private identifiers, domains, raw IDs, URLs, and raw batch metadata remain hidden from normal user replies.
7. Explicit raw/debug/export requests remain supported through saved files or explicit detail flags.
8. Existing wrapper scripts remain backward-compatible where practical, especially non-compact output used by tests or debugging.

## 6. Proposed Information Architecture

### 6.1 `SKILL.md` Hot Path

Target size: 150-220 lines.

Keep:

- Frontmatter with `name` and `description`. Move non-required metadata out of YAML if strict skill validation requires it.
- One-paragraph purpose.
- Trigger and non-trigger routing.
- Quick auth check.
- Mode routing table.
- Default L0 search command pattern.
- Company Search Keyword Contract, reduced to the six core rules.
- Compact output rule.
- Paid-action confirmation rule.
- Reference loading table.
- Language rule.
- Error quick map for `401`, `402`, `403`.

Remove or move:

- Long Mentor Mode explanations.
- Discovery Health details beyond mode routing.
- Full Minimal Prospecting Profile details.
- Expansion details.
- Web Research Add-on details.
- Long result-display examples.
- Changelog.
- Duplicated API parameter tables.
- Detailed local state behavior.

### 6.2 Reference Files

Create or reorganize references around operational modes:

| Reference | Read only when | Owns |
|---|---|---|
| `references/search-fast-path.md` | User asks to find companies/prospects/buyers and no advanced trigger is present. | L0 search flow, target-side payload construction, one-page vs batch command choice, lightweight recovery budget. |
| `references/result-review.md` | User asks which displayed results to unlock/contact/avoid or asks for priority analysis. | L1 Mentor Lite, result grouping, small validation batch advice, no re-search rule. |
| `references/search-strategy.md` | User asks how to search, says results are wrong, too few, suppliers not buyers, or wants systematic guidance. | L2 Mentor Guided, Minimal Prospecting Profile, low-yield diagnosis, recallability guard, route generation. |
| `references/expansion.md` | Current route is exhausted or user asks for alternate customer routes/expansion. | Pagination-before-expansion, branch candidates, user confirmation before new branch. |
| `references/paid-actions.md` | User asks to unlock, search contacts, or send email. | Confirmation prompts, paid command patterns, charge reporting, local state write degradation. |
| `references/output-contracts.md` | Editing scripts, debugging output, or implementing evals. | Compact stdout schemas and raw/debug behavior across all wrappers. |
| `references/api-reference.md` | Script development, direct API debugging, new endpoint support, or hard API errors. | Endpoint schemas and error details. Not read for normal usage. |
| `references/authentication.md` | API key missing/invalid or user asks setup/login. | Key resolution and secure save guidance. |
| `references/merchant-profile.md` | User asks to save/reuse company info or advanced strategy needs cheap profile memory. | Optional profile memory, redacted view/update, source precedence. |

Compatibility option: existing filenames can be retained if the team wants less churn. In that case, add a strict "Read only when" table to `SKILL.md` and trim content inside the existing references. The main requirement is ownership clarity, not file renaming.

### 6.3 Rule Ownership

Assign every recurring rule one owner:

| Rule | Owner | Other files should do |
|---|---|---|
| Trigger and non-trigger scope | `SKILL.md` frontmatter plus Routing section | Link only. |
| Company Search Keyword Contract | `SKILL.md` | Reference it by name, do not repeat. |
| L0 execution details | `search-fast-path.md` | Link only. |
| L1/L2 strategy | `result-review.md` and `search-strategy.md` | Link only. |
| Paid confirmations | `paid-actions.md` plus short non-bypassable summary in `SKILL.md` | Link only. |
| Compact schemas | `output-contracts.md` and scripts | Link only. |
| API schema | `api-reference.md` | Do not duplicate in `SKILL.md`. |
| Field ownership | `output-contracts.md` plus scripts | Do not ask the model to manually preserve, hide, or remap fields already handled by wrappers. |

### 6.4 Field Ownership Audit

Before rewriting prompt text, audit each field mentioned in the skill and classify it.

| Field or concept | Current script behavior | Prompt problem to remove | Target instruction |
|---|---|---|---|
| `domain` | `search-companies.js` and `discover-companies-batch.js` save it in raw/batch rows; compact rows omit it. `unlock-companies.js` reads it from the batch. | Prompt tells the model to keep row-to-domain mappings privately. | "Use compact wrapper batch state for row selections; do not manually store or display `domain`." |
| `id` / `companyHashId` | Raw search IDs are saved in batch. Unlock hash is used inside unlock flow and raw output. | Prompt repeatedly tells the model to hide internal IDs. | Put hiding in output contract; model only avoids printing debug/raw fields. |
| `batch_id` | Scripts compute it from saved batch path. | Prompt tells model to reference batch ID privately while normal replies should not show it. | Hide in normal stdout or behind `--debug-metadata`; model should rely on `--batch latest`. |
| `raw_path` | Scripts write raw files and currently emit path in compact output. | Prompt tells model not to show it, creating unnecessary filtering work. | Move to debug metadata where possible; model shows path only on explicit debug/export. |
| `private_mapping_saved` | Scripts emit a boolean when mappings are saved. | Prompt tells model not to show wrapper metadata. | Move to debug metadata or suppress from normal stdout. |
| `output_budget` | Scripts emit budget/truncation metadata. | Prompt tells model not to show it while also relying on it for routing. | Keep only routing-critical fields in normal stdout; move verbose budget details to debug. |
| `next_offset` / `available` / `discovery_health` | Scripts compute pagination and health. | Prompt asks model to infer and decide from several fields. | Add `health_action`; model follows action rather than re-deriving. |
| latest batch pointer | `batch-state.js` writes and resolves a 24h latest batch pointer. | Prompt says model should save/reference mappings. | Model uses `--batch latest`; only handles missing/stale pointer errors. |
| local viewed state | `okki-state.js` and `unlock-companies.js --mark-unlocked` handle local writes. | Prompt includes manual `mark-unlocked --domain` examples. | Prefer batch/compact commands; do not ask model to copy domains. |
| website/homepage/URL/link fields | Compact helpers omit private/link-like fields from stdout. | Prompt repeatedly instructs model not to display them. | Keep one output-contract rule; remove repeated field-level reminders from hot path. |

Acceptance check for this audit:

- For every field above, prompt text either names the script that owns it or removes the instruction entirely.
- Normal workflows do not require the model to copy, cache, hide, or transform script-owned private fields.
- Any remaining prompt-level field instruction must explain why model judgment is still required.

## 7. Workflow Modes

`SKILL.md` should route each turn into exactly one primary mode before tool use:

| Mode | Trigger | Model context budget | Required reference | Tool behavior |
|---|---|---:|---|---|
| `L0_FAST_DISCOVERY` | Find companies/buyers/importers/distributors/prospects. | Low | `search-fast-path.md` only if `SKILL.md` quick command is insufficient. | One primary search or batch script; compact rows; no mentor questions. |
| `L0_PAGINATION` | More/next/continue and current batch has next page. | Low | Usually none. | Use latest batch metadata and next offset; no Expansion. |
| `L1_RESULT_REVIEW` | Which should I contact/unlock/avoid, analyze this displayed list. | Medium | `result-review.md` | Reuse active batch; no re-search; compact groups. |
| `L2_GUIDED_STRATEGY` | Teach me how to search, results are wrong, suppliers not buyers, no route clarity. | Medium | `search-strategy.md` | Build minimal profile, run one route if constructible. |
| `EXPANSION` | Current route exhausted or user asks alternate branches. | Medium | `expansion.md` | Offer 2-3 branches, execute one after confirmation. |
| `PAID_ACTION` | Unlock, contact search, send email. | Low/medium | `paid-actions.md` | Ask/verify confirmation, then use compact wrapper. |
| `DIRECT_STATUS` | Balance, email status, install/auth/pricing. | Low | `authentication.md` only for auth setup. | Direct compact command; no prospecting context. |
| `WEB_RESEARCH_ADDON` | Explicit external/latest/source-backed research request. | High by user request | Separate web guidance if needed. | Cite sources; do not mutate OKKI payload without confirmation. |

Weak-model rule: if two modes seem plausible, choose the earlier safety-preserving route in this order:

1. Paid-action guardrails.
2. Direct status/auth.
3. L0 pagination when a next page exists.
4. L1 result review when a batch exists and the user asks analysis.
5. L0 fast discovery for ordinary find/search.
6. L2 guided strategy.
7. Expansion.
8. Web Research Add-on only on explicit external research wording.

## 8. Script and Output Contract Plan

This is a system-wide contract, not a fix for one endpoint.

### 8.1 Compact By Default

All user-facing wrappers should support `--compact` and the skill should always use compact mode for normal flows.

Default stdout should include:

- The minimum fields needed to answer the user.
- A stable row number when follow-up selection is possible.
- A short machine-readable action hint when it reduces model judgment, for example `next_action`.
- Counts and truncation flags where needed.
- Warnings only when user action matters.

Default stdout should not include:

- Raw API records.
- Private identifiers.
- Domains or raw URLs in free discovery.
- Full company profiles.
- Full local state.
- Full email bodies.
- Large wrapper metadata unless debug is explicit.

### 8.2 Raw and Debug Data

Raw data should be saved, not streamed.

Recommended flags:

- `--save-raw <path>` or `--save-batch <path>` for private raw data.
- `--debug-metadata` to print `raw_path`, `batch_id`, `output_budget`, or internal counters.
- `--detail` for user-requested fuller user-facing details, still sanitized.
- `--raw` only for explicit debugging, never normal workflow.

### 8.3 Answer-Ready Fields

Wrapper outputs should reduce model post-processing:

Company discovery:

- `display_rows`: compact user-facing rows.
- `recommended_rows`: optional deterministic top candidates when local scoring is available.
- `next_action`: `ask_unlock_selection`, `paginate_next`, `offer_refinement`, or `offer_expansion`.
- `health_action`: routing hint derived from pagination and yield metadata.

Selected-company unlock:

- `charge_summary`.
- `display_companies`.
- `display_contacts`.
- `next_action`.
- `warnings`.

Contact search:

- `display_contacts`.
- `charge_summary`.
- `next_action`.

Email status:

- `summary_counts`.
- `failed_rows`.
- `next_action`.

Local state:

- `updated_count`, `skipped_count`, `warning`.
- No full state file by default.

### 8.4 Deterministic Routing Metadata

Scripts that already compute `discovery_health`, `next_offset`, or `low_yield_batch_streak` should also return a small `health_action` value so the model does not infer:

| `health_action` | Meaning |
|---|---|
| `show_results` | Results are usable; present rows and ask next step. |
| `fetch_next_page` | More same-route results exist; pagination should precede Expansion. |
| `run_light_recovery` | First result is zero/sparse/noisy and recovery budget remains. |
| `ask_refinement` | Current request is under-specified or recovery budget is exhausted. |
| `offer_guided_strategy` | Repeated low-yield or route confusion; L2 option should be shown. |
| `offer_expansion` | Current route is exhausted and user wants more routes. |

This keeps the business logic stable across strong and weak models.

## 9. Implementation Phases

### Phase 0: Baseline and Guardrails

Purpose: prevent accidental search-quality regression before refactoring.

Tasks:

1. Capture current `wc -l` and approximate token sizes for `SKILL.md` and references.
2. Capture current representative behavior for:
   - ordinary prospect search,
   - row-selection unlock confirmation,
   - confirmed unlock,
   - result review,
   - low-yield diagnosis,
   - more/next pagination,
   - balance query,
   - contact search confirmation,
   - email status.
3. Mark protected behavior:
   - paid confirmations,
   - target-side keyword contract,
   - compact privacy rules,
   - row mapping reuse,
   - same-language replies.
4. Add or identify eval cases that represent those behaviors before changing the skill text.

Exit criteria:

- A baseline file lists current reference sizes, representative prompts, expected behavior, and protected invariants.
- No implementation behavior changes yet.

### Phase 1: Rebuild `SKILL.md` as a Router

Purpose: reduce hot-path context load.

Tasks:

1. Rewrite `SKILL.md` to keep only the hot-path items in section 6.1.
2. Add a strict reference loading table with "Read only when" triggers.
3. Add the workflow mode table from section 7.
4. Replace long advanced sections with links to references.
5. Remove duplicated API parameter tables from `SKILL.md`.
6. Keep the six-rule Company Search Keyword Contract in `SKILL.md`.
7. Keep paid confirmation summary in `SKILL.md`, but move command details to `paid-actions.md`.
8. Validate that ordinary L0 search can be performed after reading only `SKILL.md`.

Exit criteria:

- `SKILL.md` is below 220 lines unless there is a documented reason.
- A simple "find buyers" prompt does not require reading Mentor, Expansion, Merchant Profile, or API reference docs.
- Paid-action safety remains visible in `SKILL.md`.

### Phase 2: Split and Deduplicate References

Purpose: make progressive disclosure real and weak-model-friendly.

Tasks:

1. Assign every rule to one owner using section 6.3.
2. Create new references or trim existing references into the operational mode layout.
3. Add a short table of contents to references over 100 lines.
4. Remove duplicate prose from `workflows.md`, `scripts/README.md`, and mode playbooks.
5. Keep examples short and mode-specific.
6. Replace vague prose such as "consider" or "when useful" with explicit triggers where model variance is harmful.
7. Preserve advanced capabilities by linking them from the router table.

Exit criteria:

- Normal search, result review, strategy, expansion, paid actions, auth, and output contracts each have one canonical reference owner.
- No reference needs to be read solely to discover that a different reference is needed.
- Weak models can choose the right file from the router table.

### Phase 3: Standardize Compact Output Contracts

Purpose: prevent model-visible raw data across all capabilities.

Tasks:

1. Define compact stdout schemas in `references/output-contracts.md`.
2. Audit wrappers:
   - `search-companies.js`
   - `discover-companies-batch.js`
   - `unlock-companies.js`
   - `search-contacts.js`
   - `send-email.js`
   - `email-status.js`
   - `okki-state.js`
3. For each wrapper, classify output as:
   - normal compact,
   - detail,
   - debug metadata,
   - raw/export.
4. Move non-answer metadata behind `--debug-metadata` where compatibility allows.
5. Ensure raw/private data is saved to files and not printed in normal mode.
6. Add `next_action` or `health_action` only when it avoids model guesswork.

Exit criteria:

- Normal wrapper outputs are compact and answer-ready.
- No normal flow prints raw API objects, full local state, full profiles, internal IDs, or full email bodies.
- Follow-up row selection still works through saved batch pointers.

### Phase 4: Mechanicalize Repetitive Decisions

Purpose: reduce model reasoning loops without reducing search recall.

Tasks:

1. Make scripts expose deterministic hints for:
   - pagination vs expansion,
   - low-yield vs healthy,
   - row mapping validity,
   - output truncation,
   - next user action.
2. Keep search-route creativity in the model, but keep pagination/dedupe/budget decisions in scripts.
3. Add command patterns for:
   - simple L0 search,
   - broad count-based search,
   - next page,
   - row-selection unlock after confirmation,
   - result review from latest batch.
4. Avoid increasing API filters to "save tokens"; use local ranking/display hints instead.

Exit criteria:

- The model does not need to inspect raw files for normal presentation.
- The model does not infer pagination state from chat text.
- The model does not re-search to resolve row selections when latest batch exists.

### Phase 5: Cost and Capability Eval Suite

Purpose: prove the optimization helps without damaging quality.

Add eval dimensions:

| Dimension | Check |
|---|---|
| Search recall preservation | Result count and target-side relevance are comparable to baseline. |
| Hot-path loading | Ordinary tasks do not require advanced references. |
| Raw-output discipline | No raw JSON/full profiles/full state enter normal model context. |
| Tool budget | Normal tasks stay within expected command counts. |
| Latency | First visible result and paid follow-up complete within budgets under normal API latency. |
| Safety | Paid confirmations are still required and cannot be bypassed. |
| Weak-model routing | A smaller model chooses the correct mode/reference/command on representative prompts. |
| Multilingual output | Chinese requests still receive Chinese result tables and prompts. |
| Brand safety | Weak results are framed as route/index/geography adjustment, not platform deficiency. |

Representative eval prompts:

1. "我是女士箱包制造商，用 Okki go 帮我找些非洲的潜在买家"
2. "帮我搜 10 家德国的汽车玻璃潜在买家"
3. "继续找更多类似的"
4. "这些太少了，有什么建议"
5. "解锁 4、6、9 来看看"
6. "确认"
7. "查一下当前积分余额"
8. "找采购经理联系人"
9. "帮我给这几家公司写一封开发信，先不要发送"
10. "查看邮件发送状态"

Forward-test rule:

- Give subagents only the skill artifact and user-like task prompts.
- Do not tell them the expected optimization or suspected failure.
- Review their loaded files, tool calls, visible outputs, and final answers.

## 10. Success Metrics

Target metrics after implementation:

| Metric | Target |
|---|---:|
| `SKILL.md` length | 150-220 lines preferred, below 300 hard cap unless justified. |
| Normal L0 search references loaded | `SKILL.md` only, or `SKILL.md` + one fast-path reference. |
| Normal paid row unlock references loaded | `SKILL.md` + paid-actions reference at most. |
| Raw API JSON in normal model-visible output | 0 occurrences. |
| Full local state in normal model-visible output | 0 occurrences. |
| First visible L0 result | Under 60 seconds when one API call is sufficient; under 90 seconds for broad/batch search. |
| Confirmed small-batch unlock | Under 45-60 seconds when API latency is normal. |
| Paid confirmation regressions | 0. |
| Search recall regression | No material drop in relevant candidates versus baseline evals. |
| Weak-model route failure | Below agreed threshold after forward-testing; failures become routing-table fixes, not prose additions. |

## 11. File-Level Implementation Plan

This section translates the architecture into concrete file work. It is intentionally file-level so a future implementer does not need to rediscover the intended boundaries.

### 11.1 `skill/SKILL.md`

Role after refactor: router, safety hot path, and compact command starter.

Required changes:

1. Replace long workflow prose with a short mode routing table.
2. Keep trigger/non-trigger scope in the body only as a brief reinforcement of the frontmatter.
3. Keep the six-rule Company Search Keyword Contract exactly once.
4. Keep the paid-action rule in the hot path:
   - unlock requires explicit credit confirmation,
   - contact search requires first-session paid confirmation,
   - email send requires recipient and content confirmation.
5. Add copy-pastable command skeletons for:
   - API key check,
   - L0 company search,
   - batch discovery,
   - row unlock after confirmation,
   - balance check,
   - email status.
6. Add a "Read Only When" reference table.
7. Remove detailed endpoint parameter tables and move them to API/reference ownership.
8. Remove changelog entries from `SKILL.md`; keep release notes outside the skill hot path.
9. Remove prompt obligations for script-owned fields:
   - do not tell the model to keep row-to-domain mappings,
   - do not tell the model to privately reference `batch_id`,
   - do not repeatedly list `raw_path`, `private_mapping_saved`, or `output_budget` as fields to hide.
10. Replace those obligations with one rule: "Use compact wrappers and `--batch latest`; do not print debug/raw metadata unless the user asks for raw/debug/export."

Acceptance checks:

- A model can answer "帮我找德国汽车玻璃买家" after reading only `SKILL.md`.
- A model can ask the correct unlock confirmation after reading only `SKILL.md`.
- A model knows which reference to read for "这些结果太少了，有什么建议".
- `SKILL.md` remains below 220 preferred lines or below 300 hard-cap lines with a written exception.
- `SKILL.md` contains no instruction that requires the model to manually preserve `domain`.

### 11.2 `skill/references/search-fast-path.md` or Existing Discovery Reference

Role after refactor: normal company-search execution.

Required content:

1. L0 fast discovery steps.
2. Search payload construction rules that expand the Company Search Keyword Contract without duplicating it verbatim.
3. One-page vs batch discovery command choice.
4. Lightweight recovery budget and stop conditions.
5. Pagination before hidden recovery.
6. Normal result presentation rules.

Acceptance checks:

- No Mentor Guided questions are introduced in L0.
- No PMF/Profile gate blocks the first free search.
- No raw API output is recommended.
- No stricter first-round API filters are introduced to reduce token use.

### 11.3 `skill/references/result-review.md`

Role after refactor: L1 Mentor Lite over an existing displayed batch.

Required content:

1. Reuse current batch; do not re-search by default.
2. Group displayed candidates into priority unlock, observe, and not recommended.
3. Give one risk and one next action.
4. Preserve paid confirmation; recommendations never authorize unlock.
5. Stay compact and avoid Product Context Lite questioning.

Acceptance checks:

- Prompt "这批里面先联系谁" does not trigger a new search.
- Prompt "哪些值得解锁" produces advice plus confirmation boundary, not an unlock call.

### 11.4 `skill/references/search-strategy.md`

Role after refactor: L2 Mentor Guided and low-yield diagnosis.

Required content:

1. Minimal Prospecting Profile rules.
2. Product Context Lite only when route choice is blocked.
3. Buyer-side relationship validation.
4. Recallability guard.
5. Low-yield diagnosis wording and brand-safety guard.
6. One-route-first search behavior.

Acceptance checks:

- Prompt "这些像供应商不是买家" routes here.
- Prompt "教我怎么搜" routes here.
- The model asks at most 1-2 blocking questions before search.
- The first L2 search still uses one primary keyword field unless a clear exception is documented.

### 11.5 `skill/references/expansion.md`

Role after refactor: new route branches after current route is exhausted or user asks for alternate routes.

Required content:

1. Next page before Expansion.
2. Expansion is branch generation, not hidden recovery.
3. Offer 2-3 branches.
4. Execute only one branch after user confirms.
5. Preserve all paid-action boundaries.

Acceptance checks:

- Prompt "继续找" with `next_offset` uses pagination, not Expansion.
- Prompt "换一批客户类型" offers branch choices.

### 11.6 `skill/references/paid-actions.md`

Role after refactor: all paid or potentially paid actions.

Required content:

1. Unlock confirmation wording.
2. Row-selection unlock command after confirmation.
3. Contact search confirmation and compact command.
4. Email send confirmation and compact command.
5. Charge and balance reporting.
6. Local viewed-state write degradation.
7. Missing or stale batch mapping recovery.

Acceptance checks:

- "解锁4、6、9" asks before calling unlock.
- "确认" after a previous unlock prompt can call the wrapper without re-reading API docs.
- Local viewed-state failure is warning-only after successful unlock.

### 11.7 `skill/references/output-contracts.md`

Role after refactor: one canonical compact-output contract.

Required content:

1. Normal compact stdout schema by wrapper.
2. Detail mode schema.
3. Debug metadata rules.
4. Raw/export rules.
5. Field privacy rules.
6. `next_action` and `health_action` allowed values.
7. Field ownership table: script-owned, model-owned, and user-facing fields.
8. A migration rule for script-owned metadata that currently appears in compact stdout:
   - keep if needed for immediate routing,
   - move to `--debug-metadata` if only useful for debugging,
   - suppress if redundant with latest batch state.

Acceptance checks:

- Other references link here rather than repeat schemas.
- Script tests can use this document as the expected behavior source.
- References no longer tell the model to manually transform script-owned fields such as `domain`.

### 11.8 Wrapper Scripts

Files:

- `skill/scripts/search-companies.js`
- `skill/scripts/discover-companies-batch.js`
- `skill/scripts/unlock-companies.js`
- `skill/scripts/search-contacts.js`
- `skill/scripts/send-email.js`
- `skill/scripts/email-status.js`
- `skill/scripts/okki-state.js`
- shared helpers under `skill/scripts/lib/`

Required changes:

1. Ensure compact mode exists for every user-facing workflow.
2. Keep or document backward compatibility for existing non-compact behavior.
3. Save raw/private data to files instead of stdout.
4. Add `next_action` where it directly tells the model what to ask or do next.
5. Add `health_action` where pagination/low-yield routing is currently inferred.
6. Keep stdout sanitized by default.
7. Keep warnings short and actionable.
8. For fields currently emitted only so the model can hide or reason about them, choose an owner:
   - `domain`, raw IDs, and raw records remain saved only in raw/batch files.
   - `batch_id`, `raw_path`, `private_mapping_saved`, and verbose `output_budget` move behind `--debug-metadata` unless a compatibility exception is documented.
   - `next_offset`, `available`, and `discovery_health` remain visible only if needed for routing, and should be accompanied by `health_action`.
   - latest batch pointer remains script-managed, so normal row-selection prompts use `--batch latest`.

Acceptance checks:

- No normal command prints raw API lists or full local state.
- Row selections can reuse latest batch without visible `batch_id`.
- Debug commands can still expose paths/metadata when explicitly requested.
- No prompt needs to instruct the model to copy `domain` from a search result into a later unlock command.

### 11.9 Eval and Forward-Test Assets

Files depend on the current eval location. If eval has been moved out of the skill package, keep it outside the distributed `skill/` folder.

Required additions:

1. Cost-behavior scenarios for normal search, row unlock, result review, pagination, balance, contact search, and email status.
2. Static checks for raw-output leakage in normal wrapper stdout.
3. Static checks for hot-path size and duplicate rule ownership.
4. Forward-test prompts for smaller/fresh agents.
5. Search-quality comparison against baseline prompts.

Acceptance checks:

- A search-quality failure blocks merging.
- A paid-confirmation failure blocks merging.
- A raw-output leakage failure blocks merging.
- A weak-model routing failure creates a routing-table/script-field fix, not an added essay paragraph.

## 12. Risks and Mitigations

| Risk | How it could happen | Mitigation |
|---|---|---|
| Search quality drops | Over-aggressive compacting removes fields needed for model judgment. | Keep raw saved; include concise `fit` and optional deterministic score/reason; preserve current target-side rules. |
| Weak models under-load references | Router table is too terse or ambiguous. | Use explicit trigger phrases and fallback order; add evals for reference choice. |
| Weak models over-load references | References are listed without "read only when" constraints. | Make the loading table imperative and mode-based. |
| Paid safety weakens | Confirmation details moved out of hot path. | Keep non-bypassable paid summary in `SKILL.md`; put full wording in `paid-actions.md`. |
| Debuggability suffers | Raw output hidden too aggressively. | Provide explicit `--debug-metadata`, `--detail`, and raw/export paths. |
| Backward compatibility breaks tests | Existing scripts or evals expect old stdout. | Keep default backward compatibility where practical; make skill use compact mode; update tests deliberately. |
| Documentation sprawl continues | New references duplicate old content. | Assign rule ownership and delete duplicated prose during Phase 2. |

## 13. Implementation Checklist

- [ ] Create baseline file for size, behavior, and protected invariants.
- [ ] Rewrite `SKILL.md` as a router and safety hot path.
- [ ] Add strict reference loading table.
- [ ] Split or trim references by mode.
- [ ] Assign rule ownership and remove duplicate prose.
- [ ] Define output contracts in one reference.
- [ ] Complete the field ownership audit and remove prompt instructions for script-owned fields.
- [ ] Audit every wrapper for normal/detail/debug/raw output classes.
- [ ] Move raw/private/full outputs out of normal stdout.
- [ ] Move redundant wrapper metadata such as `batch_id`, `raw_path`, `private_mapping_saved`, and verbose `output_budget` behind debug output where compatible.
- [ ] Add deterministic `next_action`/`health_action` where useful.
- [ ] Add cost-behavior eval cases.
- [ ] Run existing functionality evals to check search, paid safety, auth, profile, contact, email, and status flows.
- [ ] Forward-test with weak or smaller-model agents using generic prompts.
- [ ] Review failures and fix routing tables or scripts before adding prose.

## 14. Self-Review: Functional Completeness

Question: Could this plan remove or weaken existing OKKI Go skill capabilities?

Review result: the plan is functionally safe if implemented with the non-negotiable requirements in section 5.

Capabilities preserved:

- Company search remains the default path.
- Current search keyword quality rules stay in the hot path.
- Mentor Lite and Mentor Guided are moved, not removed.
- Expansion is moved, not removed.
- Merchant Profile remains optional memory.
- Web Research Add-on remains available only when explicit.
- Contact search, email drafting, email sending, email status, auth, pricing, and balance remain supported.
- Raw/debug/export remains supported through explicit paths and flags.
- Paid confirmation remains visible in `SKILL.md`.

Potential functional risks:

1. If `SKILL.md` becomes too terse, models may miss advanced modes.
   - Required mitigation: include the mode routing table and "read only when" table, not just links.
2. If compact outputs hide too much, model result quality may fall.
   - Required mitigation: keep answer-critical fields in compact output and save raw for explicit detail/debug.
3. If `api-reference.md` is no longer read during normal usage, endpoint edge cases may be missed.
   - Required mitigation: wrappers own endpoint normalization and errors; API reference remains for hard errors and script work.
4. If debug metadata is hidden by default, row follow-up could break.
   - Required mitigation: saved latest batch pointer must remain script-managed; model does not need visible `batch_id` for ordinary row selection.
5. If prompt text stops mentioning `domain` before scripts fully own row mapping, unlock could fail.
   - Required mitigation: verify `search-companies.js`, `discover-companies-batch.js`, `batch-state.js`, and `unlock-companies.js --batch latest` cover row-selection unlock before removing model-level mapping instructions.

Conclusion: this plan should not reduce functional coverage. It changes where rules live and which layer performs repetitive work.

## 15. Self-Review: Weak Model Adaptation

Question: Is the plan executable by weaker models, or does it assume strong implicit reasoning?

Review result: the plan improves weak-model reliability, but only if implementation keeps routing tables explicit and commands copy-pastable.

Weak-model strengths in the plan:

- Single primary mode per turn.
- Fixed fallback order when modes conflict.
- "Read only when" table instead of broad reference list.
- Low-freedom scripts for paid actions, row mapping, pagination, local state, and raw data handling.
- Compact schemas with `next_action` and `health_action`.
- No requirement for models to infer pagination from previous chat text.
- No requirement for models to hand-edit state files.

Weak-model implementation requirements:

1. `SKILL.md` must include exact command skeletons for L0 search, batch search, unlock after confirmation, balance, and email status.
2. Reference names must be descriptive and one level deep.
3. Long references must have a top table of contents.
4. Mode triggers must use user-like phrases, including Chinese examples.
5. Warnings must be imperative, not advisory, for safety rules.
6. Scripts should return machine-readable `next_action` values to reduce interpretation.
7. Evals must include smaller-model or fresh-agent forward tests, not only strong-model manual review.

Conclusion: this plan is suitable for weak models if the implementation resists the temptation to replace deterministic routing with long explanatory prose. When evals fail, prefer adding a routing row, wrapper field, or command pattern over adding paragraphs.

## 16. Self-Review: Overfitting to the Sample Session

Question: Does the plan overfit to session `019eb67c-85e7-7710-8b67-c14f53104c20`?

Review result: the plan uses that session only to identify general cost patterns. The implementation phases and file-level work apply across all OKKI Go capabilities:

- Search hot-path loading.
- Reference ownership.
- Compact wrapper outputs.
- Paid-action safety.
- Pagination and batch state.
- Contact search.
- Email status.
- Local state.
- Weak-model routing.

The plan intentionally avoids single-case fixes such as special-casing one company, one product category, one geography, or one email-count mismatch. If implementation introduces such special cases, that implementation should be rejected as out of scope.

## 17. Final Recommendation

Implement this as a skill information-architecture and tool-contract refactor, not as a case-specific bug fix.

Recommended order:

1. Baseline and invariants.
2. `SKILL.md` router rewrite.
3. Reference ownership and deduplication.
4. Compact output contract audit.
5. Deterministic action hints.
6. Cost and weak-model evals.

This order protects search performance while removing the main sources of token waste: over-loaded hot path, duplicated rules, raw output exposure, and model-side orchestration of repetitive workflows.
