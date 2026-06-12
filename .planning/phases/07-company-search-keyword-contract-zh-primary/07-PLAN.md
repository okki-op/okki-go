# Phase 07 Plan: Company Search Keyword Contract (zh-primary)

## Goal

Unify OKKI Go company-search keyword rules so agents generate Chinese-first (`zh-primary`) search keywords without weakening existing rules for recall, one-primary-field search, target-side projection, paid-action confirmation, pagination, low-yield handling, and Mentor Guided behavior.

This phase is **skill-layer only**. Do not implement script-layer keyword normalization in this phase.

## Background

Observed issue: OKKI Go buyer-profile keyword indexes are primarily Chinese, while agents often generate English or target-country-language keywords for `search-advanced`. That causes low/zero recall even when relevant buyer profiles exist.

The fix should not be scattered as repeated prompt snippets. Use one canonical contract and reference it from places that build or mutate company-search payloads.

## Non-Goals

- Do not change service-side search APIs.
- Do not change `search-companies.js` or `discover-companies-batch.js` normalization behavior.
- Do not add or maintain a large keyword dictionary.
- Do not touch `eval/`.
- Do not run eval-based assessment.

## Design

### 1. Add One Canonical Contract in `skill/SKILL.md`

Add a concise section near the search workflow, before detailed prospecting rules:

```md
## Company Search Keyword Contract

Apply this contract before every free company-search payload, including L0 Default Search, recovery, Expansion, and L2 Mentor Guided payloads.

1. Target-side first: convert merchant-side product/service facts into target-company profile terms. Do not copy the seller's identity or long product phrases directly into payload keywords.
2. Chinese index-language first: OKKI Go buyer-profile keyword fields are zh-primary. For `productKeywords`, `companyTypeKeywords`, and `industryKeywords`, generate concise Chinese index-language terms by default.
3. Supplements only: keep English, local-language, brand, model, certification, acronym, or proper-noun terms only when they are likely searchable as-is. They supplement Chinese terms; they do not replace them.
4. One primary keyword field first: Round 1 uses exactly one of `productKeywords`, `companyTypeKeywords`, or `industryKeywords`, plus geography when provided.
5. Recall before precision: keep buyer route, employee size, certification, decision role, and importer/distributor hints as soft display/recovery clues unless they are the chosen primary field.
6. No over-narrow first search: do not default to `crossFieldOperator: "AND"`, do not pack all three keyword fields, and do not use email-only unless requested.
```

This contract intentionally combines old rules and the new zh-primary rule so the new rule does not compete with or dilute existing search guardrails.

### 2. Slim Down Duplicate Rules in `skill/SKILL.md`

Keep the existing flow and safety guardrails, but replace duplicated keyword wording with references to the contract:

- In first-search guardrails: add `Apply the Company Search Keyword Contract before choosing keyword fields or terms.`
- Keep the hard API constraint: at least one non-empty keyword field; `includeCountry` is only a filter.
- Keep constructible-search and automatic-recovery budget rules.
- Replace the long `Keyword Rule` details and English examples with a short summary plus a pointer to `discovery-playbook.md`.

Suggested `Keyword Rule` summary:

```md
For implementation details and examples, use [discovery-playbook.md](./references/discovery-playbook.md).

In short: company-search keywords must follow the Company Search Keyword Contract: target-side first, Chinese index-language first, one primary keyword field first, recall before precision.
```

### 3. Make `discovery-playbook.md` the Single Implementation Detail Source

Update the detailed company discovery guide:

- Round 1 rule must explicitly start with `Apply the Company Search Keyword Contract from SKILL.md`.
- Merchant-side to target-side projection should output Chinese-first structures:

```json
{
  "merchant_offer_anchor": ["汽车玻璃制造"],
  "target_side_projection": {
    "product_terms_zh": ["汽车玻璃", "挡风玻璃", "车窗玻璃", "汽车配件"],
    "company_type_terms_zh": ["经销商", "分销商", "进口商", "安装商"],
    "industry_terms_zh": ["汽车后市场", "汽车维修"],
    "supplemental_terms": ["OEM", "windshield"]
  }
}
```

- Replace English-primary examples with Chinese-primary examples.
- Keep examples aligned with existing rules: one primary search field in Round 1, geography allowed, secondary route terms remain soft unless selected as the primary field.

Example Round 1 payload:

```json
{
  "productKeywords": ["汽车玻璃", "挡风玻璃", "车窗玻璃", "汽车配件"],
  "includeCountry": ["AE", "SA", "QA"]
}
```

Example direct target-company handling:

```json
{
  "productKeywords": ["汽车配件", "汽配", "汽车后市场", "车辆配件"],
  "includeCountry": ["AE", "SA", "QA"]
}
```

Keep `进口商` / `分销商` / `经销商` as soft display or recovery terms unless `companyTypeKeywords` is the chosen primary field.

### 4. Update Recovery Rules Without Creating a Competing Flow

In `discovery-playbook.md`, update Recovery 1:

```md
If Round 1 is weak and the payload used mostly English or local-language terms, Recovery 1 first rewrites the same route into Chinese index-language terms before trying more English synonyms or route shifts.
```

Keep the existing recovery order:

1. target-side rewrite
2. buyer-route shift
3. narrow-field cleanup
4. stop after budget and offer next directions / Mentor Guided when low yield repeats

### 5. Reference the Contract From Payload-Building References Only

Do not duplicate the full contract outside `SKILL.md`.

Add one-line references:

- `skill/references/workflows.md`: Workflow A step 4 should say it builds payloads using `discovery-playbook.md` and the Company Search Keyword Contract from `SKILL.md`.
- `skill/references/sales-mentor-playbook.md`: OKKI Recallability Guard should say L1/L2 follow-up payloads apply the Company Search Keyword Contract before finalizing search payloads.
- `skill/references/expansion-playbook.md`: Expansion branch `search_payload` generation must apply the Company Search Keyword Contract before proposing or running the branch payload.

Confirmed note: `expansion-playbook.md` generates `search_payload`, so it must be included.

### 6. Preserve Existing Non-Negotiables

Do not weaken these existing rules:

- Paid unlock/contact/email-send confirmation rules.
- Free first company search path.
- `search-advanced` supported field list.
- At least one keyword field required.
- `includeCountry` cannot be keywordless search.
- One primary keyword field by default.
- No default `AND` across multiple keyword dimensions.
- No default email-only discovery.
- No unsupported fields such as employee range, decision roles, website, homepage, contacts, or limit.
- Low-yield diagnosis and Mentor Guided option when repeated low-yield happens.
- Pagination before Expansion.

## Acceptance Criteria

- `SKILL.md` has exactly one canonical `Company Search Keyword Contract`.
- `discovery-playbook.md` contains the implementation details and Chinese-first examples.
- `workflows.md`, `sales-mentor-playbook.md`, and `expansion-playbook.md` reference the contract instead of duplicating it.
- English-primary examples for company-search payloads are replaced or reframed as supplemental/proper-noun terms.
- No new script-layer normalization is added.
- No `eval/` files are modified.
- No eval run is required.

## Suggested Manual Review

After implementation, manually inspect these prompts:

1. "用 Okkigo 帮我开发一些中东地区的潜客，我是汽车玻璃的制造商"
   - Expected payload direction: Chinese-first `productKeywords`, such as `汽车玻璃`, `挡风玻璃`, `车窗玻璃`, `汽车配件`, with Middle East country filters.

2. "Find German auto glass importers"
   - Expected payload direction: Chinese-first product/category terms plus `DE`; importer remains soft unless `companyTypeKeywords` is chosen as the primary field.

3. "Search US security system installers"
   - Expected payload direction: Chinese-first product/category or company-type terms depending on chosen primary field; English terms only supplemental.

4. Expansion branch that proposes a `search_payload`
   - Expected payload direction: branch payload still uses Chinese-first keyword fields and one primary field.

