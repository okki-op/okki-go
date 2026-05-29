---
phase: 3
slug: skill-workflow-integration
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-28
updated: 2026-05-28
---

# Phase 3 - Validation Strategy

Phase 3 mostly changes `skill/SKILL.md`, so validation combines static checks, helper smoke tests, and semantic review.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` plus `rg` static checks |
| Quick helper command | `node skill/scripts/okki-state.js --help` |
| Quick state tests | `node --test eval/test/okki-state-profile.test.js eval/test/okki-state-viewed.test.js` |
| Static SKILL check | `rg` for required sections, workflow ordering, version strings, and preserved safety rules |
| Estimated runtime | < 10 seconds |

## Per-Task Verification Map

| Task ID | Plan | Requirement | Test Type | Automated Command | Status |
|---------|------|-------------|-----------|-------------------|--------|
| 3-01-01 | 03-01 | SKILL-01 | static | `rg "Merchant Profile|Prospecting Brief Discovery|Prospecting Expansion|Anti-Staleness|Sales Mentor Mode|okki-state.js" skill/SKILL.md` | passed |
| 3-02-01 | 03-02 | SKILL-02 | static/semantic | `rg "Workflow A|BC1|BC2|Rotation Hint|trade_mode|BC3|Blind-Spot|viewed classify|Sales Journey Preview|mark-unlocked" skill/SKILL.md` | passed |
| 3-02-02 | 03-02 | SKILL-03, SKILL-05 | static/semantic | `rg "Workflow C|confirm recipients and email content|Never send emails before user confirms|emails/send/batch" skill/SKILL.md` | passed |
| 3-03-01 | 03-03 | SKILL-04 | static | Old table absent; `rg "1\.0\.12|Common vague inputs|Suggest better phrasing|Better:" skill/SKILL.md` returns no matches | passed |
| 3-04-01 | 03-04 | SKILL-01, SKILL-05 | static/semantic | `rg "version: 1.2.0|X-Okki-Skill-Version: 1.2.0|Billing Confirmation Rules|First-session confirmation for contact search|Sending emails always requires explicit user confirmation" skill/SKILL.md` | passed |

## Automated Validation Results

Executed 2026-05-28:

- `node skill/scripts/okki-state.js --help` - passed.
- `node --test eval/test/okki-state-profile.test.js eval/test/okki-state-viewed.test.js` - passed, 15 tests.
- Required-section `rg` checks - passed.
- Workflow A/C ordering and safety `rg` checks - passed.
- Stale version/old vague-table check - passed with no matches.

## Manual Semantic Review

- [x] Workflow A follows: Profile -> BC1/BC2 -> Discovery -> Rotation Hint -> trade_mode -> BC3 -> Blind-Spot -> tier/direct-search routing -> search -> viewed classification -> Expansion -> grouped display -> Sales Journey Preview -> axes update -> paid unlock -> mark unlocked -> contacts.
- [x] Workflow C only changes company search/contact discovery before recipient/content confirmation and keeps the email-send half intact.
- [x] User Input Guidance no longer relies on the old vague/better phrasing table for prospecting requests.
- [x] Every new section references the relevant playbook and helper instead of duplicating full rule contracts.
- [x] Existing unrelated non-`.planning` dirty user files were not edited; Phase 3 intentionally modified only `skill/SKILL.md` outside `.planning`.

## Validation Sign-Off

- [x] Required SKILL sections present.
- [x] Workflow A/C ordering reviewed.
- [x] Existing authentication, API key resolver, billing, contact-search, and email-send safety rules preserved.
- [x] Helper smoke and related state tests pass.
- [x] Phase 3 summaries and roadmap/state progress updated.

---
*Phase: 03-skill-workflow-integration*
