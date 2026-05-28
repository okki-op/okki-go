---
phase: 01-rule-contract-playbooks
plan: 01
subsystem: documentation
tags: [merchant-profile, discovery-harness, source-metadata, privacy]
requires: []
provides:
  - Merchant Profile v1.1 schema and source semantics
  - Profile lifecycle, management, Discovery reuse, outreach reuse, and privacy rules
affects: [phase-02-state-helper, phase-03-skill-workflow]
tech-stack:
  added: []
  patterns: [source-aware-profile-defaults, privacy-aware-profile-views]
key-files:
  created:
    - skill/references/merchant-profile-playbook.md
  modified: []
key-decisions:
  - "Only user_confirmed and imported B class fields feed Discovery defaults."
  - "profile.company.country is the L0 anchor for session-derived trade_mode."
  - "preferred_language is lazy-loaded during outreach, not required in Lite Onboarding."
patterns-established:
  - "Profile values are separated into A class direct fields and B class source-metadata fields."
  - "Agent-inferred profile fields must be visible and excluded from defaults until confirmed."
requirements-completed: [RULE-01, RULE-05]
duration: 8min
completed: 2026-05-28
---

# Phase 01: Merchant Profile Playbook Summary

**Source-aware Merchant Profile contract for v1.1 local profile state, Discovery defaults, outreach reuse, and privacy-safe management**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T09:47:00Z
- **Completed:** 2026-05-28T09:55:22Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Created `skill/references/merchant-profile-playbook.md`.
- Defined profile schema v1.1, A/B field classes, source states, completeness, `sales_context`, and `preferred_language` lazy loading.
- Added Lite Onboarding with L0 company country, Progressive Enrichment, Agent Inference Confirmation, Management Workflow, Discovery reuse, outreach reuse, and privacy rules.

## Task Commits

1. **Task 1: Draft profile schema and source semantics** - `1aef621` (docs)
2. **Task 2: Draft profile trigger modes and management workflow** - `65c70b4` (docs)
3. **Task 3: Draft Discovery and outreach reuse rules** - `65c70b4` (docs)

## Files Created/Modified

- `skill/references/merchant-profile-playbook.md` - Merchant Profile schema and lifecycle contract.

## Decisions Made

- Source state semantics follow the merged plan exactly: `user_confirmed`, `user_provided`, `agent_inferred`, and `imported`.
- `agent_inferred` values are stored only as pending context and are excluded from Discovery defaults.
- Outreach reuse can help draft content but cannot skip recipient, email content, quota, or paid-action confirmations.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 can implement `profile read/redact/upsert/update-history/reset` against the documented v1.1 schema and source-state rules.

## Self-Check: PASSED

---
*Phase: 01-rule-contract-playbooks*
*Completed: 2026-05-28*
