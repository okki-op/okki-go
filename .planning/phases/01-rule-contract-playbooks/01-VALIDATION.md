---
phase: 1
slug: rule-contract-playbooks
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Documentation/static checks through shell and Node syntax-free validation |
| **Config file** | none |
| **Quick run command** | `test -f skill/references/merchant-profile-playbook.md && test -f skill/references/discovery-playbook.md && test -f skill/references/expansion-playbook.md && test -f skill/references/sales-mentor-playbook.md` |
| **Full suite command** | `node -e "const fs=require('fs'); for (const f of ['skill/references/merchant-profile-playbook.md','skill/references/discovery-playbook.md','skill/references/expansion-playbook.md','skill/references/sales-mentor-playbook.md']) { const s=fs.readFileSync(f,'utf8'); if (!s.includes('# ')) throw new Error(f+' missing heading'); }"` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run the quick file-existence check.
- **After every plan wave:** Run the full static read check.
- **Before `/gsd:verify-work`:** Full static check plus manual checklist in 01-04 must be green.
- **Max feedback latency:** 5 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | RULE-01 | static | `test -f skill/references/merchant-profile-playbook.md` | yes | pending |
| 1-02-01 | 02 | 1 | RULE-02 | static | `test -f skill/references/discovery-playbook.md` | yes | pending |
| 1-03-01 | 03 | 1 | RULE-03 | static | `test -f skill/references/expansion-playbook.md` | yes | pending |
| 1-04-01 | 04 | 2 | RULE-04 | static | `test -f skill/references/sales-mentor-playbook.md` | yes | pending |
| 1-04-02 | 04 | 2 | RULE-05 | manual/static | `rg "references/(merchant-profile|discovery|expansion|sales-mentor)-playbook.md|trade_mode|Hard Guardrails|Iron Rule 0|B''" skill/references` | yes | pending |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Static sales mentor content is country-agnostic | RULE-05 | Requires semantic review | Read `sales-mentor-playbook.md`; confirm static rules do not hardcode local tools, platforms, certifications, cultural habits, or local regulations except explicitly allowed neutral examples from the PRD. |
| Cross-reference consistency | RULE-05 | Requires semantic review | Confirm all playbooks agree on `trade_mode`, source states, direct-search fallback, Hard Guardrails, reverse recommendation percentage, and viewed/unlocked lifecycle. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual verification instructions.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency < 5s.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
