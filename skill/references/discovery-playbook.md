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
4. Use `filtered_results.length`, not raw `total`, to trigger Broadening Ladder, Full Expansion, or Lite Expansion.
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

Before calling `search-advanced`, derive `trade_mode` and route through one of three confirmation tiers. Strict mode and direct-search override may change the tier, but Hard Guardrails still apply.

Trade mode labels:

| Value | Label | Rule |
|-------|-------|------|
| `domestic` | 本地市场开发 / domestic market | Profile country and target markets match. |
| `cross_border` | 跨境市场开发 / cross-border market | Target markets exclude Profile country. |
| `mixed` | 本地 + 跨境混合 / mixed market | Target markets include Profile country plus others. |
| `unknown` | 场景未完整识别 / unknown | Profile country is missing or ambiguous. |

### Tier 1: Efficiency Mode

Use when `completeness > 0.7` or the user explicitly says "直接搜" / "skip confirmation" and a free search can be constructed.

Do not wait for confirmation before free `search-advanced`, but show a short Pre-Search Statement:

```text
本次场景识别为 [trade_mode label]（公司所在国：[profile.company.country or unknown]，目标市场：[brief.geo_include]）。
我将按 [product/company type/industry/geography/scale/target_count] 搜索。首次公司搜索免费；如后续需要解锁或找联系人，我会再单独确认。
```

If `trade_mode = unknown`, continue only for free search and skip trade-mode-dependent mentor hooks.

### Tier 2: Standard Confirmation

Use when `0.3 <= completeness <= 0.7`, or when the user asks for strict confirmation.

Show the Brief Confirmation Template and wait for explicit confirmation before `search-advanced`:

```text
本次场景识别为 [trade_mode label]。

我已经整理出您的潜客画像 brief：
- 公司类型：[company_type]
- 产品关键词：[product_anchor]
- 行业：[industry or不限]
- 地区：[geo_include]
- 排除地区：[geo_exclude or无]
- 规模：[employee_range or不限]
- 是否要求邮箱：[with_emails_only]
- 决策角色：[decision_roles or未指定]
- 目标数量：[target_count] 家

我将基于此调用公司搜索（首次搜索免费）。是否确认？
```

If the user changes the Brief, rebuild the Brief and derive `trade_mode` again.

### Tier 3: First-Use Mode

Use when `completeness < 0.3` and the user did not explicitly request direct free search.

Run Lite Onboarding from `merchant-profile-playbook.md` first. It must include L0 company country. After onboarding, route to Tier 2 so the user sees and confirms the first real Brief.

### Overrides

- Strict override: "这次帮我严格确认" / "strict mode" forces Tier 2.
- Direct-search override: "直接搜" / "skip confirmation" may force Tier 1 for free search, even when completeness is low, as long as enough search parameters exist.
- Direct-search override cannot authorize paid unlock, paid contact search, or email sending.
- If direct-search parameters are insufficient, ask only for product/category and target geography.

## 5. Brief Confirmation Template Contract

The Tier 2 template must include:

- `trade_mode` label.
- Search dimensions that will map to API parameters.
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
