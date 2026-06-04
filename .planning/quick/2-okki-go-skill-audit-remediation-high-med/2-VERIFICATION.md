---
status: passed
date: 2026-06-02
---

# Quick Task 2 Verification

## Must-Haves

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Correct installed `okki-state` path. | passed | `node skill/scripts/okki-state.js --help` shows `node scripts/okki-state.js ...`; static guardrail checks this string. |
| Support large viewed-state inputs. | passed | `eval/test/okki-state-viewed.test.js` covers `--results-file PATH` and `--results-file -`; targeted and full suites passed. |
| Fix `search-advanced` parameter documentation and avoid misleading unsupported fields. | passed | `api-reference.md` states `search-advanced supports only` documented fields; static guardrail passed. |
| Add mandatory prospecting preflight. | passed | `SKILL.md` contains `## Mandatory Prospecting Preflight`; static guardrail passed. |
| Hide internal `domain`/website/homepage/URL/link in free search output. | passed | `SKILL.md`, `api-reference.md`, `discovery-playbook.md`, and `workflows.md` carry the prohibition; static guardrail passed. |
| Strengthen unlock confirmation. | passed | `SKILL.md` and `discovery-playbook.md` require explicit unlock credit confirmation; `direct-search-paid-action-guardrail` passed. |
| Add paper-packaging failure case. | passed | New `packaging-manufacturer-missing-target-geo` scenario passed; current-turn packaging-with-Italy scenario also passed. |
| Clarify Lite Onboarding vs PMF Gate. | passed | `SKILL.md`, `discovery-playbook.md`, and `merchant-profile-playbook.md` define the boundary; static guardrail passed. |
| Reduce main `SKILL.md` length. | passed | `wc -l skill/SKILL.md` reports 221 lines, under the 500-line static threshold and down from 724 lines. |

## Commands

```bash
node --test eval/test/static-checker.test.js eval/test/okki-state-viewed.test.js eval/test/rule-judge.test.js
```

Result: passed, 41/41 tests.

```bash
node run.js --mode local-core --suite all --scenarios current-turn-merchant-seed-packaging,packaging-manufacturer-missing-target-geo,direct-search-paid-action-guardrail,viewed-lifecycle --report
```

Result: passed, 18/18 results, 0 failures. Report: `eval/results/2026-06-02T09-52-16-510Z/report.md`.

```bash
npm test
```

Result in `eval/`: passed, 169/169 tests.

```bash
npm test
```

Result in `okki-go/`: passed installer help smoke.

## Residual Risk

- Live local-agent behavior and real OKKI API or paid flows were not exercised.
- Worktree still contains prior unrelated/uncommitted changes; this verification covers deterministic local-core, static contracts, state helper behavior, and package smoke.
