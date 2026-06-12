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

## v1.4.0 Requirements

### Baseline and Guardrails

- [x] **TLO-BASE-01**: Maintainer can inspect a baseline artifact listing current `SKILL.md`/reference sizes, representative prompts, expected behaviors, protected invariants, and existing eval/test coverage before optimization changes.
- [x] **TLO-BASE-02**: Search recall, target-side Chinese-first keyword rules, one-primary-field default search, paid-action confirmations, same-language replies, compact privacy, and latest-batch row reuse are explicitly marked as protected behavior.
- [x] **TLO-BASE-03**: Existing dirty worktree and moved/untracked eval state are documented so optimization work does not revert or overwrite unrelated changes.

### Hot Path Router

- [x] **TLO-ROUTER-01**: `skill/SKILL.md` functions as a short router, safety hot path, and compact command starter, with target length 150-220 lines and hard cap 300 unless an exception is documented.
- [x] **TLO-ROUTER-02**: `SKILL.md` contains a strict workflow mode table and a "Read Only When" reference-loading table for L0 discovery, pagination, L1 review, L2 strategy, Expansion, paid actions, direct status/auth, and Web Research Add-on.
- [x] **TLO-ROUTER-03**: `SKILL.md` keeps the six-rule Company Search Keyword Contract and paid-action safety summary visible while removing advanced mentor, expansion, profile, API schema, changelog, and duplicate output prose.

### Reference Ownership

- [x] **TLO-REF-01**: Normal search, result review, search strategy, expansion, paid actions, auth, merchant profile, API reference, and output contracts each have one canonical reference owner.
- [x] **TLO-REF-02**: References over 100 lines include a short table of contents and can be selected directly from the router table without reading another reference first.
- [x] **TLO-REF-03**: Duplicate field-hiding, paid-action, keyword, API-parameter, and local-state prose is removed or replaced with links to the owning reference.

### Compact Output Contracts

- [x] **TLO-OUTPUT-01**: `references/output-contracts.md` defines normal compact, detail, debug metadata, and raw/export output classes for every user-facing wrapper.
- [x] **TLO-OUTPUT-02**: Field ownership is explicit for `domain`, raw IDs, `batch_id`, `raw_path`, `private_mapping_saved`, `output_budget`, pagination fields, latest-batch pointers, and viewed-state writes.
- [x] **TLO-OUTPUT-03**: Normal wrapper stdout avoids raw API records, domains, raw URLs, private IDs, full profiles, full local state, full email bodies, and verbose metadata unless explicit raw/debug/detail/export behavior is requested.

### Deterministic Routing

- [x] **TLO-ROUTE-01**: Scripts expose deterministic `next_action` and/or `health_action` hints where they reduce model guesswork for pagination, low-yield handling, row mapping validity, output truncation, and next user action.
- [x] **TLO-ROUTE-02**: Normal row-selection unlocks use saved batch pointers such as `--batch latest`; the model does not need to copy or preserve `domain` or visible `batch_id`.
- [x] **TLO-ROUTE-03**: Token/latency improvements do not shrink default result counts, add stricter first-round API filters, or replace recall with premature precision.

### Cost and Capability Evaluation

- [ ] **TLO-EVAL-01**: Cost-behavior scenarios cover normal search, pagination, row unlock confirmation, confirmed unlock, result review, low-yield diagnosis, balance, contact search confirmation, email status, and outreach drafting without encoding a single-session fix.
- [ ] **TLO-EVAL-02**: Static checks guard hot-path size, duplicate rule ownership, raw-output leakage, paid confirmations, and weak-model routing cues.
- [ ] **TLO-EVAL-03**: Forward tests use generic user-like prompts and fresh or smaller agents, then failures are fixed by routing rows, wrapper fields, or command patterns before adding long prose.

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
| TLO-BASE-01 | Phase 8 | Complete |
| TLO-BASE-02 | Phase 8 | Complete |
| TLO-BASE-03 | Phase 8 | Complete |
| TLO-ROUTER-01 | Phase 9 | Complete |
| TLO-ROUTER-02 | Phase 9 | Complete |
| TLO-ROUTER-03 | Phase 9 | Complete |
| TLO-REF-01 | Phase 10 | Complete |
| TLO-REF-02 | Phase 10 | Complete |
| TLO-REF-03 | Phase 10 | Complete |
| TLO-OUTPUT-01 | Phase 11 | Complete |
| TLO-OUTPUT-02 | Phase 11 | Complete |
| TLO-OUTPUT-03 | Phase 11 | Complete |
| TLO-ROUTE-01 | Phase 12 | Complete |
| TLO-ROUTE-02 | Phase 12 | Complete |
| TLO-ROUTE-03 | Phase 12 | Complete |
| TLO-EVAL-01 | Phase 13 | Planned |
| TLO-EVAL-02 | Phase 13 | Planned |
| TLO-EVAL-03 | Phase 13 | Planned |

**Coverage:**
- v1.2.0 requirements: 23 total
- v1.3.0 requirements: 8 total
- v1.4.0 requirements: 18 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-06-11 after adding v1.4.0 token and latency optimization requirements*
