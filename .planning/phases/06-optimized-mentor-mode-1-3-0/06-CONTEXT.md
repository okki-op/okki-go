# Phase 6: Optimized Mentor Mode 1.3.0 - Context

**Gathered:** 2026-06-09  
**Status:** Ready for execution  
**Source:** `docs/OKKI_GO_OPTIMIZED_MENTOR_MODE_SKILL_DESIGN.md`

## Phase Boundary

This phase lands the optimized mentor-mode design in the Skill and reference playbooks. It updates behavior contracts, routing language, and release version references.

Eval implementation is explicitly out of scope for this phase. Existing tests may be run as lightweight verification, but new eval scenarios, judges, or reference-agent behavior are not part of the delivery.

## Locked Decisions

- Target version is `1.3.0`.
- L0 Default Search stays the default for ordinary company search and pagination.
- L1 Mentor Lite is result-grounded and does not start active MPP questioning.
- L2 Mentor Guided builds a Minimal Prospecting Profile and searches one recall-safe customer route first.
- OKKI Recallability Guard prefers one primary search field plus optional geography; secondary buyer-route signals become local priority rules.
- Expansion checks pagination before new branches and requires user confirmation before searching one new branch.
- Web Research Add-on requires explicit external/latest/source request and cannot mutate OKKI search payloads without confirmation.
- Paid unlock, contact-search, and email-send confirmations remain authoritative.

## Scope

- Update `skill/SKILL.md`.
- Rewrite `skill/references/sales-mentor-playbook.md`.
- Rewrite `skill/references/expansion-playbook.md`.
- Align `discovery-playbook.md`, `workflows.md`, and `merchant-profile-playbook.md`.
- Bump release references to `1.3.0`.
- Update `.planning/` artifacts for Phase 6.

## Deferred

- Eval scenario/judge/reference-agent updates.
- New API endpoints or scripts.
- Persistent Product Brief or Success Customer Profile storage.
