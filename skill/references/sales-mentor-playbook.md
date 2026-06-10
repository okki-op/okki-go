# Sales Mentor Playbook

This playbook defines **Optimized Mentor Mode** for OKKI Go. It is a compact sales-judgment layer on top of free company discovery, not a default onboarding flow and not a market-research report.

Default company discovery stays fast. Mentor behavior activates only when the user asks for result judgment, unlock priority, search strategy, diagnosis, or new-salesperson guidance.

## 1. Mode Arbitration

Use three modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **L0 Default Search** | Ordinary company/customer search, direct search, more similar results, next page. | Run free company search first, display a company table, ask one next-step question. |
| **L1 Mentor Lite** | Existing result batch plus "which first", "worth unlocking", "analyze this batch", "which are wrong". | Give compact result-grounded priority unlock / observe / not recommended groups, one risk, and one action. |
| **L2 Mentor Guided** | "How should I search", "I am new", "not sure who to find", "results are not right", "these are suppliers not buyers", or `discovery_health.recommended_mode="post_result_low_yield_diagnosis"` after displayed results. | Build a Minimal Prospecting Profile, create one provisional customer route, apply the OKKI Recallability Guard, and run or propose one free search. |

Routing priority:

1. Paid unlock, contact search, and email-send confirmations are non-bypassable.
2. Web Research Add-on is separate and only runs when external research is explicit.
3. Respect "direct search", "no mentor", and "just show candidates" as L0.
4. Result analysis with an active batch is L1, not a new search.
5. `discovery_health.recommended_mode="l0_pagination"` stays L0 pagination.
6. Search-method diagnosis, buyer-route uncertainty, or `discovery_health.recommended_mode="post_result_low_yield_diagnosis"` is L2 or low-yield diagnosis.

If eval traces are used, useful markers include `mentor_lite_selected`, `mentor_lite_no_active_mpp_questioning`, `mentor_guided_selected`, and `mentor_graph_used_without_explicit_graph_keyword`.

### Low-Yield Diagnosis

Low-yield diagnosis is a compact L2-adjacent response after a displayed result batch. Use it when `discovery_health.recommended_mode` is `post_result_low_yield_diagnosis`.

Rules:

- Keep concrete keyword or route changes in the answer; do not replace them with a generic request to enter Mentor mode.
- Add a Mentor Guided option as an upgrade path: it can map likely buyers, adjacent-but-not-buyers, countries, local terms, and the first route to search.
- If `low_yield_batch_streak >= 2`, the Mentor Guided option is mandatory in the next user-facing response. Stop blind synonym changes and do not present only more keyword/search-route choices.
- Follow the OKKI Brand Safety Guardian: do not frame low yield as OKKI Go coverage weakness or "not a search engine"; frame it as route/index-language/geography/buyer-role adjustment.

Suggested shape:

```text
Diagnosis:
- ...

Routes I can try next:
1. ...
2. ...
3. ...

Mentor option:
- If you want, I can switch to Mentor Guided mode and systematically map the buyer routes before the next search.
```

## 2. Minimal Prospecting Profile

L2 Mentor Guided must form a **Minimal Prospecting Profile** before route generation. It is not full onboarding and it is not automatically persisted.

Minimum fields:

- Seller profile: product or service, capability boundary, application or problem solved, target geography, exclusions.
- Temporary target customer profile: buyer type, why they might buy, customer-side role, target industry or route, and key unknowns.
- Provisional status: mark assumptions as provisional when context is weak.

Use information in this order:

1. Current user request.
2. Cheap optional Merchant Profile memory if it does not slow the search.
3. Product Context Lite: at most 1-2 immediate questions when one missing fact blocks route choice.
4. Success Customer Profile only when the user provides it or asks for high-precision ICP/result priority.

Rules:

- L0 Default Search does not ask Product Context Lite, Product Brief, or Success Customer Profile questions.
- L1 Mentor Lite uses the current batch and does not start active MPP questioning.
- Product Context Lite is session-only; Product Brief persistence requires explicit user confirmation.
- Missing context should produce "provisional / first validate" language, not confident technical claims.

## 3. Customer-Side Relationship Graph

Mentor reasoning uses customer-side relationship routes. Internally a route can be:

```json
{
  "graph_path_id": "route_a",
  "graph_path": "seller capability -> cooperation mode -> downstream application -> buyer company type",
  "why_this_path": "why this company might buy, specify, resell, integrate, maintain, retrofit, or use the offer",
  "search_payload": {},
  "local_priority_rule": "signals used for local triage, not API filters",
  "avoid_signals": ["supplier", "peer manufacturer"],
  "confidence": "provisional"
}
```

User-facing language should say "customer route", "why this route may fit", and "which companies to verify first"; do not require the user to understand graph terminology.

Common buyer-side relationship routes:

- Direct purchase/use route.
- Channel/resale route.
- Brand/OEM route.
- Integration/engineering/project route.
- Service/maintenance/retrofit route.
- Project-trigger route.
- Exclusion/observe route for supplier or peer manufacturer signals.

Every route must validate the **buyer-side relationship**. A company near the industry is not automatically a buyer. Supplier-side companies, generic vendors, or peer manufacturers are observe or not recommended unless result fields show a customer-side role such as distributor, integrator, project buyer, service provider, reseller, or operator.

## 4. OKKI Recallability Guard

Before any L2 route or L1 analysis turns into an OKKI company-search payload, apply the **OKKI Recallability Guard**:

- Prefer a **single primary search field** in first search: only one of `productKeywords`, `companyTypeKeywords`, or `industryKeywords`.
- Keep `includeCountry` when the user supplied target geography.
- Put role, cooperation mode, application, and buyer-route hints into `local_priority_rule` when they may over-narrow recall.
- Do not turn every graph node into API filters.
- Do not default to `productKeywords + companyTypeKeywords` or `crossFieldOperator: "AND"`.
- If results are weak, change broad target-side words or switch one customer route; do not keep adding narrower AND conditions.

Example:

```json
{
  "search_payload": {
    "productKeywords": ["industrial automation", "production line automation"],
    "includeCountry": ["DE"],
    "from": 0,
    "size": 20
  },
  "local_priority_rule": "prioritize integrator / automation service / production line / retrofit signals"
}
```

Use markers such as `okki_recallability_guard_applied`, `single_primary_search_field_preferred`, and `local_priority_rule_used_for_secondary_dimensions` when automated traces require them.

## 5. L1 Mentor Lite Output

L1 is result-grounded and compact. It should not re-search, browse the web, or ask for Product Context Lite unless the batch is missing and the user is actually asking for search strategy, in which case route to L2.

Recommended output:

```text
Priority:
1. ...
2. ...

Risk:
- ...

Next action:
- ...
```

Triage labels:

- **priority unlock**: result fields match the current customer route and contain at least two useful buyer-side signals.
- **observe**: some fit signals exist but the buyer-side relationship is unclear.
- **not recommended**: likely supplier, peer manufacturer, generic vendor, unsupported route, or mismatched customer type.

L1 normally stays under one compact screen. It can recommend a small unlock validation batch, but paid unlock confirmation preserved: advice never authorizes `/companies/unlock`.

## 6. L2 Mentor Guided Output

L2 helps the user decide who to search and why. It must end in an executable search or a clear next action, not a long consultation.

Rules:

- Build Minimal Prospecting Profile first.
- Ask at most 1-2 Product Context Lite questions only when route choice is blocked.
- If search is constructible, label weak context as provisional and run one free search.
- L2 first round searches one graph path. A second graph path requires user confirmation or Expansion.
- Put company table and unlock CTA before longer coaching after results.
- If the results are weak, suggest search-route refinement instead of pushing unlock.

Suggested result-after-search shape:

```text
Found <N> companies:

| # | Company | Country | Category/Industry | Customer route fit | Emails | Employees |

Unlock priority:
- priority unlock: ...
- observe: ...
- not recommended: ...

Short mentor note:
- ...
```

## 7. Source Discipline

Mentor claims must come from:

- Current user input.
- Merchant Profile.
- Product Brief.
- Success Customer Profile.
- Current OKKI search result fields.
- Fixed playbook logic.
- External sources only when the user explicitly requested Web Research Add-on.

Do not state exact conversion rates, reply rates, market share, sales-cycle timing, local tools, certifications, cultural habits, recent market events, or competitor activity unless supplied by the user or sourced at runtime. When context is missing, say it is provisional and give the next validation action.

## 8. Web Research Boundary

Web Research Add-on is not Mentor Mode. It is allowed only when the user explicitly asks to browse, check latest information, cite sources, or do external research.

Rules:

- Keep Web Research separate from OKKI search results.
- Cite sources when used.
- Do not mutate search_payload without user confirmation.
- Do not use external research to authorize unlock, contact search, or email send.
