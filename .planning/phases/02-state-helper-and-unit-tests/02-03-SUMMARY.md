---
phase: 02-state-helper-and-unit-tests
plan: 03
subsystem: testing
tags: [node-test, viewed-json, dedupe, unlocked-lifecycle, corrupt-backup]
requires:
  - phase: 02-state-helper-and-unit-tests
    provides: `okki-state.js` viewed CLI from plan 02-01
provides:
  - Viewed lifecycle unit coverage
  - Three-group classification coverage
  - Corrupt recovery, v1.0 migration, dedupe, expiry, and permission coverage
affects: [phase-03-skill-workflow, phase-04-eval-coverage, phase-05-release-readiness]
tech-stack:
  added: []
  patterns: [spawn-cli-tests, active-window-classification-tests]
key-files:
  created:
    - eval/test/okki-state-viewed.test.js
  modified: []
key-decisions:
  - "Viewed tests model the 30-day unlock window and explicit expiry fallback."
  - "Domain normalization is tested through website, URL, and www-prefixed inputs."
patterns-established:
  - "Viewed lifecycle tests classify before and after mark-shown/mark-unlocked writes."
  - "Expired unlocked entries are tested separately from expired viewed entries."
requirements-completed: [STATE-02, STATE-03, STATE-04]
duration: 8min
completed: 2026-05-28
---

# Phase 02: Viewed Lifecycle and Corrupt-State Tests Summary

**Viewed helper tests covering v1.0 migration, deduplicated shown writes, unlocked lifecycle, active-window classification, corrupt recovery, atomic writes, and mode 0600**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T10:28:00Z
- **Completed:** 2026-05-28T10:36:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `eval/test/okki-state-viewed.test.js`.
- Covered missing viewed state, `mark-shown` domain dedupe, v1.0 migration, `unlocked`/`seen`/`new` grouping, `mark-unlocked`, window expiry behavior, corrupt JSON backup, no lingering temp files, and mode `0600`.
- Verified classification preserves result objects while attaching normalized domains and persisted state.

## Task Commits

1. **Task 1: Add classification and dedupe tests** - `24a72b3` (test)
2. **Task 2: Add unlocked, expiry, corrupt backup, and permission tests** - `24a72b3` (test)

**Plan metadata:** `86bad12` (docs)

## Files Created/Modified

- `eval/test/okki-state-viewed.test.js` - Viewed-state helper CLI tests.

## Decisions Made

- Tested expired unlocked entries as `seen` only when their `shown_at` remains in the active window.
- Kept viewed state limited to `viewed` and `unlocked`; saved/dismissed states remain out of scope.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.  
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 can use `viewed classify`, `mark-shown`, and `mark-unlocked` in Workflow A/C, and Phase 4 can build viewed-lifecycle scenarios on tested helper behavior.

## Self-Check: PASSED

---
*Phase: 02-state-helper-and-unit-tests*
*Completed: 2026-05-28*
