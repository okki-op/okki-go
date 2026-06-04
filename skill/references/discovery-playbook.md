# Company Discovery Playbook

This reference explains how to turn a B2B prospecting request into a fast free `POST /api/v1/companies/search-advanced` call.

Default behavior is simple: infer target-company profile keywords, search, show results, then wait for the user to choose unlock/refinement. Do not run PMF Gate, Lite Onboarding, Brief confirmation, Expansion, Sales Mentor, or historical viewed deduplication before the first free search unless the user explicitly asks.

The first search should use model judgment, not a fixed template. Build one concise target-company hypothesis and search it. The guardrails below say what not to do; they do not require a specific keyword set.

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

User-provided products, services, certifications, websites, and business descriptions are merchant-side context first.

Do not mechanically copy merchant-side terms into `productKeywords`.

Use the model's B2B reasoning to generate concise target-side terms:

- `productKeywords`: target-company products, categories, inventory, services, application categories, procurement language, or business categories.
- `companyTypeKeywords`: target-company route words such as importer, distributor, wholesaler, dealer, retailer, installer, contractor, integrator, procurement company, or trading company.
- `industryKeywords`: target-company industry/application context such as automotive aftermarket, construction materials, industrial supplies, hospitality, healthcare, or electronics.

Avoid long combined phrases in `productKeywords`.

Bad:

```json
{
  "productKeywords": ["auto glass importer", "auto glass distributor"]
}
```

Better:

```json
{
  "productKeywords": ["auto parts", "automotive glass", "vehicle parts"],
  "companyTypeKeywords": ["importer", "distributor"]
}
```

Direct target-company requests can use the user's terms more directly. If the user says "Find auto parts importers", `auto parts` is target-side product/category context and `importer` is target-side company type.

## 3. Payload Contract

Send only fields supported by [api-reference.md](./api-reference.md):

```json
{
  "productKeywords": ["auto parts", "automotive aftermarket"],
  "companyTypeKeywords": ["importer", "distributor"],
  "includeCountry": ["DE"],
  "from": 0,
  "size": 10
}
```

Rules:

- Use `node scripts/search-companies.js --json '<payload>'`.
- `size` defaults to wrapper/API behavior when the user does not specify a count.
- `size` must be 1-50. Paginate with `from` for larger counts.
- When `target_count > 50`, use free pagination with `size: 50`, `from: 0`, then `from: 50`, and continue by page as needed. Do not call `/contacts/search` or `/companies/unlock` to satisfy company-count targets.
- Use ISO 3166-1 alpha-2 country codes.
- Use `withEmails: 1` only when the user asks for companies with emails or when email availability is central to the task.
- Do not add `withEmails: 1` just because leads should be contactable. Company discovery is free; contact availability can be checked after candidates exist.
- Do not pack `productKeywords`, `companyTypeKeywords`, and `industryKeywords` together by default. Use only the fields needed for the chosen hypothesis.
- Omit `crossFieldOperator` when a simple payload is enough. Use `"AND"` only when every chosen field must be required. Use `"OR"` only for a deliberate broad scan.
- Do not switch the whole payload from `"AND"` to `"OR"` as the default response to zero results.
- Do not invent unsupported fields such as `employee_range`, `decision_roles`, `website`, `homepage`, `url`, `contacts`, or `limit`.
- Treat employee range, certifications, and similar constraints as local display/filtering guidance only if present in returned fields.
- Decision roles are for later contact lookup or outreach; never put roles into company-search keywords.

Free company-search output must hide internal identifiers. Do not display `domain`, website, homepage, URL, link fields, or raw internal IDs. Store `domain` privately by row number for later `/companies/unlock`.

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

If the first result set is sparse, zero, or noisy, keep recovery lightweight. Do not automatically enter multi-round Expansion.

Automatic recovery budget:

- Each additional `search-companies.js` invocation after the first search counts as one automatic recovery round.
- Run at most 3 automatic recovery rounds for one user request.
- Keep each recovery payload concise and directly related to the current request.
- After 3 automatic recovery rounds, stop and show the best current results or explain why the search is still weak, then ask whether to continue refining.
- If the user explicitly asks to continue, find more, or make it more precise, that new request may start another recovery budget.

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

Example:

```text
The first scan is broad and some companies look like peer suppliers. I can refine the target-side keywords toward distributors/installers, or try another country set. Which direction should I use?
```

## 7. Paid and Send Guardrails

Company discovery is free. It never authorizes:

- `/companies/unlock`
- `/contacts/search`
- `/emails/send/batch`
- `/emails/send/personalized`

Unlock, contact search, and email sending always follow the guardrails in `SKILL.md`.
