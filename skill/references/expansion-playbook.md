# Prospecting Expansion Playbook

This playbook defines target-side expansion after PMF Brief generation and free company search. It uses the PMF Brief and `query_plan_portfolio` from `discovery-playbook.md` and the Sales Mentor source-discipline rules from `sales-mentor-playbook.md`.

Expansion is target-route modeling. It does not call paid endpoints, does not unlock companies, does not search contacts, and does not persist expansion history outside session memory.

## 1. Search Tiers

Use four tiers:

1. **L0 Target-Side Core Query:** strict, high-fit target routes derived from the PMF Brief.
2. **L1 Target-Side Recovery:** recover sparse, homogeneous, or competitor-heavy results by changing target-side terms or route scope one step at a time.
3. **L2 Target Route Expansion:** generate additional route plans such as trade category, installer/integrator, project trigger, operator, or procurement category.
4. **L3 Exploration:** low-confidence or long-path ideas shown for user selection; no automatic search unless the user chooses them.

Every first-round `search-advanced` result must pass through an expansion-mode decision after local-only filters have been applied. Use `filtered_results.length` when `employee_range` or another local-only filter exists; otherwise use the effective result count from the API response.

```text
validated L0 core plan(s) complete
  -> effective_total < 5 OR competitor-heavy/homogeneous?
       yes -> L1 Target-Side Recovery
              if still below target_count -> L2 Target Route Expansion
       no  -> effective_total < brief.target_count?
              yes -> L2 Target Route Expansion
              no  -> Lite target-route suggestions
```

Behavior markers:

- `global_or_broadening_blocked`
- `target_side_recovery_applied`
- `target_side_recovery_route_retained`
- `target_route_expansion_candidates_built`
- `target_route_candidate_has_path`
- `results_grouped_by_query_plan`

## 2. L0 Target-Side Core Query

Core plans use:

- `merchant_offer_anchor` as internal reasoning context.
- Target geography.
- Exactly one target route.
- Target-side product/category, company-type, industry, or procurement terms.
- Optional industry context only when it improves precision.

Do not put every available Brief field into the first payload. Do not copy the merchant's product terms into `productKeywords` unless those terms are appropriate target-side terms for the chosen route.

Example for a custom door-lock manufacturer searching Germany:

```text
Preferred:
Plan A: door/building hardware + importer/distributor + DE
Plan B: architectural/building hardware + wholesaler/distributor + DE
Plan C, if smart-lock context exists: access control/security systems + installer/integrator + DE

Avoid as default:
door lock + DE
```

## 3. L1 Target-Side Recovery

Trigger: the first route is too sparse, too homogeneous, or visibly competitor-heavy.

Target-Side Recovery replaces the old default global OR broadening. The recovery keeps route intent and geography unless the user explicitly asks for geography-free exploration.

Allowed recovery moves:

1. Swap merchant-product terms to broader target-side category terms while preserving target route and geography, such as `door lock` to `door hardware` or `building hardware`.
2. Swap to procurement or category wording while preserving route and geography, such as `custom lock` to `architectural hardware`.
3. Broaden company type within the same route, such as importer to importer/distributor/wholesaler.
4. Remove the least important industry/application keyword when it is narrowing the target route too much.
5. Temporarily remove `withEmails`.
6. Move to an adjacent route only when the route path stays clear, such as channel route to trade-category route, or trade-category route to installer/integrator route for smart-lock or access-control contexts.

Hard rules:

- Do not switch the whole payload from `"AND"` to `"OR"` as the default move.
- Do not remove target geography unless the user asked for geography-free exploration.
- Do not combine unrelated target routes into one OR-style payload.
- Do not preserve a merchant-product keyword in `productKeywords` merely to keep an anchor when that term is causing competitor-heavy search.
- Disclose the retained target route and changed target-side terms.

Message pattern:

```text
The first round is sparse, and directly searching "[merchant term]" may mix in peer manufacturers.
I will keep [target geography] and [target route], change target-side product terms from "[old terms]" to "[new target-side terms]",
and broaden company type from "[old type]" to "[new route-compatible types]".
```

## 4. L2 Target Route Expansion

Target Route Expansion generates new target-side plans. It is not keyword-neighbor expansion and it does not append selected candidates to one expanded Brief with a global OR payload.

Allowed route types:

| Route Type | Meaning |
|------------|---------|
| `channel_route` | Importers, wholesalers, distributors, dealers, and resale channels. |
| `trade_category_route` | Broader target-side category companies likely to carry or source the offer. |
| `installer_integrator_route` | Installers, contractors, engineering firms, or system integrators that source products for projects. |
| `project_trigger_route` | Companies connected to renovation, maintenance, replacement, expansion, opening, upgrade, or new-build events. |
| `operator_route` | Asset operators with repeated or bulk use cases, such as hotels, apartments, schools, hospitals, factories, fleets, or property managers. |
| `procurement_category_route` | Standard procurement/category language from CPV, UNSPSC, HS, NAICS, tenders, or local equivalents. |
| `not_recommended` | Plausible-looking but weak or risky directions that should not be searched by default. |

Each target route candidate must include:

- `candidate`
- `target_route_type`
- `route_path`
- `merchant_offer_anchor`
- `target_company_should_be`
- `target_side_projection`
- `api_payload`
- `fit_level`
- `why_this_matches`
- `competitor_risk`
- `risk`

Candidate template:

```json
{
  "candidate": "hotel renovation contractors",
  "target_route_type": "project_trigger_route",
  "route_path": "custom door locks -> hotel room renovation -> contractor procurement",
  "merchant_offer_anchor": ["custom door locks", "smart locks"],
  "target_company_should_be": "Contractors or refurbishment firms working on hotel or apartment renovation projects.",
  "target_side_projection": {
    "product_terms": ["building hardware"],
    "company_type_terms": ["renovation contractor", "refurbishment contractor"],
    "industry_terms": ["hotel renovation", "apartment refurbishment"]
  },
  "api_payload": {
    "productKeywords": ["building hardware"],
    "companyTypeKeywords": ["renovation contractor", "refurbishment contractor"],
    "industryKeywords": ["hotel renovation", "apartment refurbishment"],
    "includeCountry": ["DE"],
    "crossFieldOperator": "AND",
    "from": 0,
    "size": 50
  },
  "fit_level": "medium_high",
  "why_this_matches": "Hotel renovation contractors may source door locks in bulk during room upgrade projects.",
  "competitor_risk": "low",
  "risk": "Generic hotels are too broad unless renovation or procurement context is included."
}
```

The important distinction is that "hotel" is not searched because it is semantically near "door lock". It is considered only when the relation path connects hotel operations to renovation, room maintenance, property management, or another procurement event.

## 5. No Route-Library Mode

A large industry route library is not required at launch. When no verified route-library entry exists for the product/category, the model may still generate target-side routes.

Rules:

- Build at least one safe generic target route when product/service and geography context are enough for free company search.
- Safe generic routes may be searched automatically if they preserve target geography, have a short route path, and pass the Target-Side Query Validator.
- Mark these plans as `generic_controlled` rather than `verified`.
- Good automatic fallback routes are usually `channel_route`, `trade_category_route`, and, when the offer context supports it, `installer_integrator_route`.
- `project_trigger_route`, `operator_route`, and broad `procurement_category_route` candidates may be auto-searched only when projection contains a concrete procurement, installation, renovation, replacement, maintenance, upgrade, or new-build trigger.
- Low-confidence or long-path ideas are L3 Exploration and require user selection before search.
- Downgrade vague ideas to `not_recommended` when they lack a target role, category, procurement event, or target-side keyword projection.

Behavior markers:

- `no_route_library_mode_entered`
- `no_route_library_safe_route_built`
- `no_route_library_exploration_selection_required`

## 6. User Selection Format

Accept these input forms for L2/L3 candidates:

- Number list: `A1, A2, B1`
- Route-wide selection: `all channel routes`, `all installer routes`
- Natural language: `try channels and installers first, avoid hotels`
- Stop signal: `enough`, `stop`, `skip expansion`

If a selection is ambiguous, ask one clarifying question before another search.

Selections create new query plans; they do not destructively overwrite the PMF Brief.

## 7. Multi-Round Limits

After each expanded search:

1. Recompute cumulative effective total after local-only filters.
2. If cumulative total meets or exceeds `target_count`, stop expansion and continue result grouping.
3. If still below target and fewer than 3 L2 expansion rounds have run, ask whether the user wants another round.
4. If the user stops or the 3-round limit is reached, continue with available results and explain that expansion stopped.

L1 Target-Side Recovery does not count as an L2 expansion round. Lite target-route suggestions do not count unless the user selects one and starts a later expanded search.

Expansion never implies paid unlock or contact retrieval. Paid-action and email-send confirmations remain governed by `discovery-playbook.md` Hard Guardrails and the main `SKILL.md`.

## 8. Result Grouping After Expansion

Results from different plans must stay explainable:

- `Core`
- `Target-Side Recovery`
- `Target Route Expansion`
- `Exploration`
- `Not Recommended` suggestions, if any

After an expansion search finishes:

- Reapply local-only filters from `discovery-playbook.md`.
- Recompute the effective total for stopping decisions.
- Keep results grouped by query plan, target route, or search tier.
- Re-run viewed classification from `discovery-playbook.md` Section 6 before final display.

Final viewed-state labels remain:

- `unlocked`: previously paid-unlocked within the active window.
- `seen`: previously displayed within the active window.
- `new`: not seen in the active window.

Do not present all results as a single undifferentiated company list when they came from different hypotheses. Do not create separate persistent states for expanded, saved, or dismissed results in v1.2.x.
