---
phase: 04-eval-coverage
status: ready
created: 2026-05-28
source:
  - .planning/ROADMAP.md
  - .planning/STATE.md
  - .planning/phases/03-skill-workflow-integration/*-SUMMARY.md
  - .planning/phases/03-skill-workflow-integration/03-VERIFICATION.md
  - docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md
---

# Phase 4: Eval Coverage - Context

Phase 4 adds regression coverage for the high-risk behavior introduced by the Discovery Harness. It should keep evaluator changes small and deterministic.

## Phase Boundary

In scope:

- Add YAML scenarios for direct-search unknown trade mode, paid-action guardrails, Business Context order, soft-filter pagination, viewed lifecycle, and Profile source defaults.
- Extend the scenario schema and rule judge only where current routing/API expectations cannot express the behavior.
- Preserve local-core/reference-agent determinism and local-agent transcript evidence.
- Run targeted Node tests and local-core scenario validation for the new coverage.

Out of scope:

- API key resolver changes.
- Authentication, billing, contact-search, and email-send safety rule rewrites.
- API endpoint changes or new npm dependencies.
- Real live-agent UAT against paid APIs.

## Inputs From Phase 3

- `skill/SKILL.md` now documents the 20-step Workflow A order and Workflow C front-half boundary.
- Direct-search paths can skip Brief questions for free company search only, not safety confirmations.
- `trade_mode = unknown` permits direct free search but skips or weakens BC3 and other trade-mode-dependent mentor hooks.
- Local-only filters such as employee range must scan paginated results before recall/Expansion decisions.
- Results must be classified into unlocked, seen, and new before display; `mark-shown` runs after display; `mark-unlocked` runs after successful unlock.
- Profile B-class `agent_inferred` fields cannot be used as Discovery defaults.

## Eval Infrastructure Notes

- Existing YAML scenarios live under `eval/scenarios/{routing,business,safety}/`.
- Existing schema validates routing, API, and safety blocks.
- Existing `rule-judge.js` scores routing/API/safety from `run.routingDecision`, `run.apiCalls`, and confirmation metadata.
- Existing local-agent prompts parse machine-readable `ROUTING_DECISION` and `API_CALL` lines.

## Safety Preservation Checklist

The new coverage must not weaken these existing rules:

- API key resolution before business API calls.
- Legal consent and API-key save consent boundaries.
- Billing confirmation before implicit `/companies/unlock`.
- First-session confirmation before `POST /contacts/search`.
- Recipient and body confirmation before `/emails/send/batch` or `/emails/send/personalized`.

---
*Phase: 04-eval-coverage*
