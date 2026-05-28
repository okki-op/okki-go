# Project Research - Stack

**Project:** OKKI Go Discovery Harness 1.2.0  
**Researched:** 2026-05-28  
**Scope:** Stack additions for the merged discovery harness plan.

## Existing Stack

- Node.js package with `package.json` engine `>=14.0.0`.
- Skill instructions in Markdown under `skill/SKILL.md`.
- Skill reference docs under `skill/references/`.
- Shell/Node helper scripts under `skill/scripts/`.
- Eval platform under `eval/` using CommonJS modules, YAML scenarios, and `node --test`.
- Existing package test command is `npm test`, currently `node bin/install.js --help`.

## Recommended Additions

- Add `skill/scripts/okki-state.js` using only Node.js standard library: `fs`, `path`, `os`, and process argv parsing.
- Add unit tests under `eval/test/` for okki-state.js behavior. Use existing Node test infrastructure rather than adding Jest/Vitest.
- Add YAML eval scenarios under existing suites: `routing`, `business`, and `safety`.
- Keep country-code logic in `discovery-playbook.md` as specified; do not introduce an ISO dependency.

## Integration Points

- SKILL.md will call the helper through `node scripts/okki-state.js ...` examples.
- Eval scenario schema currently validates routing/api/safety expectations. Prompt-behavior checks may require either existing `businessQuality` conventions or future judge extensions, but Phase 4 should start with scenarios that fit current runner capabilities.
- Existing API call examples use `curl` and `jq`; this milestone must avoid adding jq-based state writes.

## What Not To Add

- No new package dependencies for state helper.
- No new backend services.
- No script for Brief validation, country-code validation, search-plan generation, or expansion generation in this milestone.

## Confidence

HIGH. The merged plan's stack direction matches the current package layout and existing Node/CommonJS test style.
