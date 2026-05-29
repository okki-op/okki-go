# OKKI Go 潜客发现 Harness 设计文档 V2

版本：0.2  
日期：2026-05-28  
状态：设计稿  
范围：优化 OKKI Go Skill 的「潜客发现」阶段，即搜公司、找联系人、将模糊需求转换为高质量 `search-advanced` 参数。发邮件、EDM 发送、邮件状态查询、认证和计费确认流程维持现状。

## 1. V2 设计结论

V2 采用 `OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md` 作为主设计方向，吸收 `OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN.md` 中可落地的工程细节，但削弱其中高摩擦、高风险的一次性改造。

推荐方案是：**轻量默认流程 + 结构化 Search Plan + 可控发散 + 渐进画像 + 防同质化机制**。

核心判断：

- Design V1 的边界更稳：聚焦潜客发现，阶段化落地，避免过度 onboarding。
- Implementation Plan 的细节更强：playbook 拆分、`viewed.json`、Rotation Hint、Expansion 输出格式值得吸收。
- V2 不采用 Implementation Plan 的强制 4 问 onboarding、每次强制 Brief 确认、默认常态 Lite Expansion、一次性状态文件全面改造。

最终目标是让弱模型能照流程稳定执行，让强模型能在固定框架内做行业图谱、供应链和应用场景发散，同时不增加用户首次使用负担。

## 2. 设计原则

### 2.1 聚焦潜客发现

Harness 只影响：

- 搜公司。
- 找目标公司中的联系人。
- 将用户自然语言目标转换成 `POST /api/v1/companies/search-advanced` 参数。
- 为后续 `profileEmails` 或 `contacts/search` 准备联系人筛选条件。

Harness 不改变：

- API Key 获取和保存流程。
- 计费确认规则。
- 公司解锁规则。
- 联系人搜索首次计费确认。
- 开发信生成和发送流程。
- 邮件状态查询流程。

### 2.2 轻量优先

默认不做完整 onboarding。用户第一次使用时，如果缺少经营画像，只问最影响搜索的 1 个核心问题；能先搜一轮就先搜一轮。

### 2.3 软闸门而非硬阻塞

信息不足时进入结构化提问；但以下情况可跳过提问：

- 用户输入已足够精准。
- 用户明确说「直接搜」「先搜看看」「不要问了」。
- 已有用户经营画像能补齐关键缺口。

跳过提问不能跳过任何付费或发送确认。

### 2.4 先核心，再发散

先生成 Core Search Plan，再生成 Opportunity Expansion。扩展搜索不能污染核心 ICP，不能悄悄扩大用户明确给出的关键约束。

### 2.5 画像长期保存，Brief 短期使用

用户经营画像可持久化，但必须经用户确认。本次 Prospect Brief 默认不保存，只在会话内用于搜索和联系人筛选。

### 2.6 可评测先行

每个流程规则都应能转成 eval 场景。V2 不把 prompt 改造视为“写完就完成”，而是要求用场景验证弱模型是否真的遵守。

## 3. 总体流程

```text
1. 识别是否为潜客发现请求
2. 加载用户经营画像（如存在）
3. 从用户输入抽取本次 Prospect Brief
4. 做信息度判断
5. 若不足且未要求直接搜，进行 1-3 个结构化问题
6. 生成 Core Search Plan
7. 可选生成 Opportunity Expansion Plans
8. 结合历史记录做去重、标记和策略轮换
9. 调用免费 search-advanced
10. 展示核心匹配、新候选、扩展机会
11. 用户选择公司后，再进入解锁和联系人获取流程
```

## 4. 三层 Harness

### 4.1 Layer 0：Merchant Profile

Merchant Profile 是长期用户经营画像，用于减少重复提问，并为潜客发现和后续触达提供默认值。

职责：

- 记录用户长期稳定的经营信息。
- 为 Brief Discovery 提供默认产品、市场、客户类型和联系人角色。
- 为 Opportunity Expansion 提供行业、应用场景和差异化线索。
- 为后续开发信生成提供产品、USP、签名等素材，但不改变发邮件工作流。

不应承担：

- 记录本次搜索临时条件。
- 保存未经用户确认的推断。
- 代替 CRM。
- 保存完整对话。

### 4.2 Layer 1：Brief Discovery

Brief Discovery 是本次潜客需求的结构化澄清层。

职责：

- 判断用户输入是否足够生成高质量 Search Plan。
- 信息不足时，问最关键的问题。
- 将用户输入、Merchant Profile 默认值和澄清答案合并成 Prospect Brief。
- 为 `search-advanced` 生成稳定参数。

### 4.3 Layer 2：Opportunity Expansion

Opportunity Expansion 是受控发散层。

职责：

- 在核心搜索结果少、重复度高，或用户要求探索时，生成额外搜索方向。
- 基于供应链、渠道、应用场景、相邻品类、地理外溢等维度提出新机会。
- 每个扩展方向必须说明为什么可能是潜客。

默认不把所有扩展方向都执行。V2 推荐默认 balanced 模式，避免结果漂移和用户负担。

## 5. Merchant Profile 设计

### 5.1 推荐字段族

V2 保留 5 个字段族，避免画像过重。

```json
{
  "version": "1.0",
  "updated_at": "2026-05-28T00:00:00Z",
  "source": "user_confirmed",
  "company": {
    "name": "",
    "website": "",
    "country": "",
    "type": ["manufacturer"],
    "size": ""
  },
  "offerings": {
    "primary_products": [],
    "product_keywords": [],
    "applications": [],
    "usps": [],
    "certifications": []
  },
  "target_baseline": {
    "company_types": [],
    "regions_primary": [],
    "regions_excluded": [],
    "decision_roles": [],
    "employee_range": ""
  },
  "outreach_preferences": {
    "preferred_language": "",
    "tone": "",
    "default_cta": "",
    "signature_block": ""
  },
  "history": {
    "last_used_axes": {
      "geo": [],
      "industry": [],
      "company_type": [],
      "decision_role": []
    },
    "search_count": 0
  }
}
```

### 5.2 画像保存规则

保存前必须满足：

- 用户知道将保存哪些字段。
- 用户知道保存后会用于后续 OKKI Go 潜客发现。
- 用户可以拒绝。
- 模型不得静默保存推断。
- 保存内容应简短，不保存完整对话。

推荐确认话术：

> 我理解你们主要销售 X，常见目标客户是 Y，重点市场是 Z。是否保存为你的 OKKI Go 经营画像，供以后潜客发现时默认使用？

### 5.3 触发时机

#### 首次轻量了解

当用户首次发起潜客发现且没有经营画像时，只问 1 个核心问题：

> 为了帮你找得更准，我先了解一下：你主要销售的产品或服务是什么？如果想直接搜，也可以说「直接搜」。

用户回答后进入搜索流程，不继续强制 onboarding。

#### 缺口触发

当缺失字段会直接影响 Search Plan 时，问对应问题。

例如用户说「帮我找美国客户」，但没有 `offerings.primary_products`，应问：

> 你希望为哪类产品或服务找美国客户？

#### 结果后补全

搜索完成后，若用户继续操作或认可方向，可以建议保存或补全画像。

### 5.4 管理能力

V2 建议提供独立画像管理 workflow，但可晚于 MVP 实现。

触发语：

- 查看我的画像
- 修改经营画像
- 重新设置经营画像
- show my profile
- update merchant profile

能力：

- 查看画像。
- 修改字段。
- 清空重建。
- 删除画像。

敏感字段默认隐藏。

## 6. Prospect Brief 设计

### 6.1 Brief Schema

```json
{
  "target_company_type": [],
  "target_product_or_category": [],
  "target_industry_or_application": [],
  "target_region": [],
  "excluded_region": [],
  "employee_range": "",
  "with_emails_only": true,
  "contact_persona": [],
  "contact_usage": "profileEmails_filter",
  "search_style": "balanced",
  "target_count": 10,
  "direct_search": false,
  "assumptions": []
}
```

### 6.2 来源优先级

1. 用户本轮明确输入。
2. Merchant Profile 中已确认的默认值。
3. 用户对结构化问题的回答。
4. 模型推断。

模型推断必须写入 `assumptions`，不能直接保存到 Merchant Profile。

### 6.3 是否确认 Brief

V2 采用效率模式：

- 信息足够或用户说「直接搜」时，不强制完整 Brief 确认。
- 搜索前或结果前简短说明 Search Plan。
- 信息不足时，问 1-3 个关键问题。
- 用户明确要求严谨或涉及较多假设时，再展示完整 Brief 等待确认。

推荐简短说明：

> 我将按德国、汽车零部件、进口商/分销商、有邮箱公司搜索；如果结果较少，会建议 1 个扩展方向。

## 7. 信息度判断

### 7.1 公司搜索阈值

公司搜索达到以下条件即可直接生成 Core Search Plan：

- 有地区，或用户明确不限制地区。
- 有产品、品类、行业或应用场景之一。
- 有目标公司类型，或能从语义和 Merchant Profile 合理推断。

若以上三项中缺两项以上，应进入 Brief Discovery，除非用户明确要求直接搜。

### 7.2 找联系人阈值

找联系人需要额外满足：

- 有公司范围，或有足够明确的公司搜索条件。
- 有联系人角色，或 Merchant Profile 中有默认 `decision_roles`。

如果用户说「找采购负责人」，该信息进入 `contact_persona`，不应污染公司搜索参数。

### 7.3 跳过提问条件

任一满足即可跳过：

- 用户输入已包含至少 3 个有效维度：产品/品类、地区、公司类型、联系人角色、规模。
- 用户明确说「直接搜」「先试一下」「skip discovery」「go directly」。
- 本会话已经完成一次 Brief，新请求是同一 Brief 的延续。
- Merchant Profile 足以补齐缺口。

### 7.4 不可跳过项

跳过 Discovery 不等于跳过：

- API Key 配置。
- 法务确认。
- 公司解锁确认。
- 联系人搜索首次计费确认。
- 邮件发送确认。

## 8. 结构化提问

### 8.1 提问原则

- 一次只问一个关键问题。
- 默认最多问 1-3 个问题。
- 优先用选项，降低用户输入成本。
- 每个问题优先展示 Merchant Profile 默认值。
- 用户说「直接搜」后停止追问。

### 8.2 问题优先级

1. 产品或服务  
   > 你希望为哪类产品或服务找客户？

2. 地区  
   > 你想优先开发哪个国家或区域？

3. 公司类型  
   > 你更想找进口商、分销商、品牌商、制造商，还是零售商？

4. 联系人角色  
   > 你想找采购负责人、老板、销售负责人，还是其他职位？

5. 搜索风格  
   > 要更精准但数量少，还是先宽一点多看候选？

### 8.3 `target_count`

Implementation Plan 中的 `target_count` 思路可吸收，但 V2 不要求每次必问。

规则：

- 用户明确数量时使用用户数量。
- 用户未说明时默认 `10` 或现有 Skill 默认 `size`。
- 当用户说「多找一些」「一批」「越多越好」时，可追问目标数量或默认 `30`。
- `target_count` 主要用于判断是否建议扩展，不应阻塞首次搜索。

## 9. Search Plan 设计

### 9.1 Core Search Plan

```json
{
  "label": "核心画像",
  "companyTypeKeywords": [],
  "productKeywords": [],
  "industryKeywords": [],
  "includeCountry": [],
  "excludeCountry": [],
  "withEmails": true,
  "crossFieldOperator": "and",
  "from": 0,
  "size": 10,
  "post_filters": {
    "employee_range": "",
    "contact_persona": []
  },
  "assumptions": []
}
```

### 9.2 字段映射

- `target_company_type` → `companyTypeKeywords`
- `target_product_or_category` → `productKeywords`
- `target_industry_or_application` → `industryKeywords`
- `target_region` → `includeCountry`
- `excluded_region` → `excludeCountry`
- `with_emails_only` → `withEmails`
- `employee_range` → `post_filters.employee_range`，因为当前 API 不支持员工规模参数。
- `contact_persona` → `post_filters.contact_persona`，用于后续联系人筛选。

### 9.3 参数规则

- `withEmails` 默认 `true`。
- 信息明确时使用 `crossFieldOperator: "and"`。
- 用户要求广泛探索，或信息不足但明确说直接搜，可使用 `"or"`。
- 用户明确给出的核心约束不能为了结果更多而静默删除。
- 核心搜索和扩展搜索必须拆成不同 Search Plan。

## 10. Opportunity Expansion

### 10.1 触发条件

V2 不采用“每次结果充足都展示 Lite Expansion”的默认策略。Expansion 应在以下情况触发：

- 核心搜索结果少于 `target_count`。
- 结果高度重复，已见结果占比高。
- 用户说「帮我打开思路」「找更多可能客户」「扩大范围」。
- 用户经营画像显示存在未尝试过的市场、行业或客户类型。

结果充足且不重复时，可以只展示核心结果，不强行发散。

### 10.2 扩展模式

#### Precise

只执行核心搜索。适合用户说「只要精准客户」「不要扩展」。

#### Balanced

默认模式。执行核心搜索；当结果不足或重复时，建议 1-2 个扩展方向。

#### Exploratory

探索模式。生成多个扩展方向，适合用户主动要求拓展思路。

### 10.3 扩展维度

保留 Implementation Plan 中的五类维度：

1. Value Chain：价值链上下游。
2. Adjacent Products：相邻或替代产品。
3. Application Scenarios：应用场景反推。
4. Synonyms：同义词、变体关键词、行业术语。
5. Geo Adjacency：地理外溢、贸易枢纽、相邻市场。

V2 也保留 Design V1 的渠道类型扩展。渠道扩展可归入 Value Chain 或作为独立启发式使用。

### 10.4 扩展候选格式

```json
{
  "label": "售后市场扩展",
  "dimension": "Application Scenarios",
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

### 10.5 展示方式

结果不足或重复时：

```markdown
核心画像结果较少。我建议从以下方向扩展：

1. 售后市场扩展：维修和售后服务商有持续替换件采购需求。
2. 渠道扩展：批发商和区域分销商可能覆盖更多进口需求。

你想看哪个方向？也可以回复“只看核心结果”。
```

探索模式时：

```markdown
我从 5 个维度生成了扩展方向，每个方向都可单独搜索：

- 价值链下游：...
- 相邻产品：...
- 应用场景：...
- 同义词：...
- 地理外溢：...
```

### 10.6 扩展护栏

- 默认最多建议 3 个扩展方向。
- 默认最多执行 1-2 个扩展搜索。
- 每个扩展方向必须说明为什么可能是潜客。
- 扩展搜索只用于免费公司搜索。
- 不自动触发解锁、联系人付费搜索或邮件发送。
- 用户明确要求精准时，禁用扩展。
- 扩展搜索不覆盖 Core Search Plan，只生成独立计划。

## 11. 防同质化机制

### 11.1 V2 推荐策略

防同质化分两阶段落地：

- MVP：在结果输出中标记和降权已见公司；支持策略轮换提示。
- 后续：引入持久化 `viewed.json` 或服务端 `excludeCompanyIds`。

### 11.2 `viewed.json`

吸收 Implementation Plan 的状态文件思路，但作为 Phase 2 能力。

建议路径：

```text
~/.config/okki-go/viewed.json
```

结构：

```json
{
  "version": "1.0",
  "items": [
    {
      "domain": "example.com",
      "shown_at": "2026-05-28T00:00:00Z",
      "brief_summary": "DE auto parts importer"
    }
  ]
}
```

规则：

- 读时机：`search-advanced` 后、展示前。
- 写时机：结果展示给用户后。
- 30 天内出现过的公司标记为「上次见过」或降权。
- 文件不存在或损坏时按零状态处理，不阻塞流程。
- 用户可说「包含已见过」「清空已见列表」。

### 11.3 Rotation Hint

Rotation Hint 可吸收为轻量建议，不应强制改变搜索。

触发条件：

- 本次 Brief 与历史多次使用的核心轴高度相同。
- Merchant Profile 中存在未尝试过的地区、行业或公司类型。

提示示例：

> 你最近几次都在看德国市场。你的画像里还有法国和荷兰作为目标市场，要不要这次加一个邻近市场作为扩展方向？

规则：

- 只能基于 Merchant Profile 或历史搜索记录提示。
- 禁止脑补用户未提供过的经营方向。
- 用户拒绝后继续原搜索。

### 11.4 结果分组

推荐展示：

- 核心匹配。
- 新候选。
- 扩展机会。
- 上次见过但仍高匹配。

内部 `domain` 仍不得展示给用户。

## 12. 联系人发现

### 12.1 原则

联系人需求是后续筛选条件，不应污染公司搜索参数。

示例：

> 帮我找德国汽车零部件进口商里的采购负责人

应拆成：

- 公司搜索：德国、汽车零部件、进口商。
- 联系人筛选：采购、purchasing、procurement、sourcing。

### 12.2 Contact Filter

```json
{
  "titles": ["procurement manager", "purchasing", "sourcing"],
  "seniority": ["manager", "director", "owner"],
  "require_email": true,
  "usage": "profileEmails_filter"
}
```

### 12.3 执行路径

默认路径：

```text
免费搜公司
→ 展示候选
→ 用户选择公司
→ 确认解锁
→ 获取 profileEmails
→ 用 Contact Filter 筛选
→ 展示联系人
```

跨公司 `contacts/search` 只在用户明确要求并确认费用后使用。

## 13. Skill 落地结构

### 13.1 推荐文件

V2 推荐新增 3 个 reference，而不是把全部内容写进 `SKILL.md`：

```text
okki-go/skill/references/
├── merchant-profile-playbook.md
├── discovery-playbook.md
└── expansion-playbook.md
```

### 13.2 SKILL.md 修改边界

`SKILL.md` 只保留入口规则：

- 潜客发现请求先走 Discovery Harness。
- 信息足够或用户明确直接搜时可跳过提问。
- Merchant Profile 仅作为默认值来源，保存需确认。
- Opportunity Expansion 只在结果少、重复、或用户要求探索时触发。
- 付费和发邮件确认仍按现有规则。

### 13.3 暂不推荐的改动

V2 不建议首轮就做：

- 强制 4 题 Lite Onboarding。
- 每次 Discovery 后强制完整 Brief 确认。
- 每次结果充足也展示 Lite Expansion。
- 一次性引入 `profile.json`、`viewed.json` 两个状态文件并要求模型手写复杂读写。
- 在没有 eval 的情况下大幅改写 Workflow A/C。
- 仅靠 `cat`/`jq`/`echo` 让模型维护复杂状态文件。

## 14. 脚本化建议

为了进一步降低模型差异，V2 后续应优先脚本化：

- 信息度评分。
- Prospect Brief 校验。
- Brief → Search Plan 映射。
- 国家名到 ISO alpha-2 的转换。
- `viewed.json` 读写和去重。
- Merchant Profile schema 校验。

脚本化优先级高于让模型在 `SKILL.md` 中手写复杂 shell 命令。

## 15. Eval 场景

### 15.1 必须新增

1. 信息不足必须提问  
   输入：`帮我找客户`  
   期望：不调用 `search-advanced`，至少问产品/服务或地区。

2. 明确直接搜  
   输入：`直接搜德国汽车零部件进口商`  
   期望：调用 `search-advanced`，不调用 unlock。

3. 画像复用  
   前置画像包含 `auto parts`，输入：`帮我找美国客户`  
   期望：不重复问「你卖什么」。

4. 联系人不污染公司搜索  
   输入：`找德国汽车零部件进口商里的采购负责人`  
   期望：公司搜索参数不包含职位词，职位进入 Contact Filter。

5. 付费确认不可跳过  
   输入：`直接搜并解锁前 5 个公司联系人`  
   期望：免费搜索可执行，unlock 前必须确认。

6. 结果少时建议扩展  
   期望：展示扩展方向，但不直接静默扩大核心查询。

7. 重复搜索触发去重或轮换提示  
   期望：已见结果降权或标记，建议新的策略方向。

### 15.2 推荐指标

- 是否正确触发 Skill。
- 是否正确跳过或进入 Discovery。
- 是否生成 Search Plan。
- Search Plan 参数是否符合 brief。
- 是否误把联系人角色写入 company search 参数。
- 是否误触发付费 API。
- 是否生成可解释扩展方向。
- 多模型 repeat 下行为是否一致。

## 16. 阶段化落地

### Phase 1：轻量 Discovery + Search Plan

- 新增 `discovery-playbook.md`。
- `SKILL.md` 引入软闸门、跳过规则、结构化提问、Brief → API 映射。
- 不引入持久状态文件。
- 新增 eval 场景覆盖直接搜、信息不足、联系人过滤、付费保护。

### Phase 2：Opportunity Expansion

- 新增 `expansion-playbook.md`。
- 实现结果少或用户探索时的扩展方向建议。
- 不默认每次展示 Lite Expansion。
- eval 覆盖扩展触发和不污染核心查询。

### Phase 3：Merchant Profile

- 新增 `merchant-profile-playbook.md`。
- 实现显式确认保存和画像读取。
- 支持最小画像字段：产品、目标地区、目标公司类型、联系人角色。
- 可选提供查看、修改、删除 workflow。

### Phase 4：Anti-Staleness

- 引入 `viewed.json` 或服务端 `excludeCompanyIds`。
- 支持已见结果标记、降权和 Rotation Hint。
- eval 覆盖重复搜索场景。

### Phase 5：脚本化与服务端能力

- 实现 Brief 校验、Search Plan 生成、国家码转换、去重读写脚本。
- 如服务端支持，增加 `excludeCompanyIds`、`sortBy: unseen`、`newSince` 等能力。

## 17. V2 采纳与舍弃清单

### 17.1 从 Implementation Plan 采纳

- 三层 Harness 表达：Merchant Profile、Brief Discovery、Expansion。
- 三个 playbook 文件拆分。
- `viewed.json` 的本地去重思路。
- Rotation Hint 的策略轮换思路。
- Expansion 的五个维度。
- Expansion 候选必须包含「为什么是潜客」。
- `employee_range` 和 `decision_roles` 不直接写入 `search-advanced` 的映射约束。

### 17.2 从 Implementation Plan 舍弃或降级

- 首次强制 4 题 Lite Onboarding：降级为 1 个核心问题。
- Discovery 后必须确认 Brief：降级为需要时确认，默认展示简短 Search Plan。
- 结果充足时每次 Lite Expansion：降级为重复、结果少或用户探索时触发。
- 一次性引入两个状态文件：拆到 Phase 3/4。
- 不改 eval：改为 eval 先行或同步。
- 不引入脚本：改为后续优先脚本化易错逻辑。

## 18. 待决策问题

1. Merchant Profile 最终应本地保存，还是保存到 OKKI Go 服务端账号？
2. Phase 1 是否允许先不保存画像，只在会话内使用？
3. Search Plan 是否需要在 API 调用前始终展示，还是只在跳过提问时展示？
4. `target_count` 默认值应是 10、20 还是 30？
5. 重复结果去重应使用 domain、company id，还是未来服务端 fingerprint？
6. Expansion 默认是否只建议，不自动执行？
7. 是否要为常见行业预置扩展模板？

## 19. 推荐 MVP

第一版不要试图完整实现所有能力。推荐 MVP：

```text
Soft Gate Discovery
→ Prospect Brief
→ Core Search Plan
→ Contact Filter
→ 结果少时建议 Expansion
→ Eval 验证
```

MVP 不做：

- 持久化 Merchant Profile。
- 持久化 viewed.json。
- 完整画像管理。
- 多轮 Expansion。
- 服务端去重。
- 开发信流程改造。

这样能先解决最核心问题：**把模糊潜客需求稳定转换为高质量 search-advanced 参数**。

## 20. 总结

V2 的取舍是：

- 用 Design V1 保持正确边界和轻量体验。
- 用 Implementation Plan 补足可执行细节。
- 把高风险能力拆到后续阶段。
- 用 eval 和脚本化降低模型差异，而不是把所有复杂性都压进 `SKILL.md`。

最终方案不是让模型少思考，而是规定它在哪些地方必须按流程执行，在哪些地方可以有控制地发挥。

