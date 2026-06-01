# OKKI Go PMF Quick Profile Gate Design

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

## Goals

- Make prospect discovery optimize for PMF fit, not only keyword matching.
- Prefer a company website or product page as the fastest source of merchant
  profile context.
- Require user confirmation before website-extracted data is saved or used as
  confirmed long-term profile data.
- Preserve a clear skip path for users who insist on rough direct search.
- Re-ask for a website or product page in future prospecting tasks when the
  Merchant Profile remains insufficient; a skip is not a permanent preference.
- Keep all paid-action, contact-search, and email-send confirmations unchanged.

## Non-Goals

- Do not add a visual UI page or web form. Confirmation happens in the agent
  conversation as a structured message.
- Do not require every user to have a website.
- Do not block free company search forever when the user explicitly skips.
- Do not use unconfirmed website extraction as a long-term default.
- Do not change OKKI Go API schemas unless implementation later discovers a
  required backend capability.

## Recommended Approach

Implement **PMF Quick Profile Gate**.

When a new or under-profiled user starts company/customer discovery, the agent
first asks for a company website or product page. If the user provides one, the
agent extracts a provisional Merchant Profile, shows it in a conversational
confirmation message, waits for confirmation or edits, saves confirmed data to
the local Merchant Profile, builds a PMF-aware search brief, and only then runs
free company search.

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
- Preferred target types: auto parts importers, distributors, aftermarket
  channels, repair-chain suppliers, commercial vehicle maintenance suppliers.
- Product keywords: brake parts, brake system, auto spare parts.
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

### 7. Free Search

After the PMF brief is confirmed or sufficiently clear under the existing tier
rules, the agent calls the free company search endpoint. Result display should
include concise "why this may fit you" reasoning where result fields and profile
fields support it.

### 8. Explicit Skip Path

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
