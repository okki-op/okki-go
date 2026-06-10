---
phase: 06
slug: optimized-mentor-mode-1-3-0
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-09
---

# Phase 6 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node test |
| Config file | `eval/package.json` |
| Quick run command | `node --test eval/test/static-checker.test.js` |
| Full suite command | `node bin/install.js --help` |
| Estimated runtime | ~5 seconds |

## Scope Note

Eval implementation changes are excluded from this phase. Existing static checks are used only as a lightweight regression signal.

## Per-Task Verification Map

| Task ID | Plan | Requirement | Test Type | Automated Command | Status |
|---------|------|-------------|-----------|-------------------|--------|
| 06-01-01 | 06-01 | OMM-01..OMM-07 | static/text | `rg` scans for routing/version/legacy mentor terms | green |
| 06-01-02 | 06-01 | OMM-08 | static | version consistency Node scan | green |
| 06-01-03 | 06-01 | OMM-08 | smoke | `node bin/install.js --help` / `npm test` | green |
| 06-01-04 | 06-01 | Deferred eval alignment | existing eval static | known mismatch |

## Manual-Only Verifications

None. This phase changes Skill/playbook contracts and release metadata only.

## Results

- Version consistency scan passed for package, SKILL, installer, resolver, API reference, authentication examples, README, and INSTALL.
- Optimized mentor-mode keyword scan passed for Skill/playbook contract terms.
- Legacy default mentor-flow scan passed for removed BC/Sales Journey/P0 Expansion wording.
- `node bin/install.js --help` passed and displayed Version 1.3.0.
- `npm test` passed.
- `node --test eval/test/static-checker.test.js` failed because existing eval static check still requires the old sentence `Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search`. This is an eval alignment issue intentionally deferred out of Phase 6.
