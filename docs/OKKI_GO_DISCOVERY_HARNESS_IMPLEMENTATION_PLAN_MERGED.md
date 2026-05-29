---
name: OKKI Go Discovery Harness — Merged Implementation Plan
overview: 在 P（Cursor plan 落地版）的精确施工图基础上，回灌 D（V0.1 设计稿）的 10 个未被继承的好点子 + 用户对话决策新增的 9 项设计，形成可直接施工的合并版本。三层 Harness + 防同质化机制保持不变；新增数据来源分级、硬护栏清单、国家码对照表、Pre-Search Statement、3 档 Brief 确认分流、Broadening Ladder 前置闸门、unlocked 状态标记、去重窗口开关、Open Questions 审计、3 段结果分组；进一步新增动态 trade_mode 派生（国家无关的内贸/外贸自适应）、Lite Onboarding 升级为 5 题（含 L0 公司所在国）、Sales Mentor Persona（B'' 保护机制：默认有源 + 2 条 💭 额度 + 6 类 Must NOT Say + 铁律 0 国家无关）、Business Context Lite（BC1/BC2 前置 + BC3 在 trade_mode 派生后执行）、Blind-Spot Checklist（5 类盲点扫描）、Reverse Recommendations（≥20% 反向建议约束）、Sales Journey Preview（3 段销售旅程预演）；新增最小状态 helper 脚本与 eval 场景，降低落地执行漂移。
based_on:
  - OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md (V0.1 讨论稿)
  - OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN.md (Cursor plan 实施版)
merge_date: 2026-05-28
target_version: SKILL.md 1.2.0
todos:
  - id: draft-profile-playbook
    content: 创建 okki-go/skill/references/merchant-profile-playbook.md（Profile schema 含 source 字段 + sales_context 字段、5 字段族、首次轻量启动 5 题含 L0 公司所在国、渐进补全、Discovery/触达端复用、preferred_language 懒加载推断规则）
    status: pending
  - id: draft-discovery-playbook
    content: 创建 okki-go/skill/references/discovery-playbook.md（Sufficiency Check + 硬护栏清单 / Five Gray Areas / Brief Schema 含 trade_mode 会话变量说明 / Brief→API Mapping 含国家码表 + 联系人强调 / Pre-Search Statement 含 trade_mode 派生展示 / 3 档 Brief Confirmation）
    status: pending
  - id: draft-expansion-playbook
    content: 创建 okki-go/skill/references/expansion-playbook.md（Trigger Rules 含 Broadening Ladder 前置闸门 / Five Expansion Dimensions / Candidate Output Format 含反向建议约束 / User Selection / Candidate→Brief Mapping / Multi-Round Rules）
    status: pending
  - id: draft-sales-mentor-playbook
    content: 创建 okki-go/skill/references/sales-mentor-playbook.md（铁律 0 国家无关原则 + §0 Persona + §1 Business Context Lite 两阶段执行：BC1/BC2 前置、BC3 在 trade_mode 派生后执行 / §2 Blind-Spot Checklist 5 类 / §3 Reverse Recommendations 20% 占比 / §4 Sales Journey Preview 3 段 / §5 Must NOT Say 6 类警戒清单 + B'' 保护机制：默认有源 + 2 条 💭 额度 + 全模型统一约束）
    status: pending
  - id: add-state-helper
    content: 新增 okki-go/skill/scripts/okki-state.js，统一处理 profile.json/viewed.json 的读写、迁移、权限、原子写、敏感字段遮罩、去重分类与 unlocked 生命周期；SKILL.md 只描述调用接口，不要求模型临场拼 jq/echo
    status: pending
  - id: design-state-files
    content: 在 SKILL.md 中描述两个状态文件和 helper 调用接口——~/.config/okki-go/profile.json v1.1（含 source 元数据 + sales_context + preferred_language 懒加载，0600）和 ~/.config/okki-go/viewed.json v1.1（含 status + unlocked_at 字段，0600），读写通过 okki-state.js 完成
    status: pending
  - id: add-profile-section
    content: SKILL.md 新增 ## Merchant Profile 节（含 Management workflow）
    status: pending
  - id: add-discovery-section
    content: SKILL.md 新增 ## Prospecting Brief Discovery (Soft Gate) 节，含 3 档 completeness 分流逻辑 + trade_mode 派生
    status: pending
  - id: add-expansion-section
    content: SKILL.md 新增 ## Prospecting Expansion (Dual Mode + Ladder) 节
    status: pending
  - id: add-anti-staleness-section
    content: SKILL.md 新增 ## Anti-Staleness Mechanisms 节（3 段分组 + 去重窗口开关 + Rotation Hint）
    status: pending
  - id: add-sales-mentor-section
    content: SKILL.md 新增 ## Sales Mentor Mode 节（引用 sales-mentor-playbook，描述 trade_mode 派生时机 + B'' 保护机制 + 用户开关）
    status: pending
  - id: rewrite-workflow-a-c
    content: 改写 Workflow A 全链路；Workflow C 只改公司搜索/联系人发现前半段（前置 Profile 加载 + completeness 分流 + Discovery + Hard Guardrails + Rotation Hint + 派生 trade_mode + Business Context Lite + Blind-Spot Check + Ladder/Expansion + viewed.json 分组），邮件内容确认和发送链路保持原样
    status: pending
  - id: rewrite-user-input-guidance
    content: 改写 ## User Input Guidance，删除 vague/better 对照表，指向 discovery-playbook.md + sales-mentor-playbook.md
    status: pending
  - id: bump-version
    content: version 1.0.12 → 1.2.0（minor bump，反映三层 Harness + 4 大新模块 + Sales Mentor Mode）
    status: pending
  - id: self-review
    content: 自检四个 playbook 引用一致性 + SKILL.md workflow 步骤顺序 + 状态 helper 调用顺序 + 3 档分流 + Ladder 触发 + unlocked 状态写入时机 + trade_mode 派生时机 + 直接搜/unknown 降级路径 + employee_range 本地过滤分页策略 + 铁律 0 自检（playbook 静态内容是否国家无关）+ B'' 保护机制覆盖
    status: pending
  - id: add-eval-coverage
    content: 为 okki-state.js 增加单元测试，并在 okki-go/eval/scenarios/ 增加 direct-search-unknown、soft-filter-pagination、business-context-order、viewed-lifecycle、hard-guardrail-paid-action 等回归场景
    status: pending
isProject: false
---

# OKKI Go Discovery Harness — Merged Implementation Plan

> **配套设计文档**：[OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md](./OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md)（V0.1 讨论稿，下称 D） + [OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN.md](./OKKI_GO_DISCOVERY_HARNESS_IMPLEMENTATION_PLAN.md)（Cursor plan 实施版，下称 P）
>
> **本文档定位**：P 的合并增强版。基于 P 的精确施工图，回灌 D 的 10 个未被继承的好点子。每个合并点用 `[MERGE: from D §X.Y]` 标识便于追溯。
>
> **审计**：所有采纳/拒绝决策见末尾「合并决策审计」节。

## 背景诊断

`okki-go/skill/SKILL.md` 当前的 `## User Input Guidance`（第 323-347 行）只给模型一张「vague → better」对照表，"该不该追问、追问什么"的判断完全交给模型。不同模型理解力差异造成执行随机性。

对照 GSD `discuss-phase` 和 Superpowers `brainstorming` 的稳定性来源：把不确定性结构化成 **领域感知的灰色区域 + 候选选项化提问 + 决策快照**，让模型从「判断者」降级为「执行者」。

D 在此基础上进一步识别了 5 类典型问题：模糊指令处理差异、参数映射不稳、临时信息与长期画像混淆、画像精准 vs 强模型发散张力、重复结果疲劳 / 流失。本合并版同时处理这 5 类问题。

## 总体策略：三层 Harness + 防同质化

作用域：潜客发现段（公司搜索 + 联系人筛选）+ 用户经营画像持久化。Workflow A 全链路接入 Harness；Workflow C 只在**公司搜索/联系人发现前半段**接入 Harness，进入"确认收件人和邮件内容"后回到原触达安全链路。**邮件发送、邮件状态查询、计费、API Key 流程全部保持不变。**

三层职责分离，互不污染：

| 层 | 目标 | 生命周期 | 触发 | 模型角色 |
|---|---|---|---|---|
| **Layer 0: Merchant Profile** | 持久化用户经营画像，跨会话复用 | 长期 | 首次 Discovery 前轻量启动 + 后续渐进补全 + 独立管理 workflow | 收集者（首次）/ 默认值提供者（后续）|
| **Layer 1: Brief Discovery** | 收紧本次潜客需求精度 | 会话内存 | 默认进入，软性 gate 可跳过；优先用 Profile 提供 Gray Area 默认值 | 执行者（按 playbook 提问）|
| **Layer 2: Prospecting Expansion** | 扩大召回 + 常态化新视角 | 会话内存 | 三态：Ladder（极端低召回，参数放宽）/ Full（total < target_count）/ Lite（total >= target_count，附加 2 维度轻量发散）| 推理者（按维度生成候选 + 解释理由）|

防同质化机制（横切，作用于结果展示前后）：

- **A. 本地去重 + unlocked 状态（viewed.json v1.1）**：每次展示的公司域名持久化到 `~/.config/okki-go/viewed.json`，记录 `status` 字段（viewed | unlocked）。结果列表分 3 段：🔓 已解锁 / 📅 上次见过 / ✨ 新发现。窗口默认 30 天，用户可调（7/30/90）或清空。
- **F. 多轴轮换提示（Rotation Hint）**：基于 Merchant Profile 中 `last_used_axes` 字段，在 Brief 确认前给出"换轴"建议。
- **B+. Expansion 常态化（Lite Mode）**：即使首轮结果充足，也附加 2 个维度的"您可能没考虑过的角度"，让用户每次都能感受到新视角。

模型职责重新划分：

- **Profile 收集中**：仅按 playbook 提问，禁止臆造字段；模型推断的字段必须标 `source: agent_inferred` 并追问用户确认。
- **Brief Discovery 中**：不决定问什么/问几个/参数怎么填——全部按 playbook 走，且必须优先呈现 Profile 默认值（仅使用 `source: user_confirmed` 的字段做默认值）。
- **Expansion 中**：在固定维度框架内自由发挥推理力——但每个候选必须带「为什么是潜客」的一句话理由。
- **Rotation Hint 中**：依据 Profile 已用轴清单给建议，禁止脑补未在 Profile 中出现的领域。

> **[MERGE: from D §6.3 数据来源分级]** 模型对 USP / 应用场景 / 决策角色等"高推断风险"字段进行赋值时，必须标记 `source: agent_inferred` 并主动追问用户确认；只有 `user_confirmed` 的字段才参与 Discovery 默认值生成，防止"模型推断"被静默升级为"事实"。

### Dynamic Trade Mode Inference（动态贸易模式推断）

> **[MERGE: 用户对话决策]** —— 本 Skill 是个**通用的 B2B 潜客开发和触达工具**，**不预设内贸或外贸定位**。每次 Brief 完成后，根据用户 Profile 和 Brief 自动派生 `trade_mode`，作为下游推荐、扩展、引导、触达建议的依据。

**派生规则**（会话内变量，不持久化）：

```
trade_mode = derive(profile.company.country, brief.geo_include):

  ① domestic（内贸）   = profile.country 与 brief.geo_include 完全一致
                       例：profile.country=CN, brief.geo_include=[CN]
                       例：profile.country=US, brief.geo_include=[US]

  ② cross_border（外贸）= profile.country 不在 brief.geo_include 中
                       例：profile.country=US, brief.geo_include=[DE]
                       例：profile.country=CN, brief.geo_include=[DE,US,JP]

  ③ mixed（混合）      = brief.geo_include 既含 profile.country 也含其他
                       例：profile.country=CN, brief.geo_include=[CN, US, DE]

  ④ unknown           = profile.country 缺失
                       → Lite Onboarding L0 强制补
```

**关键设计选择**：

- ❌ 不是 Brief 字段（不持久化到内存 Brief 也不持久化到 Profile）
- ❌ 不让用户主动选（涌现自 Profile + Brief 已有信息）
- ✅ **会话内派生变量**，每次 Brief 重新确认后重新派生
- ✅ Profile 的 `company.country` 是这个推断的锚点 → 首次 Lite Onboarding **必收集**（L0 题）

**下游模块如何使用**：

| 模块 | 使用方式 |
|---|---|
| `sales-mentor-playbook §1 BC3` | 切入方式候选按 trade_mode 分支（domestic / cross_border / mixed） |
| `sales-mentor-playbook §2 盲点检查` | 类 2「市场-合规错配」按 trade_mode + brief.geo_include 动态判断 |
| `sales-mentor-playbook §4 销售旅程预演` | 付款建议 / 文化提示按 trade_mode 出不同模板 |
| `merchant-profile-playbook §3` | `outreach_identity.preferred_language` 懒加载默认值按 trade_mode 推断 |
| `discovery-playbook §5.0 Pre-Search Statement` | 派生 trade_mode 并展示给用户："本次场景识别为 [domestic]，将适配..." |

### Sales Mentor Persona（贯穿三层 Harness 的导师视角）

> **[MERGE: 用户对话决策 B'' 方案]** —— 模型在 Prospecting 全流程中扮演「一位有 B2B 销售经验的伙伴」而非中性搜索助手。详细规则见 `references/sales-mentor-playbook.md`。

**B'' 保护机制**（防止模型胡说，统一应用所有模型，无强弱区分）：

1. **默认有源**：所有"经验式判断"必须有可追溯来源（Profile 字段 / 本会话用户陈述 / playbook 模板规则）
2. **2 条 💭 额度**：每次响应中最多 2 条 `💭 个人推断` 标记的无源判断
3. **可疑词警戒清单**（sales-mentor-playbook §5 Must NOT Say）：禁止具体数字情报 / 地理细节断言 / 实时情报 / 时间敏感断言 / 行业刻板印象 / 地区文化预设
4. **铁律 0 国家无关**：playbook 静态内容禁止硬编码任何具体工具名 / 平台名 / 认证名 / 文化习惯——这些都由模型在运行时基于 `profile.country` 动态生成并带 💭

## 范围

新增 4 个 playbook 文件、新增 / 升级 2 个状态文件、修改 1 个 SKILL.md：

- 新增 [`okki-go/skill/references/merchant-profile-playbook.md`](../skill/references/merchant-profile-playbook.md) —— Profile schema（**含 source 字段 + sales_context 字段 + preferred_language 懒加载**）+ 5 字段族 + 触发规则（**Lite Onboarding 5 题含 L0 公司所在国**）+ Discovery/触达复用方式
- 新增 [`okki-go/skill/references/discovery-playbook.md`](../skill/references/discovery-playbook.md) —— **Sufficiency Check + 硬护栏清单** + Five Gray Areas + Brief Schema（**含 trade_mode 会话变量说明**）+ **Brief→API Mapping（含 50 国国家码对照表 + decision_roles 强调）** + **Pre-Search Brief Statement（含 trade_mode 派生展示）** + **3 档 Brief Confirmation**
- 新增 [`okki-go/skill/references/expansion-playbook.md`](../skill/references/expansion-playbook.md) —— **Broadening Ladder 前置闸门** + 5 个发散维度 + 候选输出格式（**含反向建议 ≥20% 占比约束**）+ 多轮规则
- 新增 [`okki-go/skill/references/sales-mentor-playbook.md`](../skill/references/sales-mentor-playbook.md) —— **铁律 0 国家无关** + §0 Persona + §1 Business Context Lite（BC1/BC2 前置，BC3 在 trade_mode 派生后执行）+ §2 Blind-Spot Checklist（5 类盲点）+ §3 Reverse Recommendations（反向建议模板）+ §4 Sales Journey Preview（销售旅程预演 3 段）+ §5 Must NOT Say（6 类警戒清单 + B'' 保护机制）
- 状态文件：`~/.config/okki-go/profile.json` **v1.1**（含 source 元数据 + sales_context + preferred_language 懒加载，mode 0600）+ `~/.config/okki-go/viewed.json` **v1.1**（含 status + unlocked_at 字段，mode 0600）—— 由 `skill/scripts/okki-state.js` 统一读写、迁移、遮罩、分类与原子写入，SKILL.md 只描述调用接口
- 新增 [`okki-go/skill/scripts/okki-state.js`](../skill/scripts/okki-state.js) —— 最小状态 helper；不参与 API 业务逻辑，只处理本地 JSON 状态，避免模型临场拼 `jq`/`echo` 写坏文件
- 修改 [`okki-go/skill/SKILL.md`](../skill/SKILL.md) —— 新增 Merchant Profile / Brief Discovery / Expansion / Anti-Staleness / **Sales Mentor Mode** 五节、改写 Workflow A/C、改写 User Input Guidance、bump version 至 1.2.0
- 修改 `okki-go/eval/` —— 增加状态 helper 单测与 agent transcript 场景，验证直接搜降级、状态生命周期、分页软过滤、BC 顺序、硬护栏

---

## 文件 1：新增 `references/merchant-profile-playbook.md`

文件骨架（约 230 行）：

### Section 1: Profile Schema（含 source 字段）

文件位置：`~/.config/okki-go/profile.json`，mode `0600`。

> **[MERGE: from D §6.3]** Schema 引入 `source` 元数据，但**只对模型推断风险高的 B 类字段标注**，避免 schema 复杂度翻倍。A 类字段（用户必须亲口说）省略 `source`，默认视为 `user_confirmed`。

**字段分类**：

- **A 类（不带 source，默认 user_confirmed）**：
  - `company.name` / `company.website` / `company.country` / `company.employee_range` / `company.founded_year`
  - `outreach_identity.sender_name` / `sender_email` / `sender_title` / `signature_block` / `preferred_language`
  - `offerings.primary_products` / `offerings.landing_page`

- **B 类（必须带 source，4 种状态：`user_confirmed` / `user_provided` / `agent_inferred` / `imported`）**：
  - `offerings.usps`
  - `offerings.applications`
  - `offerings.certifications`
  - `target_baseline.regions_primary`
  - `target_baseline.decision_roles`
  - `exclusions.industries_blacklist`

完整 schema 示例（以 cross_border 用户为例；其他 trade_mode 的 schema 取值结构相同，仅字段值不同——例如 domestic 用户的 `regions_primary` 可能只包含 `profile.country` 自身国码）：

```json
{
  "version": "1.1",
  "updated_at": "2026-05-28T10:00:00Z",
  "completeness": 0.7,
  "company": {
    "name": "...",
    "country": "CN",
    "type": ["manufacturer"],
    "employee_range": "50-200",
    "founded_year": "2010",
    "website": "..."
  },
  "offerings": {
    "primary_products": ["DTF printer"],
    "product_keywords_zh": ["数码热转印机", "DTF打印机"],
    "product_keywords_en": ["DTF printer", "direct-to-film printer"],
    "applications": [
      { "value": "custom apparel", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "promotional gifts", "source": "agent_inferred", "updated_at": "2026-05-28" }
    ],
    "usps": [
      { "value": "Tier-1 components", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "in-house R&D", "source": "user_provided", "updated_at": "2026-05-26" }
    ],
    "certifications": [
      { "value": "ISO 9001", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ],
    "landing_page": "..."
  },
  "target_baseline": {
    "company_types": ["manufacturer", "trading"],
    "regions_primary": [
      { "value": "US", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "DE", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "AU", "source": "agent_inferred", "updated_at": "2026-05-28" }
    ],
    "regions_excluded": ["RU"],
    "decision_roles": [
      { "value": "Procurement Manager", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ],
    "employee_range": "50-1000"
  },
  "outreach_identity": {
    "sender_name": "...",
    "sender_title": "...",
    "sender_email": "...",
    "signature_block": "...",
    "preferred_language": null
  },
  "sales_context": {
    "goal": "expand_new_market",
    "time_horizon": "this_quarter",
    "channel": "edm",
    "source": "user_confirmed",
    "updated_at": "2026-05-28"
  },
  "exclusions": {
    "competitor_domains": ["..."],
    "industries_blacklist": [
      { "value": "tobacco", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ]
  },
  "history": {
    "last_used_axes": {
      "geo": ["DE", "US"],
      "industry": ["textile printing"],
      "decision_role": ["Procurement Manager"]
    },
    "search_count": 12
  }
}
```

**preferred_language 懒加载说明**（[MERGE: 用户对话决策]）：

`outreach_identity.preferred_language` **首次 Onboarding 时不强制问**，初始值为 `null`。等用户首次进入触达 Workflow（C/D）时再询问。

模型按以下规则推断默认值，向用户确认后才写入 Profile（`source: user_confirmed`）：

```
若 outreach_identity.preferred_language 为 null，模型推断默认值：

- trade_mode = domestic AND profile.country = CN → 默认 "zh"
- trade_mode = domestic AND profile.country = 英语系 → 默认 "en"
- trade_mode = domestic AND profile.country = 其他 → 默认 profile.country 主流语言
- trade_mode = cross_border AND target 主要为英语系国家 → 默认 "en"
- trade_mode = cross_border AND target 主要为非英语系国家 → 默认 "en"（外贸通用语）+ 询问用户是否需要本地化
- trade_mode = mixed → 询问用户
- 其他不确定情况 → 询问用户
```

`sales_context` 字段（[MERGE: 用户对话决策]）：

来自 sales-mentor-playbook §1 Business Context Lite 的 BC1-BC3 答案。每次 Brief Discovery 前模型先检查 `sales_context`，若已存在则展示「上次的销售目标是 [X]，本次保持还是调整？」，避免重复问。

**source 值语义**：

| source 值 | 含义 | 是否参与 Discovery 默认值 | 写入时机 |
|---|---|---|---|
| `user_confirmed` | 用户明确确认保存 | ✅ 是 | 用户在确认问题中明确选择"加入画像" |
| `user_provided` | 用户陈述但未确认升级到 Profile | ⚠️ 仅当 user_confirmed 字段为空时降级使用 | 用户在 Brief Discovery 中明确说出，但未确认是否写入 Profile |
| `agent_inferred` | 模型推断，等待确认 | ❌ 否 | 模型从对话中自动推断，必须追问用户 |
| `imported` | 从外部系统（CRM 等）导入 | ✅ 是（视同 user_confirmed） | 用户主动导入操作 |

`completeness` 为 0-1 之间的填充度（按 5 字段族加权，**只计 `user_confirmed` 字段**），驱动渐进补全决策 + Brief 确认 3 档分流。`history.last_used_axes` 由 Rotation Hint 使用。

### Section 2: Trigger Modes（B+C 混合）

**模式 1: 首次轻量启动（Lite Onboarding）**

触发条件：
- 用户首次进入 Brief Discovery（profile.json 不存在或 `completeness < 0.3`）
- 已通过 API Key 验证

执行：仅问 **5** 题最关键的字段（[MERGE: 新增 L0 公司所在国，作为 trade_mode 推断锚点]）：

- **L0 单选（新增，必答）**："您的公司主要在哪个国家/地区运营？"
  - 用途：写入 `profile.company.country`，作为后续 trade_mode 推断的锚点
  - 候选：从国家码对照表（discovery-playbook §4.1）+ "其他" 选项
- L1 单选："您的公司主要做什么？" → (a) 制造商 (b) 贸易商 (c) 服务商 (d) 品牌商
- L2 文本："您的主营产品/服务关键词（1-3 个）？"
- L3 多选："您主要服务哪些地区的客户？" → 常用候选 + 自定义
- L4 单选（可跳）："您通常想触达哪类决策角色？" → 候选列表

完成后写入 `profile.json`（这 5 题答案 source 均为 `user_confirmed`），`completeness` 标记 0.3 左右，然后进入正常 Brief Discovery 流程。

> **L0 + L3 一起构成首次 trade_mode 推断的基础**。若 L3 与 L0 完全一致 → trade_mode 默认 domestic；若 L3 不含 L0 → cross_border；若 L3 含 L0 且含其他 → mixed。

**模式 2: 渐进补全（Progressive Enrichment）**

每次 Brief Discovery 开始时检查 Profile，若某字段族缺失，在对应 Gray Area 提问完毕后顺手追问一题：

> "顺便问一下，您方便告诉我贵公司相对竞品的核心卖点吗？（例如：质量认证 / 自研产线 / 30 天发货 / 行业经验 / 定制化能力 等——按您所在行业的常见维度）这些会被用于以后的开发信生成，不影响本次搜索。"

每次补全后写回 `profile.json`，source 设为 `user_confirmed`，更新 `completeness`。

**模式 2.5: 模型推断追问（Agent Inference Confirmation）**

> **[MERGE: from D §6.3]** 新增模式。

当模型从对话中**自动推断**出某字段值（例如用户说"我们也卖到东南亚"，模型推断 `regions_primary` 应包含 ["SG", "MY", "TH", "VN"]），先以 `source: agent_inferred` 写入 Profile，**同时**在当前会话末尾追问：

> "我从对话中理解到您还服务于东南亚——把 SG, MY, TH, VN 加入您的主要市场吗？
> (a) 全部加 (b) 仅 SG, MY (c) 都不要 (d) 让我手动选"

用户回答后：
- 若选择 (a)/(b)/(d)，对应字段 source 改为 `user_confirmed`
- 若选择 (c)，从 Profile 中移除这些字段
- 用户不回答时（24 小时无后续会话），`agent_inferred` 字段保留但**不参与 Discovery 默认值**

**模式 3: 用户主动管理（Management Workflow）**

提供 `## Merchant Profile Management` workflow，让用户随时：
- 查看当前 profile（隐藏 sender_email 等敏感字段，**展示 source 标记**：例如 `regions_primary: US (✓确认) / DE (✓确认) / AU (?待确认，模型推断)`）
- 修改任意字段（"把 regions_primary 改成 US, JP"）
- 清空重建（"重新设置经营画像"）
- 导出/导入（提示用户文件位置）

### Section 3: Discovery 端复用规则

Brief Discovery 的每个 Gray Area 必须在提问时**优先呈现 Profile 默认值**：

> **[MERGE: from D §6.3 强化]** 默认值**只取 `source: user_confirmed` 或 `imported` 的字段**，`agent_inferred` 字段不参与默认值（防止推断被静默使用）。

- Gray Area A（产品锚点）→ 默认值取自 `offerings.primary_products` + `offerings.product_keywords_en/zh`（A 类字段，默认 user_confirmed）
- Gray Area A（公司类型）→ 默认值取自 `target_baseline.company_types`（A 类）
- Gray Area B（行业）→ 默认值取自 `offerings.applications` 反推（**仅 user_confirmed 项**）
- Gray Area C（地理包含）→ 默认值取自 `target_baseline.regions_primary` 中 `source = user_confirmed/imported` 的子集
- Gray Area C（地理排除）→ 默认值取自 `target_baseline.regions_excluded` + `exclusions.competitor_domains` 对应国家
- Gray Area D（规模）→ 默认值取自 `target_baseline.employee_range`（A 类）
- Gray Area E（角色）→ 默认值取自 `target_baseline.decision_roles` 中 `source = user_confirmed/imported` 的子集

提问模板（带默认值 + source 标识）：

> 包含哪些目标市场？
> - 默认（来自您的画像）：US, DE, UK, AU
> - 注：您画像里还有 JP (待确认，上次对话中提到) 没纳入默认。
> - (a) 保持默认 (b) 调整地区（请告诉我加哪个/减哪个）(c) 完全重新选择 (d) 把 JP 加上

若用户修改了某个 Gray Area 的默认值，**询问是否把修改写回 Profile**：

> 您把地理范围从 [US, DE, UK, AU] 改成 [US, JP]。是否更新到您的经营画像（影响以后的默认推荐）？
> (a) 是，更新到画像（source: user_confirmed）
> (b) 仅本次有效（不写回）

### Section 4: 触达端复用规则

**作用域明确**：
- Workflow C 的**公司搜索/联系人发现前半段**复用 Discovery / Expansion / Anti-Staleness / Profile 默认值：即从"Search companies"到"Display contact list"之前可以接入本 Harness。
- Workflow C 进入"ask user to confirm recipients and email content"后，必须回到原触达安全链路；不得让 Discovery/Expansion/Sales Mentor 跳过邮件确认。
- Workflow D 作为个性化触达，沿用 C 的安全边界；个性化内容可读 Profile 默认值，但发送确认链路不改。

在 SKILL.md 的「Output Formatting → Email send feedback」段落上方增加引用：

> 当生成开发信时，若 Profile 存在，模板可自动注入：
> - 签名块来自 `outreach_identity.signature_block`
> - 主推产品/USP 来自 `offerings.primary_products` + `offerings.usps`（**仅 user_confirmed 项**）
> - 偏好语言来自 `outreach_identity.preferred_language`（**若为 null，按 §1 末尾的懒加载推断规则确定默认值，向用户确认后写入**）
> - 销售目标 / 时间盘 / 切入方式参考来自 `sales_context`（驱动 sales-mentor-playbook §4 销售旅程预演的模板选择）

具体落地由模型在调用 `/emails/send/batch` 或 `/emails/send/personalized` 前按规则填充邮件草稿；但必须先展示收件人列表 + 邮件内容并取得用户明确确认，不引入新 API，不改变 EDM 配额确认与发送后反馈。

### Section 5: Sensitive Fields & Privacy

- `outreach_identity.sender_email` / `sender_name` 视为半敏感字段：
  - 写入磁盘时正常存储（mode 0600 保护）
  - 在用户查看 Profile 时**默认隐藏**（显示 `r***@example.com`），明确要求"显示完整"才展开
  - 报告分析事件时**永不上报**
- 删除整个 profile.json 的命令必须明确（`rm ~/.config/okki-go/profile.json`），并在 Management workflow 中提供"清空重建"操作
- **新增**：`source: agent_inferred` 的字段在用户查看 Profile 时必须**清晰标识**（如 `🔮 模型推断`），让用户知道哪些是 AI 猜的、哪些是自己说的，可一键拒绝或确认

---

## 文件 2：新增 `references/discovery-playbook.md`

文件骨架（约 380 行）：

### Section 1: When to Run Discovery (Information Sufficiency Check + Hard Guardrails)

软性 gate 的判定逻辑：

- **Skip Discovery 条件（任一满足即跳过）**：
  - 用户首条消息已包含 ≥3 个维度（产品/品类 + 地理 + 角色/规模 中至少 3 项显式出现）
  - 用户使用明确跳过措辞："直接搜"、"先试一下"、"skip discovery"、"go directly"
  - 用户在本会话中已经完成过一次 Brief，且新请求是同一 brief 的延续
- **Enter Discovery 条件（默认路径）**：上述都不满足
- **示例标定**（让弱模型可直接照表判断）：
  - "找一些公司" → Enter
  - "找电子产品采购商" → Enter（只有 1 个维度）
  - "找美国和德国 100-500 人的 DTF printer 制造商采购总监" → Skip（4 个维度）
  - "直接搜德国汽配公司" → Skip（用户指令）

> **[MERGE: from D §9.4 硬护栏清单]** —— Sufficiency Check 末尾新增硬护栏节，确保"跳过 Discovery"不被滥用为"跳过一切确认"。

### Section 1.1: ⚠️ Hard Guardrails — 即使跳过 Discovery 仍必须执行

**「直接搜」只跳过 Brief Discovery 提问，不跳过以下任何一项**：

1. **付费动作前的确认（Billing Confirmation Rules）**：
   - 调 `/companies/unlock` 前 → 必须按 Billing Rule 1 确认，**除非**用户明确说"unlock this company / 解锁这家公司 / 获取这家公司联系人"
   - 调 `/contacts/search` 前 → 必须按 Billing Rule 1 确认（首次或非首次）
2. **邮件发送前的确认**：
   - 调 `/emails/send/personalized` / `/emails/send/edm` 前 → 必须明确确认收件人列表 + 邮件内容
3. **身份与认证**：
   - 任何未通过 Authentication & API Key Setup 的请求 → 一律拒绝
4. **法务与合规**：
   - 用户请求批量发邮件给"未在贵公司画像目标市场内"的国家时 → 提示合规风险
5. **不可绕过的安全规则**：
   - 不展示内部 `domain` 字段
   - 不在响应中包含完整 `sender_email`（除非用户明确要求）

**模型自检模板**（在响应"直接搜"请求时内部检查）：

> 在跳过 Brief Discovery 前我是否确认：
> - [ ] 本次只调用免费 API（search-advanced + balance check）？
> - [ ] 若用户在同一句中要求 unlock / 联系人 / 发邮件，我是否准备好按 Billing Rule 1 单独确认？
>
> 若任一答案为否，提示用户拆分请求或先做计费确认。

### Section 1.2: 「直接搜」与 unknown trade_mode 的优先级

> **落地修正**：`直接搜 / skip confirmation` 只能减少交互摩擦，不能强制完成画像，也不能阻塞免费搜索。`trade_mode = unknown` 时应降级导师能力，而不是中断用户明确要求的免费 search。

优先级从高到低：

1. **认证与计费/发送安全**：Authentication、Billing Confirmation Rules、邮件发送确认永远最高优先级。
2. **用户明确要求的免费公司搜索**：如果用户说"直接搜"且本次只需要 `search-advanced`，即使 `profile.company.country` 缺失，也允许执行免费搜索。
3. **画像与导师增强**：`trade_mode = unknown` 时跳过或弱化依赖 trade_mode 的 Business Context BC3、Blind-Spot 类 2/4、Sales Journey Preview 分支模板；不得编造公司所在国。
4. **搜索后轻量补全**：结果展示后再提示："补充贵公司所在国家后，我下次可以判断本次是本地/跨境/混合场景，并给更贴近的销售建议。"

具体规则：

- 用户说「直接搜」/ `skip confirmation`：
  - 已有足够搜索参数 → 走 Tier 1，直接调用免费 `search-advanced`
  - 参数仍不足以构造 API 请求（例如只有"找客户"）→ 只问最少必要字段：产品/品类 + 目标地区；不要启动完整 Lite Onboarding
  - 同一句包含 unlock / 联系人 / 发邮件 → 先按 Hard Guardrails 做计费或发送确认，不能把"直接搜"理解为授权付费/发送
- `trade_mode = unknown`：
  - 免费搜索可继续
  - Sales Mentor 只能输出国家无关的方法论建议
  - 任何需要 `profile.company.country` 的建议必须延后到用户补全后

### Section 2: Five Gray Areas

按固定顺序提问，每个区域 2-3 题，全部使用「带候选选项的单选/多选」格式，禁止开放性问题。**每题必须优先呈现 Merchant Profile 的 user_confirmed 默认值**（详见 merchant-profile-playbook §3）。

- **A. 产品/品类锚点**（必答）
  - A1 单选："您主要想触达哪一类公司？"
  - A2 多选："您的核心产品/品类关键词？"
  - A3 单选（可跳）："产品关键词如何与行业关键词组合？" → (a) 严格匹配（and）(b) 宽松匹配（or）

- **B. 行业上下文**（可跳）
  - B1 多选："优先聚焦的行业？"
  - B2 单选："是否限定主行业必须精确匹配？" → (a) 是 (b) 否

- **C. 地理覆盖**（必答）
  - C1 多选："包含哪些目标市场？" → 常用候选（US/DE/UK/JP/AU/...）+ "全球" + 自定义
  - C2 多选（可跳）："明确排除哪些市场？"

- **D. 规模与生命周期**（可跳）
  - D1 单选："目标公司员工规模？" → (a) <50 (b) 50-200 (c) 200-1000 (d) 1000+ (e) 不限
  - D2 单选（可跳）："是否优先有邮箱的公司？" → (a) 是（withEmails=true）(b) 否
  - **D3 单选（必答）："您希望总共找到多少家公司？"** → (a) 10-20 (b) 20-50 (c) 50-100 (d) 100+ (e) 越多越好（默认 30）
    - 这一题驱动 Expansion 的触发阈值，是双层 harness 的衔接点

- **E. 决策角色**（可跳，但强烈建议）
  - E1 多选："您想触达的决策角色？" → 候选 + 自定义
  - E2（仅在 E1 已填时）："这些角色用于 (a) 后续 profileEmails 筛选 (b) 直接走 contacts.search"

每个问题模板都包含：英文版 + 中文版。

### Section 3: Prospecting Brief Schema

会话内存 JSON 结构（不持久化到文件）：

```json
{
  "product_anchor": ["DTF printer"],
  "company_type": ["manufacturer", "trading"],
  "industry": ["textile printing"],
  "cross_field_operator": "and",
  "geo_include": ["US", "DE", "UK"],
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

`target_count` 来自 D3（默认 30），`expansion_rounds` 由 Expansion 写入，`ladder_applied` 由 Broadening Ladder 写入（每轮一条记录）。

**会话内派生变量（不持久化到 Brief）**：

> **[MERGE: 用户对话决策]** Brief schema 不含 `trade_mode` 字段——它是个**会话内派生变量**，每次 Brief 确认后由模型按 `derive(profile.company.country, brief.geo_include)` 实时计算（详见总体策略节「Dynamic Trade Mode Inference」）。

派生时机：
- Brief 生成后、Pre-Search Brief Statement（§5.0）之前
- Brief 因用户调整而重新确认时，重新派生一次

派生结果在会话内传递给：
- `discovery-playbook §5.0 Pre-Search Brief Statement`（向用户展示场景识别）
- `expansion-playbook §1 Trigger Rules`（影响 Expansion 维度选择启发式）
- `sales-mentor-playbook §1/§2/§4`（影响 Business Context Lite / Blind-Spot / Sales Journey Preview 的模板分支）

### Section 4: Brief → API Parameter Mapping

明确每个 Brief 字段如何映射到 `POST /api/v1/companies/search-advanced`，避免模型臆造参数：

- `product_anchor` → `productKeywords`
- `company_type` → `companyTypeKeywords`
- `industry` → `industryKeywords`
- `cross_field_operator` → `crossFieldOperator`
- `geo_include` → `includeCountry`（**ISO alpha-2**，见 Section 4.1 国家码对照表）
- `geo_exclude` → `excludeCountry`
- `with_emails_only` → `withEmails`
- `employee_range` → 不写入 search-advanced（API 不支持），改为在结果端通过 `employees_count` 字段过滤后展示
- `decision_roles` → 不写入 search-advanced，用于后续 `profileEmails` 的 `keyword` 参数或 `contacts/search` 的 `title` 参数

**本地软过滤分页策略（employee_range 等 API 不支持字段）**：

当 Brief 含 `employee_range` 或其他只能结果端过滤的字段时，不能只拉第一页就判断 total/Expansion：

- `search-advanced.size` 默认设为 50（API 最大页大小），从 `from=0` 开始。
- 对返回列表做本地过滤后，得到 `filtered_results`。
- 若 `filtered_results.length < min(target_count, 30)` 且 API `total > from + size`，最多继续拉到以下任一上限：
  - 已过滤结果达到 `min(target_count, 30)`
  - 已扫描 150 条原始结果（3 页 × 50）
  - 用户明确要求更少
- 经过分页软过滤后，再用 `filtered_results.length` 触发 Ladder / Full / Lite Expansion；不要用 API 原始 `total` 直接触发。
- 展示时说明："规模字段由结果端过滤，已扫描前 N 条，符合规模条件 M 家。"
- 若用户目标数 > 30 或要求继续翻页，必须先询问是否继续扩大扫描范围，避免免费 API 循环失控。

> **[MERGE: from D §13.1 联系人不污染公司搜索]** 强调语：

> **⚠️ 严禁**：不要把 `decision_roles`（采购经理 / Procurement Manager 等）塞进 `productKeywords` / `industryKeywords` / `companyTypeKeywords`。"采购经理"是个**人的角色**，不是公司维度。错误做法示例：把 `productKeywords: ["DTF printer", "Procurement Manager"]` 传给 search-advanced，会让搜索结果严重失真。

### Section 4.1: 国家码对照表（中文 / 英文别名 / ISO alpha-2）

> **[MERGE: from D §16.3 国家码映射]** —— D 原版建议国家码脚本化，本合并版对国家码仍采用**内嵌对照表 + 兜底规则**；本次仅为本地状态 JSON 引入 `okki-state.js`，不把国家码、Brief 校验、Search Plan 生成脚本化。

**OKKI Go 业务高频国家（约 50 个，覆盖 95%+ 实际流量）**：

| ISO | 中文 | 英文别名 |
|-----|------|---------|
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

**易错点白名单（必读）**：

- 英国 → **GB**（不是 UK，UK 不在 ISO 3166-1 中）
- 韩国 → **KR**（默认指 South Korea，与朝鲜 KP 严格区分）
- 中国 → **CN**（不含 HK / TW / MO；这三个在 ISO 中是独立条目）
- 瑞士 → **CH**（与瑞典 SE 极易混淆）
- 捷克 → **CZ**（不是 CR，CR 是哥斯达黎加）
- 阿联酋 → **AE**（不是 UAE）

**兜底规则**：

1. 列表外的国家 → 按 ISO 3166-1 alpha-2 标准生成（如蒙古→MN，柬埔寨→KH）
2. 不确定时 → 向用户确认而非猜测（"乌兹别克斯坦的 ISO 代码是 UZ 吗？"）
3. 拼写错误容错（"Germay" / "deutschland"）→ 模型应内部校正后给出 DE，并附一句"我假设您指的是德国 (DE)"

### Section 5.0: Pre-Search Brief Statement（按 completeness 分流 + trade_mode 派生展示）

> **[MERGE: from D §15.1 搜索前简短说明 + 冲突 3 D 方案 completeness 分流 + 用户决策 trade_mode 派生]** —— 进入 search-advanced 调用前的最后一步，根据 `profile.completeness` 决定告知详尽程度，并**同步派生 trade_mode 展示给用户**。

**派生 trade_mode（强制，在所有 Tier 之前）**：

```
trade_mode = derive(profile.company.country, brief.geo_include)
```

派生结果作为下一步告知/确认的隐式上下文，让用户对"AI 当前理解的场景"有清晰感知。

**3 档分流逻辑**：

**Tier 1: completeness > 0.7（效率模式 / Pre-Search Brief Statement）**

不展示完整 Brief Confirmation Template。直接一句话告知，**不等待用户回应**就调 API。话术需要包含 trade_mode 识别结果：

> 本次场景识别为 **[trade_mode 中文标签]**（您公司在 [profile.country]，目标市场含 [brief.geo_include]）。
>
> 我将按 [产品 / 公司类型 / 地区 / 规模 / 目标数] 搜索。
> 如果结果少于目标数，我会从 [对应维度] 补充候选；
> 如果超过目标数，我会附上 2 个您可能没想到的角度。
> （如需调整请立即告诉我）

**trade_mode 中文标签映射**：

- `domestic` → "本地市场开发（内贸）"
- `cross_border` → "跨境市场开发（外贸）"
- `mixed` → "本地 + 跨境混合"
- `unknown` → "场景未完整识别（缺少贵公司所在国）"；若用户未要求直接搜，先回 Profile 补 company.country；若用户明确直接搜，则继续免费搜索并跳过依赖 trade_mode 的导师分支

用户随时可以打断（"等等，改一下地区"），模型立即停止 API 调用并进入 §5 Brief Confirmation Template。

**Tier 2: 0.3 ≤ completeness ≤ 0.7（标准模式 / Brief Confirmation Template）**

走 §5 完整 Brief Confirmation Template，等用户明确确认才调 API。模板中第一行**展示 trade_mode 识别结果**：

> 本次场景识别为 **[trade_mode 中文标签]**。
>
> 我已经整理出您的潜客画像 brief：
> ...（详见 §5）

**Tier 3: completeness < 0.3（首次模式 / Lite Onboarding 优先）**

先走 merchant-profile-playbook §2 模式 1 的 Lite Onboarding（**5 题，含 L0 公司所在国**），完成后 `completeness` 升到 0.3-0.5，再走 Tier 2 路径。Lite Onboarding 完成后**立即可以派生首次 trade_mode**（基于 L0 + L3 的回答）。

**用户强制开关**：

- 用户说「这次帮我严格确认」/「strict mode」 → 即使 completeness > 0.7 也强制走 Tier 2
- 用户说「直接搜」/「skip confirmation」 → 即使 completeness < 0.7 也强制走 Tier 1（但仍受 §1.1 硬护栏和 §1.2 unknown 降级规则约束）；若无法构造免费搜索请求，只问最少必要字段，不启动完整 Lite Onboarding

### Section 5: Brief Confirmation Template

Tier 2 标准模式使用，模型必须用统一模板向用户呈现 brief 并请求确认，禁止直接调 API：

> 我已经整理出您的潜客画像 brief：
> - 公司类型：制造商
> - 产品关键词：DTF printer
> - 行业：纺织印刷
> - 地区：US, DE, UK
> - 规模：50-500 人
> - 决策角色：采购经理、采购总监
> - 目标数量：30 家（若不足将自动进入发散探索）
>
> 我将基于此调用搜索（首次搜索免费）。是否确认？

---

## 文件 3：新增 `references/expansion-playbook.md`

文件骨架（约 280 行）：

### Section 1: Trigger Rules（三态触发 + Broadening Ladder 前置闸门）

> **[MERGE: from D §14.5 Broadening Ladder]** —— P 的 Full Expansion 只处理"加候选关键词"。Ladder 作为前置闸门，处理"参数本身过严"的极端低召回 case。

Expansion 共三种运行模式，**每次首轮 search-advanced 完成后必经一次模式判定**：

```
首轮 search-advanced 完成
  ↓
total < 5？
  ├─ 是 → 走 Broadening Ladder（前置闸门，最多 1 轮）
  │       Ladder 跑完仍不足 → 继续走 Full Expansion
  └─ 否 → total >= target_count？
         ├─ 否 → Full Expansion（加候选关键词，多轮上限 3）
         └─ 是 → Lite Expansion（附加 2 维度新视角）
```

**模式 0: Broadening Ladder（极端低召回，参数放宽）**

触发条件：`response.total < 5`

行为（按顺序逐步放宽，每步告知用户）：

1. **Step 1**: `crossFieldOperator: "and" → "or"` —— 提示："因为符合所有条件的公司太少（只有 X 家），我先把交叉匹配条件从严格（and）改成宽松（or）。"
2. **Step 2**（若 Step 1 后仍 < 5）：去掉最次要的 `industryKeywords` —— 提示："去掉 'textile printing' 这个行业限制，看看更多公司。"
3. **Step 3**（若 Step 2 后仍 < 5）：去掉 `withEmails: true` 过滤 —— 提示："放开'必须有邮箱'的限制（找到后可单独筛选有邮箱的）。"

**关键约束**：

- Ladder **只跑 1 轮 search-advanced**（虽然内部步骤可能尝试多个放宽组合，但最多发起一次 API 调用——即 Step 1/2/3 是组合策略而非串行调用）
  - 推荐实现：先尝试 Step 1，若用户给的 industryKeywords 较多则同时执行 Step 1+2
- 必须**显式告知用户每一步放宽了什么**（透明性原则）
- Ladder **不计入** Full Expansion 的 3 轮上限
- 若用户在 Brief 中明确说"只要精确匹配" / "strict only" → 禁用 Ladder，直接进入 Full Expansion
- Ladder 完成后将 `brief.ladder_applied = true` 写入会话内存，避免同 brief 重复触发
- Ladder 后 `total` 仍 < target_count → 自动进入 Full Expansion

**模式 1: Full Expansion（结果驱动自动触发）**

触发条件：`response.total >= 5 AND response.total < brief.target_count`

行为：
- 不询问用户，**自动进入**完整候选展示
- 覆盖 5 个维度，每维度生成 5-8 个候选
- 用户勾选后走第二轮 search，必要时多轮（上限 3 轮）

停止条件：
- 用户回复"够了"/"不需要更多"
- 累计扩展轮数 ≥ 3
- 累计 total 已达 target_count

**模式 2: Lite Expansion（常态化轻量发散）**

触发条件：`response.total >= brief.target_count`

行为：
- 不打断主流程，结果表展示后**附带**一段「您可能没考虑过的角度」
- **仅生成 2 个维度**的候选（由模型从 5 个维度中挑最有信息量的 2 个，默认 A 价值链 + C 应用场景）
- **每维度仅 2-3 个候选**，每个候选仍必须附"为什么是潜客"理由

用户开关：
- 用户可说"关闭发散建议" → 本会话不再展示 Lite Expansion
- 用户可在 Brief 确认前明确说"只要精确匹配" → 本次跳过 Lite Expansion
- 默认开启

**模式互斥**：每次首轮 search 后只走其中一种主模式，但 Ladder 可与 Full Expansion 串联。

### Section 2: Five Expansion Dimensions

每个维度由模型生成候选，**每个候选必须附 1 句"为什么是潜客"理由**。

候选数量按模式不同：
- **Full Expansion**：每维度 5-8 个候选，全部 5 个维度都展开
- **Lite Expansion**：仅展开 2 个维度（默认 A + C），每维度 2-3 个候选

- **A. Value Chain (价值链上下游)** — 上游 / 下游
- **B. Adjacent Products (相邻/替代产品)** — 同类替代 / 互补品 / 升降级
- **C. Application Scenarios (应用场景反推)** — 反推该产品/服务用在哪些场景
- **D. Synonyms (同义/变体关键词)** — 中英别名、行业术语、缩写、口语化
- **E. Geo Adjacency (地理外溢)** — 邻近市场、同语言/文化圈、产业集群外溢

### Section 3: Candidate Output Format

**Broadening Ladder 模板**（极端低召回时，先于其他 Expansion）：

```markdown
首轮搜索只找到 3 家公司。看起来您的条件比较严格——让我尝试放宽：

**放宽 Step 1**: 把"严格匹配（and）"改成"宽松匹配（or）"
**放宽 Step 2**: 暂时去掉行业过滤（industryKeywords: textile printing）

执行第二轮搜索...

（再次返回结果后，若 total < target_count，继续进入 Full Expansion）
```

**Full Expansion 模板**（结果不足时）：

```markdown
首轮搜索结果不足（找到 12 家，目标 30 家）。我从 5 个维度生成了发散候选，请勾选感兴趣的方向：

### A. 价值链上下游
- [ ] (下游) 印花服装代工厂 — 大批量采购 DTF 用于订单
- [ ] (下游) 个性化电商品牌 — 自有打印产能或外包印花需求
- [ ] (上游) DTF 油墨制造商 — 你的客户的供应商，可能接触同一终端品牌

### B. 相邻产品
- [ ] DTG printer 制造商 — 印花技术相邻，买家画像高度重合

### C. 应用场景
...（剩余维度）

请回复您要勾选的编号（如 "A1, A2, B1"），或回复"够了"停止发散。
```

**Lite Expansion 模板**（结果充足，附加视角）：

```markdown
💡 您可能没考虑过的角度（基于您的产品 DTF printer）：

**A. 价值链下游**
- [ ] 个性化服装电商品牌 — 大批量印花需求，决策周期短
- [ ] 体育队服定制工坊 — 季节性集中采购，预算稳定

**C. 应用场景延伸**
- [ ] 广告礼品商 — DTF 用于一次性订单印花

想看其中任何一个方向的公司吗？回复编号即可；不感兴趣可直接进入下一步。
```

**维度选择启发式**（Lite 模式专用）：
- 默认选 A + C
- 若 brief 中 `geo_include` 仅 1-2 个国家 → 换 A + E（地理外溢）
- 若 brief 中 `product_anchor` 维度单一 → 换 B + C（相邻产品）

### Section 4: User Selection Format

接受用户输入的形式：
- 编号列表：`A1, A2, B1`
- 全部勾选某维度：`A 全选` / `all of B`
- 自然语言：`下游全要，相邻产品的 DTG`
- 终止信号：`够了` / `stop` / `不要了`

### Section 5: Candidate → Brief Field Mapping

每个被勾选的候选必须能映射回原 brief 的某个字段，注入后形成「扩展 brief」走第二轮搜索：

- A 维度（上下游）→ 注入新的 `company_type` + `industry` 关键词
- B 维度（相邻产品）→ 注入新的 `product_anchor`
- C 维度（应用场景）→ 注入新的 `industry` 关键词
- D 维度（同义词）→ 在原 `product_anchor` 数组中追加
- E 维度（地理）→ 注入新的 `geo_include`

注入策略：
- 不覆盖原 brief，**追加**到对应数组字段
- 单轮 expansion 可勾选跨多个维度的候选，但**每轮只产生一次** `search-advanced` 调用
- `crossFieldOperator` 在 expansion 轮强制使用 `"or"`（扩大召回意图）

### Section 6: Multi-Round Rules

- 每轮 expansion 完成后立即评估 `cumulative_total vs target_count`
- 若仍不足 → 询问用户是否继续：`已累计 24 家，距目标 30 家还差 6 家，要再发散一轮吗？`
- 上限 3 轮（防失控）
- 每轮的勾选项与生成的搜索参数都写入 `brief.expansion_rounds[]`，便于用户回顾
- **Ladder 不计入这 3 轮**

---

---

## 文件 5：新增 `references/sales-mentor-playbook.md`

> **[MERGE: 用户对话决策 — 中改方案 B''（默认有源 + 2 条 💭 额度 + 可疑词警戒清单 + 全模型统一约束 + 铁律 0 国家无关）]**
>
> 横跨 Discovery / Expansion / Result 三段的「**导师视角注入**」playbook。让模型在 Prospecting 全流程中扮演有 B2B 销售经验的伙伴而非中性搜索助手，同时通过 B'' 保护机制防止伪造"高人智慧"。

文件骨架（约 350-400 行）：

### 铁律 0：playbook 内容必须国家无关

playbook 静态内容**禁止**硬编码任何：
- 具体工具名（如微信 / LINE / WhatsApp / 飞书）
- 具体平台名（如政府采购网 / LinkedIn / 抖音 / 行业 B2B 网站）
- 具体认证名（如 CCC / CE / FCC / NMPA / SC）
- 具体文化习惯（如行业群组文化 / 名片交换文化 / 喝酒文化）
- 具体本地法规 / 时段习俗 / 地域偏见

这些都必须由模型在**运行时**基于 `profile.country` + `brief.geo_include` **动态生成**，并强制带 💭 标记 + 受 §5 Must NOT Say 约束。

**铁律 0 自检方法**：把所有出现具体地区名词的地方盖住，看 playbook 框架是否仍能成立。如果不能，说明你把某个国家的特定情况当成了通用规则。

### Section 0: Persona & Operating Mode

```
你在协助一位 B2B 销售从业者开发潜客。

本 Skill 不预设任何地理 / 文化 / 工具背景。每次 Brief 完成后：
- 根据 profile.company.country + brief.geo_include 派生 trade_mode
  （domestic / cross_border / mixed / unknown）
- 所有具体建议（沟通工具 / 本地法规 / 本地行业渠道 / 本地文化习惯等）
  必须基于 profile.country 动态生成，并强制带 💭 标记
- playbook 内部只提供国家无关的抽象框架，遵守铁律 0

你的角色是「一位有 B2B 销售经验的伙伴」——而非中性的搜索助手。
你的建议必须与当前 trade_mode 保持一致：
- domestic 场景下不要默认进入"开发信"模式
- cross_border 场景下不要默认进入"本地协会"模式
- mixed 场景下分组给两套建议
- unknown 场景下先补 profile.country，不擅自假设
```

**B'' 保护机制（统一应用所有模型，无强弱区分）**：

1. **默认有源**：所有"经验式判断"必须有可追溯来源：
   - Profile 字段（如 "您画像里 USP 含 X..."）
   - 本会话用户陈述（如 "您刚才提到 Y..."）
   - playbook 模板规则（如 §2 盲点检查的固定逻辑）
2. **2 条 💭 额度**：每次响应中最多 2 条 `💭 个人推断` 标记的无源判断。强制模型对"哪些经验值得说"做取舍——这本身就是导师能力。
3. **可疑词警戒清单**（详见 §5 Must NOT Say）：禁止 6 类高风险表述
4. **不知道直说**：模型不掌握的领域必须直接说"我不掌握这方面情报，建议您结合自己的经验"——这本身就是导师质感

### Section 1: Business Context Lite（两阶段执行：BC1/BC2 前置，BC3 在 trade_mode 派生后）

**插入位置**：
- **BC1/BC2**：discovery-playbook 在 Five Gray Areas 之前新增 §0，先收集销售目标和时间盘。
- **BC3**：必须等 Brief 生成并派生 `trade_mode` 后再问；如果 `trade_mode = unknown` 且用户要求直接搜，则跳过 BC3，避免为了导师建议阻塞免费搜索。

**3 道商业语境题**（BC1 必答 / BC2-3 可跳），答案写回 `profile.sales_context`。若用户说"直接搜"，BC1/BC2 也可延后到结果展示后补问。

#### BC1（必答）销售目标语境

```
本次潜客开发的核心目的？
(a) 拓新市场（首次进入某地区/行业）
(b) 深耕现有市场（在已成交的地区找更多客户）
(c) 补充淡季 / 测试新产品反应
(d) 建立长线 pipeline（无明确成交时间盘）
(e) 其他（让用户描述）
```

#### BC2（可跳）时间盘

```
希望多久内有第一批正面反馈？
(a) 本月 / 本季度（紧迫）
(b) 半年内（标准）
(c) 长线培养（半年以上）
(d) 不确定
```

#### BC3（可跳）切入方式偏好（按 trade_mode 分支，使用抽象维度）

执行前置条件：
- Brief 已生成
- `profile.company.country` 与 `brief.geo_include` 已足以派生 `trade_mode`
- 用户没有要求跳过导师模式 / 直接搜到底

```
trade_mode = domestic 时：
  (a) 电话 + 即时通讯一对一
      （💭 即时通讯工具按您所在地常用应用，请告诉我您主要用什么）
  (b) 行业协会 / 行业组织资源
  (c) 行业垂直展会 / 线下活动
  (d) 招投标 / 集中采购平台
      （💭 平台按您所在国家具体生态，请告诉我您所在国是否有主流平台）
  (e) 行业垂直媒体投放（含视频内容获客）
  (f) 行业垂直社群 / 论坛
  (g) 不确定，让 AI 后续给建议

trade_mode = cross_border 时：
  (a) 邮件群发（EDM）
  (b) 国际职业社交平台一对一
      （💭 主流为 LinkedIn；针对特定区域市场可能另有平台）
  (c) 国际展会名单交叉
  (d) 搜索引擎广告 + Landing Page
      （💭 主流为 Google Ads；中国大陆访问需考虑本地化适配）
  (e) 海外行业垂直媒体投放
  (f) 不确定，让 AI 后续给建议

trade_mode = mixed 时：
  分两次问 ——「对本国客户的切入方式」+「对海外客户的切入方式」

trade_mode = unknown 时：
  跳过本题；若用户未要求直接搜，提示补 profile.company.country；若用户要求直接搜，搜索后再轻量提示补全
```

> **铁律 0 自检通过**：domestic 选项里完全没有任何具体应用名；cross_border 里 LinkedIn / Google Ads 因有近乎垄断地位作为「主流为...」中性陈述列出，且**主动注明地区适配点**。

**写回 Profile**：

`sales_context: { goal, time_horizon, channel, source: user_confirmed, updated_at }`

每次 Discovery 前先读，若已有 BC1/BC2 则展示「上次的销售目标是 [X]，本次保持还是调整？」——避免重复问。BC3 只有在当前 `trade_mode` 已知后才复用或追问，避免用旧场景的渠道偏好污染新 brief。

### Section 2: Blind-Spot Checklist（盲点检查，Brief 确认前必扫）

**触发时机**：Brief 生成后、Pre-Search Statement 或 Brief Confirmation Template **之前**。

模型必须扫一遍以下 5 类盲点，发现命中至少 1 项时，必须在 Brief 旁边给「💡 销售经理提示」：

| # | 盲点类型 | 抽象触发规则（国家无关） | 提示模板示例 |
|---|---|---|---|
| 1 | **画像-目标错配** | Profile 的产品价位/USP 与本次目标客户类型在价位带上明显不匹配 | "您画像里产品是 Tier-1 + 高价位定位，但本次要找 [低价位客群类型]——他们通常对价格敏感，建议确认是否调整切入策略" |
| 2 | **市场-合规错配** | trade_mode != unknown AND brief.geo_include 中含某市场 X AND 该市场对用户产品类型有已知强制性合规要求 AND profile.offerings.certifications 中无对应项 | "您要找 [X] 市场的客户，建议确认 [X 市场对您产品类型的常见强制性合规要求]——但具体合规清单需要您结合所在行业核实。💭 我对 [X] 市场 [产品类型] 的认知有限，以下是一般情况：[模型动态生成]" |
| 3 | **角色未定** | decision_roles 为空且本次未问 | "您没指定决策角色——不同角色的开发信切入点差异很大（如采购侧重价格、技术侧重规格、决策层侧重 ROI），建议本次确认" |
| 4 | **时间盘-市场错配** | 时间盘紧迫（本月/本季度）但目标市场决策周期长 | "您希望本月有反馈，但 [trade_mode + market] 决策周期通常较长（💭 我的一般经验，仅供参考）。建议本次先做 pipeline，不要期望本月成交" |
| 5 | **画像-渠道错配** | sales_context.channel 选了 EDM 但 Profile 缺 sender_email/signature；或选了 LinkedIn 但 Profile 没填 social_profile_url 等 | "您本次想走 [channel]，但画像里没填 [对应必备字段]。要现在补吗？" |

**关键约束**：
- 类 1/3/5 的判断**全部有结构化来源**（Profile 字段 + Brief 字段），不依赖模型领域知识——不需 💭
- 类 2 的"具体合规清单"是模型动态生成，必须带 💭 + 受 §5 类 1/2 约束
- 类 4 的"决策周期长"判断需带 💭

### Section 3: Reverse Recommendations（反向建议）

**核心约束**：Expansion 中**每 5 个推荐方向，至少有 1 个是"我不推荐这个方向"**（反向建议占比 ≥ 20%）。

写入到 `expansion-playbook.md §3 Candidate Output Format` 作为强制要求。

**反向建议的合法结构**（必须有源）：

```
❌ 不推荐：[候选方向 X]
   原因：[结构化原因，必须命中以下之一]
   - 与您的 Profile 字段 [Y] 错配（例：您 USP 是 Tier-1，X 通常买低价位）
   - 与本次 sales_context 错配（例：您时间盘是本月，X 决策周期长）
   - 与您画像里 exclusions 字段冲突
   - 💭 个人推断：[必须带标记，且占用 2 条 💭 额度之一]
```

**禁止的反向建议**（属于 §5 警戒）：
- "X 这个方向是脉冲采购，不值得"（无源断言）
- "Y 行业不景气"（无可靠数据）
- "Z 国客户难谈"（地域偏见）

### Section 4: Sales Journey Preview（销售旅程预演）

**触发时机**：3 段结果分组展示后（🔓 / 📅 / ✨），在用户选择"接下来做什么"之前。

**强制输出 3 段建议**：

```markdown
## 📋 下一步建议（基于本次结果 + 您的画像 + sales_context + trade_mode）

### 优先级建议（Top 3）
1. **[公司名 A]** — 推荐先联系
   理由：[基于 Profile/Brief/Results 的具体匹配点，必须有源]

2. **[公司名 B]** — ...

### 切入方式建议
基于您选的 [sales_context.channel] 渠道 + trade_mode：
- 首封触达建议切入点：[基于 Profile USP + 目标客户类型]
- 💭 个人推断（仅供参考）：[最多 1 条]

### 我建议您先做的事
[1-2 条具体方法论建议，例如"先把 5 家最相似的解锁拿到联系人，
而不是一次解锁 30 家——快速验证开发信效果再放量"]
```

**按 trade_mode 出不同模板**：

```
trade_mode = domestic 时：
  - 优先维度：本地行业网络拓展、对公采购对接人挖掘
  - 付款建议：本地常见付款条款、回款风险
  - 文化提示：基于 profile.country 给本地化建议
    💭 [模型按 profile.country 动态生成]

trade_mode = cross_border 时：
  - 优先维度：海外决策人画像验证、目标市场时区与节假日
  - 付款建议：国际贸易常见付款条款（LC / TT / OA 等）、汇率风险
  - 文化提示：开发信的语言文化适配
    💭 [模型按目标市场动态生成]

trade_mode = mixed 时：分组呈现两套
```

**关键约束**：
- 优先级建议必须基于**可追溯字段**（不能是"我感觉这家好"）
- 切入方式建议中模板部分有源；💭 标记的部分最多 1 条
- "我建议您先做的事"必须是**方法论建议**（如何分批 / 如何验证），不是"具体公司怎么样"的判断

### Section 5: ⚠️ What Sales Mentors Must NOT Say（可疑词警戒清单）

模型在**任何阶段**生成内容时，**禁止**以下 6 类表述：

#### 类 1：具体数字情报
- ❌ "DE 转化率约 15%" / "决策周期通常 3-6 个月" / "EDM 平均回复率 5-8%"
- ✅ 允许：基于用户 Profile 中真实数字（"您画像里上次 DE 转化率是 X，本次..."）

#### 类 2：地理细节断言
- ❌ "DE 的 DTF 集中在 NRW 和巴登-符腾堡州"
- ❌ "JP 的采购总部多在大阪"
- ❌ "美国西海岸客户偏好简短沟通"
- ❌ 对国内省份/城市的断言（如"江浙沪客户偏好 X"）同等禁止
- ✅ 允许：国家级常识（"DE 市场普遍重视合规"——这是国家级标签）

#### 类 3：实时情报 / 公司动态
- ❌ "X 公司最近被 Y 收购" / "竞品 Z 刚续签了 3 年合同" / "A 公司在 LinkedIn 高频招聘"
- ✅ 允许：基于用户提供的实时信息延伸

#### 类 4：时间敏感断言
- ❌ "现在是 5 月，6 月前必须完成首轮接触"
- ❌ "Q4 是淡季，建议本月加快推进"
- ❌ "夏休季前要发完邮件"
- ✅ 允许：用户提及时间盘后的针对性建议

#### 类 5：行业刻板印象
- ❌ "广告礼品商是脉冲采购"
- ❌ "印度客户喜欢压价"
- ❌ "中东客户决策慢"
- ✅ 允许：基于 Profile/Brief 字段的中性判断

#### 类 6（新增）：地区文化预设
- ❌ 在 trade_mode = domestic 时假设具体工具/平台/认证名（如硬编码"微信"/"CCC"/"政府采购网"）
- ❌ 用某地区习惯泛化为"内贸"或"外贸"普遍规则（如"行业群组是内贸标配"——这是某地区特色，非全球内贸特色）
- ❌ 用"中文/英文"代替"用户所在地语言/目标市场语言"
- ✅ 允许：基于 profile.country 给的具体建议必须带 💭 + 明示"请您核实"

**违规检测自检模板**（模型在生成每段建议后内部检查）：

```
我刚才说的话：
- [ ] 是否包含类 1-6 中的任何一类？
- [ ] 如果是，能否找到 Profile / 会话陈述 / playbook 模板的来源？
- [ ] 如果都不能，是否已标 💭 且未超过 2 条额度？

任一答案为否，必须改写或删除该段。
```

---

## 文件 4：改造 `okki-go/skill/SKILL.md`

### 改动 1：新增 `## Merchant Profile` 节（在 `## Authentication & API Key Setup` 之后、`## Billing Confirmation Rules` 之前）

内容（约 50 行）：
- 概念说明：Merchant Profile 是持久化的用户经营画像，跨会话复用
- 状态文件：`~/.config/okki-go/profile.json`，mode 0600；所有读写通过 `scripts/okki-state.js profile ...` 完成
- 触发模式（B+C 混合）：
  - 首次进 Discovery 前若 profile 不存在或 `completeness < 0.3` → Lite Onboarding（5 题，含 L0 公司所在国）；若用户明确"直接搜"且已有最少搜索参数，可先免费搜，搜索后再提示补 Profile
  - 后续每次 Discovery → Progressive Enrichment（仅补缺失字段）
  - **模型推断追问（新增）**：当模型从对话推断字段时，先标 `agent_inferred` 写入，再追问用户确认
  - 用户可随时进入 Management workflow
- **Profile Management Sub-Workflow**：
  - 触发短语："查看我的画像"、"修改经营画像"、"show my profile"、"reset profile"
  - 操作：view（隐藏敏感字段 + 标识 agent_inferred）/ edit / reset / export
- 引用 `references/merchant-profile-playbook.md` 作为详细规则源
- 隐私声明：sender_email 不上报、查看时默认隐藏

### 改动 1.5：新增 `skill/scripts/okki-state.js`

内容（约 180-250 行）：
- 只负责本地状态，不调用 OKKI API，不处理业务搜索逻辑
- 使用 Node.js 标准库实现，避免新增 npm 依赖
- 统一路径：`${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/profile.json` 与 `viewed.json`
- 写入要求：
  - `mkdir -p ~/.config/okki-go`
  - 临时文件写入 + rename 原子替换
  - 文件 mode 固定 `0600`
  - JSON parse 失败时备份为 `*.corrupt.<timestamp>`，按零状态继续

建议 CLI 接口：

```bash
node scripts/okki-state.js profile read
node scripts/okki-state.js profile redact
node scripts/okki-state.js profile upsert --json '<partial profile patch>'
node scripts/okki-state.js profile update-history --json '<axes patch>'
node scripts/okki-state.js profile reset

node scripts/okki-state.js viewed classify --window-days 30 --results-json '<search result list json>'
node scripts/okki-state.js viewed mark-shown --brief-summary '...' --results-json '<displayed result list json>'
node scripts/okki-state.js viewed mark-unlocked --domain 'example.com' --country-code 'US'
node scripts/okki-state.js viewed reset
```

迁移与兼容：
- `profile.json` 缺 `version` → 视为旧版本，补 `version: "1.1"` 后写回
- B 类字段缺 `source` → 迁移为 `source: "agent_inferred"`，不参与默认值
- `viewed.json` v1.0 缺 `status` → 迁移为 `status: "viewed"`，`unlocked_at: null`
- `viewed classify` 负责按窗口天数输出 `unlocked / seen / new` 三组，模型只展示，不自行重算

### 改动 2：新增 `## Prospecting Brief Discovery (Soft Gate)` 节

位置：插在 `## Workflow Orchestration` 之前。

内容（约 50 行）：
- 说明这是软性 gate，列出触发/跳过规则（指向 discovery-playbook §1）
- **包含硬护栏清单引用**（指向 discovery-playbook §1.1）
- 强调每个 Gray Area 必须优先呈现 Merchant Profile 默认值（仅 user_confirmed 字段）
- **3 档 completeness 分流**：
  - `< 0.3` → Lite Onboarding → 0.3-0.7 路径
  - `0.3-0.7` → Brief Confirmation Template 逐项确认
  - `> 0.7` → Pre-Search Brief Statement 一句话告知 + 直接搜
- 明确顺序：Load Profile → Sufficiency Check → Hard Guardrails check → Gray Area 提问（含默认值）→ 用户确认改动是否写回 Profile → 生成 Brief（含 target_count）→ derive trade_mode → BC3（如适用）→ 3 档分流 / 直接搜 override → 映射参数 → 调 API
- 引用 discovery-playbook §1.2：`direct search` 不阻塞免费搜索；`trade_mode=unknown` 时降级导师能力而非强制中断
- 引用 discovery-playbook §4：当 `employee_range` 等字段只能本地过滤时，按分页软过滤策略决定 Expansion，不用 API 原始 total 直接判断
- 引用 `references/discovery-playbook.md`
- 内存 Brief 结构示例

### 改动 3：新增 `## Prospecting Expansion (Triple Mode)` 节

内容（约 55 行）：
- **每次首轮 search-advanced 完成后必经一次模式判定**
- **Broadening Ladder 模式**（`total < 5`）：前置闸门，参数放宽 1 轮
- **Full Expansion 模式**（`5 <= total < target_count`）：完整候选展示（5 维度 × 5-8 候选 × 多轮上限 3）
- **Lite Expansion 模式**（`total >= target_count`）：附加 2 维度 × 2-3 候选的"您可能没考虑过的角度"，不打断主流程
- Ladder + Full Expansion 可串联（Ladder 不计入 Full 的 3 轮上限）
- 列出 5 个发散维度（标题级别）+ Lite 模式的维度选择启发式（默认 A + C）
- 强调每个候选必须带「为什么是潜客」一句话理由
- 用户开关：可说"关闭发散建议"跳过 Lite；可在 Brief 确认前说"只要精确匹配"跳过 Ladder + Lite
- 引用 `references/expansion-playbook.md`

### 改动 4：新增 `## Anti-Staleness Mechanisms` 节（紧跟 Expansion 节）

内容（约 55 行）：

**A. 本地去重 + unlocked 状态标记（viewed.json v1.1）**：

- 状态文件：`~/.config/okki-go/viewed.json`，mode 0600；所有分类、写入、迁移通过 `scripts/okki-state.js viewed ...` 完成
- Schema **v1.1**（升级版）：
  ```json
  {
    "version": "1.1",
    "items": [
      {
        "domain": "techcorp.de",
        "shown_at": "2026-05-26T19:00:00Z",
        "brief_summary": "DE manufacturer DTF printer",
        "status": "viewed",
        "unlocked_at": null
      }
    ]
  }
  ```
- **status 值**：`"viewed"`（默认，仅展示过）/ `"unlocked"`（用户已付费解锁）
- **写时机**：
  1. 搜索结果展示后 → 调 `viewed mark-shown` append/update entry（status=viewed）
  2. **unlock 成功后 → 调 `viewed mark-unlocked` 找到对应 domain → status=unlocked, unlocked_at=now**（新增）
  3. 同 domain 在多次搜索中再次出现 → helper 不重复 append，但更新 `shown_at`
- **读时机**：在 `search-advanced` 调用**后、结果展示前**，调用 `viewed classify` 对每条结果分类
- **3 段结果分组**（[MERGE: from D §14.4 降级到 3 段]）：
  ```
  🔓 已解锁（status=unlocked AND unlocked_at < 30 天）— 你之前付过费的，再点免费
  📅 上次见过（status=viewed AND shown_at < 30 天）
  ✨ 新发现（不在 viewed.json 中）
  ```
- **容错**：文件不存在或损坏时按"全部为新"处理，不阻塞流程
- **去重窗口默认 30 天**，与服务端 `/companies/unlock` 30 天免费窗口对齐

**用户开关（[MERGE: 冲突 4 完整方案]）**：

- 默认窗口 30 天
- "短期记忆模式" / "记忆窗口 7 天" → 窗口改 7 天
- "长期记忆模式" / "记忆窗口 90 天" → 窗口改 90 天
- "清空已见" / "清空 viewed" → 删除 viewed.json 整个文件
- "包含已见过" / "show seen" → 本次搜索跳过 viewed.json 过滤（仍显示分组标识）

**F. 多轴轮换提示（Rotation Hint）**：

- 触发时机：Brief Discovery 进入「最终确认」之前
- 数据来源：Profile 中的 `history.last_used_axes`
- 判定规则：
  - 若本次 Brief 的核心轴（geo / industry / decision_role 中频次最高的一项）与上次完全相同
  - 且 Profile 中存在尚未尝试过的备选项（如 `target_baseline.regions_primary` 含 JP 但 last_used_axes.geo 无 JP）
- 提示模板：
  > 提示：您上 3 次都聚焦在 [DE, US]。您的画像里有 [UK, AU] 也是主营区域，要不要这次试试 UK？(a) 继续 DE/US (b) 加上 UK (c) 完全换到 UK/AU
- 写时机：搜索完成后，把本次实际使用的轴值写入 Profile 的 `history.last_used_axes`
- 弱模型保护：在 anti-staleness 段落里给出具体示例，禁止模型脑补不在 Profile 中的轴

> **[MERGE: sales-mentor 引用]** Anti-Staleness 的 3 段结果分组是 Sales Journey Preview（sales-mentor-playbook §4）的输入。结果展示后必须接入销售旅程预演节，不允许直接跳到"等用户选择"。

### 改动 5：改写 Workflow A（第 425-431 行）

旧：
```text
1. Search companies → display results table
2. Wait for user selection
3. Unlock company
4. Get contact emails
5. Display contacts → ask next step
```

新（[MERGE: 整合 sales-mentor-playbook §1/§2/§4 hook 点 + Derive trade_mode 步骤；BC1/BC2 与 BC3 两阶段执行]）：
```text
1. Load Merchant Profile via `okki-state.js profile read`, compute `completeness`
2. **Business Context Lite phase 1 (sales-mentor §1 BC1/BC2 only)** — read or ask sales goal/time horizon; if user says "直接搜", defer BC1/BC2 until after free search
3. Run Prospecting Brief Discovery (Soft Gate) — uses Profile defaults (user_confirmed only); skip if Sufficiency Check passes; **enforce Hard Guardrails (discovery-playbook §1.1)**
4. Apply Rotation Hint (if applicable) — see Anti-Staleness section
5. **Derive trade_mode** = derive(profile.company.country, brief.geo_include); branch domestic / cross_border / mixed / unknown
6. **Business Context Lite phase 2 (sales-mentor §1 BC3)** — ask/reuse channel preference only after trade_mode is known; if trade_mode=unknown and user requested direct search, skip BC3
7. **Blind-Spot Check (sales-mentor §2)** — scan 5 blind spot types; skip trade_mode-dependent blind spots when trade_mode=unknown; if any hit, surface 💡 提示 alongside the brief
8. Branch by completeness / direct-search override:
   - 8a. completeness > 0.7 → **Tier 1 Pre-Search Brief Statement** (one-line announce + show trade_mode label, no wait)
   - 8b. 0.3 <= completeness <= 0.7 → **Tier 2 Brief Confirmation Template** (show trade_mode label + wait for user confirm)
   - 8c. completeness < 0.3 → Lite Onboarding (5 questions, includes L0 country) → after onboarding go to 8b
   - 8d. user said "直接搜" → Tier 1 direct free search; if trade_mode=unknown, continue search and defer trade_mode-dependent mentor hooks
9. (Optional, before API call) Offer to write Brief adjustments back to Profile (especially company.country for trade_mode anchoring) unless user explicitly requested direct search
10. Map Brief to search-advanced params (use country-code table in discovery-playbook §4.1)
11. **Search companies (free)** — capture raw `total` and result list; if local-only filters such as `employee_range` exist, apply the pagination soft-filter strategy in discovery-playbook §4 before Expansion decisions
12. **Load viewed.json via `okki-state.js viewed classify`**, classify results into 3 groups: 🔓 unlocked / 📅 seen / ✨ new
13. **Branch by filtered total**:
    - 13a. `filtered_total < 5` → **Broadening Ladder** (relax params, 1 round) → re-search → goto step 11
    - 13b. `5 <= filtered_total < target_count` → **Full Expansion loop** (5 dims × 5-8 candidates, up to 3 rounds, **with reverse recommendations ≥ 20% per sales-mentor §3**):
        - Generate candidates → user selects → merge into brief → re-search → re-filter via viewed.json
    - 13c. `filtered_total >= target_count` → **Lite Expansion** (unless user disabled):
        - Generate 2 dims × 2-3 candidates → append as "您可能没考虑过的角度" below main result table
14. Display results in 3 groups (annotate 🔓/📅/✨) + mark shown domains through `okki-state.js viewed mark-shown`
15. **Sales Journey Preview (sales-mentor §4)** — if trade_mode is known, output 3-part guidance; if trade_mode=unknown, output only country-neutral methodology and prompt optional company-country completion
16. Update Profile.history.last_used_axes through `okki-state.js profile update-history`
17. Wait for user selection
18. Unlock company (follow Billing Rule 1) → **update viewed.json via `okki-state.js viewed mark-unlocked`: status=unlocked, unlocked_at=now**
19. Get contact emails
20. Display contacts → ask next step (mention Profile may be used in outreach drafting; reference sales_context.channel for outreach style when available)
```

### 改动 6：改写 Workflow C

采用**半段改造**，不是把 A 的 20 步完整复制到邮件发送链路：

```text
Workflow C 前半段（公司搜索/联系人发现）：
1. 复用 Workflow A 步骤 1-16：Profile → BC1/BC2 → Discovery → Rotation Hint → derive trade_mode → BC3 → Blind-Spot → Tier/direct-search → search → viewed classify → Expansion → 3 段结果展示 → Sales Journey Preview → update axes
2. Wait for user to select companies
3. Unlock selected companies (follow Billing Rule 1) → `okki-state.js viewed mark-unlocked`
4. Get contact emails and filter by decision_roles/title keywords
5. Display contact list

Workflow C 后半段（邮件确认/发送，保持原样）：
6. Ask user to confirm recipients and email content
7. Never send emails before user confirms recipients + content
8. Use `POST /emails/send/batch` for same-template sends
9. After sending, use existing Email send feedback and status guidance
```

硬边界：
- Discovery / Expansion / Sales Journey Preview 可以影响"找哪些公司 / 先联系哪些联系人 / 邮件草稿切入点"，但不能替代邮件发送确认。
- 用户说"直接发"也只能跳过 Discovery 的提问，不能跳过收件人和邮件内容确认。
- 若用户在同一句中要求"找公司并发邮件"，先完成公司/联系人发现与展示，再进入邮件确认；不得在搜索结果未展示前自动发送。

### 改动 7：改写 `## User Input Guidance` 段（第 323-347 行）

把当前的「vague/better」对照表替换为：

- 保留 "Language rule"（第 325 行）
- 删除「Common vague inputs」表和「Suggest better phrasing」段
- 替换为简短说明："For vague prospecting requests, run the Prospecting Brief Discovery workflow defined in `references/discovery-playbook.md`, and use Merchant Profile defaults (only `user_confirmed` fields) from `references/merchant-profile-playbook.md`. Apply the Sales Mentor Mode persona, hook points, and B'' protection rules in `references/sales-mentor-playbook.md` throughout. Do NOT improvise clarifying questions. Hard Guardrails in discovery-playbook §1.1 apply regardless of skip path. Iron Rule 0 (country-agnostic) in sales-mentor-playbook applies regardless of context."
- 对 balance/email status 等不需要 brief 的请求，保留"execute directly"的指引

### 改动 9：新增 `## Sales Mentor Mode` 节（紧跟 Anti-Staleness 节）

内容（约 50 行）：

```
## Sales Mentor Mode

This Skill operates with a **B2B sales mentor persona** layered across Discovery / Expansion / Result.
Full rules live in `references/sales-mentor-playbook.md`. Key points enforced everywhere:

### 0. Iron Rule 0 (Country-Agnostic)

Playbook static content MUST NOT hardcode any specific tool name, platform name,
certification name, cultural habit, or local regulation. All such specifics are
dynamically generated at runtime based on `profile.country` and `brief.geo_include`,
ALWAYS accompanied by `💭` tag, and ALWAYS subject to §5 Must NOT Say constraints.

### 1. Trade Mode Derivation

After every Brief confirmation, derive:
  trade_mode = derive(profile.company.country, brief.geo_include)
  ∈ { domestic | cross_border | mixed | unknown }

unknown → if the user requested normal guided Discovery, ask for profile.company.country before mentor advice; if the user explicitly requested direct free search, continue search and skip trade_mode-dependent mentor hooks.

### 2. Workflow A Hook Points

Step 2: Business Context Lite phase 1 (BC1/BC2, sales-mentor §1)
Step 5: Derive trade_mode (sales-mentor §0 + §1)
Step 6: Business Context Lite phase 2 (BC3, only after trade_mode is known)
Step 7: Blind-Spot Check (sales-mentor §2; skip trade_mode-dependent checks when unknown)
Step 13b: Reverse Recommendations enforced in Expansion (≥ 20%, sales-mentor §3)
Step 15: Sales Journey Preview (sales-mentor §4; full branch when trade_mode known, country-neutral fallback when unknown)

### 3. B'' Protection Mechanism (uniform across all models)

- Defaults to source-backed claims (Profile fields / user statements / playbook rules)
- Max 2 💭 (personal inference) tags per response
- Must NOT Say vigilance list (§5): no specific numbers / geo details / live intel /
  time-sensitive claims / industry stereotypes / regional cultural presumptions
- "I don't know" is acceptable; pretending to is not

### 4. User Toggle

User can say "关闭导师模式" → fall back to neutral search-only mode (skip §1/§2/§4 hooks).
Default: on.
```

引用 `references/sales-mentor-playbook.md`。

### 改动 8：版本号与 changelog

- 顶部 `version: 1.0.12` → `version: 1.2.0`
- 各处 `1.0.12` 字面量同步替换
- 在 SKILL.md 末尾加 CHANGELOG 注释：
  ```
  ## 1.2.0 (2026-05-28)
  - Add Merchant Profile (persistent business profile with source metadata, 4 source states + sales_context field + preferred_language lazy load)
  - Add Prospecting Brief Discovery (soft gate, 5 gray areas, 3-tier completeness routing, trade_mode session-derived variable)
  - Add Prospecting Expansion (triple mode: Broadening Ladder + Full + Lite, with mandatory reverse recommendations ≥ 20%)
  - Add Anti-Staleness Mechanisms (viewed.json v1.1 with unlocked state, 3-group display, dedup window switches)
  - Add Hard Guardrails section (5 categories of must-execute checks even when skipping Discovery)
  - Add 50-country ISO code lookup table + fallback rules
  - Add Sales Mentor Mode (sales-mentor-playbook.md: Iron Rule 0 + Persona + staged Business Context Lite + Blind-Spot Checklist + Reverse Recommendations + Sales Journey Preview + Must NOT Say + B'' protection)
  - Lite Onboarding expanded to 5 questions (added L0 company country as trade_mode anchor)
  - Add okki-state.js helper for profile/viewed state migration, atomic writes, redaction, classification, and unlocked lifecycle
  - Rewrite Workflow A fully and Workflow C discovery/contact-finding half only; email confirmation/send half remains unchanged
  - Rewrite User Input Guidance to point to discovery-playbook + sales-mentor-playbook
  ```

---

## 状态文件设计汇总

两个状态文件，均位于 `~/.config/okki-go/`（与现有 `credentials.json` 同目录）：

| 文件 | 用途 | 大小估算 | 生命周期 | mode | 版本 |
|---|---|---|---|---|---|
| `profile.json` | Merchant Profile（含 source 元数据） | ~3-5 KB | 长期持久化 | 0600 | v1.1 |
| `viewed.json` | 已展示公司去重 + unlocked 状态 | 随使用增长，预计 100 条 ~12 KB | 30 天滚动过期（用户可调 7/30/90） | 0600 | v1.1 |

读写时机由 SKILL.md 内的 workflow 步骤规定，但具体读写、迁移、遮罩、分类和原子写入由 `skill/scripts/okki-state.js` 执行。模型不得临场拼 `cat`/`jq`/`echo` 修改状态文件。

**Helper 职责边界**：
- ✅ 读写 `profile.json` / `viewed.json`
- ✅ 迁移 v1.0 → v1.1，修复缺失字段，备份损坏 JSON
- ✅ 强制 `0600` 权限和原子写入
- ✅ `profile redact` 隐藏 sender_email / sender_name
- ✅ `viewed classify` 输出 `unlocked / seen / new` 三组
- ✅ `viewed mark-shown` / `mark-unlocked` 更新生命周期
- ❌ 不调用 OKKI API
- ❌ 不生成 Brief / Expansion 候选
- ❌ 不判断 Billing / 邮件发送确认

**容错原则**：

- 任何状态文件不存在 → helper 返回零状态，不阻塞核心流程
- 状态文件损坏 → helper 备份损坏文件并返回零状态，同时在输出中标记 `recovered: true`
- 文件 mode 不对（如 0644）→ helper 自动 chmod 0600，告知用户
- profile.json 字段缺失 → helper 重新计算 completeness，进入对应 Progressive Enrichment
- profile.json B 类字段缺少 source → helper 迁移为 `agent_inferred`（保守降级，不参与 Discovery 默认值）
- viewed.json v1.0（无 status 字段）→ helper 视为全部 status=viewed，平滑升级到 v1.1

---

## 不做的事（明确划界）

继承 P 的 5 条 + 本次落地修正后的边界 + 合并讨论中明确**拒绝采纳**的 5 条：

**继承 P**：

- 不改 API Key resolver、`api-reference.md` 与现有 API 调用脚本；仅新增一个本地状态 helper `skill/scripts/okki-state.js`
- 不改邮件发送 / 邮件状态查询 / 计费 / 余额查询的工作流主流程；Workflow C 只改公司搜索/联系人发现前半段
- 不持久化 Brief / Expansion 历史到本地文件
- 不为「找联系人」（Workflow B）单独引入 discovery
- Expansion 不调用任何外部知识图谱 API
- 不引入 Brief 校验、国家码、计划去重、历史过滤等额外脚本；只为本地状态读写引入最小 helper

**合并讨论中拒绝采纳（决策与理由记录）**：

- **D §14.3 多状态历史（saved/dismissed）** → 仅采纳 unlocked 状态。saved/dismissed 需要用户主动标注入口，本次 SKILL.md 不设计这些工作流，加字段也不会被填充。viewed.json v1.1 的 `status` enum **预留扩展点**，未来 v2 加值不破坏兼容。
- **D §16.3 大范围脚本化（Brief 校验 / 信息度评分 / Search Plan 生成 / 国家码 / 计划去重 / 历史过滤）** → 仍不采纳。落地修正仅新增 `okki-state.js` 处理易写坏的本地 JSON 状态；国家码继续用 playbook 内嵌对照表（§4.1）+ 兜底规则。
- **D §9 信息度分数化（6/10 / 7/10）** → 不引入。继续用 P 的"必答/可跳 + 示例标定"二分制。分数制需要模型自己评分，反而引入新判断点；P 的"数维度"是离散计数任务，弱模型更稳定。
- **D §15.1 视觉区分版（沿用 Profile vs 本次新指定的字段视觉区分）** → 被推翻。改用 3 档 completeness 分流（Tier 1/2/3），用户体验比"逐项标注沿用"更直观，且能根据 Profile 成熟度做差异化交互。
- **D §14.4 结果 5 分组（核心匹配 / 扩展机会 / 新候选 / 上次未处理 / 需要放宽条件才有）** → 降级到 3 分组（🔓 / 📅 / ✨）。其余 2 分组依赖未采纳的多状态历史，等 v2 saved/dismissed 落地后再扩展。

---

## v2 候选清单（本次不做，已为对接预留接口）

继承 P 4 项 + 合并讨论中新增 6 项：

| 候选 | 描述 | 触发预留 | 预期影响 |
|---|---|---|---|
| **E. Prospect Pool** | 把每次搜索结果累积到本地潜客池 + 状态机（new/contacted/replied/closed）| 可在本次 viewed.json 基础上扩展为 pool.json | 价值锚点从"搜索"转向"经营管理" |
| **D. 反馈循环 (saved/dismissed)** | 用户对结果标 👍/👎，下次搜索时调权 | viewed.json v1.1 的 `status` enum 已预留扩展点 | 长期个性化，需用户配合打标 |
| **H. 触达端个性化升级** | 同一公司用 USP × 对方画像多组合生成不同切入 | 依赖 Profile 已有 USP 字段（含 source 标记） | 与本次 plan 完成后的触达体验联动评估 |
| **C/G. 服务端时序订阅 + 竞争对手反向挖掘** | 需要 search-advanced API 扩展（`since` / `excludeViewed` / `competitorTrade` 参数）| 需 OKKI 服务端 Roadmap 配合 | 数据库时序新鲜度，最高价值但跨团队 |
| **I. 信息度分数化（v2）** | 若 Tier 2 用户在边界 case 上失败率高，引入维度评分细则 | 当前 Sufficiency Check 已有"示例标定"作为评分锚点 | 提升弱模型在 5-7 分场景的稳定性 |
| **J. 跨设备 Profile 同步** | 把 profile.json 从本地迁移到 OKKI 服务端账号 | profile schema 已结构化 + 含 version 字段 | 解决用户多设备工作场景 |
| **K. 完整 ISO 3166 国家库脚本化** | 若用户群体扩展到冷僻国家，把国家码改为脚本 | 当前 §4.1 已有 50 国对照表 + 兜底规则 | 仅当真实用户出现冷僻国家场景时触发 |
| **L. Brief 校验脚本** | 在 Brief 生成后用脚本做格式校验 | Brief schema 已确定，校验函数可附加 | 进一步降低弱模型 JSON 输出差异 |
| **M. 5 段结果分组** | 在 saved/dismissed 落地后扩展到 D 的 5 分组（含"上次未处理但仍高匹配"等）| 当前 3 分组架构可平滑扩展 | 重复搜索场景的延续感大幅提升 |
| **N. 行业模板** | 为不同行业（汽配 / 服装 / 3C / 化工）提供独立的 Expansion 维度示例库 | 当前 expansion-playbook §2 维度框架与行业解耦 | 行业内的发散质量提升 |
| **O. trade_mode 派生规则细化** | 把当前 4 值枚举（domestic / cross_border / mixed / unknown）扩展为更细粒度判定，例如：内贸-跨省 vs 内贸-本省、跨境-周边国 vs 跨境-远端国、跨境-自由贸易区 vs 跨境-常规市场 | 当前 trade_mode 为会话内派生变量、独立于 Brief schema 与 Profile schema，新增枚举值不破坏向后兼容 | 销售建议（§4 Sales Journey Preview）的细分模板与盲点检查（§2）精度提升；前提是收集到足够细分场景下的真实使用反馈 |
| **P. sales_context 多 channel** | 用户可在 BC3 选多个 channel 组合（如 EDM + LinkedIn 并行）；Sales Journey Preview 按多 channel 分组出建议 | sales_context.channel 现为单值字符串，未来改为数组类型 | 多渠道运营用户的体验显著提升 |

---

## 合并决策审计（对应 D §19 八个开放问题）

> **[MERGE: from D §19]** —— D 的 8 个开放问题在本合并版的实际选择 + 选择理由。

### Q1: 用户经营画像应存储在本地 Skill 配置中，还是 OKKI Go 服务端账号下？

**本次选择**：本地（`~/.config/okki-go/profile.json`，与 credentials.json 同目录）

**理由**：
- 与现有 `credentials.json` 同目录管理，无需 API 扩展
- 目标用户（B2B 销售从业者，无论开发本国还是海外潜客）通常在固定一台电脑上工作，跨设备同步需求弱
- 服务端方案涉及 OKKI 后端数据模型 + 隐私合规审查 + 跨团队协作
- 跨设备同步留给 v2 候选 J 评估

### Q2: 用户画像保存是否需要提供查看、编辑、删除命令？

**本次选择**：提供完整 Management Workflow（view / edit / reset / export）

**理由**：
- 数据来源分级要求用户能看到 `agent_inferred` 标识并确认/拒绝
- 隐私合规要求用户对画像有完全控制权
- 触发短语清晰（"查看我的画像" / "修改经营画像" / "reset profile"），SKILL.md 一节即可承载

### Q3: 信息度评分是否先用规则实现，还是交给模型按 rubric 评估？

**本次选择**：用规则（Sufficiency Check 4 条 + 示例标定）

**理由**：
- 弱模型对"数维度"（离散计数）的稳定性远高于"打分"（连续判断）
- 规则 + 示例可直接照表执行，无需模型维持评分权重
- 若未来发现边界 case 失败，再引入维度评分细则（v2 候选 I）

### Q4: Opportunity Expansion 默认执行几个扩展搜索最合适？

**本次选择**：Full Expansion 5 维度 × 5-8 候选，上限 3 轮；Lite Expansion 2 维度 × 2-3 候选

**理由**：
- 5 维度覆盖 D §12.2 全部扩展类型，避免遗漏
- 5-8 候选 / 维度 = 25-40 个候选总量，符合用户一次决策上限
- 3 轮上限防止失控（D §12.5 默认最多 1-2 个扩展搜索，本版稍激进，但有"用户喊停"和"达 target_count 自动停"双重护栏）
- Lite 2×2-3 = 4-6 候选，足够给"新视角"信号但不打断主流程

### Q5: 搜索历史去重应保留多久？

**本次选择**：默认 30 天，用户可调 7/30/90

**理由**：
- 30 天与 OKKI 服务端 `/companies/unlock` 免费窗口对齐（unlock 状态 30 天后失效，去重也 30 天后失效，语义一致）
- 用户开关覆盖"短记忆"（7 天，常态化更高频换新）和"长记忆"（90 天，季度级潜客 pipeline）两种风格
- 清空操作明确（`rm` 或"清空已见"指令）

### Q6: 是否需要为不同行业提供独立扩展模板？

**本次选择**：本版不做，留 v2（候选 N）

**理由**：
- 当前 expansion-playbook §2 的 5 维度框架是行业无关的元结构
- 行业模板需要 OKKI 内部行业专家配合，跨团队成本高
- 等用户群体行业分布稳定后再针对性投入

### Q7: 是否需要在结果中显式标记「这是扩展机会，不是核心 ICP」？

**本次选择**：是，通过 3 段分组隐式标记

**理由**：
- 🔓 已解锁 / 📅 上次见过 / ✨ 新发现 三段中，✨ 段进一步可标注 `(核心 ICP)` vs `(Expansion 候选)`
- Expansion 候选本身就是用户在 Full Expansion 中主动勾选的，"扩展性"对用户透明
- 不引入新分组层级，避免视觉过载

### Q8: 画像字段中哪些属于敏感商业信息，需要额外确认或不保存？

**本次选择**：
- **半敏感（默认隐藏 + 不上报）**：`outreach_identity.sender_email` / `sender_name`
- **强敏感（仅在用户主动要求时持久化）**：本版未识别强敏感字段；若用户提及"MOQ" / "成交价" / "客户名单"等，模型应**拒绝写入 Profile** 并提示用户这些不适合长期存储

**理由**：
- 半敏感字段保护策略来自 P 的 §"Sensitive Fields & Privacy"
- 强敏感字段判定本版保守处理（不主动推断 / 不写入），等用户场景反馈后再细化
- `source: agent_inferred` 的字段在 Profile 查看时清晰标识，防止模型把敏感信息当事实推断

---

## 验证策略

本次不再按纯 prompt 改造处理。`okki-state.js` 必须有单元测试，prompt/workflow 行为必须进入 `okki-go/eval/scenarios/` 做回归覆盖；手测只作为补充，不作为唯一验收。

**继承 P**：

- **干跑测试用例**：在 `merchant-profile-playbook.md` 和 `discovery-playbook.md` 中各列 6-8 个典型输入，标注 Skip/Enter 路径和 Profile 默认值替换效果
- **状态文件 round-trip 测试**：通过 `okki-state.js` 单测模拟「首次启动 → Lite Onboarding → 写入 profile → 第二次进入 → 默认值被加载 → 用户调整 → 写回 profile」全链路
- **viewed.json 隔离测试**：通过 `okki-state.js viewed classify/mark-shown/mark-unlocked` 单测验证同样 brief 两次搜索、unlock 后复搜、窗口过期
- **跨模型差异度量**：使用 `okki-go/eval/scenarios/` 跑同一组场景，对比改造前后不同模型行为一致性

**新增验证项**：

- **状态 helper 单测（必须）**：
  - profile 不存在 → 返回零状态 + completeness=0
  - profile v1.0/字段缺失 → 迁移到 v1.1
  - B 类字段缺 source → 转 agent_inferred，不进入默认值池
  - redact 隐藏 sender_email/sender_name
  - viewed v1.0 → v1.1 status=viewed
  - classify 输出 unlocked / seen / new 三组
  - mark-shown 同 domain 去重更新 shown_at
  - mark-unlocked 写 status=unlocked + unlocked_at
  - 损坏 JSON 备份为 corrupt 文件并返回零状态
  - 写入后 mode=0600
- **source 元数据 round-trip**：模拟「模型推断 USP → 写 agent_inferred → 用户确认 → 改 user_confirmed → 进入 Discovery 默认值池」全链路
- **Hard Guardrails 注入测试**：构造"直接搜并解锁前 5 家"输入，验证模型仍按 Billing Rule 1 单独确认 unlock
- **direct-search unknown 降级测试**：profile.company.country 缺失 + 用户说"直接搜德国汽配公司"，验证免费 search 可继续、BC3/依赖 trade_mode 的导师建议被跳过、结果后提示补公司所在国
- **Business Context 顺序测试**：验证 BC1/BC2 在 Brief 前，BC3 只在 trade_mode 派生后出现；不能在 step 2 提前问 BC3
- **employee_range 软过滤分页测试**：构造 API 原始 total 很大但第一页过滤后不足的 fixture，验证最多扫描 3 页/150 条后用 filtered_results.length 触发 Expansion
- **国家码对照表测试**：覆盖 50 国 + 易错点白名单 6 项 + 兜底规则 3 项（共 ~60 个输入），验证模型映射准确率
- **Broadening Ladder 触发测试**：构造极端低召回 brief（5 个严格 and 关键词），验证 Ladder 正确触发并告知放宽步骤
- **unlocked 状态生命周期测试**：模拟「展示公司 → status=viewed → 用户 unlock → status=unlocked, unlocked_at=now → 第二次搜索 → 显示 🔓 标识 → 30 天后 → 降级回 📅 状态」全链路
- **3 档 completeness 分流测试**：构造 completeness=0.2 / 0.5 / 0.85 三种 Profile，验证 Tier 1/2/3 分流准确
- **去重窗口开关测试**：用户说"短期记忆模式"后，验证 7 天窗口生效

建议新增 eval 场景：
- `routing/direct-search-unknown-trade-mode.yaml`
- `business/business-context-order.yaml`
- `business/soft-filter-pagination.yaml`
- `business/viewed-lifecycle.yaml`
- `safety/direct-search-paid-action-guardrail.yaml`
- `business/profile-source-defaults.yaml`

---

## 附录：合并改动对照表

| # | D 来源 | P 中位置 / 状态 | 灌入 _MERGED 的位置 | 改动量 | 优先级 |
|---|---|---|---|---|---|
| 1 | §9.4 硬护栏清单 | P 未明示 | discovery-playbook §1.1 | 低 | P0（安全） |
| 2 | §6.3 数据来源分级（B 类字段折中版） | P schema 无 source | merchant-profile-playbook §1 + §3 强化 | 中 | P0（隐私） |
| 3 | §15.1 搜索前简短说明 + 冲突 3 completeness 分流 | P 只有单一 Brief Confirmation | discovery-playbook §5.0 Pre-Search Statement + 3 档分流 | 中 | P0（UX） |
| 4 | §13.1 联系人不污染公司搜索 | P §4 mapping 已有但未强调 | discovery-playbook §4 加 ⚠️ 强调语 | 低 | P0 |
| 5 | 冲突 4 去重窗口开关 | P 写死 30 天 | SKILL.md `## Anti-Staleness` 末尾 | 低 | P0 |
| 6 | §14.4 结果分组（降级到 3 段） | P 只有 2 段（新/旧） | SKILL.md `## Anti-Staleness` 节 + viewed.json schema 升级 | 低 | P1 |
| 7 | unlocked 状态标记（用户决策） | P viewed.json 无 status 字段 | viewed.json v1.1 schema + `okki-state.js viewed mark-unlocked` + Workflow A 步骤 18 | 低 | P1 |
| 8 | §14.5 Broadening Ladder（前置闸门改造版） | P Full Expansion 只加关键词 | expansion-playbook §1 模式 0 + Workflow A 步骤 13a | 中 | P1 |
| 9 | §16.3 国家码（内嵌表替代脚本） | P 只说"列出常见对照" | discovery-playbook §4.1 含 50 国表 + 6 易错点 + 3 兜底规则 | 低 | P1 |
| 10 | §19 → Open Questions | P 未回应 | 本文档「合并决策审计」节 | 低 | P2 |
| 11 | 用户对话：Dynamic Trade Mode | D/P 都无 | 总体策略节末「Dynamic Trade Mode Inference」+ discovery-playbook §3/§5.0 + Workflow A 步骤 5 | 低 | P0（核心架构） |
| 12 | 用户对话：Lite Onboarding 5 题 | P 4 题 | merchant-profile-playbook §2 模式 1 加 L0 公司所在国 | 低 | P0（trade_mode 推断锚点） |
| 13 | 用户对话：Sales Mentor Persona（B''） | D/P 都无 | sales-mentor-playbook 整文件 + SKILL.md 改动 9 | 高 | P0（导师感本质） |
| 14 | 用户对话：Business Context Lite | D/P 都无 | sales-mentor-playbook §1 + Workflow A 步骤 2/6 + Profile sales_context 字段 | 中 | P0 |
| 15 | 用户对话：Blind-Spot Checklist | D/P 都无 | sales-mentor-playbook §2 + Workflow A 步骤 7 | 中 | P0 |
| 16 | 用户对话：Reverse Recommendations | D/P 都无 | sales-mentor-playbook §3 + expansion-playbook §3 候选输出格式约束 + Workflow A 步骤 13b | 中 | P0 |
| 17 | 用户对话：Sales Journey Preview | D/P 都无 | sales-mentor-playbook §4 + Workflow A 步骤 15 | 中 | P0 |
| 18 | 落地修正：状态 helper | 原计划依赖模型临场拼状态读写命令 | `skill/scripts/okki-state.js` + 状态 helper 单测 | 中 | P0（稳定性） |
| 19 | 落地修正：直接搜/unknown 降级 | 原计划 unknown 一律中断，直接搜可强制 Tier 1 | discovery-playbook §1.2 + Workflow A 步骤 8d/15 | 低 | P0（UX） |
| 20 | 落地修正：employee_range 软过滤分页 | 原计划只说结果端过滤，未定义分页 | discovery-playbook §4 本地软过滤分页策略 + eval 场景 | 中 | P0（召回判断） |
| 21 | 落地修正：eval 覆盖 | 原计划偏手测且不改 eval | `okki-go/eval/scenarios/` 新增回归场景 + okki-state 单测 | 中 | P0（验收） |
| 18 | 用户对话：Must NOT Say + 铁律 0 | D 部分提及（防伪造）；P 无 | sales-mentor-playbook §5 类 1-6 + 铁律 0 自检方法 | 中 | P0（防胡说） |
| 19 | 用户对话：preferred_language 懒加载 | P 默认 "en"，强制问 | merchant-profile-playbook §1 schema 改 null + 懒加载推断规则 + §4 触达端引用 | 低 | P1（UX） |

**总改动量评估**：中-高。新增的 9 项（11-19）使本次迭代从"防同质化 + 防漏问"扩展到"防同质化 + 防漏问 + 防中性化 + 防胡说"。施工时按 P0 → P1 → P2 顺序推进，**P0 必做**。Sales Mentor 相关（13-18）作为同一个 playbook 文件交付，可并行实施。

---

## 与 P 的差异速查表

供你和 P 原版对照阅读：

| 章节 | P 原版 | _MERGED 改动 |
|---|---|---|
| Profile schema | 无 source 字段；preferred_language 默认 "en" | 6 个 B 类字段加 source（user_confirmed / user_provided / agent_inferred / imported）；preferred_language 改 null 懒加载；新增 sales_context 字段 |
| Profile 触发模式 | 2 种（Onboarding + Enrichment） | 3 种（+ Agent Inference Confirmation） |
| Lite Onboarding 题数 | 4 题 | **5 题**（新增 L0 公司所在国，作为 trade_mode 推断锚点） |
| Discovery §1 | 仅 Sufficiency Check | +§1.1 Hard Guardrails（5 类必执行项） |
| Discovery §4 | "列出常见国家中文 → 代码对照" | +§4.1 完整 50 国对照表 + 6 易错点 + 3 兜底规则；+decision_roles ⚠️ 强调 |
| Discovery §5 | 单一 Brief Confirmation Template | +§5.0 Pre-Search Brief Statement（Tier 1 效率模式）+ 3 档 completeness 分流 + **trade_mode 派生展示** |
| Expansion 模式数 | 2 种（Full + Lite） | 3 种（+ Broadening Ladder 前置闸门，total < 5 触发） |
| Expansion 候选输出 | 仅"为什么是潜客"理由 | + **反向建议占比 ≥ 20%**（不推荐方向的合法结构 + 禁止形式） |
| viewed.json | v1.0 无 status | v1.1 加 status (viewed/unlocked) + unlocked_at |
| 结果分组 | 2 段（新/旧） | 3 段（🔓 / 📅 / ✨） |
| 去重窗口 | 写死 30 天 | 默认 30 天，用户开关 7/30/90 + 清空 + 跳过过滤 |
| **Trade Mode**（新增维度）| **无** | **会话内派生变量 4 值**（domestic / cross_border / mixed / unknown），驱动下游 4 个模块的模板分支 |
| **Sales Mentor Persona**（新增维度）| **无** | **新增 sales-mentor-playbook.md 整文件**（铁律 0 + Persona + Business Context Lite + Blind-Spot + Reverse Rec + Sales Journey Preview + Must NOT Say + B'' 保护） |
| **Business Context Lite**（新增维度）| **无** | **BC1/BC2 前置 + BC3 在 trade_mode 派生后执行**（销售目标 / 时间盘 / 切入方式），避免渠道偏好在未知场景下提前污染 brief |
| **Blind-Spot Checklist**（新增维度）| **无** | **5 类盲点扫描**（画像-目标错配 / 市场-合规错配 / 角色未定 / 时间盘-市场错配 / 画像-渠道错配），Brief 确认前必扫，命中即 💡 提示 |
| **Sales Journey Preview**（新增维度）| **无** | **3 段销售旅程建议**（Top 3 优先级 / 切入方式建议 / 我建议您先做的事），按 trade_mode 出不同模板，结果展示后强制输出 |
| **B'' 保护机制**（新增维度）| **无** | **统一应用所有模型**：默认有源 + 最多 2 条 💭 额度 + 6 类 Must NOT Say 警戒清单（含地区文化预设）+ 铁律 0 国家无关自检 |
| Workflow A/C 边界 | A/C 都是短流程 | **Workflow A 全链路 20 步**；**Workflow C 只改公司搜索/联系人发现前半段**，邮件确认/发送半段保持原样 |
| SKILL.md 新增节数 | 0（原始） | **5 节**（Merchant Profile / Brief Discovery / Expansion / Anti-Staleness / Sales Mentor Mode） |
| 末尾 | 验证策略 | + 合并决策审计 + 附录对照表 + 与 P 差异速查表 |
