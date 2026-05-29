---
phase: 03-skill-workflow-integration
plan: 03
subsystem: documentation
tags: [user-input-guidance, output-formatting, grouped-results, profile-redaction]
requires:
  - phase: 03-skill-workflow-integration
    provides: Harness sections and Workflow A/C updates
provides:
  - Playbook-driven input routing
  - Grouped result and redacted Profile output guidance
affects: [phase-04-eval-coverage, phase-05-release-readiness]
tech-stack:
  added: []
  patterns: [sufficiency-check-routing, redacted-profile-output, viewed-result-groups]
key-files:
  created: []
  modified:
    - skill/SKILL.md
key-decisions:
  - "Removed the old vague/better table and routed prospecting ambiguity through Discovery playbooks."
  - "Kept balance, pricing, authentication, and email-status requests direct instead of running Discovery."
patterns-established:
  - "Company results display as unlocked/seen/new groups after helper classification."
requirements-completed: [SKILL-04, SKILL-05]
duration: 6min
completed: 2026-05-28
---

# Phase 03: Input and Output Guidance Summary

**User guidance now routes prospecting ambiguity through playbooks and displays classified result groups**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-28T10:52:00Z
- **Completed:** 2026-05-28T10:58:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Removed the old vague/better phrasing table from `User Input Guidance`.
- Added intent routing for company discovery, direct free search, selected-company contact discovery, outreach, direct balance/status flows, and Merchant Profile management.
- Updated company output guidance to display `unlocked`, `seen`, and `new` groups and to run `viewed mark-shown` after display.
- Added redacted Merchant Profile output guidance.

## Task Commits

No commits were created in this Codex run. The worktree had unrelated user changes, and this phase kept changes scoped without staging or committing.

## Files Created/Modified

- `skill/SKILL.md` - User Input Guidance and Output Formatting sections.

## Decisions Made

- Simple non-prospecting tasks remain direct so balance/status/auth flows do not pay the Discovery overhead.
- Profile output remains redacted by default to preserve privacy.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.  
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 can test that vague prospecting requests route to Discovery while balance/status requests remain direct.

## Self-Check: PASSED

---
*Phase: 03-skill-workflow-integration*
*Completed: 2026-05-28*
