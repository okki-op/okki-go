---
phase: 03-skill-workflow-integration
plan: 02
subsystem: documentation
tags: [workflow-a, workflow-c, safety-boundary, viewed-lifecycle, sales-mentor]
requires:
  - phase: 03-skill-workflow-integration
    provides: Harness sections from 03-01
provides:
  - Workflow A 20-step harness sequence
  - Workflow C front-half discovery/contact boundary
affects: [phase-04-eval-coverage, phase-05-release-readiness]
tech-stack:
  added: []
  patterns: [ordered-workflow-contract, send-confirmation-preservation]
key-files:
  created: []
  modified:
    - skill/SKILL.md
key-decisions:
  - "Workflow A now places viewed classification before Expansion and reclassifies merged results when Expansion changes the final result set."
  - "Workflow C reuses Workflow A through contact discovery, then returns to the existing recipient/content confirmation and batch-send flow."
patterns-established:
  - "Direct-search paths can skip Discovery questions for free search only, not safety confirmations."
requirements-completed: [SKILL-02, SKILL-03, SKILL-05]
duration: 8min
completed: 2026-05-28
---

# Phase 03: Workflow A/C Boundary Summary

**Workflow A now runs the merged discovery harness, while Workflow C preserves the email-send confirmation boundary**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T10:44:00Z
- **Completed:** 2026-05-28T10:52:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced the old five-step Workflow A with the merged 20-step sequence: Profile, BC1/BC2, Discovery, Rotation Hint, `trade_mode`, BC3, Blind-Spot, tier/direct-search routing, search, viewed classification, Expansion, grouped display, Sales Journey Preview, axes update, paid unlock, mark unlocked, and contacts.
- Rewrote Workflow C so only the company-search/contact-discovery front half uses the harness.
- Preserved "ask user to confirm recipients and email content" and "Never send emails before user confirms" before `/emails/send/batch`.

## Task Commits

No commits were created in this Codex run. The worktree had unrelated user changes, and this phase kept changes scoped without staging or committing.

## Files Created/Modified

- `skill/SKILL.md` - Workflow A and Workflow C orchestration.

## Decisions Made

- Kept paid unlock after user selection and before contact emails.
- Kept `viewed mark-unlocked` only after a successful `/companies/unlock`.
- Kept `/contacts/search` as Workflow B with its first-session confirmation, rather than folding it into Workflow A.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.  
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 4 can add scenarios for Workflow A ordering, direct-search unknown trade mode, paid-action guardrails, and Workflow C send-confirmation preservation.

## Self-Check: PASSED

---
*Phase: 03-skill-workflow-integration*
*Completed: 2026-05-28*
