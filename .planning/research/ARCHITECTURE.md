# Project Research - Architecture

**Project:** OKKI Go Discovery Harness 1.2.0  
**Researched:** 2026-05-28

## Architecture Summary

The harness is primarily a rule-contract and workflow integration change. It should be implemented as reference Markdown plus one local state helper, not as a new application layer.

## Components

1. **Reference playbooks** — `skill/references/merchant-profile-playbook.md`, `discovery-playbook.md`, `expansion-playbook.md`, and `sales-mentor-playbook.md` define the stable rules.
2. **State helper** — `skill/scripts/okki-state.js` owns profile.json and viewed.json reads, writes, migration, redaction, classification, and lifecycle updates.
3. **Skill orchestration** — `skill/SKILL.md` links the playbooks and helper into Workflow A and Workflow C while preserving existing safety sections.
4. **Eval coverage** — `eval/test/` covers helper behavior; `eval/scenarios/` captures high-risk agent behavior.

## Data Flow

1. Load profile state with okki-state.js.
2. Run Business Context Lite phase 1 if appropriate.
3. Run Discovery soft gate or direct-search fallback.
4. Derive `trade_mode`.
5. Run Business Context Lite phase 2 and blind-spot checks when allowed.
6. Map Brief to search-advanced params and run free search.
7. Classify results through viewed.json helper.
8. Run Ladder/Full/Lite Expansion based on filtered total.
9. Display grouped results and mark shown.
10. On successful unlock, mark unlocked.
11. Keep Workflow C email confirmation path unchanged after contacts are displayed.

## Build Order

1. Playbooks.
2. State helper and tests.
3. SKILL.md integration.
4. Eval scenarios and regression checks.
5. Release/version/self-review.

## Confidence

HIGH. The architecture follows the merged plan and isolates high-risk local state behavior in a small testable script.
