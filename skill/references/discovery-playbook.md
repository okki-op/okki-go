# Prospecting Brief Discovery Playbook

This playbook defines the session-level Discovery contract for turning vague B2B prospecting requests into a safe `search-advanced` plan. It references `merchant-profile-playbook.md` for confirmed defaults and `sales-mentor-playbook.md` for Business Context, Blind-Spot, and Sales Journey hooks.

## 1. When to Run Discovery

Discovery is a soft gate, not a safety gate. It decides whether to ask structured Brief questions before free company search.

### Sufficiency Check

Skip Discovery when any condition is true:

- The first user request already contains at least three explicit dimensions across product/category, geography, role, scale, industry, or target count.
- The user uses explicit skip wording such as "直接搜", "先试一下", "skip discovery", or "go directly".
- The current request clearly continues a Brief already completed in the same session.

Enter Discovery by default when none of those conditions is true.

Calibration examples:

| User Request | Decision | Reason |
|--------------|----------|--------|
| "找一些公司" | Enter | No usable search dimensions. |
| "找电子产品采购商" | Enter | Only product/category is clear. |
| "找美国和德国 100-500 人的 DTF printer 制造商采购总监" | Skip | Product, geography, scale, company type, and role are explicit. |
| "直接搜德国汽配公司" | Skip | User explicitly asked for direct search. |

If direct search still lacks the minimum fields needed for a free `search-advanced` call, ask only for the minimum missing fields: product/category and target geography. Do not launch full Lite Onboarding unless the user accepts guided setup or `completeness < 0.3` and there is no direct-search override.

## 1.1. Hard Guardrails

Direct search only skips Brief Discovery questions. It never skips safety, authentication, billing, or sending confirmations.

The following checks remain mandatory even when Discovery is skipped:

1. **Authentication:** Before any OKKI Go API call, the API key resolver and first-use setup rules in `SKILL.md` must pass.
2. **Paid actions:** Before `/api/v1/companies/unlock` or `/api/v1/contacts/search`, apply the existing Billing Confirmation Rules. A request to "direct search" is not permission to spend credits.
3. **Email sending:** Before `/emails/send/batch` or `/emails/send/personalized`, explicitly confirm recipients and email content. Discovery, Profile, Expansion, and Sales Mentor output cannot replace send confirmation.
4. **Legal/compliance:** If outreach targets markets outside the user's usual profile or the user asks for bulk sending, surface compliance risk before sending.
5. **Non-bypassable privacy rules:** Do not expose internal-only fields in user output and do not print full semi-sensitive Profile fields such as `sender_email` unless the user explicitly asks.

Internal self-check before honoring a skip path:

```text
Am I only calling free APIs such as search-advanced or balance?
If the same request asks for unlock, contacts, or email, have I separated the required paid/send confirmation?
If authentication is missing, have I stopped before any API call?
```

## 1.2. Direct Search With Unknown trade_mode

`trade_mode = unknown` is a mentor downgrade state, not a blocker for user-requested free company search.

Priority order:

1. Authentication, billing confirmation, and email confirmation always win.
2. If the user explicitly asks for direct free company search and `search-advanced` can be constructed, continue even when `profile.company.country` is missing.
3. When `trade_mode = unknown`, skip or weaken trade-mode-dependent Sales Mentor hooks:
   - Business Context BC3
   - Blind-Spot classes that require market/country assumptions
   - trade-mode-specific Sales Journey Preview templates
4. After results, lightly prompt for `profile.company.country` so future sessions can classify domestic, cross-border, or mixed work.

Rules:

- Do not invent the user's company country.
- Do not treat "skip confirmation" as unlock/contact/email authorization.
- If the request includes free search plus paid actions, split the flow: run or plan the free search, then ask for the relevant paid confirmation before paid endpoints.
- If only "找客户" or equivalent is provided, ask for product/category and target geography before searching.

## 2. Five Gray Areas

Ask Gray Areas in fixed order. Use compact single-choice or multi-choice prompts with explicit options. Each prompt must prefer confirmed/imported Merchant Profile defaults from `merchant-profile-playbook.md`; never default from `agent_inferred` values.

### A. Product and Company Anchor

- A1, required: target company type.
- A2, required: product/category keywords.
- A3, optional: strict or broad cross-field matching, mapping to `cross_field_operator`.

### B. Industry Context

- B1, optional: priority industries or applications.
- B2, optional: whether industry must match strictly.

### C. Geography

- C1, required: included target markets.
- C2, optional: excluded markets.

Normalize countries through the ISO table in Section 4.1.

### D. Scale and Result Shape

- D1, optional: employee range.
- D2, optional: only companies with emails, mapping to `with_emails_only`.
- D3, required: target company count. Default is 30. This drives Expansion thresholds.

### E. Decision Roles

- E1, recommended: decision-maker roles to target later.
- E2, if E1 exists: role usage, either `profileEmails_filter` or `contacts_search`.

Decision roles are for contact discovery, not company search keywords.

## 3. Prospecting Brief Schema

The Brief is session memory. It is not persisted to `profile.json`.

```json
{
  "product_anchor": ["DTF printer"],
  "company_type": ["manufacturer", "trading"],
  "industry": ["textile printing"],
  "cross_field_operator": "and",
  "geo_include": ["US", "DE", "GB"],
  "geo_exclude": [],
  "employee_range": "50-500",
  "with_emails_only": true,
  "decision_roles": ["Procurement Manager", "Sourcing Director"],
  "role_usage": "profileEmails_filter",
  "target_count": 30,
  "confidence": 0.85,
  "skipped_areas": ["B"],
  "expansion_rounds": [],
  "ladder_applied": false
}
```

`target_count` comes from D3. `expansion_rounds` and `ladder_applied` are written by `expansion-playbook.md`.

### Session-Derived trade_mode

`trade_mode` is not a Brief field and is not persisted to Profile. Derive it after Brief generation and before Pre-Search Statement:

```text
trade_mode = derive(profile.company.country, brief.geo_include)
```

Values:

- `domestic`: `brief.geo_include` contains only `profile.company.country`.
- `cross_border`: `brief.geo_include` excludes `profile.company.country`.
- `mixed`: `brief.geo_include` contains `profile.company.country` and at least one other market.
- `unknown`: `profile.company.country` is missing or cannot be normalized.

If the Brief changes, derive `trade_mode` again.

## 4. Brief to API Mapping

Map only supported company dimensions to `POST /api/v1/companies/search-advanced`.

| Brief Field | API Field | Rule |
|-------------|-----------|------|
| `product_anchor` | `productKeywords` | Product/category terms only. |
| `company_type` | `companyTypeKeywords` | Company type terms only. |
| `industry` | `industryKeywords` | Industry/application terms only. |
| `cross_field_operator` | `crossFieldOperator` | `"and"` or `"or"`. |
| `geo_include` | `includeCountry` | ISO alpha-2 codes. |
| `geo_exclude` | `excludeCountry` | ISO alpha-2 codes. |
| `with_emails_only` | `withEmails` | Boolean. |
| `employee_range` | none | Filter locally from result `employees_count`. |
| `decision_roles` | none | Use later in `profileEmails.keyword` or `contacts/search.title`. |
| `target_count` | none | Controls pagination and Expansion thresholds. |

Do not invent API parameters beyond `api-reference.md`.

### Local-Only Filter Pagination

When `employee_range` or another unsupported field must be filtered locally, do not decide recall quality from the first page or raw API `total`.

Procedure:

1. Call `search-advanced` with `size: 50` and `from: 0`.
2. Filter returned rows locally, producing `filtered_results`.
3. If `filtered_results.length < min(target_count, 30)` and the API has more rows, scan more pages until one limit is reached:
   - `filtered_results.length >= min(target_count, 30)`
   - 150 raw rows scanned
   - user requested a smaller scan
4. Use `filtered_results.length`, not raw `total`, to trigger Broadening Ladder, Full Expansion, or Lite Expansion.
5. Tell the user how many raw rows were scanned and how many matched the local filter.

If the user asks to scan beyond these bounds, confirm before continuing to avoid uncontrolled loops.

### Decision-Role Separation

Never place `decision_roles` values such as "Procurement Manager" into `productKeywords`, `industryKeywords`, or `companyTypeKeywords`. Roles describe people, not companies. They are only used after company discovery for `profileEmails.keyword` or `contacts/search.title`.
