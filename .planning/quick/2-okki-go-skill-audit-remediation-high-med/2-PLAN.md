# Quick Task 2: OKKI Go skill audit remediation - Plan

**Date:** 2026-06-02
**Mode:** GSD quick, inline execution
**Goal:** Fix the high-risk, medium-risk, and document-length issues from the previous OKKI Go skill audit while preserving existing prospecting, billing, and email-send safety boundaries.

## Must Haves

- Correct `okki-state` command paths for installed skill usage.
- Document the supported `search-advanced` request parameters without implying unsupported fields or user-visible `domain`/website output.
- Add a mandatory prospecting preflight at the top of `SKILL.md`.
- Strengthen free-search display rules: never show internal `domain` or website/homepage-like identifiers in free company-search results.
- Strengthen paid unlock rules: no prospecting, direct-search, profile, contact, or "get emails" wording may bypass explicit credit confirmation before `/companies/unlock`.
- Add the packaging manufacturer failure case: "纸品包装制造商，帮我开发潜客" should not ask already-provided product/category questions and should not block free search just because company country is missing.
- Clarify the question boundary between Lite Onboarding and PMF Gate.
- Improve `viewed` large-result input handling by supporting file/stdin input and documenting that path.
- Move long API examples and detailed rule contracts out of the main `SKILL.md` to reduce main-file length and avoid misleading API examples.

## Task 1: Lock Audit Rules in Tests

**Files:**
- Modify: `eval/test/static-checker.test.js`
- Modify: `eval/lib/static/static-checker.js`
- Modify: `eval/test/okki-state-viewed.test.js`
- Modify: `eval/scenarios/business/current-turn-merchant-seed-packaging.yaml`

**Action:**
Add static checks for prospecting preflight, script path, hidden free-search identifiers, unlock confirmation, and main `SKILL.md` length. Add a failing viewed-state test for `--results-file` input. Update the packaging scenario expectations so the failure mode is explicit.

**Verify:**
Run:

```bash
npm test -- --run eval/test/static-checker.test.js eval/test/okki-state-viewed.test.js
```

Expected first run: fails for the newly required contract before implementation.

**Done:**
The regression surface describes the audit findings and fails before the docs/script fixes.

## Task 2: Implement State Helper and Reference Fixes

**Files:**
- Modify: `skill/scripts/okki-state.js`
- Modify: `skill/references/api-reference.md`
- Modify: `skill/references/discovery-playbook.md`
- Modify: `skill/references/merchant-profile-playbook.md`
- Create or modify: `skill/references/workflows.md`
- Create or modify: `skill/references/authentication.md`

**Action:**
Add `--results-file PATH` and `--results-file -` support for `viewed classify` and `viewed mark-shown`, keeping `--results-json` for small inline payloads. Correct helper command examples to `node scripts/okki-state.js`. Tighten API docs around `search-advanced`: supported request fields only, page size max 50, `domain` is internal, and free-search output must not display `domain`, website, homepage, URL, or link columns. Clarify Lite Onboarding versus PMF Gate question ownership.

**Verify:**
Run:

```bash
node --test eval/test/okki-state-viewed.test.js
node skill/scripts/okki-state.js --help
```

**Done:**
The helper supports large result files, help text shows installed-skill paths, and reference docs carry the corrected contracts.

## Task 3: Slim SKILL.md and Verify End to End

**Files:**
- Modify: `skill/SKILL.md`
- Modify: `.planning/STATE.md`
- Create: `.planning/quick/2-okki-go-skill-audit-remediation-high-med/2-SUMMARY.md`
- Create: `.planning/quick/2-okki-go-skill-audit-remediation-high-med/2-VERIFICATION.md`

**Action:**
Refactor `SKILL.md` into a lean router/orchestrator: top mandatory preflight, routing, billing guardrails, state helper summary, output prohibitions, compact workflow references, and links to detailed reference files. Move long authentication, save-key, API, and workflow examples into references. Update GSD state and summary artifacts.

**Verify:**
Run:

```bash
npm test -- --run eval/test/static-checker.test.js eval/test/okki-state-viewed.test.js
node run.js --mode local-core --suite all --scenarios current-turn-merchant-seed-packaging,direct-search-paid-action-guardrail,viewed-lifecycle --report
npm test
```

**Done:**
All targeted and full eval tests pass, `SKILL.md` is materially shorter, and GSD artifacts summarize the changes.
