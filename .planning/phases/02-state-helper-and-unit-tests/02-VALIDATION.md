---
phase: 2
slug: state-helper-and-unit-tests
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-28
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for state helper implementation and deterministic tests.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Config file** | `eval/package.json` |
| **Quick run command** | `node --test eval/test/okki-state-profile.test.js eval/test/okki-state-viewed.test.js` |
| **Full suite command** | `cd eval && npm test` |
| **Estimated runtime** | < 10 seconds |

---

## Sampling Rate

- **After helper implementation:** run the quick state tests once the first test file exists.
- **After each test plan:** run the quick state tests.
- **Before Phase 2 completion:** run quick state tests plus `node skill/scripts/okki-state.js --help`.
- **Max feedback latency:** 10 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 2-01-01 | 02-01 | 1 | STATE-01 | cli | `node skill/scripts/okki-state.js profile read` with temp `XDG_CONFIG_HOME` | pending |
| 2-01-02 | 02-01 | 1 | STATE-02 | cli | `node skill/scripts/okki-state.js viewed classify --results-json '[]'` with temp `XDG_CONFIG_HOME` | pending |
| 2-01-03 | 02-01 | 1 | STATE-03 | cli/static | `node skill/scripts/okki-state.js --help` | pending |
| 2-02-01 | 02-02 | 2 | STATE-01, STATE-04 | unit | `node --test eval/test/okki-state-profile.test.js` | pending |
| 2-03-01 | 02-03 | 2 | STATE-02, STATE-03, STATE-04 | unit | `node --test eval/test/okki-state-viewed.test.js` | pending |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Helper boundary | STATE-01..03 | Requires semantic review | Confirm `okki-state.js` does not call OKKI APIs, resolve API keys, generate Briefs, generate Expansion candidates, or decide billing/email confirmation. |
| Non-user-change safety | Project constraint | Requires worktree review | Confirm no existing dirty non-`.planning` files were modified. |

---

## Validation Sign-Off

- [x] All tasks have automated verification instructions.
- [x] State helper behavior has dedicated profile and viewed tests.
- [x] No watch-mode flags.
- [x] Feedback latency < 10s.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
