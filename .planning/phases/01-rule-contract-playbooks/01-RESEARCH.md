# Phase 1: Rule Contract Playbooks - Research

**Researched:** 2026-05-28  
**Question:** What do we need to know to plan Phase 1 well?

## Summary

Phase 1 is documentation-heavy but safety-critical. The primary implementation challenge is not writing Markdown files; it is preserving exact semantics from the merged plan so later SKILL.md orchestration and okki-state.js implementation do not drift.

The playbooks should be treated as executable contracts. Each playbook must state when it is used, which data it owns, what it must not decide, and how it interacts with the other playbooks. The best plan structure is one independent plan each for Merchant Profile, Discovery, and Expansion, followed by a dependent Sales Mentor/cross-reference audit plan.

## Existing Architecture Notes

- Existing `skill/SKILL.md` references `skill/references/api-reference.md`.
- Existing `skill/references/` is the right location for new playbooks.
- Existing eval and code changes are out of scope for Phase 1.
- Phase 3 will later reference these playbooks from SKILL.md, so headings should be stable and easy to cite.

## Required Playbook Contracts

### Merchant Profile
- Owns `profile.json` schema and source semantics.
- Defines confirmed vs inferred default behavior.
- Defines onboarding, enrichment, inference confirmation, management, reuse, and privacy.
- Must mention `profile.company.country` as `trade_mode` anchor.

### Discovery
- Owns vague-input handling, direct-search fallback, hard guardrails, Brief schema, and API mapping.
- Must state that decision roles never pollute company search keywords.
- Must include local-only filter pagination rules so Expansion decisions use filtered totals.
- Must include country-code mapping and confirmation tiers.

### Expansion
- Owns low-recall recovery and new-angle suggestions.
- Must define Ladder/Full/Lite triggers and bounds.
- Must map selected candidates back into Brief fields.
- Must include the reverse recommendation hard rule.

### Sales Mentor
- Owns mentor persona and claim-safety constraints.
- Must preserve Iron Rule 0 and B'' protection.
- Must define BC order, blind-spot checks, reverse recommendation structure, sales journey preview, and Must NOT Say list.

## Validation Architecture

Phase 1 validation is static plus semantic review:

- File-existence checks prove the four playbooks were created.
- `rg` checks prove key contract terms are present.
- Manual review confirms cross-document consistency and country-agnostic static content.

No runtime test framework is required in this phase because executable code is introduced in Phase 2.

## Risks

1. **Overwriting future implementation details into playbooks** — keep scripts and eval implementation out of Phase 1.
2. **Contradicting the merged plan's direct-search fallback** — direct free search can proceed with unknown trade_mode; paid/send guardrails still apply.
3. **Making Sales Mentor country-specific** — static rules must stay abstract; runtime dynamic suggestions carry source/inference constraints.
4. **Letting source metadata become decorative** — playbooks must make default eligibility dependent on source state.

## Recommended Plan Split

- `01-01`: Merchant Profile playbook.
- `01-02`: Discovery playbook.
- `01-03`: Expansion playbook.
- `01-04`: Sales Mentor playbook plus cross-reference and Iron Rule 0 audit.

---

*Research completed: 2026-05-28*  
*Ready for planning: yes*
