# Project Research - Features

**Project:** OKKI Go Discovery Harness 1.2.0  
**Researched:** 2026-05-28

## Table Stakes

- Persistent Merchant Profile with source-aware defaults and progressive enrichment.
- Discovery soft gate with skip/enter rules, hard guardrails, gray-area prompts, brief schema, country-code mapping, and three-tier confirmation.
- Dynamic `trade_mode` derivation from `profile.company.country` and `brief.geo_include`.
- Expansion rules with Broadening Ladder, Full Expansion, Lite Expansion, candidate mapping, and multi-round limits.
- Anti-staleness state with viewed/unlocked lifecycle, three result groups, dedup window options, and rotation hints.
- Sales Mentor Mode with Business Context Lite, blind-spot checks, reverse recommendations, sales journey preview, and B'' protection.
- Local state helper and tests.
- Eval scenarios covering direct search fallback, guardrails, workflow ordering, pagination filtering, viewed lifecycle, and source defaults.

## Differentiators

- Sales guidance is mentor-like but constrained by source-backed claims and a two-inference budget.
- `trade_mode` is derived, not user-selected or persisted, keeping Profile and Brief schemas cleaner.
- `direct search` is treated as a friction-reduction command for free search only, not blanket consent.
- Anti-staleness distinguishes already-unlocked companies from merely seen companies.

## Anti-Features

- Do not let the mentor persona invent market intelligence, regional stereotypes, real-time facts, or exact performance numbers.
- Do not let decision roles pollute company search keywords.
- Do not use Profile fields with `source: agent_inferred` as defaults.
- Do not make unknown `trade_mode` block free direct search.
- Do not let Discovery/Expansion skip email confirmation or paid-action confirmation.

## Deferred

- Server-side profile sync.
- saved/dismissed result feedback.
- Full prospect pool/CRM state.
- Industry-specific expansion templates.
- Complete ISO library/script.
- Brief validation script.
