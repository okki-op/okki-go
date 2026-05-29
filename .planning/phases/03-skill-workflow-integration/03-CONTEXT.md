---
phase: 03-skill-workflow-integration
status: ready
created: 2026-05-28
source:
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/phases/01-rule-contract-playbooks/*-SUMMARY.md
  - .planning/phases/02-state-helper-and-unit-tests/*-SUMMARY.md
  - docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md
---

# Phase 3: Skill Workflow Integration - Context

Phase 3 updates `skill/SKILL.md` to version 1.2.0 and wires the Phase 1 playbooks plus Phase 2 state helper into the user-facing workflow contract.

## Phase Boundary

In scope:

- Add Merchant Profile, Prospecting Brief Discovery, Prospecting Expansion, Anti-Staleness, and Sales Mentor Mode sections.
- Document `skill/scripts/okki-state.js` helper calls for Profile and viewed-state lifecycle.
- Rewrite Workflow A into the merged harness sequence.
- Rewrite only the company-search/contact-discovery front half of Workflow C.
- Rewrite User Input Guidance so prospecting requests route through playbooks instead of the old vague/better table.
- Bump `SKILL.md` skill version references to `1.2.0`.
- Preserve existing authentication, API key resolver, billing confirmation, contact-search confirmation, and email-send confirmation rules.

Out of scope:

- Eval scenarios and evaluator changes, which belong to Phase 4.
- Release-wide package version/changelog audit, which belongs to Phase 5 unless `SKILL.md` itself requires the version bump.
- API changes, backend changes, new npm dependencies, and state helper code changes.

## Inputs From Phase 1

- `merchant-profile-playbook.md` defines Profile v1.1, source metadata, Lite Onboarding, progressive enrichment, management workflow, Discovery reuse, outreach reuse, preferred-language lazy loading, and privacy rules.
- `discovery-playbook.md` defines Sufficiency Check, Hard Guardrails, direct-search unknown fallback, Five Gray Areas, Brief schema, API mapping, local-only filter pagination, country-code normalization, Pre-Search Statement, confirmation tiers, and viewed lifecycle.
- `expansion-playbook.md` defines Broadening Ladder, Full Expansion, Lite Expansion, reverse recommendations, user selection parsing, Brief mapping, and multi-round limits.
- `sales-mentor-playbook.md` defines Iron Rule 0, B'' protection, Business Context Lite ordering, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, and Must NOT Say rules.

## Inputs From Phase 2

Use `skill/scripts/okki-state.js`; do not instruct the model to hand-edit JSON with `jq`, `echo`, or shell redirection.

Required helper calls for SKILL.md:

- `node skill/scripts/okki-state.js profile read`
- `node skill/scripts/okki-state.js profile redact`
- `node skill/scripts/okki-state.js profile upsert --json JSON`
- `node skill/scripts/okki-state.js profile update-history --json JSON`
- `node skill/scripts/okki-state.js profile reset`
- `node skill/scripts/okki-state.js viewed classify --results-json JSON --window-days 30`
- `node skill/scripts/okki-state.js viewed mark-shown --results-json JSON --brief-summary TEXT`
- `node skill/scripts/okki-state.js viewed mark-unlocked --domain DOMAIN --country-code ISO`
- `node skill/scripts/okki-state.js viewed reset`

## Safety Preservation Checklist

The following existing rules remain authoritative and must not be weakened:

- Before every OKKI Go API call, use `bash scripts/resolve-api-key.sh --check`; when a request needs a key, resolve with `bash scripts/resolve-api-key.sh --print` immediately before `curl` and do not print the key.
- Legal consent and API-key save consent are separate confirmations.
- Billing Rule 1 and Rule 2 still govern `/companies/unlock`.
- Billing Rule 3 still requires first-session confirmation before `POST /contacts/search`.
- Workflow C/D email sending still requires explicit confirmation of recipients and content before `/emails/send/batch` or `/emails/send/personalized`.
- Direct-search, Profile, Expansion, Sales Mentor Mode, and viewed-state helper calls never authorize paid actions or email sending.

---
*Phase: 03-skill-workflow-integration*
