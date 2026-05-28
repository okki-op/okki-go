# Phase 2: State Helper and Unit Tests - Context

**Gathered:** 2026-05-28  
**Status:** Ready for execution  
**Source:** Phase 1 playbooks plus `docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md`

<domain>

## Phase Boundary

Phase 2 delivers the local JSON state helper and deterministic unit tests. It creates `skill/scripts/okki-state.js` and focused tests under `eval/test/`. It does not modify SKILL.md workflows, API resolver scripts, API reference docs, package versions, or eval scenarios.

The helper owns only local `profile.json` and `viewed.json` state. It must not call OKKI APIs, generate Prospecting Briefs, generate Expansion candidates, or decide billing/email confirmation behavior.

</domain>

<decisions>

## Implementation Decisions

### Helper shape
- Implement a dependency-free CommonJS-compatible Node CLI at `skill/scripts/okki-state.js`.
- Use `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/profile.json` and `viewed.json`.
- Output JSON for every successful command so SKILL.md can consume it deterministically.
- Support `--now` for tests and deterministic timestamp behavior without adding dependencies.

### Profile state
- `profile read` returns zero state when missing, migrates old or partial state to version `1.1`, recomputes `completeness`, and enforces mode `0600`.
- `profile redact` hides semi-sensitive fields such as `sender_email` and `sender_name`.
- `profile upsert --json` deep-merges patch data, migrates B class source metadata, and recomputes completeness.
- `profile update-history --json` merges into `history.last_used_axes` and increments `history.search_count`.
- `profile reset` removes `profile.json` and returns zero state.

### Viewed state
- `viewed read` may exist for testing/debug convenience, but required commands are `classify`, `mark-shown`, `mark-unlocked`, and `reset`.
- `viewed classify --window-days N --results-json ...` returns `unlocked`, `seen`, and `new` groups using the active window.
- `viewed mark-shown` deduplicates by normalized domain, updates `shown_at`, stores `brief_summary`, and preserves `unlocked` status.
- `viewed mark-unlocked` sets `status: "unlocked"` and `unlocked_at`.
- `viewed reset` removes `viewed.json`.

### Migration and safety
- Corrupt JSON is backed up as `*.corrupt.<timestamp>` and treated as zero state.
- Missing version or old version is migrated to `1.1`.
- Profile B class entries missing `source` are downgraded to `agent_inferred`.
- Viewed v1.0 entries missing `status` become `status: "viewed"` and `unlocked_at: null`.
- All writes use a temp file plus rename and chmod `0600`.

</decisions>

<specifics>

## Specific Ideas

- Normalize result domains from `domain`, `website`, `url`, `companyDomain`, or `companyWebsite`.
- Preserve the original result object inside classification groups so display code can render existing result fields.
- Treat active `unlocked` entries as unlocked only when `unlocked_at` is within the selected window; otherwise the result falls back to `seen` if `shown_at` is in-window.
- Completeness should be conservative and deterministic: count confirmed field families only enough to drive Tier 1/2/3 workflows, not to become business logic.

</specifics>

<deferred>

## Deferred Ideas

- SKILL.md helper invocation docs belong to Phase 3.
- YAML scenario regression coverage belongs to Phase 4.
- Country-code scripting, Brief validation, Search Plan generation, saved/dismissed states, and prospect pools remain out of scope for v1.2.0 Phase 2.

</deferred>

---

*Phase: 02-state-helper-and-unit-tests*  
*Context gathered: 2026-05-28*
