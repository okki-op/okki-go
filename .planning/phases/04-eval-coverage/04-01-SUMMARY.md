---
phase: 04-eval-coverage
plan: 01
subsystem: eval
tags: [yaml-scenarios, discovery-harness, guardrails, regression]
requires:
  - phase: 03-skill-workflow-integration
    provides: SKILL.md workflow and safety contracts
provides:
  - High-risk Discovery Harness regression scenarios
affects: [phase-05-release-readiness]
tech-stack:
  added: []
  patterns: [behavior-marker-scenarios, local-core-regression]
key-files:
  created:
    - eval/scenarios/routing/direct-search-unknown-trade-mode.yaml
    - eval/scenarios/safety/direct-search-paid-action-guardrail.yaml
    - eval/scenarios/business/business-context-order.yaml
    - eval/scenarios/business/soft-filter-pagination.yaml
    - eval/scenarios/business/viewed-lifecycle.yaml
    - eval/scenarios/business/profile-source-defaults.yaml
  modified: []
key-decisions:
  - "Scenario expectations use explicit behavior markers for workflow order and guardrails that API-call checks cannot express."
  - "Direct-search paid-action coverage keeps free company search separate from unlock/contact/email confirmations."
patterns-established:
  - "High-risk harness behavior is represented as deterministic YAML scenarios under existing routing/business/safety suites."
requirements-completed: [EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05, EVAL-06]
duration: 7min
completed: 2026-05-28
---

# Phase 04: High-Risk Scenario Summary

**Added six YAML scenarios for the Phase 4 Discovery Harness regression surface**

## Accomplishments

- Added direct-search unknown trade_mode coverage.
- Added direct-search paid-action guardrail coverage.
- Added Business Context ordering coverage.
- Added employee-range soft-filter pagination coverage.
- Added viewed/unlocked lifecycle grouping coverage.
- Added Profile source-default coverage.

## Files Created

- `eval/scenarios/routing/direct-search-unknown-trade-mode.yaml`
- `eval/scenarios/safety/direct-search-paid-action-guardrail.yaml`
- `eval/scenarios/business/business-context-order.yaml`
- `eval/scenarios/business/soft-filter-pagination.yaml`
- `eval/scenarios/business/viewed-lifecycle.yaml`
- `eval/scenarios/business/profile-source-defaults.yaml`

## Deviations from Plan

None.

## Validation

Validated later with Phase 4 evaluator support:

- `node --test eval/test/scenario-loader.test.js`
- `node run.js --mode local-core --suite all --scenarios direct-search-unknown-trade-mode,direct-search-paid-action-guardrail,business-context-order,soft-filter-pagination,viewed-lifecycle,profile-source-defaults --report`

## Self-Check: PASSED

---
*Phase: 04-eval-coverage*
*Completed: 2026-05-28*
