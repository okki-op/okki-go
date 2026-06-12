# Phase 8 Baseline: Token and Latency Optimization Guardrails

**Captured:** 2026-06-11  
**Source plan:** `docs/OKKI_GO_SKILL_SYSTEMIC_TOKEN_LATENCY_OPTIMIZATION_PLAN.md`  
**Status:** Baseline before behavior-changing optimization edits

## Current Size Baseline

Measured with `wc -l -c` on 2026-06-11:

| File | Lines | Bytes |
|---|---:|---:|
| `skill/SKILL.md` | 407 | 28,920 |
| `skill/references/api-reference.md` | 709 | 21,878 |
| `skill/references/authentication.md` | 153 | 6,149 |
| `skill/references/discovery-playbook.md` | 375 | 25,134 |
| `skill/references/expansion-playbook.md` | 109 | 5,240 |
| `skill/references/merchant-profile-playbook.md` | 336 | 17,639 |
| `skill/references/sales-mentor-playbook.md` | 213 | 10,081 |
| `skill/references/workflows.md` | 285 | 16,483 |
| `skill/scripts/README.md` | 277 | 10,747 |
| Total measured docs | 2,864 | 142,271 |

Baseline implication: `SKILL.md` is above the v1.4.0 target of 150-220 lines and above the 300-line hard cap. Phase 9 owns the reduction.

## Current Reference Layout

Existing references:

- `api-reference.md`
- `authentication.md`
- `discovery-playbook.md`
- `expansion-playbook.md`
- `merchant-profile-playbook.md`
- `sales-mentor-playbook.md`
- `workflows.md`

Missing target references from the systemic plan:

- `search-fast-path.md`
- `result-review.md`
- `search-strategy.md`
- `paid-actions.md`
- `output-contracts.md`

Phase 10 may create new references or retain compatible existing filenames, but it must still establish one owner per rule.

## Representative Workflow Baseline

| Workflow | Representative prompt | Expected protected behavior |
|---|---|---|
| Ordinary prospect search | `我是女士箱包制造商，用 Okki go 帮我找些非洲的潜在买家` | Authenticate, construct a free `search-advanced` payload from target-side Chinese-first terms, use one primary keyword field plus geography when available, run compact company search, show user-language result table, ask one next step. |
| German auto glass search | `帮我搜 10 家德国的汽车玻璃潜在买家` | Use Chinese-first product/category terms such as auto glass/windshield terms, include `DE`, avoid over-narrow filters, show compact rows without private fields. |
| More/next pagination | `继续找更多类似的` | If compact output indicates a next page, paginate the same route before Expansion. Do not infer pagination from chat text when script metadata exists. |
| Result review | `这批里面先联系谁` | Reuse the visible/latest batch; do not run a new search by default. Group candidates into priority unlock, observe, and not recommended. Advice cannot authorize paid unlock. |
| Low-yield diagnosis | `这些太少了，有什么建议` | Use `discovery_health` when available, frame weakness as route/term/geography assumptions, include executable refinements and Mentor Guided option when low yield repeats. |
| Row-selection unlock confirmation | `解锁 4、6、9 来看看` | Ask explicit credit confirmation before `/companies/unlock`; row selection alone is not authorization. |
| Confirmed unlock | `确认` after a prior unlock prompt | Use latest saved batch mapping when valid, call `unlock-companies.js --batch latest --rows ... --compact`, report charge/balance/details/warnings, do not repeat unlock for viewed-state write failures. |
| Balance query | `查一下当前积分余额` | Direct status/auth flow. Skip prospecting references and company search. |
| Contact search confirmation | `找采购经理联系人` | Before first-session `POST /contacts/search`, state 1 credit per query and wait for confirmation. Use compact contact output after confirmation. |
| Email status | `查看邮件发送状态` | Use `email-status.js --compact`, summarize status and failures first, do not show full bodies unless explicitly requested. |
| Outreach draft only | `帮我给这几家公司写一封开发信，先不要发送` | Draft only. Do not send email. Sending later requires explicit recipient and content confirmation. |

## Protected Invariants

These behaviors must not regress while reducing token use and latency:

- Free company discovery remains available as the default path.
- Company-search payloads follow the six-rule Company Search Keyword Contract in `skill/SKILL.md`.
- Chinese index-language target-side terms are the default for `productKeywords`, `companyTypeKeywords`, and `industryKeywords`.
- Round 1 uses one primary keyword field by default, plus geography when supplied.
- Search recall must not be reduced by smaller default result counts, stricter first-round filters, default `AND`, or email-only search unless requested.
- Paid unlock, cross-company contact search, and email send still require explicit confirmation.
- Advice from Mentor Lite, Mentor Guided, Profile, Expansion, or Web Research cannot authorize paid actions.
- Normal user replies do not display `domain`, website/homepage/URL/link fields, raw IDs, unlock keys, raw API JSON, full profiles, full local state, or full email bodies.
- Raw/private/debug data remains available through saved files or explicit debug/detail/export flags.
- Latest batch row mapping remains script-managed; normal row-selection unlock should use `--batch latest` when available.
- Same-language replies remain required.
- Local viewed-state write failure after successful unlock is warning-only and must not trigger a repeat paid unlock.
- Weak-model support must improve through explicit modes, command skeletons, field ownership, and action hints, not longer prose.

## Field Ownership Baseline

Current prompt/docs still repeat some script-owned field work:

| Field or concept | Current state | Phase owner |
|---|---|---|
| `domain` | Scripts save it in raw/batch rows and compact stdout omits it, but docs still tell the model to keep row-to-domain mappings privately. | Phase 11 output contracts and Phase 12 row-selection hints. |
| `batch_id` | Scripts derive it from saved paths; docs tell the model not to show it while relying on batch mappings. | Move to debug metadata where compatible; normal flow should rely on `--batch latest`. |
| `raw_path` | Some compact outputs include it; docs tell the model not to show it in normal replies. | Classify as debug/export unless needed as an explicit compatibility exception. |
| `private_mapping_saved` | Emitted by company/batch compact outputs. | Classify as debug or redundant with latest batch pointer. |
| `output_budget` | Emitted by compact helpers; useful for routing/truncation but verbose. | Keep only routing-critical fields in normal stdout. |
| `next_offset` / `available` / `discovery_health` | Used for pagination and low-yield routing. | Add or preserve a small `health_action` where it reduces inference. |
| latest batch pointer | `batch-state.js` manages latest-batch resolution. | Model should use `--batch latest` and handle missing/stale errors only. |
| local viewed state | `okki-state.js` and unlock helpers handle writes. | Keep as script-owned local bookkeeping; failure warning only. |

## Current Wrapper Command Baseline

Help output confirms compact-capable wrappers:

- `search-companies.js --json|--file ... --compact [--locale] [--target-count] [--limit-output] [--fields] [--save-raw]`
- `discover-companies-batch.js --plan|--json ... --target-count N --save-batch PATH --compact [--locale]`
- `unlock-companies.js --batch batch.json|latest --rows ROWS --compact|--detail [--locale] [--mark-unlocked] [--raw-file]`
- `search-contacts.js --json|--file ... --compact [--save-batch]`
- `send-email.js batch|personalized ... --compact`
- `email-status.js tasks|task|mails|mail ... --compact`
- `okki-state.js profile ...` and `okki-state.js viewed ... --compact`

## Known Worktree State

Current `git status --short` includes:

- Modified files in this package, including `skill/SKILL.md`, several references, `skill/scripts/README.md`, and `skill/scripts/unlock-companies.js`.
- Deleted tracked `eval/` files under the package path.
- Untracked `../eval/` and `../hotfix/` directories in the parent worktree.
- Untracked `docs/OKKI_GO_SKILL_SYSTEMIC_TOKEN_LATENCY_OPTIMIZATION_PLAN.md` and `.planning/phases/07-company-search-keyword-contract-zh-primary/`.

Execution rule: treat all of the above as existing user or generated state. Do not revert, delete, reconcile, or overwrite unrelated changes while implementing v1.4.0.

## Existing Eval and Test Signals

Observed from repository search:

- Parent `../eval/` contains scenarios and tests for routing, safety, business flows, compact output scripts, static checks, and local-core behavior.
- Existing static checks still mention older PMF Gate wording, which was already noted as a Phase 6 follow-up concern.
- `../eval/test/compact-output-scripts.test.js` currently asserts some `raw_path` and `batch_id` fields. Phase 11 must update output contracts and tests deliberately if those fields move behind debug metadata.
- Root `package.json` test is currently a smoke command: `node bin/install.js --help`.

Phase 13 owns cost-behavior and weak-model eval changes. Earlier phases should not rely on eval deletions or moved eval paths.

## Exit Criteria Check

- Baseline file lists current sizes: yes.
- Representative prompts and expected behaviors are recorded: yes.
- Protected invariants are recorded: yes.
- Existing worktree risks are recorded: yes.
- No implementation behavior changed in Phase 8 baseline: yes, documentation/planning only.
