# Project Research - Pitfalls

**Project:** OKKI Go Discovery Harness 1.2.0  
**Researched:** 2026-05-28

## Critical Pitfalls

1. **Prompt drift from underspecified playbooks**  
   Prevention: Phase 1 must make field sources, trigger order, hard guardrails, and mentor constraints explicit enough that SKILL.md does not improvise.

2. **Safety regression through direct-search language**  
   Prevention: Discovery skip paths must explicitly say they only skip discovery questions. Paid unlock, contact search, and email send confirmations remain mandatory.

3. **State corruption from ad hoc shell writes**  
   Prevention: All profile/viewed writes go through okki-state.js with atomic rename, migration, corrupt backup, and mode 0600.

4. **Using model-inferred profile data as facts**  
   Prevention: `agent_inferred` values must be visible to the user and excluded from Discovery defaults until confirmed.

5. **Sales mentor hallucination**  
   Prevention: Enforce default source-backed claims, max two `💭` inferences, Must NOT Say constraints, and country-agnostic static playbook content.

6. **Expansion loops overusing free search**  
   Prevention: Full Expansion is capped at three rounds, Ladder is one round, local-only filters scan at most 150 raw results before asking.

7. **Workflow C accidentally rewriting send safety**  
   Prevention: Phase 3 only changes Workflow C front half through contact display; confirmation/send half remains original.

8. **Eval scenarios that current runner cannot judge**  
   Prevention: Add helper unit tests for deterministic behavior and keep YAML expectations within current schema unless judge extensions are intentionally planned.
