---
status: passed
date: 2026-06-02
---

# Quick Task 1 Verification

## Must-Haves

| Requirement | Status | Evidence |
|-------------|--------|----------|
| New and under-profiled prospecting requests hit PMF Gate before free company search, including direct-search wording. | passed | `direct-search-pmf-gate`, `pmf-gate-basic-prospecting`, and updated `direct-search-unknown-trade-mode` passed in local-core. |
| Merchant product terms are stored as `merchant_offer_anchor` and must not be mechanically copied into API `productKeywords`. | passed | `target-side-door-lock-plan` asserts `door hardware` / `building hardware` target-side terms and excludes `door lock` / `custom door locks` / `smart locks`. |
| Query execution goes through `target_side_projection` and `query_plan_portfolio` before `search-advanced`. | passed | Behavior markers and ordered assertions in `profile-confirmed-target-plan` and `target-side-door-lock-plan`. |
| Expansion recovery does not default to global `crossFieldOperator: "or"` broadening. | passed | `target-side-recovery-no-global-or` asserts `crossFieldOperator: and` and excludes `or`; docs replace Broadening Ladder with Target-Side Recovery. |
| Paid unlock, contact-search, and email-send guardrails stay unchanged. | passed | Updated `direct-search-paid-action-guardrail` passed with paid/contact/send confirmation markers preserved. |

## Commands

```bash
node --test test/scenario-loader.test.js test/rule-judge.test.js
```

Result: passed, 35/35 tests.

```bash
npm test
```

Result: passed, 164/164 tests.

```bash
node run.js --mode local-core --suite all --report
```

Result: passed, 53/53 results, 0 failures. Report: `eval/results/2026-06-02T01-42-57-158Z/report.md`.

## Residual Risk

- Live local-agent behavior and real OKKI API calls were not exercised; verification is deterministic local-core plus unit coverage.
- Existing unrelated dirty files remain in the worktree and were intentionally left untouched.
