# OKKI Go PMF and Query Expansion Optimization Design

Date: 2026-06-01

## Context

The current OKKI Go discovery flow can honor direct-search requests such as
"directly search German auto parts companies" before it understands the user's
own company, product, service capability, or fit constraints. This is efficient,
but it optimizes for executing a search rather than finding prospects that match
the user's product-market fit.

The existing skill already has the right foundation: Merchant Profile, source
labels, Lite Onboarding, dynamic `trade_mode`, confirmation tiers, and discovery
evaluation scenarios. The change is a product-policy adjustment on top of those
contracts: new or under-profiled users should be strongly guided to provide a
company website or product page before the first prospect search, while still
keeping an explicit skip path for rough free search.

The current 1.2.0 expansion rules also create a second failure mode. Discovery
builds a complete Brief, maps Brief fields directly to `search-advanced`
parameters, and then uses `crossFieldOperator: "or"` as the first broadening
move when results are too sparse. This assumes the user's own product keywords
are the same terms that should appear in the target company's profile. For many
prospecting tasks that is false. A custom door-lock manufacturer that searches
`productKeywords: ["door lock"]` can easily retrieve peer manufacturers or
brands instead of buyers, channels, installers, project contractors, or operators
with procurement demand. A richer Brief can therefore make the first query
competitor-heavy, while the fallback can become overly broad and unrelated.

The optimization must fix both sides: better PMF context before discovery, and a
target-side keyword modeling layer between the PMF Brief and API calls. The
agent should reason from "what the merchant sells" to "what the target company
should look like" before it chooses `productKeywords`, `companyTypeKeywords`,
and `industryKeywords`.

## Goals

- Make prospect discovery optimize for PMF fit, not only keyword matching.
- Prefer a company website or product page as the fastest source of merchant
  profile context.
- Require user confirmation before website-extracted data is saved or used as
  confirmed long-term profile data.
- Preserve a clear skip path for users who insist on rough direct search.
- Re-ask for a website or product page in future prospecting tasks when the
  Merchant Profile remains insufficient; a skip is not a permanent preference.
- Separate PMF Brief generation from API query construction.
- Treat the merchant's product/service terms as offer anchors for reasoning, not
  as automatic `productKeywords` for target-company search.
- Replace default `AND -> OR` broadening with target-side recovery plans that
  preserve geography and target-route intent.
- Add target-route expansion so follow-up searches are based on channel,
  trade-category, installer/integrator, project-trigger, operator, or procurement
  routes rather than loose keyword similarity.
- Make expansion reliable for weaker models through fixed route types,
  structured target-side keyword projection, validation rules, and conservative
  handling of low-confidence routes.
- Keep all paid-action, contact-search, and email-send confirmations unchanged.

## Non-Goals

- Do not add a visual UI page or web form. Confirmation happens in the agent
  conversation as a structured message.
- Do not require every user to have a website.
- Do not block free company search forever when the user explicitly skips.
- Do not use unconfirmed website extraction as a long-term default.
- Do not build a complete universal supply-chain graph or target-keyword
  ontology in the first iteration. The system starts with generic target-route
  templates and a small, auditable route library that can grow over time.
- Do not change OKKI Go API schemas unless implementation later discovers a
  required backend capability.

## Recommended Approach

Implement **PMF Quick Profile Gate** plus **Target-Side Query Plan Portfolio**
and **Target Route Expansion Harness**.

When a new or under-profiled user starts company/customer discovery, the agent
first asks for a company website or product page. If the user provides one, the
agent extracts a provisional Merchant Profile, shows it in a conversational
confirmation message, waits for confirmation or edits, saves confirmed data to
the local Merchant Profile, and builds a PMF-aware search brief.

The PMF Brief is not sent to the API directly. The agent must turn it into a
small portfolio of target-side query plans. Each plan represents one target
route, such as channel buyer, trade-category buyer, installer/integrator,
project-trigger contractor, operator, or procurement-category path. The plan
keeps the merchant's offer anchors as internal reasoning context, then projects
them into the current `search-advanced` API fields only when those terms describe
the target company. This avoids the current pattern where all Brief dimensions
are packed into one competitor-prone payload and then widened with a noisy `OR`
fallback.

If the user skips, the agent may run a free rough search, but must clearly label
the result as under-profiled and ask again in future independent prospecting
tasks while the profile remains incomplete.

## Trigger Rules

Before prospecting discovery, load Merchant Profile with the existing state
helper. The PMF Gate runs when all of the following are true:

- The user intent is company/customer discovery.
- Merchant Profile lacks enough confirmed or imported context to support PMF
  matching. At minimum, this means missing or weak company country, primary
  product/service, or offer/fit context.
- The request is a new independent prospecting task, not a small refinement of
  the same brief where the user has just skipped.

Direct-search wording such as "directly search", "直接搜", or "先不用问我" no
longer bypasses the PMF Gate by default. It only allows rough search after the
agent has strongly recommended providing a website/product page and the user has
explicitly skipped.

## Conversation Flow

### 1. Profile Load

The agent reads Merchant Profile before discovery unless the user is only
checking balance, checking email status, handling authentication, or managing
profile state.

### 2. Quick Profile Prompt

If the profile is insufficient, the agent asks one compact question:

```text
为了让潜客更匹配你的产品和服务能力，强烈建议先发我你的公司官网或产品介绍页。
如果暂时没有，也可以用一句话描述：你的公司在哪、主要卖什么、核心优势是什么。
如果你只想先粗搜，也可以回复“跳过”。
```

If the user previously skipped in another independent prospecting task and the
profile is still insufficient, the prompt should mention that the prior results
were under-profiled:

```text
上次我们是在缺少官网/产品信息的情况下做了粗搜。为了让这次潜客更贴合你的产品、服务能力和目标客户画像，强烈建议先提供官网或产品介绍页。
```

### 3. Website/Product Page Extraction

If the user provides a URL, the agent should try to read it when the runtime can
access the web. If it cannot access the URL, it asks the user to paste the core
page content or provide a one-sentence description. Both paths feed the same
extraction and confirmation flow.

Extraction should focus on:

- Company country or operating region.
- Company type, such as manufacturer, trader, service provider, or brand owner.
- Primary products or services.
- Typical applications, industries, or use cases.
- Differentiators such as certifications, delivery capability, customization,
  quality proof, or service scope.
- Target-customer clues mentioned by the site.
- Explicit exclusions or constraints, only when the source clearly states them.

The extraction must record source URL or user-pasted source where possible.

### 4. Conversational Confirmation

Website-extracted data is shown as provisional and cannot be silently saved or
used as confirmed long-term profile data.

Example:

```text
我从你提供的官网/产品页提取到以下画像，准备用它来优化这次潜客搜索：

- 公司所在国家/地区：CN
- 公司类型：制造商
- 主营产品/服务：汽车零部件、制动系统配件
- 适用场景：售后维修、商用车配套
- 核心优势：IATF 16949、可定制、小批量交付
- 目标客户线索：进口商、批发商、维修连锁

如果准确，请回复“确认”，我会保存到本地 Merchant Profile 并开始搜索。
如果不准确，直接告诉我要改哪里。
```

This is not a UI page. It is a structured agent message.

### 5. Confirm and Save

When the user confirms:

- Save confirmed fields to Merchant Profile using the state helper.
- Treat user edits as authoritative and save the edited values.
- Convert confirmed extracted values into `user_confirmed` where the existing
  schema requires a source label.
- Do not save rejected fields.

The confirmation action means "save and use for this search". No second save
prompt is needed, because the confirmation message explicitly states the data
will be saved locally.

### 6. PMF Brief Generation

The search brief is generated from both:

- The user's prospect request, such as target geography, industry, company type,
  desired count, and role intent.
- The confirmed Merchant Profile, such as country, products, applications,
  strengths, certifications, fit clues, and exclusions.

The brief should answer: "Which target companies are most likely to buy, use,
distribute, integrate, or influence demand for this user's offering?"

The brief must separate offer-side facts from target-side search intent:

- `merchant_offer_anchor`: what the user sells or provides. This is used for PMF
  reasoning and result explanation, but it is not automatically copied into API
  `productKeywords`.
- `merchant_capabilities`: certifications, customization, delivery capability,
  service scope, or other reasons a target may buy.
- `target_routes`: the kinds of companies that may buy, distribute, install,
  specify, operate, or procure the offering.
- `target_geo`: the requested search geography.

Example:

User request:

```text
帮我找些德国汽配公司
```

Confirmed profile:

```text
中国制动系统配件制造商，支持定制，有 IATF 16949，小批量交付
```

PMF brief:

- Target market: DE.
- Merchant offer anchor: brake parts, brake system components.
- Preferred target routes: auto parts importers, distributors, aftermarket
  channels, repair-chain suppliers, commercial vehicle maintenance suppliers.
- Target-side search terms: auto spare parts channels, automotive aftermarket,
  commercial vehicle maintenance, distributor/importer wording.
- Industry/application context: automotive aftermarket, commercial vehicle
  maintenance.
- Deprioritize or exclude: pure vehicle brands or direct competitor
  manufacturers unless the user asks for OEM/co-manufacturing prospects.
- Matching rationale: these targets are more likely to purchase, distribute, or
  integrate the user's parts than a generic list of all auto-parts companies.

If the original target is too broad, the agent should ask a short directional
choice before search:

```text
结合你的产品画像，“德国汽配公司”可以拆成几类潜客：
(a) 汽配进口商/批发商
(b) 售后维修和连锁渠道
(c) 商用车/车队维护供应链
(d) OEM/Tier 配套采购方

我建议先搜 a+b，匹配度更高、获客路径更直接。是否按这个方向开始？
```

### 7. Target-Side Query Plan Portfolio

After PMF Brief generation, the agent builds a `query_plan_portfolio`. The
portfolio is session memory and sits between the Brief and API calls. It is not
persisted as Merchant Profile data.

The portfolio must distinguish plan metadata from the API payload. Metadata can
include offer anchors, target routes, rationale, risks, and local result rules.
Only `api_payload` is sent to `POST /api/v1/companies/search-advanced`, and it
must use only fields supported by `api-reference.md`.

Each query plan must contain:

```json
{
  "plan_id": "core-1",
  "tier": "core",
  "merchant_offer_anchor": ["automotive glass", "windshield"],
  "target_route_type": "channel_route",
  "target_hypothesis": "German automotive aftermarket distributors may buy replacement glass from an overseas supplier.",
  "target_company_should_be": "Importer, distributor, or wholesaler serving the automotive aftermarket.",
  "route_path": "automotive glass supplier -> aftermarket distributor/importer -> German repair and replacement market",
  "target_side_projection": {
    "product_terms": ["automotive glass", "windshield"],
    "company_type_terms": ["distributor", "importer"],
    "industry_terms": ["automotive aftermarket"]
  },
  "api_payload": {
    "productKeywords": ["automotive glass", "windshield"],
    "companyTypeKeywords": ["distributor", "importer"],
    "industryKeywords": ["automotive aftermarket"],
    "includeCountry": ["DE"],
    "crossFieldOperator": "and",
    "from": 0,
    "size": 50
  },
  "fit_level": "high",
  "competitor_risk": "medium",
  "risk": "May miss repair chains that describe themselves as service providers rather than distributors."
}
```

Rules:

- A PMF Brief can produce multiple query plans. It must not collapse every Brief
  field into one payload.
- Each plan should test one target route only.
- Each plan must keep merchant offer context in metadata and target geography in
  `api_payload` unless the user explicitly asks for geography-free exploration.
- Merchant offer terms may be projected into API `productKeywords` only when
  they plausibly describe the target company's own products, services, inventory,
  categories, or procurement language. They must not be copied mechanically.
- If direct use of the merchant offer term is likely to retrieve competitors,
  the plan should project to target-side category, channel, use-case, project, or
  procurement terms instead.
- Decision roles remain contact-discovery context and must not be placed into
  company-search keywords.
- Query plans should be shown or summarized before search when they materially
  change the user's requested direction.

Supported target-route types:

| Target Route Type | What It Searches For |
|-------------------|----------------------|
| `channel_route` | Importers, wholesalers, distributors, dealers, and other resale channels. |
| `trade_category_route` | Companies organized around broader target-side categories such as building hardware, architectural hardware, auto aftermarket, industrial supplies, or medical consumables. |
| `installer_integrator_route` | Installers, contractors, engineering firms, or system integrators that source products for projects. |
| `project_trigger_route` | Companies connected to renovation, maintenance, replacement, expansion, opening, upgrade, or new-build events. |
| `operator_route` | Asset operators with repeated or bulk use cases, such as hotels, apartments, schools, hospitals, factories, fleets, or property managers. |
| `procurement_category_route` | Standard procurement/category language from CPV, UNSPSC, HS, NAICS, tenders, or equivalent local terminology. |
| `not_recommended` | Plausible-looking but weak or risky target routes that should not be searched by default. |

Door-lock example:

```json
{
  "plan_id": "channel-1",
  "tier": "core",
  "merchant_offer_anchor": ["custom door locks", "smart locks"],
  "target_route_type": "channel_route",
  "target_hypothesis": "German building-hardware channels may resell or source custom locks.",
  "target_company_should_be": "Importer, distributor, or wholesaler of building or architectural hardware.",
  "route_path": "custom door lock manufacturer -> building hardware channel -> German construction/hardware market",
  "target_side_projection": {
    "product_terms": ["door hardware", "building hardware", "architectural hardware"],
    "company_type_terms": ["importer", "distributor", "wholesaler"],
    "industry_terms": ["construction materials"]
  },
  "api_payload": {
    "productKeywords": ["door hardware", "building hardware", "architectural hardware"],
    "companyTypeKeywords": ["importer", "distributor", "wholesaler"],
    "industryKeywords": ["construction materials"],
    "includeCountry": ["DE"],
    "crossFieldOperator": "and",
    "from": 0,
    "size": 50
  },
  "fit_level": "high",
  "competitor_risk": "medium",
  "risk": "Some distributors may be brand owners or peer suppliers; result display should deprioritize obvious lock manufacturers when fields support it."
}
```

### 8. Free Search Execution

After the PMF brief is confirmed or sufficiently clear under the existing tier
rules, the agent runs the selected query plan or plans with the free company
search endpoint. Result display should include concise "why this may fit you"
reasoning where result fields and profile fields support it.

Default first search:

- Run one high-fit core plan when the user requested a narrow target.
- Run up to three high-fit core plans when the target is broad and the plans
  represent distinct target routes.
- Keep results grouped by query plan or target route when multiple plans run.
- Do not merge exploratory results into the core group without labeling their
  origin.

### 9. Explicit Skip Path

If the user explicitly skips:

- Continue only with free company search when enough search parameters exist.
- Label the search as a rough initial scan because Merchant Profile context is
  missing.
- Do not save "skip" as a long-term preference.
- Do not suppress future PMF Gate prompts for new independent prospecting tasks.
- Keep all paid and send confirmations intact.

Same-session throttle:

- If the user just skipped and is only refining the same brief, do not repeat
  the website prompt on every small adjustment.
- If the user starts a new product, market, or independent prospecting task, and
  the profile is still insufficient, ask again.

## Query Expansion Rules

### Problem To Eliminate

The current 1.2.0 expansion flow has two coupled problems:

```text
complete Brief
  -> Brief.product_anchor copied into API productKeywords
  -> one strict API payload
  -> too few results
  -> crossFieldOperator: and -> or
  -> competitor-heavy or unrelated results
```

The new flow must avoid both automatic product-keyword copying and global OR
broadening. Expansion is target-side route modeling, not a single query that
keeps getting looser.

### Search Tiers

Use four tiers:

1. **L0 Target-Side Core Query:** strict, high-fit target routes derived from
   the PMF Brief.
2. **L1 Target-Side Recovery Ladder:** recover sparse or competitor-heavy
   results by changing target-side terms or route scope, not by global OR.
3. **L2 Target Route Expansion:** generate additional target routes such as
   trade category, installer/integrator, project trigger, operator, or
   procurement category.
4. **L3 Exploration:** low-confidence or long-path routes shown to the user for
   selection; no automatic search unless the user explicitly chooses them.

### L0 Target-Side Core Query

Core plans use:

- Merchant offer anchor as internal reasoning context.
- Target geography.
- One target route.
- Target-side product/category, company-type, industry, or procurement terms.
- Optional industry context only when it improves precision.

Do not put every available Brief field into the first payload. Also do not copy
the merchant's product terms into `productKeywords` unless they are appropriate
target-side terms for the chosen route.

For example, a custom door-lock manufacturer searching Germany should not start
with:

```text
door lock + DE
```

Preferred core plans are target-side routes:

```text
Plan A: door/building hardware + importer/distributor + DE
Plan B: architectural/building hardware + wholesaler/distributor + DE
Plan C, if smart-lock context exists: access control/security systems + installer/integrator + DE
```

### L1 Target-Side Recovery Ladder

Target-Side Recovery replaces the old default `AND -> OR` Broadening Ladder.
It runs when the first route is too sparse, too homogeneous, or visibly
competitor-heavy.

Allowed recovery moves:

- Swap merchant-product terms to broader target-side category terms while
  preserving target route and geography, such as `door lock` to `door hardware`
  or `building hardware`.
- Swap to target-side procurement or category wording while preserving route and
  geography, such as `custom lock` to `architectural hardware`.
- Broaden company type within the same route, such as importer to
  importer/distributor/wholesaler.
- Remove the least important industry/application keyword when it is narrowing
  the target route too much.
- Temporarily remove `withEmails`.
- Move to an adjacent route only when the route path stays clear, such as
  channel route to trade-category route, or trade-category route to
  installer/integrator route for smart-lock or access-control contexts.

Hard rules:

- Do not switch the whole payload from `and` to `or` as the default move.
- Do not remove target geography unless the user asked for geography-free
  exploration.
- Do not combine unrelated target routes into one OR-style payload.
- Do not preserve a merchant-product keyword in `productKeywords` merely to keep
  a "product anchor" when that term is causing competitor-heavy search.
- Disclose the target-side recovery used and why it is still likely to match.

Example recovery:

```text
首轮结果偏少，且直接搜 "door lock" 容易混入门锁厂家。我会保留德国市场和渠道买家路线，
把目标侧产品词从 "door lock" 调整为 "door hardware / building hardware"，
并把公司类型从 importer 放宽到 importer/distributor/wholesaler。
```

### L2 Target Route Expansion

Target Route Expansion generates new target-side plans. It is not
keyword-neighbor expansion and it does not append selected candidates to one
expanded Brief with `crossFieldOperator: "or"`.

Allowed route types:

| Route Type | Meaning |
|------------|---------|
| `channel_route` | Importers, wholesalers, distributors, dealers, and other resale channels. |
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

Example:

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
    "crossFieldOperator": "and",
    "from": 0,
    "size": 50
  },
  "fit_level": "medium_high",
  "why_this_matches": "Hotel renovation contractors may source door locks in bulk during room upgrade projects.",
  "competitor_risk": "low",
  "risk": "Generic hotels are too broad unless renovation or procurement context is included."
}
```

The important distinction is that "hotel" is not searched because it is
semantically near "door lock". It is considered only when the relation path
connects hotel operations to renovation, room maintenance, property management,
or another procurement event. The API payload searches target-side company
profiles, not the merchant's product list verbatim.

### L3 No Route-Library Mode

The system does not need a large industry route library at launch. When no
verified route-library entry exists for the product/category, the model may
still generate target-side routes. Lack of a library entry must not prevent all
search results.

Rules:

- Build at least one safe generic target route when the user has provided enough
  product/service and geography context for free company search.
- Safe generic routes may be searched automatically if they preserve target
  geography, have a short route path, and pass the Target-Side Query Validator.
- Mark these plans as `generic_controlled` rather than `verified`.
- Good automatic fallback routes are usually `channel_route`,
  `trade_category_route`, and, when the offer context supports it,
  `installer_integrator_route`.
- `project_trigger_route`, `operator_route`, and broad
  `procurement_category_route` candidates may be auto-searched only when the
  target-side projection contains a concrete procurement, installation,
  renovation, replacement, maintenance, upgrade, or new-build trigger.
- Low-confidence or long-path ideas are shown for user selection as Exploration.
- Downgrade vague ideas to `not_recommended` when they lack a target role,
  category, procurement event, or target-side keyword projection.

Example:

```text
我没有找到门锁行业的已验证目标路线库，因此先使用通用受控路线。
我会先自动尝试：

(a) 渠道路线：door/building hardware + importer/distributor + DE
(b) 品类路线：architectural/building hardware + wholesaler/distributor + DE

如果你的产品是智能门锁，我还可以尝试：
(c) 安装集成路线：access control/security systems + installer/integrator + DE

暂不自动搜索：
(d) 酒店集团、物业公司、房地产开发商。它们可能有需求，但需要翻新、采购、
维护或项目触发词，否则很容易搜偏。
```

This keeps recall above zero without letting the model perform unconstrained
semantic expansion.

### Target Route Library

Build a small, auditable target-route library incrementally. It should be
optional at first and should improve projection confidence, not be required for
basic recall.

Suggested record shape:

```json
{
  "vertical_id": "custom_door_locks",
  "aliases": ["door locks", "custom locks", "smart locks"],
  "merchant_offer_anchors": ["door lock", "custom lock", "smart lock"],
  "routes": [
    {
      "type": "channel_route",
      "target_company_should_be": "Door or building hardware importers, distributors, or wholesalers.",
      "target_side_projection": {
        "product_terms": ["door hardware", "building hardware", "architectural hardware"],
        "company_type_terms": ["importer", "distributor", "wholesaler"],
        "industry_terms": ["construction materials"]
      },
      "fit_level": "high",
      "competitor_risk": "medium"
    },
    {
      "type": "project_trigger_route",
      "target_company_should_be": "Hotel or apartment renovation contractors that may procure room door hardware.",
      "target_side_projection": {
        "product_terms": ["building hardware"],
        "company_type_terms": ["renovation contractor", "refurbishment contractor"],
        "industry_terms": ["hotel renovation", "apartment refurbishment"]
      },
      "fit_level": "medium_high",
      "competitor_risk": "low",
      "risk": "Do not search generic hotels without renovation, maintenance, procurement, or project context."
    }
  ],
  "bad_routes": ["generic hotels", "travel agencies", "real estate agencies"],
  "avoid_as_primary_product_keywords": ["door lock manufacturer", "lock factory"]
}
```

Promotion path:

- Generic-controlled route starts as `candidate_route`.
- Result quality, user selection, unlock/contact behavior, and user feedback can
  be recorded as signals.
- A route becomes `verified` only after human or explicit review.

### Target-Side Query Validator

Before running any expanded search, validate the plan:

- It stores merchant offer anchors in plan metadata.
- It explains why the target company may buy, resell, install, specify, operate,
  or procure the offering.
- It preserves target geography unless the user asked otherwise.
- It has exactly one target route.
- It has a `route_path`.
- It has target-side projected terms and a valid `api_payload`.
- Its `api_payload` uses only supported `search-advanced` fields.
- It does not put multiple unrelated target routes into one OR query.
- It does not use decision-maker roles as company-search keywords.
- It does not conflict with confirmed Merchant Profile constraints.
- It avoids broad generic targets such as hotels, real estate companies, repair
  companies, or property managers unless procurement, installation, renovation,
  maintenance, upgrade, replacement, or other route triggers are included.
- It flags competitor risk when API terms may retrieve peer manufacturers,
  factories, brands, or direct suppliers.
- It does not require merchant offer terms to appear in `productKeywords` when
  those terms would mainly retrieve competitors.

Invalid plans must be rewritten, downgraded to `not_recommended`, or shown for
user confirmation without search.

### Result Grouping

Results from different plans must stay explainable:

- `Core`
- `Target-Side Recovery`
- `Target Route Expansion`
- `Exploration`
- `Not Recommended` suggestions, if any

The agent should not present all results as a single undifferentiated company
list when they came from different hypotheses.

## Source and Profile Rules

The existing source discipline remains:

- `user_confirmed` and `imported` fields may feed Discovery defaults.
- `agent_inferred` values may be shown for confirmation but must not silently
  become defaults.
- Website-extracted values are provisional until the user confirms them. They
  may be represented as `agent_inferred` or an implementation-specific
  pending extraction state, but they must not feed long-term defaults before
  confirmation.
- After user confirmation, save the confirmed version as `user_confirmed`.
- Keep source URL or source description where practical for auditability.

The design does not require a schema-breaking new source value. Implementation
may choose either:

- Use existing `agent_inferred` plus a source URL note until confirmation.
- Add an internal pending extraction marker if the state helper and tests are
  updated together.

## Error Handling

If the URL cannot be fetched:

```text
我现在无法读取这个页面。为了继续做 PMF 匹配，你可以粘贴产品页核心内容，或用一句话描述：
你的公司在哪、主要卖什么、核心优势是什么。
也可以先跳过做粗搜。
```

If extracted data is ambiguous:

- Ask one focused clarification question.
- Do not guess company country, product category, or company type when the value
  materially affects `trade_mode` or search brief construction.

If the user refuses confirmation:

- Do not save the extracted fields.
- Ask whether to edit the extracted profile, provide a short manual
  description, or skip to rough search.

If the first query plans are too strict:

- Do not conclude that OKKI Go lacks matching companies solely from one strict
  plan.
- Use L1 Target-Side Recovery before Target Route Expansion.
- Report which target route stayed fixed and which target-side terms changed.

If Target Route Expansion produces only invalid plans:

- Show the strongest `not_recommended` reasons.
- Ask the user to choose a direction or provide an industry clue.
- Do not run broad fallback searches just to fill the target count.

## Evaluation Updates

Existing scenarios that expect direct search with unknown `trade_mode` should be
updated. The expected behavior is no longer "free search immediately allowed";
it is "PMF Gate shown first; free rough search allowed only after explicit
skip."

Required coverage:

- New user says "帮我找德国汽配公司": must not immediately call company search;
  must strongly recommend website/product page first.
- New user says "直接搜德国汽配公司": must still strongly recommend
  website/product page first; after explicit skip, free rough search may run.
- User provides a website/product page: must extract provisional profile and
  ask for conversational confirmation before search.
- User confirms extracted profile: must save confirmed fields to Merchant
  Profile before PMF brief and search.
- User edits extracted profile: must save the edited confirmed values.
- User rejects extracted profile: must not save rejected values or use them as
  long-term defaults.
- User skips once, then later starts another independent prospecting task while
  profile remains insufficient: must strongly recommend website/product page
  again.
- Provisional extraction must not be used as confirmed Profile defaults.
- PMF Brief generation must be followed by `query_plan_portfolio_built` before
  any free company search.
- A rich PMF Brief must not be collapsed into a single all-fields API payload
  when multiple target routes are present.
- First-round plans must store merchant offer anchors in plan metadata and
  preserve target geography in `api_payload`.
- Merchant offer terms must not be mechanically copied into API
  `productKeywords` when they are likely to retrieve competitors.
- Each query plan must include target-side projected terms before API payload
  construction.
- Result-sparse searches must not default to global `crossFieldOperator:
  "or"`.
- Target-Side Recovery must change target-side terms or route scope one step at
  a time and must report the retained target route and changed terms.
- Target Route Expansion candidates must include `target_route_type`,
  `route_path`, `merchant_offer_anchor`, `target_company_should_be`,
  `target_side_projection`, `api_payload`, `fit_level`, `why_this_matches`,
  `competitor_risk`, and `risk`.
- No Route-Library Mode must still build at least one safe generic target route
  when enough product/service and geography context exists.
- No Route-Library Mode must require user selection before running low-confidence
  long-path exploratory routes.
- Target-Side Query Validator must reject broad generic targets without
  procurement, installation, renovation, maintenance, upgrade, replacement, or
  similar route triggers.
- Expanded results must be grouped by query plan, target route, or search tier;
  they must not be merged into a single undifferentiated list.
- Paid unlock, paid contact search, and email send guardrails must still require
  separate explicit confirmations.

Suggested behavior markers:

- `pmf_gate_profile_insufficient`
- `pmf_gate_website_prompted`
- `pmf_gate_direct_search_deferred`
- `website_extraction_attempted`
- `website_extraction_fallback_requested`
- `profile_extraction_confirmation_requested`
- `profile_extraction_confirmed`
- `profile_confirmed_saved`
- `pmf_brief_built`
- `query_plan_portfolio_built`
- `brief_not_sent_directly_as_single_payload`
- `core_query_plan_selected`
- `merchant_offer_anchor_recorded`
- `target_side_projection_built`
- `merchant_offer_terms_not_mechanically_copied`
- `target_geo_preserved`
- `global_or_broadening_blocked`
- `target_side_recovery_applied`
- `target_side_recovery_route_retained`
- `target_route_expansion_candidates_built`
- `target_route_candidate_has_path`
- `target_side_query_validator_passed`
- `target_side_query_validator_rejected_generic_target`
- `no_route_library_mode_entered`
- `no_route_library_safe_route_built`
- `no_route_library_exploration_selection_required`
- `results_grouped_by_query_plan`
- `rough_search_after_explicit_skip`
- `rough_search_labeled_under_profiled`
- `skip_not_saved_as_preference`
- `pmf_gate_reprompted_future_task`

## Files Likely To Change During Implementation

- `okki-go/skill/SKILL.md`
- `okki-go/skill/references/discovery-playbook.md`
- `okki-go/skill/references/merchant-profile-playbook.md`
- `okki-go/skill/references/sales-mentor-playbook.md`
- `okki-go/eval/scenarios/...`
- `okki-go/eval/lib/runners/reference-agent.js`
- `okki-go/eval/test/...`

Implementation should preserve unrelated local changes and should not alter
authentication, billing, contact-search, or email-send safety semantics except
where evaluation scenarios need to assert that those semantics still hold.
