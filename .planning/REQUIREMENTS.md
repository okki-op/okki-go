# Requirements: OKKI Go Discovery Harness 1.2.0

**Defined:** 2026-05-28  
**Core Value:** The skill must turn vague B2B prospecting requests into safe, repeatable, source-backed search and outreach preparation without bypassing paid-action or email-send confirmations.

## v1.2.0 Requirements

### Rule Contracts

- [x] **RULE-01**: Maintainer can read a Merchant Profile playbook that defines profile schema v1.1, source metadata, Lite Onboarding, progressive enrichment, management workflow, Discovery reuse, outreach reuse, and privacy rules.
- [x] **RULE-02**: Maintainer can read a Discovery playbook that defines Sufficiency Check, Hard Guardrails, direct-search unknown fallback, Five Gray Areas, Brief schema, API mapping, country-code mapping, Pre-Search Statement, and three-tier confirmation.
- [x] **RULE-03**: Maintainer can read an Expansion playbook that defines Broadening Ladder, Full Expansion, Lite Expansion, candidate output format, reverse recommendation requirements, selection parsing, Brief mapping, and multi-round limits.
- [x] **RULE-04**: Maintainer can read a Sales Mentor playbook that defines Iron Rule 0, persona, Business Context Lite, Blind-Spot Checklist, Reverse Recommendations, Sales Journey Preview, Must NOT Say, and B'' protection.
- [x] **RULE-05**: Playbooks cross-reference each other consistently and do not hardcode country-specific tools, platforms, certifications, cultural habits, or local regulations in static mentor rules.

### Local State

- [x] **STATE-01**: User can read, redact, upsert, reset, and update history for `~/.config/okki-go/profile.json` through `skill/scripts/okki-state.js`.
- [x] **STATE-02**: User can classify, mark shown, mark unlocked, and reset `~/.config/okki-go/viewed.json` through `skill/scripts/okki-state.js`.
- [x] **STATE-03**: The helper migrates missing/old state to v1.1, treats missing files as zero state, backs up corrupt JSON, writes atomically, and enforces mode 0600.
- [x] **STATE-04**: Helper tests prove source metadata, redaction, classification, deduplication, unlocked lifecycle, corrupt recovery, and file permissions.

### Skill Workflow

- [x] **SKILL-01**: User can see SKILL.md version 1.2.0 with new Merchant Profile, Prospecting Brief Discovery, Prospecting Expansion, Anti-Staleness, and Sales Mentor Mode sections.
- [x] **SKILL-02**: Workflow A runs Profile -> BC1/BC2 -> Discovery -> Rotation Hint -> trade_mode -> BC3 -> Blind-Spot -> tier/direct-search routing -> search -> viewed classification -> Expansion -> grouped display -> Sales Journey Preview -> axes update -> paid unlock -> mark unlocked -> contacts.
- [x] **SKILL-03**: Workflow C reuses Workflow A front-half discovery/contact-finding behavior but preserves the existing recipient/content confirmation and send flow.
- [x] **SKILL-04**: User Input Guidance routes vague prospecting requests to the playbooks and keeps non-prospecting balance/status requests direct.
- [x] **SKILL-05**: Existing authentication, API key resolver, billing confirmation, contact-search confirmation, and email-send confirmation rules remain authoritative.

### Evaluation

- [x] **EVAL-01**: Direct-search unknown trade_mode scenario proves free company search can continue without profile country while trade_mode-dependent mentor hooks are skipped/deferred.
- [x] **EVAL-02**: Paid-action guardrail scenario proves "direct search and unlock" still requires Billing Rule confirmation before unlock/contact paid actions.
- [x] **EVAL-03**: Business Context order scenario proves BC1/BC2 happen before Brief and BC3 only after trade_mode derivation.
- [x] **EVAL-04**: Soft-filter pagination scenario proves employee_range/local-only filters scan paginated results before Expansion decisions.
- [x] **EVAL-05**: Viewed lifecycle scenario proves shown/unlocked state maps to three result groups and 30-day unlocked semantics.
- [x] **EVAL-06**: Profile source defaults scenario proves `agent_inferred` fields are excluded from Discovery defaults until confirmed.

### Release Readiness

- [x] **REL-01**: Maintainer can run the relevant Node tests and eval validation without failures introduced by this milestone.
- [x] **REL-02**: Maintainer can inspect a self-review checklist covering playbook references, workflow order, helper call order, three-tier routing, Ladder trigger, unlocked write timing, trade_mode timing, direct-search fallback, pagination strategy, Iron Rule 0, and B'' coverage.
- [x] **REL-03**: Package and SKILL version references are consistently bumped from 1.0.12 to 1.2.0 where release scope requires it.

## v1.3.0 Requirements

### Optimized Mentor Mode

- [x] **OMM-01**: User can see Skill routing that separates L0 Default Search, L1 Mentor Lite, and L2 Mentor Guided.
- [x] **OMM-02**: L2 Mentor Guided requires a Minimal Prospecting Profile, uses Product Context Lite only when route choice is blocked, and treats Success Customer Profile as optional.
- [x] **OMM-03**: Mentor routes use customer-side relationship reasoning and buyer-side validation before recommending or searching a route.
- [x] **OMM-04**: OKKI Recallability Guard keeps first route payloads to one primary search field plus optional geography, with secondary role signals in local priority rules.
- [x] **OMM-05**: Expansion checks pagination state before new branches and requires user confirmation before searching one new branch.
- [x] **OMM-06**: Web Research Add-on is explicit, source-backed, separate from OKKI search, and cannot mutate search payloads without confirmation.
- [x] **OMM-07**: Existing paid unlock, contact-search, and email-send confirmations remain authoritative.
- [x] **OMM-08**: Package, installer, resolver, API reference, authentication examples, README, INSTALL, and SKILL version references align to 1.3.0.

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
| RULE-01 | Phase 1 | Complete |
| RULE-02 | Phase 1 | Complete |
| RULE-03 | Phase 1 | Complete |
| RULE-04 | Phase 1 | Complete |
| RULE-05 | Phase 1 | Complete |
| STATE-01 | Phase 2 | Complete |
| STATE-02 | Phase 2 | Complete |
| STATE-03 | Phase 2 | Complete |
| STATE-04 | Phase 2 | Complete |
| SKILL-01 | Phase 3 | Complete |
| SKILL-02 | Phase 3 | Complete |
| SKILL-03 | Phase 3 | Complete |
| SKILL-04 | Phase 3 | Complete |
| SKILL-05 | Phase 3 | Complete |
| EVAL-01 | Phase 4 | Complete |
| EVAL-02 | Phase 4 | Complete |
| EVAL-03 | Phase 4 | Complete |
| EVAL-04 | Phase 4 | Complete |
| EVAL-05 | Phase 4 | Complete |
| EVAL-06 | Phase 4 | Complete |
| REL-01 | Phase 5 | Complete |
| REL-02 | Phase 5 | Complete |
| REL-03 | Phase 5 | Complete |
| OMM-01 | Phase 6 | Complete |
| OMM-02 | Phase 6 | Complete |
| OMM-03 | Phase 6 | Complete |
| OMM-04 | Phase 6 | Complete |
| OMM-05 | Phase 6 | Complete |
| OMM-06 | Phase 6 | Complete |
| OMM-07 | Phase 6 | Complete |
| OMM-08 | Phase 6 | Complete |

**Coverage:**
- v1.2.0 requirements: 23 total
- v1.3.0 requirements: 8 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-06-09 after Phase 6 optimized mentor-mode landing*
