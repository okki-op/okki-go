# Roadmap: OKKI Go Discovery Harness 1.2.0

## Overview

This roadmap lands the merged discovery harness from rule contracts to tested release, then continues into optimized mentor-mode and systemic token/latency optimization work. The current optimization milestone refactors information architecture and wrapper contracts without reducing search recall or weakening paid-action safeguards.

## Phases

**Phase Numbering:**
- Integer phases are planned milestone work.
- Decimal phases are urgent insertions if needed.

- [x] **Phase 1: Rule Contract Playbooks** - Create the four reference playbooks and lock cross-document behavior rules.
- [x] **Phase 2: State Helper and Unit Tests** - Implement okki-state.js and deterministic tests for profile/viewed state.
- [x] **Phase 3: Skill Workflow Integration** - Wire the harness into SKILL.md, preserving existing safety flows.
- [x] **Phase 4: Eval Coverage** - Add regression scenarios for high-risk harness behavior.
- [x] **Phase 5: Verification and Release Readiness** - Run self-review, tests, version checks, and release notes.
- [x] **Phase 6: Optimized Mentor Mode 1.3.0** - Land L0/L1/L2 mentor routing, pagination-aware Expansion, recallability guardrails, and 1.3.0 version consistency.
- [x] **Phase 8: Baseline and Guardrails** - Capture size, behavior, protected invariants, and evaluation coverage before refactoring.
- [x] **Phase 9: SKILL Router Hot Path** - Rebuild `SKILL.md` as a compact router, safety summary, and command starter.
- [x] **Phase 10: Reference Ownership and Deduplication** - Split or trim references into strict operational owners with weak-model-friendly loading rules.
- [x] **Phase 11: Compact Output Contracts** - Define and implement normal/detail/debug/raw output classes and field ownership across wrappers.
- [x] **Phase 12: Deterministic Routing Hints** - Move repetitive pagination, low-yield, row-mapping, truncation, and next-action decisions into script outputs.
- [ ] **Phase 13: Cost and Capability Evals** - Add cost-behavior, safety, privacy, search-recall, and weak-model forward tests.

## Phase Details

### Phase 1: Rule Contract Playbooks
**Goal**: Create the complete rule-contract documentation that SKILL.md and future implementation will reference.  
**Depends on**: Nothing.  
**Requirements**: [RULE-01, RULE-02, RULE-03, RULE-04, RULE-05]  
**Success Criteria** (what must be TRUE):
  1. Four files exist under `skill/references/`: `merchant-profile-playbook.md`, `discovery-playbook.md`, `expansion-playbook.md`, and `sales-mentor-playbook.md`.
  2. Merchant Profile rules define schema v1.1, source metadata, Lite Onboarding with L0 country, progressive enrichment, management workflow, Discovery/outreach reuse, preferred_language lazy load, and privacy rules.
  3. Discovery rules define Sufficiency Check, Hard Guardrails, direct-search unknown fallback, Five Gray Areas, Brief schema, API mapping, 50-country table, Pre-Search Statement, and three-tier confirmation.
  4. Expansion rules define Ladder, Full, Lite, candidate output, reverse recommendation requirement, selection parsing, candidate-to-Brief mapping, and multi-round limits.
  5. Sales Mentor rules define Iron Rule 0, B'' protection, Business Context order, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, and Must NOT Say.
  6. Cross-references are consistent and static mentor rules are country-agnostic.
**Plans**: 4 plans

Plans:
- [x] 01-01: Merchant Profile playbook
- [x] 01-02: Discovery playbook
- [x] 01-03: Expansion playbook
- [x] 01-04: Sales Mentor playbook and cross-reference audit

### Phase 2: State Helper and Unit Tests
**Goal**: Add a minimal, dependency-free Node helper for local profile/viewed state and prove it with unit tests.  
**Depends on**: Phase 1.  
**Requirements**: [STATE-01, STATE-02, STATE-03, STATE-04]  
**Success Criteria** (what must be TRUE):
  1. `skill/scripts/okki-state.js` implements profile read/redact/upsert/update-history/reset.
  2. `skill/scripts/okki-state.js` implements viewed classify/mark-shown/mark-unlocked/reset.
  3. Missing, old, corrupt, and permission-misaligned state files are handled safely.
  4. Tests cover profile migration, source downgrade, redaction, viewed migration, grouping, deduplication, unlocked lifecycle, corrupt backup, atomic write behavior, and mode 0600.
**Plans**: 3 plans

Plans:
- [x] 02-01: State helper CLI and schema migration
- [x] 02-02: Profile command tests
- [x] 02-03: Viewed lifecycle and corrupt-state tests

### Phase 3: Skill Workflow Integration
**Goal**: Update SKILL.md to version 1.2.0 with harness sections, helper calls, and Workflow A/C changes while preserving safety.  
**Depends on**: Phase 2.  
**Requirements**: [SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05]  
**Success Criteria** (what must be TRUE):
  1. SKILL.md version and version headers reference 1.2.0 where appropriate.
  2. New Merchant Profile, Discovery, Expansion, Anti-Staleness, and Sales Mentor Mode sections exist and reference the playbooks/helper.
  3. Workflow A contains the merged 20-step sequence with correct ordering.
  4. Workflow C only changes company search/contact discovery front half and keeps email confirmation/send half intact.
  5. User Input Guidance no longer relies on the vague/better phrasing table for prospecting requests.
**Plans**: 4 plans

Plans:
- [x] 03-01: Add new SKILL.md harness sections
- [x] 03-02: Rewrite Workflow A and Workflow C boundaries
- [x] 03-03: Rewrite User Input Guidance and output/profile references
- [x] 03-04: Version bump and safety-preservation review

### Phase 4: Eval Coverage
**Goal**: Add deterministic and scenario-level coverage for the high-risk behavior changes.  
**Depends on**: Phase 3.  
**Requirements**: [EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05, EVAL-06]  
**Success Criteria** (what must be TRUE):
  1. New YAML scenarios exist for direct-search unknown, paid-action guardrail, business context order, soft-filter pagination, viewed lifecycle, and profile source defaults.
  2. Scenario loader validates all new scenarios.
  3. Rule-judge or scenario expectations cover the behavior possible with current eval infrastructure.
  4. Any required judge/schema extension is small, tested, and scoped to the new expectations.
**Plans**: 3 plans

Plans:
- [x] 04-01: Add high-risk YAML scenarios
- [x] 04-02: Extend evaluator only where necessary
- [x] 04-03: Run and stabilize regression checks

### Phase 5: Verification and Release Readiness
**Goal**: Complete the merged plan self-review and prepare the skill for release as 1.2.0.  
**Depends on**: Phase 4.  
**Requirements**: [REL-01, REL-02, REL-03]  
**Success Criteria** (what must be TRUE):
  1. Relevant Node tests and eval validation pass.
  2. A self-review artifact checks playbook references, workflow order, helper call order, tier routing, Ladder trigger, unlocked timing, trade_mode timing, direct-search fallback, pagination, Iron Rule 0, and B'' coverage.
  3. Package/SKILL version references and changelog are consistent with 1.2.0 release scope.
**Plans**: 2 plans

Plans:
- [x] 05-01: Self-review and verification artifact
- [x] 05-02: Final test run and release readiness cleanup

### Phase 6: Optimized Mentor Mode 1.3.0
**Goal**: Implement the optimized mentor-mode design from `docs/OKKI_GO_OPTIMIZED_MENTOR_MODE_SKILL_DESIGN.md` in the Skill and reference playbooks without making eval implementation part of the phase scope.  
**Depends on**: Phase 5.  
**Requirements**: [OMM-01, OMM-02, OMM-03, OMM-04, OMM-05, OMM-06, OMM-07, OMM-08]  
**Success Criteria** (what must be TRUE):
  1. `skill/SKILL.md` documents Optimized Mentor Mode and routes ordinary search to L0, result judgment to L1, and guided strategy/diagnosis to L2.
  2. `sales-mentor-playbook.md` defines Minimal Prospecting Profile, customer-side relationship routes, OKKI Recallability Guard, compact L1/L2 output, and source discipline.
  3. `expansion-playbook.md` requires pagination checks before Expansion and user confirmation before searching a new branch.
  4. `discovery-playbook.md` and `workflows.md` align recovery budgets, recall-first payload rules, and follow-up routing with the optimized mentor design.
  5. Package/SKILL release references are consistent with `1.3.0`.
**Plans**: 1 plan

Plans:
- [x] 06-01: Skill and playbook optimized mentor-mode retrofit

### Phase 8: Baseline and Guardrails
**Goal**: Establish the non-regression baseline before changing skill text or wrapper behavior.  
**Depends on**: Phase 6 and the existing Phase 7 keyword-contract plan remaining undisturbed.  
**Requirements**: [TLO-BASE-01, TLO-BASE-02, TLO-BASE-03]  
**Success Criteria** (what must be TRUE):
  1. A baseline artifact records current line/byte sizes for `skill/SKILL.md`, `skill/references/*.md`, and `skill/scripts/README.md`.
  2. Representative prompts and expected behaviors are listed for ordinary search, pagination, row-selection unlock confirmation, confirmed unlock, result review, low-yield diagnosis, balance, contact search confirmation, and email status.
  3. Protected invariants explicitly include search recall, Chinese-first target-side keyword rules, one-primary-field first search, paid confirmation, same-language replies, compact privacy, latest-batch row reuse, and warning-only local viewed-state degradation.
  4. The current dirty worktree and eval relocation/deletion state are documented so unrelated user work is not reverted.
  5. No implementation behavior changes are made in this phase.
**Plans**: 1 plan

Plans:
- [x] 08-01: Baseline artifact and protected invariants

### Phase 9: SKILL Router Hot Path
**Goal**: Reduce hot-path context by turning `skill/SKILL.md` into a short router and safety surface.  
**Depends on**: Phase 8.  
**Requirements**: [TLO-ROUTER-01, TLO-ROUTER-02, TLO-ROUTER-03]  
**Success Criteria** (what must be TRUE):
  1. `skill/SKILL.md` is below 220 preferred lines or below 300 with a documented exception.
  2. `SKILL.md` contains one primary mode table, a safety-preserving fallback order, and a "Read Only When" reference-loading table.
  3. A simple "find buyers" prompt can be executed after reading only `SKILL.md`, or `SKILL.md` plus the fast-path reference if the quick command is insufficient.
  4. Paid unlock, contact search, and email-send confirmation summaries remain visible in `SKILL.md`.
  5. `SKILL.md` contains exactly one six-rule Company Search Keyword Contract and no instruction requiring the model to manually preserve `domain`.
**Plans**: 1 plan

Plans:
- [x] 09-01: Router rewrite and hot-path safety review

### Phase 10: Reference Ownership and Deduplication
**Goal**: Make progressive disclosure real by assigning each rule to one canonical reference owner.  
**Depends on**: Phase 9.  
**Requirements**: [TLO-REF-01, TLO-REF-02, TLO-REF-03]  
**Success Criteria** (what must be TRUE):
  1. Search fast path, result review, search strategy, expansion, paid actions, output contracts, API reference, auth, and merchant profile each have a clear owning reference.
  2. References over 100 lines include a short top-level table of contents.
  3. References do not duplicate the full keyword contract, paid confirmation text, compact schemas, API parameter tables, or script-owned field instructions.
  4. Weak models can choose the correct reference from `SKILL.md` without reading another reference first.
  5. Advanced capabilities remain available and are linked from the router table.
**Plans**: 1 plan

Plans:
- [x] 10-01: Reference split, ownership, and duplicate-prose removal

### Phase 11: Compact Output Contracts
**Goal**: Standardize wrapper output classes so normal workflows stay compact and answer-ready.  
**Depends on**: Phase 10.  
**Requirements**: [TLO-OUTPUT-01, TLO-OUTPUT-02, TLO-OUTPUT-03]  
**Success Criteria** (what must be TRUE):
  1. `skill/references/output-contracts.md` defines normal compact, detail, debug metadata, and raw/export schemas for every user-facing wrapper.
  2. Field ownership for `domain`, raw IDs, `batch_id`, `raw_path`, `private_mapping_saved`, `output_budget`, pagination metadata, latest batch pointer, and local viewed state is explicit.
  3. Wrapper audits classify stdout fields as answer-critical, routing-critical, debug-only, or raw/export-only.
  4. Normal outputs do not print raw API objects, full local state, full profiles, full email bodies, internal IDs, domains, or raw URLs.
  5. Row selections still work through saved batch pointers.
**Plans**: 1 plan

Plans:
- [x] 11-01: Output contract reference and wrapper audit

### Phase 12: Deterministic Routing Hints
**Goal**: Reduce repeated model inference by exposing script-owned action hints without changing search recall.  
**Depends on**: Phase 11.  
**Requirements**: [TLO-ROUTE-01, TLO-ROUTE-02, TLO-ROUTE-03]  
**Success Criteria** (what must be TRUE):
  1. Scripts return `next_action` and/or `health_action` only where the hint removes real model guesswork.
  2. Pagination, low-yield, row-mapping validity, output truncation, and next user action are not inferred from chat text when script metadata exists.
  3. The model does not inspect raw files for normal presentation.
  4. The model does not re-search to resolve row selections when the latest batch exists.
  5. Token savings do not come from lower default result counts, stricter first-round filters, or premature precision.
**Plans**: 1 plan

Plans:
- [x] 12-01: Script routing hints and command-pattern hardening

### Phase 13: Cost and Capability Evals
**Goal**: Prove the optimization reduces context/latency risk without damaging quality, safety, or weak-model behavior.  
**Depends on**: Phase 12.  
**Requirements**: [TLO-EVAL-01, TLO-EVAL-02, TLO-EVAL-03]  
**Success Criteria** (what must be TRUE):
  1. Eval prompts cover normal search, more/next pagination, low-yield diagnosis, unlock confirmation, confirmed unlock, balance, contact search confirmation, outreach drafting, and email status.
  2. Static checks cover hot-path size, raw-output leakage, duplicate rule ownership, paid confirmations, and weak-model routing cues.
  3. Search recall comparison and paid-confirmation checks block merging on regression.
  4. Forward tests use generic prompts and fresh or smaller agents, not the diagnosis or the historical sample session.
  5. Failures are addressed first with routing rows, wrapper fields, or command patterns before adding long prose.
**Plans**: 1 plan

Plans:
- [ ] 13-01: Cost-behavior evals and weak-model forward-test harness

## Progress

**Execution Order:**
Phases execute in numeric order. Phase 7 is an existing keyword-contract plan; this optimization continues with Phase 8 to avoid overwriting that work.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rule Contract Playbooks | 4/4 | Complete | 2026-05-28 |
| 2. State Helper and Unit Tests | 3/3 | Complete | 2026-05-28 |
| 3. Skill Workflow Integration | 4/4 | Complete | 2026-05-28 |
| 4. Eval Coverage | 3/3 | Complete | 2026-05-28 |
| 5. Verification and Release Readiness | 2/2 | Complete | 2026-05-29 |
| 6. Optimized Mentor Mode 1.3.0 | 1/1 | Complete | 2026-06-09 |
| 8. Baseline and Guardrails | 1/1 | Complete | 2026-06-11 |
| 9. SKILL Router Hot Path | 1/1 | Complete | 2026-06-11 |
| 10. Reference Ownership and Deduplication | 1/1 | Complete | 2026-06-11 |
| 11. Compact Output Contracts | 1/1 | Complete | 2026-06-11 |
| 12. Deterministic Routing Hints | 1/1 | Complete | 2026-06-11 |
| 13. Cost and Capability Evals | 0/1 | Planned | — |
