# OKKI Go Discovery Harness 1.2.0

## What This Is

OKKI Go is an existing B2B lead prospecting and outbound outreach skill for AI agents. This milestone upgrades the prospect discovery portion from a mostly prompt-driven flow into a structured discovery harness with persistent merchant profile state, source-aware defaults, controlled expansion, anti-staleness, and a sales mentor persona.

The work is brownfield: existing authentication, billing confirmation, company search, contact retrieval, and email send safety rules must continue to work. The new harness only changes prospect discovery, company/contact finding, and the guidance surrounding those workflows.

## Core Value

The skill must turn vague B2B prospecting requests into safe, repeatable, source-backed search and outreach preparation without bypassing paid-action or email-send confirmations.

## Current Milestone: v1.2.0 Discovery Harness

**Goal:** Land the merged discovery harness plan as executable skill behavior with documented playbooks, local state tooling, workflow integration, and regression coverage.

**Target features:**
- Merchant Profile with source metadata, privacy-aware redaction, and progressive enrichment.
- Prospecting Brief Discovery with hard guardrails, trade_mode derivation, and three-tier confirmation routing.
- Triple-mode Prospecting Expansion with Broadening Ladder, Full Expansion, Lite Expansion, and reverse recommendations.
- Anti-staleness via viewed.json v1.1, unlocked lifecycle, three result groups, and rotation hints.
- Sales Mentor Mode with country-agnostic static rules, Business Context Lite, blind-spot checks, sales journey preview, and B'' protection.
- okki-state.js helper for safe local JSON state migration, atomic writes, redaction, classification, and lifecycle updates.
- Eval and unit coverage for helper behavior, direct-search fallback, paid-action guardrails, workflow order, pagination filtering, and viewed lifecycle.

## Requirements

### Validated

- Existing skill can route company search, contact lookup, outreach email, balance, and status requests.
- Existing API key resolver and legal/signup flow are already established and must not be changed by this milestone.
- Existing billing confirmation and email send confirmation behavior is relied on and must remain authoritative.

### Active

- [ ] Implement rule-contract playbooks that make profile, discovery, expansion, sales mentor, and safety decisions explicit.
- [ ] Implement local profile/viewed state helper with tests.
- [ ] Integrate the harness into SKILL.md while preserving existing billing, authentication, and email-send safety.
- [ ] Add eval scenarios and regression tests that prove the new harness does not drift or bypass safeguards.
- [ ] Complete release-readiness review and version bump to 1.2.0.

### Out of Scope

- Server-side profile sync — requires backend data model and privacy review; deferred to v2.
- New OKKI API endpoints or API parameter changes — this milestone only uses existing APIs.
- Persisting Brief or Expansion histories — only profile.json and viewed.json are persisted.
- Separate discovery flow for direct contact search workflow B — current scope is company search and Workflow C front half.
- External knowledge graph APIs for expansion — all expansion remains agent-side reasoning inside fixed rules.
- Full CRM/prospect pool state machine — viewed.json only tracks viewed/unlocked lifecycle for this milestone.
- saved/dismissed feedback states — enum can expand later, but no UI/workflow exists in this release.

## Context

- Source PRD: `docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md`.
- Current skill file: `skill/SKILL.md` at version 1.0.12.
- Existing references include `skill/references/api-reference.md`.
- Existing scripts include credential/update helpers under `skill/scripts/`.
- Existing eval platform uses YAML scenarios under `eval/scenarios/`, Node tests under `eval/test/`, and a rule judge in `eval/lib/judge/rule-judge.js`.
- The repo is nested under a parent git worktree; `okki-go` is not its own git root.

## Constraints

- **Safety:** Discovery skip paths must never skip authentication, billing confirmation, unlock confirmation, contact-search confirmation, recipient confirmation, or email body confirmation.
- **Privacy:** API keys are never stored in planning docs; profile state is local, mode 0600, redacted on view, and sensitive fields are not reported.
- **Compatibility:** No new npm dependencies for okki-state.js; use Node.js standard library.
- **Scope:** Do not change API key resolver, legal/signup flow, credit balance, API reference, or email status flows except where SKILL.md references the new discovery behavior.
- **State boundary:** okki-state.js only manages local JSON state and never calls OKKI APIs or generates business search logic.
- **Country-agnostic mentor rules:** Static playbook content cannot hardcode local tools, platforms, certifications, cultural habits, or regulations.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat merged plan as PRD Express input | It already contains scope, todos, constraints, acceptance strategy, and sequencing | Pending |
| Use local `.planning/` under `okki-go` | The package is a subdirectory of a parent git worktree; planning should stay with the package | Pending |
| Phase playbooks before code | SKILL.md and helper behavior depend on stable rule contracts | Pending |
| Keep helper minimal and dependency-free | Avoid broad scripting expansion and preserve install simplicity | Pending |
| Preserve existing paid/send safety as higher priority than discovery UX | The plan explicitly keeps billing and email safety unchanged | Pending |

---
*Last updated: 2026-05-28 after GSD formal initialization from merged implementation plan*
