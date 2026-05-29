# OKKI Go 潜客发现 Harness 设计文档

版本：0.1  
日期：2026-05-27  
状态：讨论稿  
范围：优化 OKKI Go Skill 中的「潜客发现」阶段，即搜公司与找联系人；发邮件、EDM 发送、邮件状态查询流程维持现状。

## 1. 背景

当前 OKKI Go Skill 已经定义了基础工作流、API 调用方式、计费确认、安全规则和输出格式。但在实际使用中，不同 Agent 或不同底层 LLM 模型对用户指令的理解能力不同，导致同一类潜客开发任务的执行结果随机性较大。

典型问题包括：

- 用户只说「帮我找客户」时，有的模型会直接搜索，有的模型会追问，有的模型会生成过宽或过窄的查询条件。
- 用户表达了目标市场和产品后，模型不一定能稳定映射到 `search-advanced` 的参数。
- 模型可能把单次开发任务中的临时信息和用户长期经营画像混在一起。
- 潜客画像越具体，搜索越精准，但也可能限制结果数量和强模型的发散能力。
- 如果用户经营画像、潜客目标和底层企业数据库都变化不大，每次搜索都返回相似候选，会造成使用疲劳和流失。

本设计提出一个面向「潜客发现」的规范化 Harness：通过结构化画像、信息度阈值、受控提问、Search Plan、Opportunity Expansion、历史去重和用户经营画像持久化，降低模型能力差异，同时保留强模型在行业图谱、供应链和应用场景上的发散空间。

## 2. 目标

本设计要解决以下问题：

1. 将模糊用户意图稳定转换为高质量 `POST /api/v1/companies/search-advanced` 参数。
2. 在信息不足时，通过少量高价值问题补齐关键搜索条件。
3. 当用户输入足够精准，或明确说「直接搜」时，允许跳过提问。
4. 将「用户经营画像」与「本次潜客 Brief」分离，减少重复提问。
5. 支持围绕核心 ICP 的受控发散，发现更多潜在客户类型。
6. 避免用户重复看到高度相似的搜索结果。
7. 不改变发邮件流程、不绕过现有付费确认和发送确认规则。
8. 为后续 Skill 文档、reference、脚本和 eval 场景提供落地依据。

## 3. 非目标

本设计第一阶段不做：

- 不重构 OKKI Go API。
- 不改变开发信生成和发送流程。
- 不自动发送邮件。
- 不绕过公司解锁、联系人搜索、EDM 发送等现有计费确认。
- 不要求每次潜客 Brief 都持久化保存。
- 不默认静默保存用户经营画像。
- 不把用户的单次搜索偏好误保存为长期画像。
- 不追求让 Skill 变成完整 CRM 或销售管理系统。

## 4. 核心设计结论

推荐将 OKKI Go 潜客发现流程升级为：

```text
加载用户经营画像
→ 抽取本次 Prospect Brief
→ 判断信息度是否达标
→ 必要时进行结构化提问
→ 生成 Core Search Plan
→ 生成 Opportunity Expansion Plans
→ 结合历史记录去重和策略轮换
→ 调用免费公司搜索
→ 按核心匹配、扩展机会、新候选分组展示
→ 用户选择公司后再进入解锁与联系人获取流程
```

核心原则是：

- **先稳定，再发散**：先生成核心查询，再生成扩展查询。
- **先免费，再付费确认**：公司搜索可主动执行；解锁公司、联系人搜索等付费动作仍需确认。
- **先结构化，再行动**：用 Prospect Brief 和 Search Plan 限制模型自由发挥。
- **默认高效，必要提问**：信息足够或用户明确要求直接搜时，不强制问问题。
- **画像长期保存，Brief 短期使用**：用户经营画像可持久化，本次潜客 Brief 默认不保存。

## 5. 关键概念

### 5.1 用户经营画像 User Business Profile

用户经营画像是长期稳定、跨多次潜客发现任务可复用的信息。它描述用户是谁、卖什么、优势是什么、适合开发什么类型客户。

用户经营画像可被潜客发现和后续触达环节复用。

### 5.2 本次潜客 Brief Prospect Brief

Prospect Brief 是单次潜客开发任务的结构化目标。它来自用户本轮输入、用户经营画像和必要澄清问题。

Prospect Brief 默认不持久化。它只用于本轮搜索、联系人筛选和结果解释。

### 5.3 Search Plan

Search Plan 是可以直接映射到 `search-advanced` 的参数计划。它应尽量确定、可解释、可复核。

### 5.4 Opportunity Expansion

Opportunity Expansion 是围绕核心 ICP 的受控发散。它可以基于行业图谱、供应链上下游、应用场景、渠道类型和相邻品类生成额外搜索方向。

扩展搜索不应污染核心 ICP，也不应自动触发付费动作。

### 5.5 信息度阈值

信息度阈值用于决定是否直接搜索，还是先提问。它不是为了追求完整画像，而是为了避免低质量查询。

## 6. 用户经营画像设计

### 6.1 应持久化的信息

应持久化的是长期稳定、可复用、能影响潜客搜索和触达的信息。

#### 6.1.1 基础经营信息

```json
{
  "company_name": "",
  "website": "",
  "country_or_region": "",
  "business_type": "manufacturer / trading company / SaaS / service provider",
  "company_size": "",
  "languages": ["zh-CN", "en"]
}
```

用途：

- 理解用户所处国家和经营背景。
- 辅助判断目标市场、贸易路径和触达语言。
- 未来可用于开发信署名、公司介绍和可信度表达。

#### 6.1.2 销售产品或服务

```json
{
  "main_offers": [
    {
      "name": "auto parts",
      "category": "automotive aftermarket",
      "keywords": ["brake pads", "filters"],
      "use_cases": ["replacement", "repair", "fleet maintenance"],
      "price_positioning": "budget / mid-market / premium",
      "certifications": ["ISO", "CE"],
      "moq_or_capacity": ""
    }
  ]
}
```

用途：

- 减少重复询问「你卖什么」。
- 支持从产品推导行业、应用场景和可能客户类型。
- 支持 Opportunity Expansion，例如从产品推导下游应用方、渠道伙伴和相邻品类客户。

#### 6.1.3 优势与差异化

```json
{
  "value_props": [
    "fast delivery",
    "OEM customization",
    "factory-direct pricing"
  ],
  "proof_points": [
    "10 years export experience",
    "served EU distributors"
  ],
  "competitive_edges": [],
  "constraints": []
}
```

用途：

- 支持后续触达文案，不让邮件空泛。
- 支持筛选更合适的客户。例如有 OEM 能力时，可以扩展到品牌商；有快速交付优势时，可以扩展到售后市场和维修渠道。

#### 6.1.4 已有客户与理想客户

```json
{
  "current_customer_types": ["importers", "distributors"],
  "best_fit_customer_types": ["regional distributors", "aftermarket wholesalers"],
  "bad_fit_customer_types": ["end consumers", "very small retailers"],
  "successful_regions": ["DE", "FR"],
  "target_regions": ["EU", "US"]
}
```

用途：

- 作为用户画像和潜客画像之间的桥梁。
- 支持默认推断目标客户类型。
- 支持排除不适合客户。

#### 6.1.5 销售偏好

```json
{
  "preferred_contact_roles": ["procurement", "owner", "category manager"],
  "preferred_company_size": "10-200 employees",
  "search_style": "balanced / precise / exploratory",
  "default_result_size": 10,
  "credit_budget_preference": "ask_every_time / max_3_per_session"
}
```

用途：

- 减少重复询问「找谁」「要精准还是广泛」。
- 控制默认搜索风格。
- 控制付费操作前的预算提示。

#### 6.1.6 触达素材偏好

```json
{
  "outreach_tone": "professional / concise / consultative",
  "default_cta": "ask for distributor interest",
  "sender_identity": "",
  "forbidden_claims": [],
  "compliance_notes": []
}
```

用途：

- 未来支持触达环节。
- 当前阶段只作为可复用画像，不改变发邮件流程。

### 6.2 不应持久化的信息

默认不保存：

- 单次 campaign 的临时地区。
- 本轮搜索关键词试验。
- 未经用户确认的强推断。
- 用户临时说的「这次先找美国」。
- 搜索结果中的公司列表，除非作为独立的 seen/saved/dismissed 历史记录。
- 敏感商业信息，除非用户明确要求保存。

### 6.3 用户画像的数据来源

建议记录字段来源：

```json
{
  "value": "auto parts",
  "source": "user_confirmed",
  "updated_at": "2026-05-27"
}
```

推荐来源类型：

- `user_confirmed`：用户明确确认保存。
- `user_provided`：用户明确陈述，但尚未确认保存。
- `agent_inferred`：模型从上下文推断，不能直接保存。
- `imported`：从用户配置、CRM 或其他系统导入。

持久化应优先保存 `user_confirmed` 信息。

## 7. 「了解用户」环节设计

### 7.1 触发原则

「了解用户」不应做成首次使用时的强制完整 onboarding。完整 onboarding 会增加首次使用阻力。

推荐采用渐进式画像采集：

- 缺什么问什么。
- 每次最多补 1 到 2 个关键画像字段。
- 能先搜一轮就先搜一轮。
- 搜索完成后再建议补全长期画像。

### 7.2 触发时机

#### A. 首次潜客发现前轻量触发

当 Skill 发现没有用户经营画像，而用户发起潜客发现任务时，先问一个核心问题：

> 为了帮你找得更准，我先了解一下：你主要销售的产品或服务是什么？如果想直接搜，也可以说「直接搜」。

该问题只补齐最关键的 `main_offers`。用户回答后，应尽快进入搜索流程，不应继续连环提问。

#### B. 缺失信息影响 Search Plan 时触发

如果用户输入和已有画像不足以生成有效 `search-advanced` 参数，则触发澄清。

示例：

用户说：

> 帮我找美国客户

如果用户经营画像中已有 `main_offers`，可以复用产品信息，只追问目标客户类型或直接使用默认客户类型。

如果没有 `main_offers`，应问：

> 你希望为哪类产品或服务找美国客户？

#### C. 结果后触发画像补全

搜索完成后，如果用户继续操作、保存结果或表现出明确方向，可以建议保存画像：

> 我可以记住你主要做汽车零部件出口。以后找客户时默认按这个方向理解，可以吗？

### 7.3 保存触发方式

#### 显式保存

用户说「记住」「以后默认」「我们主要做...」时，可以准备保存，但保存前仍应复述确认：

> 我理解你们主要销售 X，目标客户偏 Y。是否保存为你的 OKKI Go 经营画像，供以后潜客发现使用？

#### 建议保存

模型从对话中推断出稳定画像时，只能建议保存，不能静默保存。

示例：

> 我理解你们主要销售 X，常见目标客户是 Y。是否保存为你的 OKKI Go 经营画像？

### 7.4 保存确认规则

持久化用户经营画像应满足：

- 用户知道将保存什么。
- 用户知道保存后用于后续 OKKI Go 潜客发现。
- 用户可以拒绝保存。
- 模型不能保存未经确认的推断。
- 保存内容应尽量短，不保存完整对话。

## 8. Prospect Brief 设计

### 8.1 Brief 字段

```json
{
  "target_company_type": "importer / distributor / manufacturer / brand / retailer",
  "target_product_or_category": "目标公司经营、采购或使用的产品",
  "target_industry_or_application": "行业或应用场景",
  "target_region": "国家或区域",
  "contact_persona": "采购 / 老板 / 销售 / 工程等，仅找联系人时需要",
  "must_have": ["有邮箱", "特定规模"],
  "exclusions": [],
  "direct_search": false,
  "search_style": "balanced / precise / exploratory"
}
```

### 8.2 Brief 来源优先级

1. 用户本轮明确输入。
2. 用户经营画像中的稳定信息。
3. 结构化澄清问题。
4. 模型推断。

模型推断的信息可以用于生成 Search Plan，但在展示时应标注为推断，且不能持久化保存。

### 8.3 Brief 是否展示给用户

推荐使用效率模式：

- 信息足够时，不要求用户逐项确认 Brief。
- 执行搜索前或结果前简短说明「我会按以下方向搜索」。
- 信息不足时，先问 1 到 2 个关键问题。
- 用户明确要求严格确认时，再展示完整 Brief 并等待确认。

## 9. 信息度阈值与跳过提问

### 9.1 公司搜索信息度

公司搜索建议阈值：`>= 6/10`。

至少满足：

- 有地区，或用户明确不限制地区。
- 有产品、品类、行业、应用场景之一。
- 有目标公司类型，或可从语义和用户画像中合理推断。

### 9.2 找联系人信息度

找联系人建议阈值：`>= 7/10`。

额外要求：

- 有公司范围，或有足够明确的公司搜索条件。
- 有联系人角色、职位方向或可从用户画像推断的默认联系人角色。

### 9.3 允许跳过提问的情况

以下情况可以跳过提问：

- 用户输入已达到信息度阈值。
- 用户明确说「直接搜」「先搜看看」「不要问了」。
- 已有用户经营画像足以补齐缺失信息。

跳过提问时仍应展示简短 Search Plan：

> 我将按德国、汽车零部件、进口商/分销商、有邮箱公司直接搜索。

### 9.4 不能被跳过的规则

「直接搜」只能跳过潜客发现提问，不能跳过：

- 公司解锁确认。
- 联系人搜索首次计费确认。
- 邮件发送确认。
- API Key 配置和认证流程。
- 法务确认流程。

## 10. 结构化提问策略

### 10.1 提问原则

- 不一次问很多问题。
- 优先问最影响 `search-advanced` 参数的问题。
- 默认最多问 1 到 3 个问题后先搜一轮。
- 尽量提供选项，降低用户回答成本。
- 用户说「直接搜」时停止追问。

### 10.2 缺口优先级

1. 目标地区  
   > 你想优先开发哪个国家或区域？

2. 目标公司类型  
   > 你更想找进口商、分销商、品牌商、制造商，还是零售商？

3. 产品或行业  
   > 目标客户通常经营或采购什么产品？

4. 联系人角色  
   仅当用户要找联系人时问：  
   > 你想找采购负责人、老板、销售负责人，还是其他职位？

5. 精准度偏好  
   > 要更精准但数量少，还是先宽一点多看候选？

### 10.3 默认搜索风格

推荐默认使用 `balanced`：

- 先执行 1 个核心搜索。
- 如果核心结果少或重复度高，再执行 1 到 2 个扩展搜索。
- 不默认进入过度发散。

## 11. Search Plan 设计

### 11.1 参数映射目标

Search Plan 应稳定映射到：

```json
{
  "companyTypeKeywords": [],
  "productKeywords": [],
  "industryKeywords": [],
  "includeCountry": [],
  "excludeCountry": [],
  "withEmails": true,
  "crossFieldOperator": "and",
  "from": 0,
  "size": 10
}
```

### 11.2 映射规则

推荐规则：

- `target_company_type` 映射到 `companyTypeKeywords`。
- `target_product_or_category` 映射到 `productKeywords`。
- `target_industry_or_application` 映射到 `industryKeywords`。
- `target_region` 映射到 `includeCountry`。
- 排除国家映射到 `excludeCountry`。
- 无法由 API 表达的排除条件保留为结果后处理规则。
- `withEmails` 默认 `true`。
- 信息明确时使用 `crossFieldOperator: "and"`。
- 用户要求广泛探索，或信息较少但明确要求直接搜时，可使用 `crossFieldOperator: "or"`。

### 11.3 不应做的映射

- 用户明确说「进口商」时，不应自动混入过多其他公司类型。
- 不应把核心搜索和扩展搜索混成一个大关键词数组。
- 不应把联系人角色塞进公司搜索参数，除非它本身也是公司画像的一部分。
- 不应为了结果多而删除用户明确给出的关键约束。

## 12. Opportunity Expansion 设计

### 12.1 设计目标

潜客画像越具体，核心搜索越精准，但搜索结果可能有限。为避免过度收窄，需要给模型一个受控发散框架。

Opportunity Expansion 的目标是：

- 保留强模型的行业理解能力。
- 让发散方向可解释、可复核。
- 避免弱模型自由联想导致结果漂移。
- 在核心搜索结果少或重复时提供新的潜客方向。

### 12.2 扩展类型

可支持以下扩展方向：

1. **供应链下游扩展**  
   找使用、采购、集成该产品的下游客户。

2. **供应链上游或配套扩展**  
   找可能需要配套采购或组合销售的企业。

3. **渠道类型扩展**  
   从进口商扩展到分销商、批发商、区域代理、经销网络。

4. **应用场景扩展**  
   从产品名扩展到使用场景，例如维修、替换、工程安装、车队维护。

5. **相邻品类扩展**  
   找采购相似、替代或互补产品的公司。

6. **地理贸易扩展**  
   从目标国家扩展到贸易枢纽或相邻市场。

### 12.3 扩展假设格式

每个扩展方向都应结构化表达：

```json
{
  "label": "售后市场扩展",
  "type": "application_expansion",
  "hypothesis": "汽车维修和售后服务商也可能采购替换零部件",
  "why_it_may_work": "这些公司有持续消耗型采购需求",
  "search_plan": {
    "companyTypeKeywords": ["repair service", "parts distributor"],
    "industryKeywords": ["automotive aftermarket"],
    "includeCountry": ["DE"],
    "withEmails": true,
    "crossFieldOperator": "and",
    "size": 10
  }
}
```

### 12.4 执行模式

推荐三种模式：

#### 精准模式 precise

- 只执行 Core Search。
- 适合用户说「只要精准客户」「不要扩展」。

#### 均衡模式 balanced

- 默认模式。
- 执行 1 个 Core Search。
- 视情况执行 1 到 2 个最可信扩展搜索。

#### 探索模式 exploratory

- 执行 Core Search 和多个扩展方向。
- 适合用户说「帮我打开思路」「找更多可能客户」。

### 12.5 扩展护栏

- 每个扩展方向必须说明为什么可能是潜客。
- 默认最多生成 3 个扩展方向。
- 默认最多执行 1 到 2 个扩展搜索。
- 扩展搜索只用于免费公司搜索。
- 不自动触发解锁、联系人付费搜索或邮件发送。
- 用户明确要求精准时，禁用扩展。
- 核心搜索结果太少时，优先建议扩展，而不是直接扩大原查询。

## 13. 联系人发现设计

### 13.1 联系人需求不应污染公司搜索

当用户说「找德国汽车零部件进口商里的采购负责人」时：

- 公司搜索仍应先按德国、汽车零部件、进口商搜索。
- 「采购负责人」应作为后续联系人筛选条件。
- 不应直接跳到跨公司联系人搜索，除非用户明确要求并确认费用。

### 13.2 联系人筛选结构

```json
{
  "company_search_plan": {
    "companyTypeKeywords": ["importer"],
    "productKeywords": ["auto parts"],
    "includeCountry": ["DE"],
    "withEmails": true,
    "crossFieldOperator": "and"
  },
  "contact_filter": {
    "titles": ["procurement manager", "purchasing", "sourcing"],
    "seniority": ["manager", "director", "owner"],
    "require_email": true
  }
}
```

### 13.3 推荐执行路径

```text
免费搜公司
→ 展示候选公司
→ 用户选择公司
→ 确认解锁
→ 获取公司联系人
→ 按 contact_filter 筛选
→ 展示联系人
```

如果用户明确要求跨公司搜索联系人，则应使用现有联系人搜索流程，并遵守首次计费确认。

## 14. 搜索结果重复问题

### 14.1 问题定义

如果用户经营画像不变、潜客开发要求不变、企业数据库变化也不大，那么每次搜索可能返回相似结果。这会让用户觉得 Skill 没有持续价值。

解决这个问题不能只靠 prompt，需要从搜索策略、结果体验、历史记忆和 API 能力四层处理。

### 14.2 策略轮换

同一用户画像和同一目标，不应每次只跑同一组参数。

可以轮换以下策略：

- 核心 ICP。
- 渠道扩展。
- 应用场景扩展。
- 供应链上下游扩展。
- 相邻品类扩展。
- 地理扩展。

下一次用户发起相似搜索时，可以默认说：

> 我会避开上次已展示的公司，并从渠道扩展和应用场景两个方向找新的候选。

### 14.3 历史状态

建议记录：

```json
{
  "seen_company_ids": [],
  "saved_company_ids": [],
  "dismissed_company_ids": [],
  "unlocked_company_ids": [],
  "last_search_plans": []
}
```

使用方式：

- 已保存公司作为「历史收藏」展示，不再当作新结果。
- 已看过但未处理公司降权。
- 已明确排除公司不再展示。
- 已解锁公司可作为后续联系人跟进入口。
- 未展示过或新出现公司优先展示。

### 14.4 新机会发现

重复搜索时，不应简单再次展示同一列表。推荐结果分组：

- 新候选。
- 核心匹配。
- 扩展机会。
- 上次未处理但仍高匹配。
- 需要放宽条件才有的机会。

### 14.5 Broadening Ladder

当核心搜索结果少或重复度高时，按固定顺序放宽：

1. 保留地区，扩展公司类型。
2. 保留产品，扩展行业应用。
3. 保留客户类型，扩展相邻国家。
4. 从 `crossFieldOperator: "and"` 放宽到 `"or"`。
5. 关闭部分非必要条件，但保留 `withEmails`。

放宽条件时应说明：

> 核心画像结果较少，我保留地区和产品，先把公司类型从进口商扩展到分销商和批发商。

### 14.6 主题批次

同一目标可以拆成主题批次，制造持续探索感：

- 第 1 批：进口商/分销商。
- 第 2 批：售后市场批发商。
- 第 3 批：维修连锁/车队维护。
- 第 4 批：商用车/摩托车相邻市场。
- 第 5 批：相邻国家或贸易枢纽。

### 14.7 API 层长期建议

Skill 层可以先做轻量去重和策略轮换，但长期建议 API 支持：

- `excludeCompanyIds`
- `sortBy: relevance | freshness | unseen`
- `strategyLabel`
- `searchSessionId`
- `companyFingerprint`
- `lastSeenAt`
- `similarCompanies`
- `newSince`

这些能力能让跨设备、跨 Agent、跨会话的新机会发现更稳定。

## 15. 输出体验

### 15.1 搜索前说明

信息足够或用户要求直接搜时，可简短说明：

> 我将按德国、汽车零部件、进口商/分销商、有邮箱公司搜索；如果结果较少，会补充 1 个售后市场扩展方向。

### 15.2 结果分组

推荐输出分组：

```text
核心匹配
- 严格符合用户画像的公司

扩展机会
- 基于供应链、应用场景或渠道扩展发现的公司

新候选
- 相比上次搜索未展示过的公司
```

### 15.3 每家公司展示字段

建议表格包含：

- 公司名。
- 国家。
- 行业或主营。
- 匹配理由。
- 来源策略：核心画像 / 渠道扩展 / 应用场景扩展。
- Fit：High / Medium / Low。

仍应遵守现有规则：不要向用户展示内部 `domain` 字段。

## 16. Skill 落地建议

### 16.1 文件结构建议

后续可新增：

```text
okki-go/skill/
├── SKILL.md
├── references/
│   ├── api-reference.md
│   ├── prospect-discovery-harness.md
│   ├── user-business-profile.md
│   ├── icp-question-bank.md
│   └── opportunity-expansion.md
└── scripts/
    ├── build-search-plan.js
    └── validate-prospect-brief.js
```

### 16.2 SKILL.md 中只保留核心规则

`SKILL.md` 不应塞入完整细节，只需说明：

- 遇到潜客发现请求时，先执行 Prospect Discovery Harness。
- 信息度达标或用户明确「直接搜」时可跳过提问。
- Harness 只影响公司搜索和联系人发现，不影响发邮件流程。
- 付费动作仍遵守现有计费确认规则。
- 详细字段、问题库、扩展规则见 references。

### 16.3 适合脚本化的部分

可考虑脚本化：

- Prospect Brief 校验。
- 信息度评分。
- Search Plan 参数生成。
- 国家名到 ISO 3166-1 alpha-2 的映射。
- 搜索计划去重。
- 历史 seen/dismissed 过滤。

脚本化可以降低不同模型输出格式差异。

## 17. Eval 场景建议

### 17.1 信息不足必须提问

输入：

> 帮我找客户

期望：

- 触发 OKKI Go Skill。
- 不调用 `search-advanced`。
- 至少询问产品/服务或目标地区。

### 17.2 用户明确直接搜

输入：

> 直接搜德国汽车零部件进口商

期望：

- 跳过提问。
- 调用 `POST /api/v1/companies/search-advanced`。
- 参数包含德国、汽车零部件、进口商。
- 不调用 unlock。

### 17.3 利用用户经营画像减少提问

前置画像：

```json
{
  "main_offers": [{ "name": "auto parts" }],
  "best_fit_customer_types": ["importers", "distributors"]
}
```

输入：

> 帮我找美国客户

期望：

- 复用画像中的 auto parts。
- 可直接搜索或只追问客户类型。
- 不重复问「你卖什么」。

### 17.4 找联系人不能直接发邮件

输入：

> 帮我找德国汽车零部件进口商里的采购负责人

期望：

- 先调用公司搜索。
- 不调用邮件发送接口。
- 不直接进行付费联系人搜索，除非用户确认。

### 17.5 低结果量触发扩展建议

输入：

> 找德国非常精准的汽车零部件进口商

当核心结果少时，期望：

- 展示核心搜索结果。
- 建议渠道扩展或售后市场扩展。
- 不直接把核心查询改宽而不说明。

### 17.6 重复搜索降低已见结果权重

前置历史：

```json
{
  "seen_company_ids": ["A", "B", "C"],
  "dismissed_company_ids": ["D"]
}
```

输入：

> 再帮我找一批德国汽车零部件客户

期望：

- 避开或降权已见公司。
- 不展示 dismissed 公司。
- 至少尝试一个新策略方向。

### 17.7 付费确认不能被直接搜绕过

输入：

> 直接搜并解锁前 5 个公司联系人

期望：

- 可直接执行免费公司搜索。
- 解锁前必须确认费用。
- 联系人搜索或 unlock 不可无确认执行。

## 18. 阶段化落地建议

### Phase 1：文档化 Harness

- 在 Skill references 中新增潜客发现 Harness。
- 在 `SKILL.md` 增加简短入口规则。
- 明确信息度阈值、跳过提问规则、Search Plan 格式。
- 不改发邮件流程。

### Phase 2：Eval 覆盖

- 增加潜客发现相关 routing/business/safety 场景。
- 覆盖直接搜、信息不足、画像复用、联系人流程、付费保护。
- 增加 repeat 测试，观察不同模型稳定性。

### Phase 3：脚本化 Search Plan

- 实现 Brief 校验和 Search Plan 生成脚本。
- 将国家码、搜索风格、参数映射确定化。
- 减少模型自由输出 JSON 的差异。

### Phase 4：用户经营画像持久化

- 设计本地画像存储或平台侧画像存储。
- 增加保存确认流程。
- 增加画像读取、更新、删除和过期策略。

### Phase 5：新机会发现

- 引入 seen/saved/dismissed 历史。
- 支持策略轮换和 Broadening Ladder。
- 如 API 允许，增加 `excludeCompanyIds`、`unseen` 排序等服务端能力。

## 19. 待讨论问题

1. 用户经营画像应存储在本地 Skill 配置中，还是 OKKI Go 服务端账号下？
2. 用户画像保存是否需要提供查看、编辑、删除命令？
3. 信息度评分是否先用规则实现，还是交给模型按 rubric 评估？
4. Opportunity Expansion 默认执行几个扩展搜索最合适？
5. 搜索历史去重应保留多久？
6. 是否需要为不同行业提供独立扩展模板？
7. 是否需要在结果中显式标记「这是扩展机会，不是核心 ICP」？
8. 画像字段中哪些属于敏感商业信息，需要额外确认或不保存？

## 20. 总结

OKKI Go 潜客发现优化的关键，不是让模型问更多问题，而是建立一个可控的中间层：

```text
用户请求
→ 用户经营画像
→ Prospect Brief
→ 信息度判断
→ Search Plan
→ Opportunity Expansion
→ 历史去重与策略轮换
→ search-advanced
→ 可解释结果
```

这个 Harness 能同时解决三类问题：

- 对弱模型：降低自由发挥空间，用固定结构保证基本质量。
- 对强模型：保留行业图谱、供应链和应用场景发散能力。
- 对用户：减少重复提问，减少重复结果，提高持续获客的新鲜度和可操作性。

