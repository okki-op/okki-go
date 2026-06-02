---
mode: quick-full
description: OKKI Go PMF Gate + Target-Side Expansion complete retrofit from spec 27f42dd
must_haves:
  truths:
    - New and under-profiled prospecting requests hit PMF Gate before free company search, including direct-search wording.
    - Merchant product terms are stored as merchant_offer_anchor and must not be mechanically copied into API productKeywords.
    - Query execution goes through target_side_projection and query_plan_portfolio before search-advanced.
    - Expansion recovery does not default to global crossFieldOperator OR broadening.
    - Paid unlock, contact-search, and email-send guardrails stay unchanged.
  artifacts:
    - skill/SKILL.md
    - skill/references/discovery-playbook.md
    - skill/references/merchant-profile-playbook.md
    - skill/references/expansion-playbook.md
    - skill/references/sales-mentor-playbook.md
    - eval/lib/runners/reference-agent.js
    - eval/lib/judge/rule-judge.js
    - eval/lib/scenarios/schema.js
    - eval/scenarios/**/*.yaml
    - eval/test/*.test.js
  key_links:
    - docs/superpowers/specs/2026-06-01-okki-go-pmf-quick-profile-gate-design.md at commit 27f42dd
---

# Quick Task 1 Plan

## Task 1: Extend Eval Contract For PMF Gate And Target-Side Plans

files:
- `eval/lib/scenarios/schema.js`
- `eval/lib/judge/rule-judge.js`
- `eval/lib/runners/reference-agent.js`
- `eval/test/scenario-loader.test.js`
- `eval/test/rule-judge.test.js`
- `eval/scenarios/routing/*.yaml`
- `eval/scenarios/business/*.yaml`

action:
- Add optional scenario expectations for API payload shape and behavior markers needed by the PMF Gate / target-side plan flow.
- Add scenarios proving direct search is deferred by PMF Gate, rough search runs only after explicit skip, website extraction requires confirmation, confirmed profile is saved before search, and door-lock discovery uses target-side projected hardware/channel terms rather than mechanically copying `door lock`.
- Update deterministic reference-agent output only enough to satisfy new scenario contracts.

verify:
- Targeted node tests fail before implementation and pass after implementation.
- Scenario loader rejects malformed payload expectations.
- Rule judge flags missing payload terms, forbidden copied merchant terms, missing behavior markers, and unexpected pre-gate company search.

done:
- New scenarios load and deterministic local-core reference behavior passes.

## Task 2: Retrofit Skill And Playbook Contracts

files:
- `skill/SKILL.md`
- `skill/references/discovery-playbook.md`
- `skill/references/merchant-profile-playbook.md`
- `skill/references/expansion-playbook.md`
- `skill/references/sales-mentor-playbook.md`

action:
- Replace old direct-search unknown fallback with PMF Quick Profile Gate rules.
- Define PMF Brief fields, `merchant_offer_anchor`, `query_plan_portfolio`, target route types, target-side projection, validator, L0-L3 tiers, No Route-Library mode, and result grouping.
- Remove the default `AND -> OR` Broadening Ladder contract and replace it with Target-Side Recovery.
- Preserve authentication, billing, contact-search, and email-send confirmation rules.

verify:
- Static checks still pass.
- Text search confirms old default OR broadening and direct-search bypass language is gone from active skill/playbook contracts.
- Required new behavior marker names appear in docs and scenarios.

done:
- Skill docs consistently describe PMF Gate + Target-Side Expansion.

## Task 3: Verify, Summarize, And Update GSD State

files:
- `.planning/quick/1-okki-go-pmf-gate-target-side-expansion-c/1-SUMMARY.md`
- `.planning/quick/1-okki-go-pmf-gate-target-side-expansion-c/1-VERIFICATION.md`
- `.planning/STATE.md`

action:
- Run targeted tests, local-core scenarios, static checker, and full eval suite as feasible.
- Document changed files, commands, outcomes, residual risks, and the existing unrelated dirty worktree.
- Update GSD state with quick task completion.

verify:
- `npm test` in `eval/` passes or any failure is explicitly documented.
- State row references this quick task directory.

done:
- Summary and verification artifacts exist and current state reflects the completed quick task.
