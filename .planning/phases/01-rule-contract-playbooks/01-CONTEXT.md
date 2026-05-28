# Phase 1: Rule Contract Playbooks - Context

**Gathered:** 2026-05-28  
**Status:** Ready for planning  
**Source:** PRD Express Path (`docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md`)

<domain>

## Phase Boundary

Phase 1 delivers the reference rule contracts for the discovery harness. It creates four Markdown playbooks under `skill/references/` and does not modify executable helper code, SKILL.md workflows, eval tests, or package versions.

This phase exists to turn the merged implementation plan into stable, cross-referenced rules before any orchestration or state-helper implementation begins.

</domain>

<decisions>

## Implementation Decisions

### Merchant Profile
- Create `merchant-profile-playbook.md`.
- Define `profile.json` v1.1, source metadata, A/B field classes, `sales_context`, and preferred_language lazy loading.
- Lite Onboarding asks 5 questions and must include L0 company country.
- `agent_inferred` fields must not feed Discovery defaults until user-confirmed.
- Management workflow must support view, edit, reset, export, redaction, and source labels.

### Discovery
- Create `discovery-playbook.md`.
- Define Sufficiency Check, Hard Guardrails, direct-search fallback, Five Gray Areas, Brief schema, API mapping, country-code table, local-only filter pagination, Pre-Search Statement, and three-tier confirmation.
- Direct search skips Discovery questions only; it does not skip authentication, billing confirmation, contact-search confirmation, or email-send confirmation.
- `trade_mode` is session-derived after Brief generation and never persisted in Profile or Brief.

### Expansion
- Create `expansion-playbook.md`.
- Define Broadening Ladder, Full Expansion, Lite Expansion, five dimensions, candidate output, selection parsing, candidate-to-Brief mapping, and multi-round limits.
- Reverse recommendations must be represented as a hard rule: at least 20 percent of recommendation directions in Full Expansion.

### Sales Mentor
- Create `sales-mentor-playbook.md`.
- Define Iron Rule 0, Persona, Business Context Lite, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, Must NOT Say, B'' protection, and user toggle.
- Static mentor content must remain country-agnostic.
- BC1/BC2 happen before Brief; BC3 happens only after `trade_mode` is derived.

### Claude's Discretion
- Exact Markdown heading names and prose may vary as long as all required rules are present and easy for SKILL.md to cite.
- The playbooks may include compact examples, but examples must not weaken the country-agnostic requirement or safety boundaries.

</decisions>

<specifics>

## Specific Ideas

- Reuse the merged plan's exact source states: `user_confirmed`, `user_provided`, `agent_inferred`, and `imported`.
- Reuse the merged plan's `trade_mode` values: `domestic`, `cross_border`, `mixed`, and `unknown`.
- Reuse the merged plan's three result groups: unlocked, seen, and new.
- Reuse the merged plan's guardrail categories: paid actions, email send, authentication, legal/compliance, and non-bypassable safety rules.
- Reuse the merged plan's Must NOT Say categories: specific numbers, geo details, live intel, time-sensitive claims, stereotypes, and regional cultural presumptions.

</specifics>

<deferred>

## Deferred Ideas

- okki-state.js implementation and tests belong to Phase 2.
- SKILL.md integration belongs to Phase 3.
- Eval scenarios belong to Phase 4.
- Release self-review and version consistency belong to Phase 5.

</deferred>

---

*Phase: 01-rule-contract-playbooks*  
*Context gathered: 2026-05-28 via PRD Express Path*
