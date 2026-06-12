# Search Fast Path

Read this for `L0_FAST_DISCOVERY` and `L0_PAGINATION`: ordinary company, buyer, importer, distributor, customer, target-account, or prospect search.

## Responsibilities

- Build one recall-first free `search-advanced` payload from the current user request.
- Keep the first visible result fast and compact.
- Use pagination before Expansion when the current route has more rows.
- Keep paid actions out of L0.

## L0 Flow

1. Run the auth check from `SKILL.md`.
2. Extract current-turn seller facts and target geography or buyer route.
3. Apply the Company Search Keyword Contract from `SKILL.md`.
4. Build a free company-search payload with one primary keyword field plus geography when supplied.
5. Run compact search.
6. Present the script-rendered `display_table_markdown` result table.
7. Ask one next step: unlock selected rows, refine, or fetch more.

Do not run Mentor, Profile onboarding, Web Research, Expansion, viewed dedupe, or paid APIs before the first free search unless the user explicitly asked for that mode.

## No Web Fallback

L0 owns ordinary OKKI Go prospecting. If a company search has zero rows, noisy rows, network failure, timeout, 5xx, or system busy response, do not switch to public web search.

Allowed recovery actions are OKKI-only: retry once, split a batch into smaller requests, simplify Chinese target-side keywords, change one buyer route, remove over-narrow constraints, paginate, ask one clarifying question, or tell the user OKKI Go is temporarily unavailable and offer to retry later.

## Constructible Search

A free company search is constructible when at least one target-company keyword field can be populated:

- `productKeywords`
- `companyTypeKeywords`
- `industryKeywords`

`includeCountry` and `excludeCountry` are filters only. They cannot be the whole search.

Ask a short question only when no target-company keyword can be built. If product/category is present but geography is missing, search globally unless the user's wording makes geography essential.

## Payload Rules

- Use ISO 3166-1 alpha-2 country codes.
- Use `size` from the user's requested count when practical; max API page size is 50.
- For requests over 20 rows, broad "more", or multi-page discovery, prefer `discover-companies-batch.js --compact`.
- Omit `withEmails` or set `0` unless email availability is central to the user's request.
- Do not default to `crossFieldOperator: "AND"`.
- Do not invent unsupported filters such as employee range, decision roles, website, homepage, contacts, URL, or limit.
- Treat importer/distributor/installer/employee/certification/decision-role hints as local display or recovery clues unless they are the chosen primary field.

Example:

```json
{
  "productKeywords": ["汽车玻璃", "挡风玻璃", "车窗玻璃", "汽车配件"],
  "includeCountry": ["DE"],
  "from": 0,
  "size": 20
}
```

## Recovery Budget

If the first result set is zero, sparse, noisy, or peer-supplier-heavy, use small free recovery before asking the user.

Default recovery order:

1. Rewrite the same route with better Chinese target-side index terms.
2. Shift one buyer route, such as distributor to installer or service provider.
3. Remove an over-narrow field such as email-only or `AND`.

Run at most one automatic recovery by default. The hard cap is three recovery searches for one user request, and only when each new payload is materially broader or cleaner than the previous one.

After the budget, show the best current rows or explain the route weakness with an executable next step. If low yield repeats, offer `L2_GUIDED_STRATEGY`.

## Pagination

Use compact output metadata before deciding:

- If `has_next_page=true`, or `next_offset` exists and is less than `available`, fetch the next page.
- If `discovery_health.health_action` or top-level `next_action` exists, follow that small action hint instead of re-deriving pagination or diagnosis from chat text.
- If the current route is exhausted and the user asks for another customer type or route, use `references/expansion-playbook.md`.
- If the user says the results are wrong, supplier-like, or too sparse, use `references/search-strategy.md`.

Do not infer hidden rows from chat text.

## Presentation

For free company discovery results, use `display_table_markdown` exactly as the result table. Do not rebuild the table from `rows`, reorder columns, or add hidden fields such as domain, website, IDs, raw paths, or exact email/WhatsApp counts.

After the table, write the next-step guidance naturally in the user's language. Use `next_action` and `discovery_health` for pagination, low-yield, refinement, or unlock-selection guidance.

Rely on `output-contracts.md` for script-owned private fields and debug metadata. Use `--batch latest` for later row selections.
