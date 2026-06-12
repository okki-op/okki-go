# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-11)

**Core value:** The skill must turn vague B2B prospecting requests into safe, repeatable, source-backed search and outreach preparation without bypassing paid-action or email-send confirmations.
**Current focus:** v1.4.0 systemic token and latency optimization

## Current Position

Phase: 13 of 13 (Cost and Capability Evals)
Plan: 1 of 1 in current phase
Status: In progress — reference ownership duplication check added; broader cost/capability eval alignment remains
Last activity: 2026-06-12 - Added prompt ownership regression and removed duplicate script-owned field handling prose from hot paths

Progress: [█████████░] 92%

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: ~9 min
- Total execution time: ~153 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Rule Contract Playbooks | 4 | ~26 min | ~7 min |
| 2. State Helper and Unit Tests | 3 | ~28 min | ~9 min |
| 3. Skill Workflow Integration | 4 | ~30 min | ~8 min |
| 4. Eval Coverage | 3 | ~24 min | ~8 min |
| 5. Verification and Release Readiness | 2 | ~45 min | ~23 min |

**Recent Trend:**
- Last 5 plans: 04-01, 04-02, 04-03, 05-01, 05-02
- Trend: Harness behavior has deterministic regression coverage, release version consistency checks, and final full-suite validation

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Treat `docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md` as PRD Express input.
- Use `okki-go/.planning/` because `okki-go` is a package directory inside a parent git worktree.
- Use GSD recommended defaults: coarse phases, parallelization on, research/plan-check/verifier enabled.
- Phase 1 playbooks establish Profile source states, Discovery direct-search guardrails, Expansion branching, Sales Mentor source discipline, and viewed/unlocked result grouping.
- Discovery owns viewed lifecycle semantics; Expansion and Sales Mentor consume `unlocked`, `seen`, and `new` result groups.
- `skill/scripts/okki-state.js` is a dependency-free CommonJS Node CLI that owns local `profile.json` and `viewed.json` reads, writes, migration, redaction, classification, and lifecycle updates.
- Profile B class fields missing `source` are conservatively downgraded to `agent_inferred`; only confirmed/imported values count toward trusted completeness families.
- Viewed classification normalizes domains, preserves original result objects, and treats expired unlocked entries as `seen` only when `shown_at` remains inside the active window.
- State helper tests use temporary `XDG_CONFIG_HOME` directories and spawn the CLI, so they do not touch real user config.
- Phase 3 updated `skill/SKILL.md` to 1.2.0 with Local State Helper, Merchant Profile, Prospecting Brief Discovery, Prospecting Expansion, Anti-Staleness Mechanisms, and Sales Mentor Mode sections.
- Workflow A now follows the merged harness order from Profile through viewed classification, Expansion, grouped display, Sales Journey Preview, paid unlock, mark-unlocked, and contacts.
- Workflow C reuses Workflow A for the company-search/contact-discovery front half and keeps recipient/content confirmation plus email-send confirmation intact.
- User Input Guidance now routes prospecting ambiguity through the playbooks; balance, pricing, authentication, and email-status requests remain direct.
- Phase 3 validation passed: `node skill/scripts/okki-state.js --help`, state helper tests (15 tests), static section checks, stale `1.0.12` check, and safety-rule checks.
- Phase 4 added six regression scenarios for direct-search unknown, paid-action guardrail, Business Context order, soft-filter pagination, viewed lifecycle, and Profile source defaults.
- Evaluator behavior coverage uses `expected.behavior.mustEmit`, `mustNotEmit`, and `ordered` plus `BEHAVIOR:` transcript markers; no LLM judge or new dependency was added.
- Local-core reference-agent emits deterministic behavior events from scenario expectations so scenario validation is stable.
- Phase 4 validation passed: targeted Node tests (74 tests), six-scenario local-core regression (16 cases), and full `npm test` (155 tests).
- Phase 5 self-review verified playbook references, Workflow A/C order, helper call order, tier routing, Ladder trigger, unlocked timing, `trade_mode` timing, direct-search fallback, pagination strategy, Iron Rule 0, and B'' coverage.
- Release version consistency is now enforced by `eval/lib/static/static-checker.js` across package, SKILL, installer, resolver, API reference, README, and INSTALL version references.
- Phase 5 cleanup aligned `package.json`, `bin/install.js`, `skill/scripts/resolve-api-key.sh`, `skill/references/api-reference.md`, README, INSTALL, and SKILL changelog to `1.2.0`.
- Top-level installation docs were updated away from legacy runtime flags; local-core static checks now pass with 0 warnings.
- Phase 5 validation passed: static checker (9 tests), targeted Node tests (74 tests), six-scenario local-core regression (17 cases, 0 warnings), root package smoke, and full `eval` suite (156 tests).
- Quick task 2 reduced `skill/SKILL.md` from 724 lines to 221 lines by moving authentication and workflow detail to references while keeping mandatory preflight, billing, output privacy, state helper, and routing rules in the main skill.
- Quick task 2 added static guardrails for preflight, installed state-helper path, free-search output privacy, unlock confirmation, `search-advanced` supported-only docs, viewed large-input docs, and `SKILL.md` length.
- `okki-state.js viewed classify` and `viewed mark-shown` now support `--results-file PATH` and `--results-file -`; inline `--results-json` remains available for small payloads.
- Packaging manufacturer cases now cover both "我是纸品包装制造商，有欧盟环保认证，帮我找意大利的潜客" and "我是纸品包装制造商，帮我开发潜客"; the latter asks target geography/buyer route only and does not repeat product/company-type questions.
- Phase 6 targets `1.3.0`, not `1.2.2`, because the optimized mentor mode changes user-visible routing and guidance behavior.
- Phase 6 intentionally excludes eval implementation changes; eval remains a verification tool and can be updated in a separate follow-up phase if needed.
- `skill/SKILL.md` now defines Optimized Mentor Mode with L0 Default Search, L1 Mentor Lite, L2 Mentor Guided, Minimal Prospecting Profile, OKKI Recallability Guard, pagination-before-Expansion, and explicit Web Research Add-on boundaries.
- `sales-mentor-playbook.md` was rewritten around compact L1/L2 mentor behavior, customer-side relationship routes, buyer-side validation, source discipline, and non-bypassable paid-action confirmation.
- `expansion-playbook.md` now treats Expansion as user-confirmed new search branches after pagination is exhausted or a new route is explicitly requested.
- `discovery-playbook.md` and `workflows.md` now align default search, recovery budgets, L1/L2 routing, and follow-up pagination with the optimized mentor design.
- Package, installer, resolver, API reference, authentication examples, README, INSTALL, and SKILL references now align to `1.3.0`.
- v1.4.0 optimization uses `docs/OKKI_GO_SKILL_SYSTEMIC_TOKEN_LATENCY_OPTIMIZATION_PLAN.md` as the controlling plan and maps its Phase 0-5 sequence to roadmap Phases 8-13.
- Phase 7 already exists as an untracked keyword-contract plan; this optimization starts at Phase 8 to avoid overwriting that work.
- The historical session cited in the plan is only a symptom sample. Implementation must not special-case one conversation, product, geography, company, or email-count mismatch.
- Search recall, Chinese-first target-side keyword generation, one-primary-field first search, paid-action confirmations, same-language replies, compact privacy, and latest-batch row reuse are non-negotiable optimization guardrails.
- Token and latency savings should come from progressive disclosure, compact wrapper contracts, and deterministic script hints, not from smaller default result counts, stricter API filters, or weaker confirmation prompts.
- Phase 8 baseline is recorded at `.planning/phases/08-baseline-and-guardrails/08-BASELINE.md`.
- Phase 9 reduced `skill/SKILL.md` from 407 lines to 161 lines while keeping the six-rule Company Search Keyword Contract, paid-action confirmation summary, mode routing table, command starters, compact output rules, language rule, and error quick map.
- Phase 10 added canonical references for `search-fast-path`, `result-review`, `search-strategy`, `paid-actions`, and `output-contracts`, while converting old `discovery-playbook`, `sales-mentor-playbook`, and `workflows` files into compatibility indexes.
- Phase 10 removed prompt obligations that told the model to manually preserve or copy `domain`; field ownership now points to scripts and saved batch/raw files.
- Phase 11 added `--debug-metadata` across user-facing wrappers. Normal compact stdout now hides `batch_id`, `raw_path`, `private_mapping_saved`, and verbose `output_budget`; explicit debug output places those fields under `debug_metadata`.
- Phase 11 added `skill/scripts/test/debug-metadata.test.js` to prove normal compact output hides debug metadata while raw files remain saved.
- Phase 12 added `discovery_health.health_action` and top-level `next_action` for company discovery wrappers so pagination and low-yield routing do not need to be re-derived by the model.

### Pending Todos

- Align eval static checks/scenarios with v1.3.0 optimized mentor mode and v1.4.0 cost-behavior requirements in the eval phase.
- Add broader representative cost-behavior scenarios and weak-model mode/reference cue checks.
- Reconcile or update parent `../eval` expectations for debug metadata if those tests are part of the release gate.

### Blockers/Concerns

- `okki-go` is not a git root; commit commands must be run from the parent worktree or with correct paths.
- Existing worktree still has unrelated and prior-phase modified/untracked files; do not revert or overwrite them.
- Live local-agent behavior and paid OKKI API flows were not exercised in Phase 5; coverage is deterministic local-core plus safety-rule review.
- Existing eval static check still expects the old PMF Gate boundary sentence; this was not changed because eval implementation is not part of Phase 6.
- Current git status shows deleted tracked `eval/` files under this package and an untracked `../eval/` directory in the parent worktree; treat this as existing user/generated state unless explicitly asked to reconcile it.
- Current `skill/SKILL.md` is 407 lines, above the v1.4.0 target. This is expected before Phase 9 and should be reduced only after Phase 8 baseline is recorded.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 1 | OKKI Go PMF Gate + Target-Side Expansion complete retrofit from spec 27f42dd | 2026-06-02 | uncommitted | Verified | [1-okki-go-pmf-gate-target-side-expansion-c](./quick/1-okki-go-pmf-gate-target-side-expansion-c/) |
| 2 | OKKI Go skill audit remediation: high/medium risks and SKILL.md length | 2026-06-02 | uncommitted | Verified | [2-okki-go-skill-audit-remediation-high-med](./quick/2-okki-go-skill-audit-remediation-high-med/) |

## Session Continuity

Last session: 2026-05-29
Stopped at: Phase 5 complete; v1.2.0 release-ready pending user review/commit/publish decision
Resume file: None
