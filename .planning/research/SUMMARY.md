# Project Research Summary

**Project:** OKKI Go Discovery Harness 1.2.0  
**Domain:** AI-agent skill workflow hardening for B2B prospecting  
**Researched:** 2026-05-28  
**Confidence:** HIGH

## Executive Summary

This milestone should be implemented as a rules-first harness: four playbooks define the agent's decision contract, a small dependency-free Node helper owns fragile local state writes, and SKILL.md becomes the orchestrator that stitches the rules into existing company/contact/outreach workflows.

The highest-risk areas are not API integration but behavior drift: direct-search language must not bypass paid or email confirmations; mentor-style advice must not invent market facts; inferred profile fields must not become defaults without confirmation. The recommended roadmap therefore front-loads playbooks before code, then implements state helper tests, then integrates SKILL.md, then adds eval coverage.

## Key Findings

### Recommended Stack

**Core technologies:**
- Markdown playbooks: rule contracts for agent behavior.
- Node.js standard library: local state helper without dependency churn.
- Node test runner: deterministic helper tests inside existing eval test infrastructure.
- Existing YAML scenarios: regression coverage for agent routing/safety behavior.

### Expected Features

**Must have:**
- Merchant Profile with source metadata and privacy-aware management.
- Discovery soft gate, hard guardrails, three-tier confirmation, and trade_mode derivation.
- Triple-mode Expansion and anti-staleness result grouping.
- Sales Mentor Mode with B'' protection and country-agnostic static rules.
- okki-state.js helper and regression tests.
- SKILL.md workflow integration preserving existing billing and email safety.

**Defer:**
- Server-side sync, saved/dismissed feedback, prospect pool, industry templates, complete ISO script, and Brief validation script.

### Architecture Approach

Use four layers: reference playbooks, local state helper, SKILL.md orchestration, and eval/test verification. Keep OKKI API calls unchanged and keep all paid/send confirmations governed by existing safety sections.

### Critical Pitfalls

1. Direct-search instructions bypassing paid-action or email confirmations.
2. Sales mentor hallucinations through unsourced local-market claims.
3. JSON state corruption from shell snippets.
4. `agent_inferred` fields silently used as facts.
5. Expansion and local-filter pagination causing uncontrolled repeated searches.

## Implications for Roadmap

### Phase 1: Rule Contract Playbooks
**Rationale:** All later implementation depends on stable rules and exact helper/workflow references.  
**Delivers:** Four playbooks with source, discovery, expansion, mentor, and guardrail contracts.

### Phase 2: State Helper and Unit Tests
**Rationale:** Local JSON state is the only new executable module and must be reliable before SKILL.md tells agents to use it.  
**Delivers:** okki-state.js plus deterministic tests.

### Phase 3: SKILL.md Workflow Integration
**Rationale:** Once contracts and helper exist, wire them into the skill's behavior while preserving existing safety boundaries.  
**Delivers:** Version 1.2.0 SKILL.md with new sections and Workflow A/C rewrites.

### Phase 4: Eval Coverage
**Rationale:** Agent-behavior changes need regression coverage beyond manual review.  
**Delivers:** YAML scenarios and any small judge/schema adjustments needed.

### Phase 5: Verification and Release Readiness
**Rationale:** The merged plan has many cross-references; final audit must prove consistency before release.  
**Delivers:** Self-review, tests, version/package checks, and release notes.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing repo supports Markdown, Node scripts, and node:test. |
| Features | HIGH | Merged plan contains explicit todos and acceptance cases. |
| Architecture | HIGH | Minimal helper plus playbook orchestration fits existing package shape. |
| Pitfalls | HIGH | Risks are directly identified in the merged plan and current skill boundaries. |

## Sources

### Primary
- `docs/OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN_MERGED.md`
- `skill/SKILL.md`
- `eval/lib/scenarios/schema.js`
- `eval/lib/judge/rule-judge.js`

---
*Research completed: 2026-05-28*
*Ready for roadmap: yes*
