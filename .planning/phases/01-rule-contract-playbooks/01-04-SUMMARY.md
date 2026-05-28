---
phase: 01-rule-contract-playbooks
plan: 04
subsystem: documentation
tags: [sales-mentor, cross-reference-audit, rule-contracts, viewed-lifecycle]
requires:
  - phase: 01-rule-contract-playbooks
    provides: Merchant Profile, Discovery, and Expansion playbooks from plans 01-01 through 01-03
provides:
  - Sales Mentor rule contract
  - Cross-playbook consistency audit and lifecycle alignment
affects: [phase-02-state-helper, phase-03-skill-workflow, phase-04-eval-coverage]
tech-stack:
  added: []
  patterns: [country-agnostic-mentor-rules, sourced-sales-advice, viewed-result-groups]
key-files:
  created:
    - skill/references/sales-mentor-playbook.md
  modified:
    - skill/references/discovery-playbook.md
    - skill/references/expansion-playbook.md
    - skill/references/sales-mentor-playbook.md
key-decisions:
  - "Sales Mentor static rules remain country-agnostic; runtime local details require source or marked inference."
  - "BC1/BC2 happen before Brief, while BC3 only runs after trade_mode derivation."
  - "Discovery owns viewed/unlocked lifecycle semantics; Expansion and Sales Mentor consume the same result groups."
patterns-established:
  - "B'' protection: sourced advice by default, max two personal inferences, and Must NOT Say self-check."
  - "Result groups are consistently named unlocked, seen, and new across playbooks."
requirements-completed: [RULE-04, RULE-05]
duration: 6min
completed: 2026-05-28
---

# Phase 01: Sales Mentor Playbook and Audit Summary

**Country-agnostic Sales Mentor contract with B'' protection, staged Business Context, blind-spot checks, reverse recommendations, and aligned result lifecycle references**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-28T09:54:00Z
- **Completed:** 2026-05-28T10:00:18Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Created `skill/references/sales-mentor-playbook.md`.
- Defined Iron Rule 0, persona, B'' protection, Business Context Lite ordering, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, Must NOT Say rules, and user toggle behavior.
- Audited and aligned Discovery, Expansion, and Sales Mentor result grouping around `viewed.json` v1.1, `unlocked`, `seen`, `new`, and 30-day unlock semantics.
- Confirmed no static country-specific mentor terms were present.

## Task Commits

1. **Task 1: Draft Sales Mentor persona and Business Context Lite** - `0d85371` (docs)
2. **Task 2: Draft blind spots, reverse recommendations, journey preview, and Must NOT Say** - `0d85371` (docs)
3. **Task 3: Audit cross-references and consistency** - `7c19401` (docs)
4. **Task 4: Static country-agnostic review** - `7c19401` (docs)

## Files Created/Modified

- `skill/references/sales-mentor-playbook.md` - Sales Mentor Mode rule contract.
- `skill/references/discovery-playbook.md` - Added viewed/unlocked result lifecycle contract.
- `skill/references/expansion-playbook.md` - Added post-expansion result grouping alignment.
- `skill/references/sales-mentor-playbook.md` - Aligned Sales Journey Preview with Discovery result groups.

## Decisions Made

- Discovery owns result classification and viewed lifecycle semantics.
- Expansion may annotate expansion-origin context but does not create new persistent result states.
- Sales Mentor consumes `unlocked`, `seen`, and `new` groups after Discovery classification.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 1 is complete. Phase 2 can implement `okki-state.js` against the documented Profile and viewed-state contracts, including source downgrade, redaction, classification, shown dedupe, and unlocked lifecycle.

## Self-Check: PASSED

---
*Phase: 01-rule-contract-playbooks*
*Completed: 2026-05-28*
