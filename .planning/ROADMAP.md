# Roadmap: OKKI Go Discovery Harness 1.2.0

## Overview

This roadmap lands the merged discovery harness from rule contracts to tested release. It starts with the playbooks because they define the behavioral contract, then implements the local state helper, then integrates SKILL.md, adds eval coverage, and finishes with a release-readiness audit.

## Phases

**Phase Numbering:**
- Integer phases are planned milestone work.
- Decimal phases are urgent insertions if needed.

- [ ] **Phase 1: Rule Contract Playbooks** - Create the four reference playbooks and lock cross-document behavior rules.
- [ ] **Phase 2: State Helper and Unit Tests** - Implement okki-state.js and deterministic tests for profile/viewed state.
- [ ] **Phase 3: Skill Workflow Integration** - Wire the harness into SKILL.md, preserving existing safety flows.
- [ ] **Phase 4: Eval Coverage** - Add regression scenarios for high-risk harness behavior.
- [ ] **Phase 5: Verification and Release Readiness** - Run self-review, tests, version checks, and release notes.

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
- [ ] 01-01: Merchant Profile playbook
- [ ] 01-02: Discovery playbook
- [ ] 01-03: Expansion playbook
- [ ] 01-04: Sales Mentor playbook and cross-reference audit

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
- [ ] 02-01: State helper CLI and schema migration
- [ ] 02-02: Profile command tests
- [ ] 02-03: Viewed lifecycle and corrupt-state tests

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
- [ ] 03-01: Add new SKILL.md harness sections
- [ ] 03-02: Rewrite Workflow A and Workflow C boundaries
- [ ] 03-03: Rewrite User Input Guidance and output/profile references
- [ ] 03-04: Version bump and safety-preservation review

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
- [ ] 04-01: Add high-risk YAML scenarios
- [ ] 04-02: Extend evaluator only where necessary
- [ ] 04-03: Run and stabilize regression checks

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
- [ ] 05-01: Self-review and verification artifact
- [ ] 05-02: Final test run and release readiness cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rule Contract Playbooks | 0/4 | Not started | - |
| 2. State Helper and Unit Tests | 0/3 | Not started | - |
| 3. Skill Workflow Integration | 0/4 | Not started | - |
| 4. Eval Coverage | 0/3 | Not started | - |
| 5. Verification and Release Readiness | 0/2 | Not started | - |
