---
phase: 04-eval-coverage
plan: 02
subsystem: eval
tags: [rule-judge, scenario-schema, behavior-markers, local-agent]
requires:
  - phase: 04-eval-coverage
    provides: High-risk YAML scenarios
provides:
  - Behavior marker schema and rule-judge support
  - Local-agent transcript parsing for behavior events
affects: [phase-05-release-readiness]
tech-stack:
  added: []
  patterns: [deterministic-transcript-markers, ordered-behavior-judge]
key-files:
  created: []
  modified:
    - eval/lib/scenarios/schema.js
    - eval/lib/judge/rule-judge.js
    - eval/lib/runners/reference-agent.js
    - eval/lib/adapters/agent-execution.js
    - eval/test/rule-judge.test.js
    - eval/test/scenario-loader.test.js
    - eval/test/agent-adapter.test.js
    - eval/test/fixtures/fake-codex-cli.js
key-decisions:
  - "Use `expected.behavior.mustEmit`, `mustNotEmit`, and `ordered` instead of adding a new LLM judge."
  - "Reference-agent emits deterministic behavior events from scenario expectations so local-core remains stable."
  - "Local-agent prompt and parser now support `BEHAVIOR:` transcript markers."
patterns-established:
  - "Rule judge reports `missing_behavior`, `forbidden_behavior`, and `behavior_out_of_order` failures."
requirements-completed: [EVAL-03, EVAL-04, EVAL-05, EVAL-06]
duration: 9min
completed: 2026-05-28
---

# Phase 04: Evaluator Extension Summary

**Extended the evaluator with small, deterministic behavior-marker expectations**

## Accomplishments

- Added `expected.behavior` validation to the scenario schema.
- Added rule-judge checks for required, forbidden, and ordered behavior markers.
- Added `behavior` score reporting alongside routing/API/safety scores.
- Updated reference-agent and local-agent transcript parsing to support `BEHAVIOR:` markers.
- Added tests for schema validation, behavior judging, transcript parsing, and Codex adapter marker capture.

## Files Modified

- `eval/lib/scenarios/schema.js`
- `eval/lib/judge/rule-judge.js`
- `eval/lib/runners/reference-agent.js`
- `eval/lib/adapters/agent-execution.js`
- `eval/test/rule-judge.test.js`
- `eval/test/scenario-loader.test.js`
- `eval/test/agent-adapter.test.js`
- `eval/test/fixtures/fake-codex-cli.js`

## Deviations from Plan

None.

## Validation

- `node --test eval/test/scenario-loader.test.js eval/test/rule-judge.test.js eval/test/agent-adapter.test.js eval/test/local-agent-runner.test.js eval/test/okki-state-profile.test.js` - passed, 74 tests.
- `node run.js --mode local-core --suite all --scenarios direct-search-unknown-trade-mode,direct-search-paid-action-guardrail,business-context-order,soft-filter-pagination,viewed-lifecycle,profile-source-defaults --report` - passed after fixing one scenario marker ordering issue.

## Self-Check: PASSED

---
*Phase: 04-eval-coverage*
*Completed: 2026-05-28*
