# Prospecting Brief Discovery Playbook

This playbook defines the session-level Discovery contract for turning vague B2B prospecting requests into a safe `search-advanced` plan. It references `merchant-profile-playbook.md` for confirmed defaults and `sales-mentor-playbook.md` for Business Context, Blind-Spot, and Sales Journey hooks.

## 1. When to Run Discovery

Discovery is a soft gate, not a safety gate. The PMF Quick Profile Gate runs before free company search when a company/customer discovery request does not have enough confirmed merchant context to reason about product-market fit.

### PMF Quick Profile Gate

Before prospecting discovery, load Merchant Profile with `node skill/scripts/okki-state.js profile read`. The PMF Gate runs when all conditions are true:

- The user intent is company/customer discovery.
- Merchant Profile lacks enough confirmed/imported context for PMF matching. At minimum, company country, primary product/service, and offer/fit context must be usable.
- The request is a new independent prospecting task, not a small refinement of the same brief where the user has just explicitly skipped.

Direct-search wording such as "direct search", "直接搜", "先不用问我", or "go directly" no longer bypasses the PMF Gate. It only allows rough free search after the agent has strongly recommended a company website/product page and the user explicitly skips.

If the profile is insufficient, ask one compact question:

```text
为了让潜客更匹配你的产品和服务能力，强烈建议先发我你的公司官网或产品介绍页。
如果暂时没有，也可以用一句话描述：你的公司在哪、主要卖什么、核心优势是什么。
如果你只想先粗搜，也可以回复“跳过”。
```

If the user skipped in a previous independent task and the profile is still insufficient, mention that prior results were under-profiled before asking again.

Behavior markers:

- `pmf_gate_profile_insufficient`
- `pmf_gate_website_prompted`
- `pmf_gate_direct_search_deferred`

Calibration examples:

| User Request | Decision | Reason |
|--------------|----------|--------|
| "找一些公司" | Ask | No usable search dimensions or merchant context. |
| "帮我找些德国汽配公司" | PMF Gate | Target is clear enough, but merchant offer/fit context is missing. |
| "直接搜德国汽配公司" | PMF Gate first | Direct-search wording is deferred until explicit skip. |
| "我们是中国制动系统配件制造商，有 IATF 16949，找德国汽配进口商" | Build Brief | Product, merchant context, target route, and geography are usable. |
| "继续按刚才那个德国汽配方向加 20 家" | Continue | Same-session refinement of a current Brief. |

### Website/Product Page Extraction

If the user provides a URL, try to read it when runtime access is available. If the page cannot be read, ask the user to paste the core page content or provide a one-sentence description. Both paths feed the same provisional extraction flow.

Extract only what the source supports:

- Company country or operating region.
- Company type, such as manufacturer, trader, service provider, or brand owner.
- Primary products or services.
- Applications, industries, use cases, differentiators, certifications, delivery/customization capability, and service scope.
- Target-customer clues and explicit exclusions.
- Source URL or source description where practical.

Website-extracted values are provisional. Show a structured confirmation message and wait. Do not save them or use them as confirmed long-term defaults before confirmation.

Behavior markers:

- `website_extraction_attempted`
- `website_extraction_fallback_requested`
- `profile_extraction_confirmation_requested`
- `profile_extraction_confirmed`
- `profile_confirmed_saved`

If the user confirms, save confirmed or edited values with `profile upsert --json` as `user_confirmed`. If the user rejects extraction, do not save rejected fields; ask whether to edit, provide a manual description, or skip to rough search.

### Explicit Skip Path

After the PMF Gate prompt, an explicit skip may continue only with free company search when enough search parameters exist. Label the result as a rough initial scan because Merchant Profile context is missing.

Rules:

- Do not save skip as a long-term preference.
- Do not suppress future PMF Gate prompts for new independent prospecting tasks while the profile remains insufficient.
- Same-session refinements of the same rough brief do not repeat the website prompt on every small adjustment.
- Paid unlock, contact search, and email send confirmations remain separate.

Behavior markers:

- `rough_search_after_explicit_skip`
- `rough_search_labeled_under_profiled`
- `skip_not_saved_as_preference`
- `pmf_gate_reprompted_future_task`

## 1.1. Hard Guardrails

Post-gate rough search only skips full PMF enrichment after the explicit skip. It never skips safety, authentication, billing, or sending confirmations.

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

## 1.2. Unknown trade_mode After PMF Gate

Priority order:

1. Authentication, billing confirmation, and email confirmation always win.
2. If the user explicitly skips the PMF Gate and `search-advanced` can be constructed, rough free company search may continue even when `profile.company.country` is missing.
3. When `trade_mode = unknown`, skip or weaken trade-mode-dependent Sales Mentor hooks:
   - Business Context BC3
   - Blind-Spot classes that require market/country assumptions
   - trade-mode-specific Sales Journey Preview templates
4. After results, lightly prompt for `profile.company.country` so future sessions can classify domestic, cross-border, or mixed work.

Rules:

- Do not invent the user's company country.
- Do not treat "skip confirmation" as unlock/contact/email authorization.
- If the request includes free search plus paid actions, split the flow: run or plan the free search, then ask for the relevant paid confirmation before paid endpoints.
- If only "找客户" or equivalent is provided, ask for product/category and target geography before searching after the PMF Gate path is resolved.

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
  "merchant_offer_anchor": ["brake system components"],
  "merchant_capabilities": ["IATF 16949", "customization", "small-batch delivery"],
  "target_routes": ["channel_route", "trade_category_route"],
  "target_company_should_be": ["auto parts importer", "aftermarket distributor"],
  "target_side_terms": ["auto spare parts", "automotive aftermarket"],
  "target_industry_context": ["commercial vehicle maintenance"],
  "geo_include": ["US", "DE", "GB"],
  "geo_exclude": [],
  "employee_range": "50-500",
  "with_emails_only": true,
  "decision_roles": ["Procurement Manager", "Sourcing Director"],
  "role_usage": "profileEmails_filter",
  "target_count": 30,
  "confidence": 0.85,
  "skipped_areas": ["B"],
  "query_plan_portfolio_built": false,
  "search_tiers_run": []
}
```

The Brief must answer: "Which target companies are most likely to buy, use, distribute, integrate, specify, operate, or procure the merchant's offering?"

Field meanings:

- `merchant_offer_anchor`: what the user sells or provides. This is PMF reasoning context, not an automatic API `productKeywords` source.
- `merchant_capabilities`: certifications, customization, delivery capability, service scope, proof points, and constraints.
- `target_routes`: route types from Section 4, such as channel buyers, installers/integrators, operators, procurement categories, or project-trigger paths.
- `target_side_terms`: terms that describe target-company products, inventory, categories, services, procurement language, or industry positioning.
- `decision_roles`: people to find later; never company-search keywords.

Behavior markers:

- `pmf_brief_built`
- `merchant_offer_anchor_recorded`
- `brief_not_sent_directly_as_single_payload`

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

## 4. Target-Side Query Plan Portfolio

The PMF Brief must not be sent directly as one all-fields API payload. Build a `query_plan_portfolio` in session memory between Brief generation and `POST /api/v1/companies/search-advanced`.

Each plan tests exactly one target route:

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
  "risk": "Some distributors may also be brand owners; deprioritize obvious peer manufacturers when result fields support it."
}
```

Only `api_payload` is sent to `search-advanced`, and it must use only supported fields from `api-reference.md`.

Supported target-route types:

| Target Route Type | What It Searches For |
|-------------------|----------------------|
| `channel_route` | Importers, wholesalers, distributors, dealers, and resale channels. |
| `trade_category_route` | Broader target-side categories such as building hardware, auto aftermarket, industrial supplies, or medical consumables. |
| `installer_integrator_route` | Installers, contractors, engineering firms, or system integrators that source products for projects. |
| `project_trigger_route` | Renovation, maintenance, replacement, expansion, opening, upgrade, or new-build events. |
| `operator_route` | Asset operators with repeated or bulk use cases, such as hotels, apartments, hospitals, factories, fleets, or property managers. |
| `procurement_category_route` | CPV, UNSPSC, HS, NAICS, tender, or local procurement/category language. |
| `not_recommended` | Plausible-looking but weak or risky routes that should not be searched by default. |

Projection rules:

- Merchant offer terms may be projected into `productKeywords` only when they plausibly describe the target company's own products, services, inventory, categories, or procurement language.
- If direct use of the merchant offer term is likely to retrieve competitors, project to target-side category, channel, use-case, project, or procurement terms instead.
- Preserve target geography in every `api_payload` unless the user explicitly asks for geography-free exploration.
- Do not put multiple unrelated target routes into one OR-style payload.
- Decision roles remain contact-discovery context and must not appear in company-search keywords.

Behavior markers:

- `query_plan_portfolio_built`
- `target_side_projection_built`
- `core_query_plan_selected`
- `merchant_offer_terms_not_mechanically_copied`
- `target_geo_preserved`

### Target-Side Query Validator

Before running any plan, validate that it:

- Stores merchant offer anchors in plan metadata.
- Explains why the target company may buy, resell, install, specify, operate, or procure the offering.
- Preserves target geography unless the user asked otherwise.
- Has exactly one `target_route_type`, a `route_path`, `target_side_projection`, and valid `api_payload`.
- Uses only supported `search-advanced` fields.
- Does not use decision-maker roles as company-search keywords.
- Does not conflict with confirmed Merchant Profile constraints.
- Avoids broad generic targets such as hotels, real estate companies, repair companies, or property managers unless procurement, installation, renovation, maintenance, upgrade, replacement, or similar route triggers are included.
- Flags competitor risk when terms may retrieve peer manufacturers, factories, brands, or direct suppliers.

Invalid plans must be rewritten, downgraded to `not_recommended`, or shown for user confirmation without search.

Behavior markers:

- `target_side_query_validator_passed`
- `target_side_query_validator_rejected_generic_target`

### Brief to API Mapping

Map only `target_side_projection` into `api_payload`:

| Plan Field | API Field | Rule |
|------------|-----------|------|
| `target_side_projection.product_terms` | `productKeywords` | Target-company category/inventory/service terms only. |
| `target_side_projection.company_type_terms` | `companyTypeKeywords` | Route-specific target company types only. |
| `target_side_projection.industry_terms` | `industryKeywords` | Target industry/application/procurement context only. |
| plan geography | `includeCountry` / `excludeCountry` | ISO alpha-2 codes. |
| route strictness | `crossFieldOperator` | Default `"and"`; do not switch to global `"or"` as recovery. |
| `with_emails_only` | `withEmails` | Boolean, optional. |
| `employee_range` | none | Filter locally from result `employees_count`. |
| `decision_roles` | none | Use later in `profileEmails.keyword` or `contacts/search.title`. |
| `target_count` | none | Controls pagination and Expansion thresholds. |

Do not invent API parameters beyond `api-reference.md`.

### Company Search Pagination

`POST /api/v1/companies/search-advanced` is free, but its page `size` must never exceed 50. Never send `size: 100` or any value above 50.

When `target_count > 50`, satisfy the company-count target with free pagination:

1. Call `search-advanced` with `size: 50` and `from: 0`.
2. If more companies are needed and the API has more rows, call the next page with `size: 50` and `from: 50`.
3. Continue with `from` increased by 50 until effective results reach `target_count`, the API has no more rows, local scan limits apply, or the user stops the search.

Do not call `/contacts/search` or `/companies/unlock` to satisfy company-count targets. Those endpoints are for contact/person discovery or user-selected company details after the free company search phase.

### Local-Only Filter Pagination

When `employee_range` or another unsupported field must be filtered locally, do not decide recall quality from the first page or raw API `total`.

Procedure:

1. Start from the free company-search pagination procedure above.
2. Filter returned rows locally, producing `filtered_results`.
3. If `filtered_results.length < target_count` and the API has more rows, scan more pages until one limit is reached:
   - `filtered_results.length >= target_count`
   - 150 raw rows scanned
   - user requested a smaller scan
4. Use `filtered_results.length`, not raw `total`, to trigger Target-Side Recovery, Target Route Expansion, or Lite target-route suggestions.
5. Tell the user how many raw rows were scanned and how many matched the local filter.

If the user asks to scan beyond these bounds, confirm before continuing to avoid uncontrolled loops.

### Decision-Role Separation

Never place `decision_roles` values such as "Procurement Manager" into `productKeywords`, `industryKeywords`, or `companyTypeKeywords`. Roles describe people, not companies. They are only used after company discovery for `profileEmails.keyword` or `contacts/search.title`.

## 4.1. Country Code Table

Use ISO 3166-1 alpha-2 codes for `includeCountry`, `excludeCountry`, Profile `company.country`, and `target_baseline.regions_primary`.

| ISO | Chinese | English aliases |
|-----|---------|-----------------|
| US | 美国 | USA, United States, America |
| CA | 加拿大 | Canada |
| MX | 墨西哥 | Mexico |
| BR | 巴西 | Brazil, Brasil |
| AR | 阿根廷 | Argentina |
| CL | 智利 | Chile |
| CO | 哥伦比亚 | Colombia |
| PE | 秘鲁 | Peru |
| GB | 英国 | UK, United Kingdom, Britain, Great Britain |
| DE | 德国 | Germany, Deutschland |
| FR | 法国 | France |
| IT | 意大利 | Italy, Italia |
| ES | 西班牙 | Spain, España |
| NL | 荷兰 | Netherlands, Holland |
| BE | 比利时 | Belgium |
| CH | 瑞士 | Switzerland |
| AT | 奥地利 | Austria |
| SE | 瑞典 | Sweden |
| NO | 挪威 | Norway |
| DK | 丹麦 | Denmark |
| FI | 芬兰 | Finland |
| IE | 爱尔兰 | Ireland |
| PL | 波兰 | Poland |
| PT | 葡萄牙 | Portugal |
| GR | 希腊 | Greece |
| CZ | 捷克 | Czech, Czech Republic, Czechia |
| RU | 俄罗斯 | Russia |
| UA | 乌克兰 | Ukraine |
| TR | 土耳其 | Turkey, Türkiye |
| JP | 日本 | Japan |
| KR | 韩国 | South Korea, Korea, ROK |
| KP | 朝鲜 | North Korea, DPRK |
| CN | 中国 | China, PRC, Mainland China |
| HK | 香港 | Hong Kong |
| TW | 台湾 | Taiwan |
| MO | 澳门 | Macau, Macao |
| SG | 新加坡 | Singapore |
| MY | 马来西亚 | Malaysia |
| TH | 泰国 | Thailand |
| VN | 越南 | Vietnam |
| ID | 印度尼西亚 | Indonesia |
| PH | 菲律宾 | Philippines |
| IN | 印度 | India |
| BD | 孟加拉国 | Bangladesh |
| PK | 巴基斯坦 | Pakistan |
| AE | 阿联酋 | UAE, United Arab Emirates |
| SA | 沙特阿拉伯 | Saudi Arabia, KSA |
| QA | 卡塔尔 | Qatar |
| IL | 以色列 | Israel |
| AU | 澳大利亚 | Australia |
| NZ | 新西兰 | New Zealand |
| ZA | 南非 | South Africa |
| EG | 埃及 | Egypt |
| NG | 尼日利亚 | Nigeria |
| MA | 摩洛哥 | Morocco |

Easy-mistake whitelist:

- United Kingdom is `GB`, not `UK`.
- South Korea is `KR`; North Korea is `KP`.
- Mainland China is `CN`; Hong Kong, Taiwan, and Macau are distinct ISO entries: `HK`, `TW`, `MO`.
- Switzerland is `CH`; Sweden is `SE`.
- Czechia is `CZ`, not `CR`.
- United Arab Emirates is `AE`, not `UAE`.

Fallback rules:

1. For countries outside the table, normalize to ISO 3166-1 alpha-2 if known.
2. If uncertain, ask the user for confirmation instead of guessing.
3. If spelling is likely wrong but intent is clear, normalize and mention the assumption briefly.

## 5.0. Pre-Search Statement and Confirmation Tiers

Before calling `search-advanced`, derive `trade_mode`, build and validate the query plan portfolio, then route through one of three confirmation tiers. Strict mode and explicit post-gate skip may change the tier, but Hard Guardrails still apply.

Trade mode labels:

| Value | Label | Rule |
|-------|-------|------|
| `domestic` | 本地市场开发 / domestic market | Profile country and target markets match. |
| `cross_border` | 跨境市场开发 / cross-border market | Target markets exclude Profile country. |
| `mixed` | 本地 + 跨境混合 / mixed market | Target markets include Profile country plus others. |
| `unknown` | 场景未完整识别 / unknown | Profile country is missing or ambiguous. |

### Tier 1: Efficiency Mode

Use when confirmed/imported profile completeness is high enough and a validated target-side core plan can be constructed, or when the user explicitly skipped the PMF Gate and rough free search can be constructed.

Do not wait for confirmation before free `search-advanced`, but show a short Pre-Search Statement:

```text
本次场景识别为 [trade_mode label]（公司所在国：[profile.company.country or unknown]，目标市场：[brief.geo_include]）。
我将按 [target route / target-side product-category terms / company type / industry / geography / target_count] 搜索。首次公司搜索免费；如后续需要解锁或找联系人，我会再单独确认。
```

If `trade_mode = unknown`, continue only for post-gate rough free search and skip trade-mode-dependent mentor hooks.

### Tier 2: Standard Confirmation

Use when `0.3 <= completeness <= 0.7`, or when the user asks for strict confirmation.

Show the Brief Confirmation Template and wait for explicit confirmation before `search-advanced`:

```text
本次场景识别为 [trade_mode label]。

我已经整理出您的潜客画像 brief：
- 公司类型：[company_type]
- 商家产品/服务锚点：[merchant_offer_anchor]（仅用于 PMF 推理，不会机械复制到 API）
- 目标侧行业/品类：[target_side_terms or 不限]
- 地区：[geo_include]
- 排除地区：[geo_exclude or无]
- 规模：[employee_range or不限]
- 是否要求邮箱：[with_emails_only]
- 决策角色：[decision_roles or未指定]
- 目标数量：[target_count] 家
- 搜索路线：[target_route_type]
- 目标侧关键词：[target_side_projection summary]

我将基于此调用公司搜索（首次搜索免费）。是否确认？
```

If the user changes the Brief, rebuild the Brief and derive `trade_mode` again.

### Tier 3: First-Use Mode

Use when `completeness < 0.3` or required PMF fields are missing and the user has not explicitly skipped after the PMF Gate prompt.

Run the PMF Gate first. If the user provides a website/product page or one-sentence description, confirm and save the profile before route planning. If they prefer guided setup, Lite Onboarding from `merchant-profile-playbook.md` may collect the same core fields. After profile confirmation, route to Tier 2 so the user sees the first real Brief and target-side query plan.

### Overrides

- Strict override: "这次帮我严格确认" / "strict mode" forces Tier 2.
- PMF skip override: after the PMF Gate prompt, "跳过" / "rough search" may force Tier 1 rough free search when enough search parameters exist.
- PMF skip override cannot authorize paid unlock, paid contact search, or email sending.
- If rough-search parameters are insufficient, ask only for product/category and target geography.

## 5. Brief Confirmation Template Contract

The Tier 2 template must include:

- `trade_mode` label.
- Search dimensions that will map to API parameters.
- Target route and target-side projection summary.
- Unsupported/local-only dimensions such as `employee_range`.
- `target_count` and the fact that Expansion may run when filtered results are below target.
- A clear yes/no or edit prompt.

The template must not claim that a paid action will happen. Company search is free. Unlock, contact search, and email sending have separate confirmations.

## 6. Result Classification and Viewed Lifecycle

After `search-advanced` returns and any local-only filtering is complete, classify companies before display using the viewed-state helper planned for Phase 2. The model must not manually reimplement persisted deduplication logic when the helper exists.

State file contract:

- Path: `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/viewed.json`
- Version: `1.1`
- File mode: `0600`
- Entry lifecycle: `status: "viewed"` by default, `status: "unlocked"` only after successful `/companies/unlock`
- `unlocked_at` is set when unlock succeeds

Display groups:

1. `unlocked`: companies with `status = "unlocked"` and `unlocked_at` within the active window. Display as already unlocked and free to revisit.
2. `seen`: companies with `status = "viewed"` and `shown_at` within the active window. Display as previously seen.
3. `new`: companies not present in viewed state within the active window.

Default window is 30 days, matching the OKKI Go company unlock deduplication window. Future helper commands may support 7, 30, or 90 days, reset, and "show seen" behavior, but Discovery should only consume the classification output.

Write timing:

- Before display: classify results into `unlocked`, `seen`, and `new`.
- After display: mark displayed domains as shown.
- After a successful unlock: mark that domain as unlocked with `unlocked_at = now`.

Expansion decisions happen before final display but after effective result counts are known. If Expansion triggers another search, classify the final merged result set again before display.
