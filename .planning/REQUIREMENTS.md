# Requirements: OKKI Go Discovery Harness 1.2.0

**Defined:** 2026-05-28  
**Core Value:** The skill must turn vague B2B prospecting requests into safe, repeatable, source-backed search and outreach preparation without bypassing paid-action or email-send confirmations.

## v1.2.0 Requirements

### Rule Contracts

- [ ] **RULE-01**: Maintainer can read a Merchant Profile playbook that defines profile schema v1.1, source metadata, Lite Onboarding, progressive enrichment, management workflow, Discovery reuse, outreach reuse, and privacy rules.
- [ ] **RULE-02**: Maintainer can read a Discovery playbook that defines Sufficiency Check, Hard Guardrails, direct-search unknown fallback, Five Gray Areas, Brief schema, API mapping, country-code mapping, Pre-Search Statement, and three-tier confirmation.
- [ ] **RULE-03**: Maintainer can read an Expansion playbook that defines Broadening Ladder, Full Expansion, Lite Expansion, candidate output format, reverse recommendation requirements, selection parsing, Brief mapping, and multi-round limits.
- [ ] **RULE-04**: Maintainer can read a Sales Mentor playbook that defines Iron Rule 0, persona, Business Context Lite, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, Must NOT Say, and B'' protection.
- [ ] **RULE-05**: Playbooks cross-reference each other consistently and do not hardcode country-specific tools, platforms, certifications, cultural habits, or local regulations in static mentor rules.

### Local State

- [ ] **STATE-01**: User can read, redact, upsert, reset, and update history for `~/.config/okki-go/profile.json` through `skill/scripts/okki-state.js`.
- [ ] **STATE-02**: User can classify, mark shown, mark unlocked, and reset `~/.config/okki-go/viewed.json` through `skill/scripts/okki-state.js`.
- [ ] **STATE-03**: The helper migrates missing/old state to v1.1, treats missing files as zero state, backs up corrupt JSON, writes atomically, and enforces mode 0600.
- [ ] **STATE-04**: Helper tests prove source metadata, redaction, classification, deduplication, unlocked lifecycle, corrupt recovery, and file permissions.

### Skill Workflow

- [ ] **SKILL-01**: User can see SKILL.md version 1.2.0 with new Merchant Profile, Prospecting Brief Discovery, Prospecting Expansion, Anti-Staleness, and Sales Mentor Mode sections.
- [ ] **SKILL-02**: Workflow A runs Profile -> BC1/BC2 -> Discovery -> Rotation Hint -> trade_mode -> BC3 -> Blind-Spot -> tier/direct-search routing -> search -> viewed classification -> Expansion -> grouped display -> Sales Journey Preview -> axes update -> paid unlock -> mark unlocked -> contacts.
- [ ] **SKILL-03**: Workflow C reuses Workflow A front-half discovery/contact-finding behavior but preserves the existing recipient/content confirmation and send flow.
- [ ] **SKILL-04**: User Input Guidance routes vague prospecting requests to the playbooks and keeps non-prospecting balance/status requests direct.
- [ ] **SKILL-05**: Existing authentication, API key resolver, billing confirmation, contact-search confirmation, and email-send confirmation rules remain authoritative.

### Evaluation

- [ ] **EVAL-01**: Direct-search unknown trade_mode scenario proves free company search can continue without profile country while trade_mode-dependent mentor hooks are skipped/deferred.
- [ ] **EVAL-02**: Paid-action guardrail scenario proves "direct search and unlock" still requires Billing Rule confirmation before unlock/contact paid actions.
- [ ] **EVAL-03**: Business Context order scenario proves BC1/BC2 happen before Brief and BC3 only after trade_mode derivation.
- [ ] **EVAL-04**: Soft-filter pagination scenario proves employee_range/local-only filters scan paginated results before Expansion decisions.
- [ ] **EVAL-05**: Viewed lifecycle scenario proves shown/unlocked state maps to three result groups and 30-day unlocked semantics.
- [ ] **EVAL-06**: Profile source defaults scenario proves `agent_inferred` fields are excluded from Discovery defaults until confirmed.

### Release Readiness

- [ ] **REL-01**: Maintainer can run the relevant Node tests and eval validation without failures introduced by this milestone.
- [ ] **REL-02**: Maintainer can inspect a self-review checklist covering playbook references, workflow order, helper call order, three-tier routing, Ladder trigger, unlocked write timing, trade_mode timing, direct-search fallback, pagination strategy, Iron Rule 0, and B'' coverage.
- [ ] **REL-03**: Package and SKILL version references are consistently bumped from 1.0.12 to 1.2.0 where release scope requires it.

## v2 Requirements

### Deferred Personalization

- **V2-POOL-01**: User can maintain a full prospect pool with contacted/replied/closed lifecycle.
- **V2-FEED-01**: User can save or dismiss results and use that feedback in future searches.
- **V2-SYNC-01**: User can sync Merchant Profile across devices through the OKKI account.
- **V2-ISO-01**: User can rely on a complete scripted ISO country library.
- **V2-BRIEF-01**: User can validate Brief JSON with a script instead of model-only checks.
- **V2-IND-01**: User can use industry-specific expansion templates.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend API changes | This milestone is skill-side and must not depend on service roadmap. |
| CRM/prospect pool | Larger workflow and state-machine design; deferred to v2. |
| Server-side Profile sync | Needs privacy and backend review. |
| saved/dismissed state | No user workflow exists in this release; enum can expand later. |
| Workflow B Discovery | Merged plan explicitly excludes separate discovery for direct contact search. |
| Email send flow redesign | Existing safety boundaries must remain unchanged. |
| New npm dependencies | State helper should stay portable and install-safe. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RULE-01 | Phase 1 | Pending |
| RULE-02 | Phase 1 | Pending |
| RULE-03 | Phase 1 | Pending |
| RULE-04 | Phase 1 | Pending |
| RULE-05 | Phase 1 | Pending |
| STATE-01 | Phase 2 | Pending |
| STATE-02 | Phase 2 | Pending |
| STATE-03 | Phase 2 | Pending |
| STATE-04 | Phase 2 | Pending |
| SKILL-01 | Phase 3 | Pending |
| SKILL-02 | Phase 3 | Pending |
| SKILL-03 | Phase 3 | Pending |
| SKILL-04 | Phase 3 | Pending |
| SKILL-05 | Phase 3 | Pending |
| EVAL-01 | Phase 4 | Pending |
| EVAL-02 | Phase 4 | Pending |
| EVAL-03 | Phase 4 | Pending |
| EVAL-04 | Phase 4 | Pending |
| EVAL-05 | Phase 4 | Pending |
| EVAL-06 | Phase 4 | Pending |
| REL-01 | Phase 5 | Pending |
| REL-02 | Phase 5 | Pending |
| REL-03 | Phase 5 | Pending |

**Coverage:**
- v1.2.0 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after PRD Express initialization*
