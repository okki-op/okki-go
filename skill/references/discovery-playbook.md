# Company Discovery Playbook

This reference explains how to turn a B2B prospecting request into a fast free `POST /api/v1/companies/search-advanced` call.

Default behavior is simple: infer target-company profile keywords, search, show results, then wait for the user to choose unlock/refinement. Do not run PMF Gate, Lite Onboarding, Brief confirmation, Expansion, Sales Mentor, or historical viewed deduplication before the first free search unless the user explicitly asks.

## Round 1 Search Preference

Round 1 is recall-first. Its job is to create a usable candidate pool, not to prove exact fit in one API call.

1. Before the first search, translate user words into OKKI index-language terms: upper-level category words, application words, service words, procurement language, local-language words, and common target-company profile terms. Do not rely on one exact SKU, model, or long-tail product phrase from the user.

2. Use exactly one keyword dimension by default. Choose only one of `productKeywords`, `companyTypeKeywords`, or `industryKeywords` for Round 1. Country or region filters are allowed when the user specifies geography.

3. Prefer `productKeywords` for Round 1 when product, service, application, or buyer-need terms are available. Use 2-5 same-dimension terms in that field, such as synonyms, broader category terms, target-side application terms, or local-language terms.

4. Do not use `industryKeywords` in Round 1 by default, and do not use `crossFieldOperator: "AND"` in Round 1 by default. Treat extra dimensions from the user as soft display or recovery clues.

The first search should use model judgment, not a fixed template. Build one concise target-company hypothesis and search it with one keyword dimension plus optional geography. The guardrails below say what not to do; they do not require a specific keyword set.

## 1. Constructible Search

A default company search is constructible when the current request or optional Profile memory provides:

- A target company/category, buyer route, or merchant product/service that can be projected into target-company profile keywords.
- A target geography, buyer route, or explicit geography-free exploration request.

Ask one short clarifying question only when these are missing.

Examples:

| User Request | Decision |
|--------------|----------|
| "Find some companies." | Ask for product/category and target market or route. |
| "Find Middle East auto parts importers." | Search directly; the user already described target companies. |
| "I am an auto glass manufacturer; find German customers." | Search directly; project merchant product into target-side categories/routes. |
| "We manufacture paper packaging; help me find prospects." | Ask only for target geography or buyer route. |
| "We manufacture paper packaging with EU environmental certification; find prospects in Italy." | Search directly; do not ask product or company-type again. |
| "Use my saved profile and find 30 more buyers in France." | Search directly if Profile has enough product/category context. |

If the user provides a company website or product page, use it only when it helps without delaying the first search, unless the user asks for high precision first.

### Current-Turn Merchant Seed

Extract current-turn merchant facts before PMF Gate or Profile questions and mark that with `current_turn_merchant_seed_extracted`. Treat those facts as `user_provided_current_turn`: they can feed the current free search, but do not persist them unless the user confirms saving.

Do not repeat questions for merchant facts the user already provided. If target geography or trade mode is incomplete, keep free discovery moving when possible and emit `trade_mode_unknown_degraded_not_blocked` instead of blocking the first search.

## 2. Merchant-Side to Target-Side Keywords

User-provided products, services, certifications, websites, and business descriptions are merchant-side context first when the user describes their own business. Common merchant-side signals include "I am", "we are", "we manufacture", "we sell", "our company", "our website", and product pages.

Direct target-company requests are different. If the user says "Find German auto glass importers", "Find Middle East auto parts distributors", or "Search US security system installers", the user already named target-side product/category terms and target company types. Keep Round 1 recall-first: use the product/category side as the first keyword dimension when available, and keep company type words for display filtering or recovery.

Do not mechanically copy merchant-side terms into `productKeywords`. Store them mentally as `merchant_offer_anchor` and project them into target-company terms before or during recovery.

Use the model's B2B reasoning to generate concise target-side terms:

- `productKeywords`: target-company products, categories, inventory, services, application categories, procurement language, or business categories.
- `companyTypeKeywords`: target-company route words such as importer, distributor, wholesaler, dealer, retailer, installer, contractor, integrator, procurement company, or trading company.
- `industryKeywords`: target-company industry/application context such as automotive aftermarket, construction materials, industrial supplies, hospitality, healthcare, or electronics.

Build a `target_side_projection` when merchant-side facts drive the search. Keep it short:

```json
{
  "merchant_offer_anchor": ["custom door locks"],
  "target_side_projection": {
    "product_terms": ["door hardware", "architectural hardware"],
    "company_type_terms": ["distributor", "dealer"],
    "industry_terms": ["building materials"]
  }
}
```

Avoid long combined phrases in `productKeywords`.

Bad:

```json
{
  "productKeywords": ["auto glass importer", "auto glass distributor"]
}
```

Better for recovery or explicit later refinement:

```json
{
  "productKeywords": ["auto parts", "automotive glass", "vehicle parts"],
  "companyTypeKeywords": ["importer", "distributor"]
}
```

Better for Round 1:

```json
{
  "productKeywords": ["auto parts", "automotive glass", "vehicle parts", "Autoglas"],
  "includeCountry": ["DE"]
}
```

Direct target-company requests can use the user's product/category terms more directly. If the user says "Find auto parts importers", `auto parts` is target-side product/category context and `importer` is target-side company type; Round 1 should usually search product/category terms plus geography, then use `importer` in recovery if recall is weak or noisy.

Simple request classification:

| User says | Classify as | First-search handling |
|-----------|-------------|-----------------------|
| "I am an auto glass manufacturer; find German customers." | Merchant-side seed | Round 1: product/category terms such as `auto parts`, `automotive glass`, `vehicle parts`, or `Autoglas` plus `DE`. If weak, rewrite within product/category terms first. |
| "Our website is for custom door locks; find US buyers." | Merchant-side seed | Round 1: product/category terms such as `door hardware`, `architectural hardware`, `access control`, or `security systems` plus `US`. |
| "Find German auto glass importers." | Direct target-company request | Round 1: `auto glass`, `automotive glass`, `vehicle glass`, `Autoglas`, or `Windschutzscheibe` plus `DE`; keep `importer` for display filtering or recovery. |
| "Find Middle East auto parts distributors." | Direct target-company request | Round 1: `auto parts`, `automotive aftermarket`, or `vehicle parts` plus a practical Middle East country set; keep `distributor` for display filtering or recovery. |

## 3. Payload Contract

Send only fields supported by [api-reference.md](./api-reference.md):

```json
{
  "productKeywords": ["auto parts", "automotive aftermarket"],
  "includeCountry": ["DE"],
  "from": 0,
  "size": 10
}
```

Rules:

- Use `node scripts/search-companies.js --json '<payload>' --compact --locale '<user-locale>' --save-raw /private/tmp/okki-go-batches/<batch>.json` for normal free company-search display.
- Do not call `search-companies.js` without `--compact` unless the user explicitly asks for raw/debug output.
- `size` defaults to wrapper/API behavior when the user does not specify a count.
- `size` must be 1-50. Paginate with `from` for larger counts.
- When `target_count > 50`, use free pagination with `size: 50`, `from: 0`, then `from: 50`, and continue by page as needed. Do not call `/contacts/search` or `/companies/unlock` to satisfy company-count targets.
- Use ISO 3166-1 alpha-2 country codes.
- Use `withEmails: 1` only when the user asks for companies with emails or when email availability is central to the task.
- Do not add `withEmails: 1` just because leads should be contactable. Company discovery is free; contact availability can be checked after candidates exist.
- In Round 1, use exactly one keyword dimension by default. Choose only one of `productKeywords`, `companyTypeKeywords`, or `industryKeywords`.
- Country or region filters are allowed in Round 1 when the user specifies geography.
- Do not pack `productKeywords`, `companyTypeKeywords`, and `industryKeywords` together by default. Extra user dimensions are soft display or recovery clues.
- Omit `crossFieldOperator` when a simple payload is enough. Use `"AND"` only when every chosen field must be required. Use `"OR"` only for a deliberate broad scan.
- Do not use `crossFieldOperator: "AND"` in Round 1 by default.
- Do not switch the whole payload from `"AND"` to `"OR"` as the default response to zero results.
- Do not invent unsupported fields such as `employee_range`, `decision_roles`, `website`, `homepage`, `url`, `contacts`, or `limit`.
- Treat employee range, certifications, and similar constraints as local display/filtering guidance only if present in returned fields.
- Decision roles are for later contact lookup or outreach; never put roles into company-search keywords.

Free company-search output must hide internal identifiers. Do not display `domain`, website, homepage, URL, link fields, or raw internal IDs. Store `domain` privately by row number for later `/companies/unlock`.

Apply this silently in user replies. Present only visible company fields and the next action; do not explain that domain, website, URL, or internal fields were hidden, omitted, filtered, or privately mapped unless the user asks for raw/debug output.

For display, use localized country/region names from compact output (`country_name`) instead of raw ISO country codes. Fall back to `country_code` only when a localized name is unavailable.

## 4. Country Normalization

Use ISO 3166-1 alpha-2 codes for `includeCountry` and `excludeCountry`.

Common mappings:

| Region/User wording | Country codes |
|---------------------|---------------|
| United States, USA, America | `US` |
| United Kingdom, UK, Britain | `GB` |
| Germany | `DE` |
| France | `FR` |
| Italy | `IT` |
| Spain | `ES` |
| Netherlands | `NL` |
| China, Mainland China | `CN` |
| Hong Kong | `HK` |
| Taiwan | `TW` |
| Japan | `JP` |
| South Korea | `KR` |
| Singapore | `SG` |
| Malaysia | `MY` |
| India | `IN` |
| Australia | `AU` |
| United Arab Emirates, UAE | `AE` |
| Saudi Arabia, KSA | `SA` |
| Turkey | `TR` |
| Brazil | `BR` |
| Mexico | `MX` |
| South Africa | `ZA` |

For broad regions, choose a practical first set and mention it briefly:

- Middle East: `AE`, `SA`, `QA`, `TR`, `IL` unless the user specifies otherwise.
- Europe: start with major target markets relevant to the request, such as `DE`, `FR`, `IT`, `ES`, `GB`, `NL`.
- Southeast Asia: `SG`, `MY`, `TH`, `VN`, `ID`, `PH`.

If country intent is unclear, ask one question instead of guessing.

## 5. Result Handling

Keep first-search handling light:

- Show the companies returned by the API according to requested count or first-page size.
- Do not hard-code an 8-12 result display.
- Do not run historical `viewed classify` or `mark-shown` by default.
- Do not spend time building a full scoring model.
- Deduplicate only obvious duplicates within the same API response if needed.
- Preserve private row-to-domain mapping for unlock.

Suggested columns:

```text
| # | Company | Country | Category/Industry | Products/Profile fit | Emails | Employees |
```

Then ask for the next step:

```text
Pick a company number to unlock details and emails, or tell me how to refine the search.
```

If the user asks for "new only", "exclude companies I saw", or similar, use the viewed-state helper from [workflows.md](./workflows.md).

## 6. When Results Are Weak

If the first result set is sparse, zero, noisy, or peer-manufacturer-heavy, keep recovery lightweight. Do not automatically enter multi-round Expansion.

Automatic recovery budget:

- Each additional `search-companies.js` invocation after the first search counts as one automatic recovery round.
- Run at most 3 automatic recovery rounds for one user request.
- Keep each recovery payload concise and directly related to the current request.
- After 3 automatic recovery rounds, stop and show the best current results or explain why the search is still weak, then ask whether to continue refining.
- If the user explicitly asks to continue, find more, or make it more precise, that new request may start another recovery budget.

### Automatic recovery gradient

Use this order. It is designed for weaker models: do the first applicable step, run the free search, inspect whether results improved, then move to the next step only if needed.

1. **Round 1: recall-first one-dimension search.** Build one concise target-company search hypothesis from the current request. Use exactly one keyword dimension by default, plus geography if specified. Translate user words into OKKI index-language terms before searching. Do not add a separate visible validator, a Query Plan Portfolio, or a long explanation before the first search.
2. **Recovery 1: target-side rewrite.** If Round 1 is zero, sparse, noisy, or peer-manufacturer-heavy, treat merchant-side terms as `merchant_offer_anchor` and rewrite within the same keyword dimension first, usually `productKeywords`, into target-side category, inventory, service, application, local-language, or procurement language. Keep target geography.
3. **Recovery 2: buyer-route shift.** If Recovery 1 is still weak, stop changing only synonyms. Shift to one adjacent buyer route with a clear path, such as channel route to installer/integrator route, or narrow importer route to trade-category supplier route. Keep geography. Use one route per payload. This is the first normal place to add or switch to `companyTypeKeywords`.
4. **Recovery 3: narrow-field cleanup.** If Recovery 2 is still weak, remove the least important narrowing field, such as `industryKeywords`, or remove `withEmails` if the user did not require email-only results. You may broaden the same route from one company type to route-compatible types, such as `importer` to `importer`, `distributor`, and `wholesaler`.
5. **Stop after the recovery budget.** After three recovery searches, stop automatic searching. Show the best current results or say that the search is still weak, then offer two or three next directions instead of continuing to guess.

Direct target-company request rule:

- For a direct target-company request, Round 1 usually searches product/category wording first and keeps the user-specified company type as a soft clue. Example: `auto glass importer` can start with `automotive glass`, `vehicle glass`, `auto parts`, `automotive aftermarket`, `Autoglas`, or `Windschutzscheibe` plus geography.
- In Recovery 1, change product/category wording before adding another dimension.
- In Recovery 2, you may add or broaden the company type within the same route, such as `importer` to `importer`, `distributor`, and `wholesaler`.

Merchant-side seed rule:

- For a merchant-side seed, Recovery 1 must not preserve exact merchant-side product terms merely to keep an anchor when those terms caused weak or peer-heavy results.
- Use `merchant_offer_anchor` only as internal reasoning context. The API payload should contain target-side terms from `target_side_projection`.
- If the user gave a website or product page and recovery is weak, use the page only to improve target-side projection. Do not add unsupported `website`, `homepage`, or `url` fields to the API payload.

Allowed refinement options:

- Remove an over-narrow field such as `industryKeywords`.
- Remove `withEmails` when the user did not require email-only leads.
- Try a different target-side product/category term.
- Broaden or narrow company type within the same buyer route.
- Add or change target country when geography was the weak point.
- Use a website/product page for higher precision.
- Run explicit Expansion if the user asks for more routes.

Do not do these as automatic recovery:

- Do not use global `OR` before trying the allowed refinements above.
- Do not combine unrelated buyer routes in one payload.
- Do not drop target geography unless the user asked for geography-free exploration.
- Do not keep a merchant-side keyword only to preserve an anchor when it is causing poor results.

Examples:

```text
Merchant-side seed:
User: "I am a custom door lock manufacturer. Find German customers."
Round 1 should use: door hardware / architectural hardware / security hardware + DE
Recovery 1 may use: access control / security systems + DE
Recovery 2 may use: installer / integrator + DE, or distributor / dealer + DE
Recovery 3 may remove an industry keyword or broaden dealer to distributor/wholesaler.

Direct target-company request:
User: "Find German auto glass importers."
Round 1 should use: auto glass / automotive glass / vehicle glass / Autoglas / Windschutzscheibe + DE
Recovery 1 should use: auto parts / automotive aftermarket / vehicle parts + DE
Recovery 2 may add or broaden within the channel route: importer/distributor/wholesaler + auto parts or automotive aftermarket + DE
```

## 7. Paid and Send Guardrails

Company discovery is free. It never authorizes:

- `/companies/unlock`
- `/contacts/search`
- `/emails/send/batch`
- `/emails/send/personalized`

Unlock, contact search, and email sending always follow the guardrails in `SKILL.md`.
