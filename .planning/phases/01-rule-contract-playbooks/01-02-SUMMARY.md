---
phase: 01-rule-contract-playbooks
plan: 02
subsystem: documentation
tags: [discovery, brief, guardrails, search-advanced, country-codes]
requires:
  - phase: 01-rule-contract-playbooks
    provides: Merchant Profile defaults from plan 01-01
provides:
  - Discovery sufficiency, guardrail, Brief, API mapping, country-code, and confirmation-tier contract
affects: [phase-03-skill-workflow, phase-04-eval-coverage]
tech-stack:
  added: []
  patterns: [three-tier-brief-confirmation, direct-search-unknown-fallback, local-filter-pagination]
key-files:
  created:
    - skill/references/discovery-playbook.md
  modified: []
key-decisions:
  - "Direct search skips Discovery questions only; it never skips authentication, paid-action, or email-send confirmation."
  - "trade_mode is session-derived after Brief generation and is not persisted."
  - "employee_range and other unsupported filters use local pagination before Expansion decisions."
patterns-established:
  - "Brief fields map explicitly to search-advanced fields or to local/contact-stage handling."
  - "Tier 1/2/3 routing depends on Profile completeness with strict/direct overrides."
requirements-completed: [RULE-02, RULE-05]
duration: 7min
completed: 2026-05-28
---

# Phase 01: Discovery Playbook Summary

**Prospecting Brief Discovery contract with direct-search guardrails, API mapping, country normalization, and three-tier confirmation routing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-28T09:48:00Z
- **Completed:** 2026-05-28T09:55:22Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Created `skill/references/discovery-playbook.md`.
- Defined Sufficiency Check, Hard Guardrails, direct-search unknown fallback, Five Gray Areas, Brief schema, `trade_mode` timing, and API mapping.
- Added local-only filter pagination, decision-role separation, 50-country ISO table, Pre-Search Statement, Tier 1/2/3 routing, and Brief Confirmation Template contract.

## Task Commits

1. **Task 1: Draft Sufficiency Check and Hard Guardrails** - `32d3cbd` (docs)
2. **Task 2: Draft gray areas, Brief schema, and API mapping** - `32d3cbd` (docs)
3. **Task 3: Draft country-code table and confirmation tiers** - `f65ce7a` (docs)

## Files Created/Modified

- `skill/references/discovery-playbook.md` - Discovery rule contract.

## Decisions Made

- Direct-search with `trade_mode = unknown` may proceed for free company search but downgrades mentor behavior.
- `decision_roles` are explicitly barred from company search keyword fields.
- Expansion thresholds must use filtered result counts when local-only filters are active.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 can wire Workflow A/C routing to this playbook, and Phase 4 can build direct-search, paid guardrail, BC order, and soft-filter pagination scenarios against these rules.

## Self-Check: PASSED

---
*Phase: 01-rule-contract-playbooks*
*Completed: 2026-05-28*
