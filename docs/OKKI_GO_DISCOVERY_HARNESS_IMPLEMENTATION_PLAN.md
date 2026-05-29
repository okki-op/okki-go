---
name: OKKI Go Discovery Harness
overview: 为 OKKI Go Skill 引入「三层 harness + 防同质化机制」——Merchant Profile 持久化用户经营画像（跨会话复用）、Brief Discovery 结构化收紧潜客需求精度、Expansion 多维发散补足召回；同时通过本地去重和多轴轮换防止结果稳定带来的流失风险。
todos:
  - id: draft-profile-playbook
    content: 创建新文件 okki-go/skill/references/merchant-profile-playbook.md，定义 Profile schema、5 字段族、首次轻量启动 + 渐进补全的触发规则、Discovery 端和触达端的复用方式
    status: pending
  - id: draft-discovery-playbook
    content: 创建新文件 okki-go/skill/references/discovery-playbook.md，包含 5 个 section：Sufficiency Check / Five Gray Areas（含 target_count，且每个区域优先使用 Profile 默认值）/ Brief Schema / Brief→API Mapping / Brief Confirmation Template
    status: pending
  - id: draft-expansion-playbook
    content: 创建新文件 okki-go/skill/references/expansion-playbook.md，包含 6 个 section：Trigger Rules（双模式：Full + Lite）/ Five Expansion Dimensions / Candidate Output Format（两种模板）/ User Selection Format / Candidate→Brief Mapping / Multi-Round Rules
    status: pending
  - id: design-state-files
    content: "在 SKILL.md 中描述两个新状态文件：~/.config/okki-go/profile.json（Merchant Profile，0600）和 ~/.config/okki-go/viewed.json（已展示公司去重，0600），明确读写时机和容错"
    status: pending
  - id: add-profile-section
    content: "在 SKILL.md 中新增 ## Merchant Profile 节（含独立的 Management workflow），插在 ## Authentication 之后、## Workflow Orchestration 之前"
    status: pending
  - id: add-discovery-section
    content: "在 SKILL.md 中新增 ## Prospecting Brief Discovery (Soft Gate) 节"
    status: pending
  - id: add-expansion-section
    content: "在 SKILL.md 中新增 ## Prospecting Expansion (Dual Mode) 节，描述 Full + Lite 两种模式的触发与产出格式"
    status: pending
  - id: add-anti-staleness-section
    content: "在 SKILL.md 中新增 ## Anti-Staleness Mechanisms 节，描述 viewed.json 去重规则和多轴轮换建议（Rotation Hint）"
    status: pending
  - id: rewrite-workflow-a-c
    content: 改写 SKILL.md 中 Workflow A 和 Workflow C 的步骤，前置 Profile 加载、Discovery、Rotation Hint，中间插入 Expansion 双模式分支（Full/Lite），结果展示前后插入 viewed.json 去重与写入
    status: pending
  - id: rewrite-user-input-guidance
    content: "改写 SKILL.md 的 ## User Input Guidance 节，删除 vague/better 对照表，改为指向 discovery-playbook.md"
    status: pending
  - id: bump-version
    content: SKILL.md 顶部 version 从 1.0.12 升级到 1.2.0（minor bump 反映三个新模块），同步替换所有 1.0.12 字面量
    status: pending
  - id: self-review
    content: 自检三个 playbook 之间的引用一致性、SKILL.md 各 workflow 步骤顺序、状态文件读写顺序，确保弱模型照表可执行
    status: pending
isProject: false
source_plan: .cursor/plans/okki_go_discovery_harness_f61e05fd.plan.md
copied_at: 2026-05-27
---

# OKKI Go Discovery Harness — Implementation Plan

> 配套设计文档：[OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md](./OKKI_GO_PROSPECT_DISCOVERY_HARNESS_DESIGN.md)（V0.1 讨论稿）
>
> 本文档是上述设计稿的「实施计划」视角快照，由 Cursor plan 系统生成并迁移到 docs 目录归档。原始 plan 状态仍保留在 `.cursor/plans/` 下用于 Cursor 工具链状态同步。

## 背景诊断

`okki-go/skill/SKILL.md` 当前的 `## User Input Guidance`（第 323-347 行）只给模型一张「vague → better」对照表，"该不该追问、追问什么"的判断完全交给模型。不同模型理解力差异造成执行随机性。

对照 GSD `discuss-phase` 和 Superpowers `brainstorming` 的稳定性来源：把不确定性结构化成 **领域感知的灰色区域 + 候选选项化提问 + 决策快照**，让模型从「判断者」降级为「执行者」。

## 总体策略：三层 Harness + 防同质化

作用域：潜客发现段（公司搜索 + 联系人筛选）+ 用户经营画像持久化（同时被触达端复用，但触达端的工作流本身不改）。**邮件发送、邮件状态查询、计费、API Key 流程全部保持不变。**

三层职责分离，互不污染：

| 层 | 目标 | 生命周期 | 触发 | 模型角色 |
|---|---|---|---|---|
| **Layer 0: Merchant Profile** | 持久化用户经营画像，跨会话复用 | 长期 | 首次 Discovery 前轻量启动 + 后续渐进补全 + 独立管理 workflow | 收集者（首次）/ 默认值提供者（后续）|
| **Layer 1: Brief Discovery** | 收紧本次潜客需求精度 | 会话内存 | 默认进入，软性 gate 可跳过；优先用 Profile 提供 Gray Area 默认值 | 执行者（按 playbook 提问）|
| **Layer 2: Prospecting Expansion** | 扩大召回 + 常态化新视角 | 会话内存 | 双模式：Full（total < target_count，自动完整发散）/ Lite（total >= target_count，附加 2 维度轻量发散）| 推理者（按维度生成候选 + 解释理由）|

防同质化机制（横切，作用于结果展示前后）：

- **A. 本地去重（viewed.json）**：每次展示的公司域名持久化到 `~/.config/okki-go/viewed.json`，下次搜索后 client-side 过滤 30 天内已展示项，结果列表标注「✨ 新发现 / 📅 上次见过」
- **F. 多轴轮换提示（Rotation Hint）**：基于 Merchant Profile 中 `last_used_axes` 字段，在 Brief 确认前给出"换轴"建议（"上次重点是 DE，要不要试试 JP？"）
- **B+. Expansion 常态化（Lite Mode）**：即使首轮结果充足，也附加 2 个维度的"您可能没考虑过的角度"，让用户每次都能感受到新视角（合并到 Layer 2 内实现）

模型职责重新划分：
- **Profile 收集中**：仅按 playbook 提问，禁止臆造字段
- **Brief Discovery 中**：不决定问什么/问几个/参数怎么填——全部按 playbook 走，且必须优先呈现 Profile 默认值
- **Expansion 中**：在固定维度框架内自由发挥推理力——但每个候选必须带「为什么是潜客」的一句话理由
- **Rotation Hint 中**：依据 Profile 已用轴清单给建议，禁止脑补未在 Profile 中出现的领域

## 范围

新增 3 个 playbook 文件、新增 2 个状态文件设计、修改 1 个 SKILL.md：

- 新增 [`okki-go/skill/references/merchant-profile-playbook.md`](../skill/references/merchant-profile-playbook.md) —— Profile schema + 5 字段族 + 触发规则 + Discovery/触达复用方式
- 新增 [`okki-go/skill/references/discovery-playbook.md`](../skill/references/discovery-playbook.md) —— 灰色区域 + 选项化问题 + 信息度评分 + Brief → API 映射（Gray Area 优先用 Profile 默认值）
- 新增 [`okki-go/skill/references/expansion-playbook.md`](../skill/references/expansion-playbook.md) —— 触发阈值 + 5 个发散维度 + 候选输出格式 + 多轮规则
- 状态文件：`~/.config/okki-go/profile.json`（Merchant Profile，mode 0600）+ `~/.config/okki-go/viewed.json`（已展示公司去重，mode 0600）—— 由 SKILL.md 直接描述读写逻辑，不引入新脚本
- 修改 [`okki-go/skill/SKILL.md`](../skill/SKILL.md) —— 新增 Merchant Profile / Brief Discovery / Expansion / Anti-Staleness 四节、改写 Workflow A/C、改写 User Input Guidance、bump version

## 文件 1：新增 `references/merchant-profile-playbook.md`

文件骨架（约 200 行）：

### Section 1: Profile Schema（持久化结构）

文件位置：`~/.config/okki-go/profile.json`，mode `0600`。结构：

```json
{
  "version": "1.0",
  "updated_at": "2026-05-26T19:00:00Z",
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
    "applications": ["custom apparel", "promotional gifts"],
    "usps": ["Tier-1 components", "in-house R&D"],
    "certifications": ["CE", "ROHS"],
    "landing_page": "..."
  },
  "target_baseline": {
    "company_types": ["manufacturer", "trading"],
    "regions_primary": ["US", "DE", "UK", "AU"],
    "regions_excluded": ["RU"],
    "decision_roles": ["Procurement Manager", "Sourcing Director"],
    "employee_range": "50-1000"
  },
  "outreach_identity": {
    "sender_name": "...",
    "sender_title": "...",
    "sender_email": "...",
    "signature_block": "...",
    "preferred_language": "en"
  },
  "exclusions": {
    "competitor_domains": ["..."],
    "industries_blacklist": ["..."]
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

`completeness` 为 0-1 之间的填充度（按 5 字段族加权），驱动渐进补全决策。`history.last_used_axes` 由防同质化模块的 Rotation Hint 使用。

### Section 2: Trigger Modes（B+C 混合）

**模式 1: 首次轻量启动（Lite Onboarding）**

触发条件：
- 用户首次进入 Brief Discovery（profile.json 不存在或 `completeness < 0.3`）
- 已通过 API Key 验证

执行：仅问 4 题最关键的字段，构造一个最小可用 Profile：

- L1 单选："您的公司主要做什么？" → (a) 制造商 (b) 贸易商 (c) 服务商 (d) 品牌商
- L2 文本："您的主营产品/服务关键词（1-3 个）？"
- L3 多选："您主要服务哪些地区的客户？" → 常用候选 + 自定义
- L4 单选："您通常想触达哪类决策角色？" → 候选列表

完成后写入 `profile.json`，`completeness` 标记 0.3 左右，然后进入正常 Brief Discovery 流程。

**模式 2: 渐进补全（Progressive Enrichment）**

每次 Brief Discovery 开始时检查 Profile，若某字段族缺失（如 `offerings.usps` 为空、`outreach_identity` 为空），在对应 Gray Area 提问完毕后顺手追问一题：

> "顺便问一下，您方便告诉我贵公司相对竞品的核心卖点吗？（CE 认证 / 自研产线 / 30 天发货等）这些会被用于以后的开发信生成，不影响本次搜索。"

每次补全后写回 `profile.json`，更新 `completeness`。

**模式 3: 用户主动管理（Management Workflow）**

提供 `## Merchant Profile Management` workflow（在 SKILL.md 中），让用户随时：
- 查看当前 profile（隐藏 sender_email 等敏感字段）
- 修改任意字段（"把 regions_primary 改成 US, JP"）
- 清空重建（"重新设置经营画像"）
- 导出/导入（提示用户文件位置）

### Section 3: Discovery 端复用规则

Brief Discovery 的每个 Gray Area 必须在提问时**优先呈现 Profile 默认值**：

- Gray Area A（产品锚点）→ 默认值取自 `offerings.primary_products` + `offerings.product_keywords_en/zh`
- Gray Area A（公司类型）→ 默认值取自 `target_baseline.company_types`
- Gray Area B（行业）→ 默认值取自 `offerings.applications` 反推
- Gray Area C（地理包含）→ 默认值取自 `target_baseline.regions_primary`
- Gray Area C（地理排除）→ 默认值取自 `target_baseline.regions_excluded` + `exclusions.competitor_domains` 对应国家
- Gray Area D（规模）→ 默认值取自 `target_baseline.employee_range`
- Gray Area E（角色）→ 默认值取自 `target_baseline.decision_roles`

提问模板（带默认值）：

> 包含哪些目标市场？
> - 默认（来自您的画像）：US, DE, UK, AU
> - (a) 保持默认 (b) 调整地区（请告诉我加哪个/减哪个）(c) 完全重新选择

若用户修改了某个 Gray Area 的默认值，**询问是否把修改写回 Profile**：

> 您把地理范围从 [US, DE, UK, AU] 改成 [US, JP]。是否更新到您的经营画像（影响以后的默认推荐）？还是仅本次有效？

### Section 4: 触达端复用规则

**作用域明确**：本次 plan 不修改触达 Workflow（C/D）的步骤本身，仅在 SKILL.md 的「Output Formatting → Email send feedback」段落上方增加一条引用：

> 当生成开发信时，若 Profile 存在，模板可自动注入：
> - 签名块来自 `outreach_identity.signature_block`
> - 主推产品/USP 来自 `offerings.primary_products` + `offerings.usps`
> - 偏好语言来自 `outreach_identity.preferred_language`

具体落地由模型在调用 `/emails/send/personalized` 时按规则填充，不引入新 API。

### Section 5: Sensitive Fields & Privacy

- `outreach_identity.sender_email` / `sender_name` 视为半敏感字段：
  - 写入磁盘时正常存储（mode 0600 保护）
  - 在用户查看 Profile 时**默认隐藏**（显示 `r***@example.com`），明确要求"显示完整"才展开
  - 报告分析事件时**永不上报**
- 删除整个 profile.json 的命令必须明确（`rm ~/.config/okki-go/profile.json`），并在 Management workflow 中提供"清空重建"操作

## 文件 2：新增 `references/discovery-playbook.md`

文件骨架（约 200-300 行）：

### Section 1: When to Run Discovery (Information Sufficiency Check)

软性 gate 的判定逻辑，明确列出：

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

### Section 2: Five Gray Areas

按固定顺序提问，每个区域 2-3 题，全部使用「带候选选项的单选/多选」格式，禁止开放性问题。**每题必须优先呈现 Merchant Profile 的默认值**（详见 merchant-profile-playbook §3），用户可一键沿用 / 局部调整 / 完全重选。

- **A. 产品/品类锚点**（必答）
  - A1 单选："您主要想触达哪一类公司？"（默认：来自 `target_baseline.company_types`）→ (a) 保持默认 (b) 调整 (c) 制造商/工厂 (d) 经销商/代理商 (e) 品牌商/终端买家 (f) 服务商/集成商
  - A2 多选："您的核心产品/品类关键词？"（默认：来自 `offerings.product_keywords_en/zh`）→ 默认值 + 调整选项
  - A3 单选（可跳）："产品关键词如何与行业关键词组合？" → (a) 严格匹配（and）(b) 宽松匹配（or）
  
- **B. 行业上下文**（可跳）
  - B1 多选："优先聚焦的行业？" → 候选若干 + 自定义
  - B2 单选："是否限定主行业必须精确匹配？" → (a) 是 (b) 否（允许相关行业）

- **C. 地理覆盖**（必答）
  - C1 多选："包含哪些目标市场？" → 常用候选（US/DE/UK/JP/AU/...）+ "全球" + 自定义
  - C2 多选（可跳）："明确排除哪些市场？" → 常用候选 + 无

- **D. 规模与生命周期**（可跳）
  - D1 单选："目标公司员工规模？" → (a) <50 (b) 50-200 (c) 200-1000 (d) 1000+ (e) 不限
  - D2 单选（可跳）："是否优先有邮箱的公司？" → (a) 是（withEmails=true）(b) 否
  - **D3 单选（必答，新增）："您希望总共找到多少家公司？"** → (a) 10-20 (b) 20-50 (c) 50-100 (d) 100+ (e) 越多越好（默认 30）
    - 这一题驱动 Expansion 的触发阈值，是双层 harness 的衔接点

- **E. 决策角色**（可跳，但强烈建议）
  - E1 多选："您想触达的决策角色？" → 候选（采购经理 / 采购总监 / CEO / 销售总监 / 技术总监 / 供应链总监）+ 自定义
  - E2（仅在 E1 已填时）："这些角色用于 (a) 后续 profileEmails 筛选 (b) 直接走 contacts.search"

每个问题模板都包含：英文版（用户用英文时使用）+ 中文版（用户用中文时使用）。

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
  "expansion_rounds": []
}
```

`target_count` 来自 D3（默认 30），`expansion_rounds` 由后续 Expansion 写入（每轮一条记录）。

### Section 4: Brief → API Parameter Mapping

明确每个 Brief 字段如何映射到 `POST /api/v1/companies/search-advanced`，避免模型臆造参数：

- `product_anchor` → `productKeywords`
- `company_type` → `companyTypeKeywords`（如果用户选了 "manufacturer"，转成对应中英文关键词数组）
- `industry` → `industryKeywords`
- `cross_field_operator` → `crossFieldOperator`
- `geo_include` → `includeCountry`（ISO alpha-2，列出常见国家中文 → 代码对照）
- `geo_exclude` → `excludeCountry`
- `with_emails_only` → `withEmails`
- `employee_range` → 不写入 search-advanced（API 不支持），改为在结果端通过 `employees_count` 字段过滤后展示
- `decision_roles` → 不写入 search-advanced，用于后续 `profileEmails` 的 `keyword` 参数或 `contacts/search` 的 `title` 参数

### Section 5: Brief Confirmation Template

Discovery 结束后，模型必须用统一模板向用户呈现 brief 并请求确认，禁止直接调 API：

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

## 文件 3：新增 `references/expansion-playbook.md`

文件骨架（约 200-250 行）：

### Section 1: Trigger Rules（双模式触发）

Expansion 有两种运行模式，**每次首轮 search-advanced 完成后必经一次模式判定**：

**模式 1: Full Expansion（结果驱动自动触发）**

触发条件：`response.total < brief.target_count`（无 target_count 时默认阈值 30）

行为：
- 不询问用户，**自动进入**完整候选展示
- 覆盖 5 个维度，每维度生成 5-8 个候选
- 用户勾选后走第二轮 search，必要时多轮（上限 3 轮）

停止条件：
- 用户回复"够了"/"不需要更多"
- 累计扩展轮数 ≥ 3
- 累计 total 已达 target_count

**模式 2: Lite Expansion（常态化轻量发散，新增）**

触发条件：`response.total >= brief.target_count`（精准结果已满足，但仍主动给用户额外视角）

行为：
- 不打断主流程，结果表展示后**附带**一段「您可能没考虑过的角度」
- **仅生成 2 个维度**的候选（由模型从 5 个维度中挑最有信息量的 2 个，默认优先 A 价值链 + C 应用场景）
- **每维度仅 2-3 个候选**，每个候选仍必须附"为什么是潜客"理由
- 用户可勾选感兴趣的，触发追加搜索；可忽略，主流程不受影响

用户体验示例：

> 已为您找到 **45 家**符合画像的公司（满足目标 30 家）。下面是结果表 [...]
> 
> 💡 您可能没考虑过的角度（基于您的产品 DTF printer）：
> 
> **A. 价值链下游**
> - [ ] 个性化服装电商品牌 — 大批量印花需求，决策周期短
> - [ ] 体育队服定制工坊 — 季节性集中采购，预算稳定
> 
> **C. 应用场景延伸**
> - [ ] 广告礼品商 — DTF 用于一次性订单印花
> 
> 想看其中任何一个方向的公司吗？回复编号即可；不感兴趣可直接进入下一步。

用户开关：
- 用户可说"关闭发散建议"/"don't suggest expansion" → 本会话不再展示 Lite Expansion
- 用户可在 Brief 确认前明确说"只要精确匹配" → 本次跳过 Lite Expansion
- 默认开启，因为这是防同质化的核心机制

**两模式互斥**：每次首轮 search 后只走其中一种，不会同时出现。

### Section 2: Five Expansion Dimensions

每个维度由模型生成候选，**每个候选必须附 1 句"为什么是潜客"理由**——这是降低强模型胡说的关键约束。

候选数量按模式不同：
- **Full Expansion**：每维度 5-8 个候选，全部 5 个维度都展开
- **Lite Expansion**：仅展开 2 个维度（默认 A + C，模型可基于 brief 智能选择），每维度 2-3 个候选

- **A. Value Chain (价值链上下游)**
  - 上游：目标客户的供应商类型
  - 下游：目标客户的客户类型
  - 候选格式："(下游) 印花服装代工厂 — 大批量采购 DTF printer 用于服装印花订单"

- **B. Adjacent Products (相邻/替代产品)**
  - 同类替代：DTF ↔ DTG ↔ Sublimation
  - 互补品：printer + film + powder + ink
  - 升级/降级：工业级 ↔ 商业级 ↔ 家用级

- **C. Application Scenarios (应用场景反推)**
  - 该产品/服务用在哪些场景 → 反推这些场景的典型买家
  - 示例：服装定制工坊 / 体育用品厂 / 广告礼品商 / 汽车内饰装饰商

- **D. Synonyms (同义/变体关键词)**
  - 中英文别名、行业术语、缩写、口语化表达
  - 示例：DTF printer / direct-to-film printer / 数码热转印机 / heat transfer printer

- **E. Geo Adjacency (地理外溢)**
  - 邻近市场（地理 + 经济）
  - 同语言/文化圈
  - 产业集群外溢（如纺织印花 → PK / IN / VN）

### Section 3: Candidate Output Format

**Full Expansion 模板**（结果不足时）：

```markdown
首轮搜索结果不足（找到 12 家，目标 30 家）。我从 5 个维度生成了发散候选，请勾选感兴趣的方向：

### A. 价值链上下游
- [ ] (下游) 印花服装代工厂 — 大批量采购 DTF 用于订单
- [ ] (下游) 个性化电商品牌 — 自有打印产能或外包印花需求
- [ ] (上游) DTF 油墨制造商 — 你的客户的供应商，可能接触同一终端品牌

### B. 相邻产品
- [ ] DTG printer 制造商 — 印花技术相邻，买家画像高度重合
- [ ] 升华转印机制造商 — 替代技术，部分买家可同时考虑两种方案

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
- 默认选 A（价值链）+ C（应用场景）——这两个维度对模型推理价值最高
- 若 brief 中 `geo_include` 仅 1-2 个国家，可换成 A + E（地理外溢）
- 若 brief 中 `product_anchor` 维度单一，可换成 B（相邻产品）+ C
- 模型应在 SKILL.md 中描述此启发式，避免完全自由选择

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

## 文件 4：改造 `okki-go/skill/SKILL.md`

### 改动 1：新增 `## Merchant Profile` 节（在 `## Authentication & API Key Setup` 之后、`## Billing Confirmation Rules` 之前）

内容（约 40-50 行）：
- 概念说明：Merchant Profile 是持久化的用户经营画像，跨会话复用，用于 Discovery 默认值和触达内容生成
- 状态文件：`~/.config/okki-go/profile.json`，mode 0600，与 credentials.json 同目录管理
- 触发模式（B+C 混合）：
  - 首次进 Discovery 前若 profile 不存在或 `completeness < 0.3` → Lite Onboarding（4 题）
  - 后续每次 Discovery → Progressive Enrichment（仅补缺失字段）
  - 用户可随时进入 Management workflow
- **Profile Management Sub-Workflow**（独立 workflow）：
  - 触发短语："查看我的画像"、"修改经营画像"、"show my profile"、"update merchant profile"、"reset profile"
  - 操作：view（隐藏敏感字段）/ edit（任意字段）/ reset（清空重建）/ export（提示文件路径）
- 引用 `references/merchant-profile-playbook.md` 作为详细规则源
- 隐私声明：sender_email 不上报、查看时默认隐藏

### 改动 2：新增 `## Prospecting Brief Discovery (Soft Gate)` 节

位置：插在 `## Workflow Orchestration` 之前。

内容（约 30-40 行）：
- 说明这是软性 gate，列出 4 条触发/跳过规则（指向 discovery-playbook §1）
- **强调每个 Gray Area 必须优先呈现 Merchant Profile 默认值**（指向 merchant-profile-playbook §3）
- 明确顺序：Load Profile → Sufficiency Check → （进入则）Gray Area 提问（用 Profile 填默认值）→ 用户确认改动是否写回 Profile → 生成 Brief（含 target_count）→ 用户确认 → 映射参数 → 调 API
- 引用 `references/discovery-playbook.md`
- 内存 Brief 结构示例

### 改动 3：新增 `## Prospecting Expansion (Dual Mode)` 节

内容（约 40-50 行）：
- **每次首轮 search-advanced 完成后必经一次模式判定**——这是 B+ 常态化的核心改造
- **Full Expansion 模式**（`total < target_count`）：自动进入完整候选展示（5 维度 × 5-8 候选 × 多轮上限 3）
- **Lite Expansion 模式**（`total >= target_count`）：结果展示后**附带** 2 维度 × 2-3 候选的"您可能没考虑过的角度"，不打断主流程
- 列出 5 个发散维度（标题级别）+ Lite 模式的维度选择启发式（默认 A + C）
- 强调每个候选必须带「为什么是潜客」一句话理由
- 用户开关：可说"关闭发散建议"跳过 Lite 模式；可在 Brief 确认前说"只要精确匹配"跳过本次
- 多轮规则（仅 Full 模式）：累计达标即停 / 用户喊停 / 上限 3 轮
- 引用 `references/expansion-playbook.md`

### 改动 4：新增 `## Anti-Staleness Mechanisms` 节（紧跟 Expansion 节）

内容（约 30-40 行）：

**A. 本地去重（viewed.json）**：
- 状态文件：`~/.config/okki-go/viewed.json`，mode 0600
- 结构：
  ```json
  {
    "version": "1.0",
    "items": [
      {
        "domain": "techcorp.de",
        "shown_at": "2026-05-26T19:00:00Z",
        "brief_summary": "DE manufacturer DTF printer"
      }
    ]
  }
  ```
- 读时机：在 `search-advanced` 调用**后、结果展示前**，加载 viewed.json，对每条结果标记是否 30 天内已展示
- 写时机：结果展示给用户后立即追加新展示的 domain
- 用户体验：结果列表区分「✨ 新发现 X 家 / 📅 上次见过 Y 家」
- 容错：文件不存在或损坏时，按"全部为新"处理，不阻塞流程
- 用户开关：用户可说"包含已见过"来跳过过滤；可说"清空已见列表"重置

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

### 改动 5：改写 Workflow A（第 425-431 行）

旧：
```text
1. Search companies → display results table
2. Wait for user selection
3. Unlock company
4. Get contact emails
5. Display contacts → ask next step
```

新：
```text
1. Load Merchant Profile (if exists)
2. Run Prospecting Brief Discovery (Soft Gate) — uses Profile defaults; skip if Sufficiency Check passes
3. Apply Rotation Hint (if applicable) — see Anti-Staleness section
4. Confirm Brief with user (offer to write changes back to Profile)
5. Map Brief to search-advanced params
6. Search companies (free)
7. Filter via viewed.json (mark new vs seen)
8. Branch by total vs brief.target_count:
   - 8a. If total < target_count → **Full Expansion loop**:
     - Generate candidates across 5 dimensions (5-8 each)
     - User selects → merge into brief → re-search → re-filter via viewed.json
     - Repeat until target met OR user stops OR 3 rounds reached
   - 8b. If total >= target_count → **Lite Expansion** (unless user disabled):
     - Generate 2 dimensions (default A + C, or per heuristic) × 2-3 candidates each
     - Append as "您可能没考虑过的角度" below the main result table
     - User can ignore or click; clicking triggers an additional targeted search
9. Display results (annotate "新发现 / 上次见过") + append shown domains to viewed.json
10. Update Profile.history.last_used_axes
11. Wait for user selection
12. Unlock company (follow Billing Rule 1)
13. Get contact emails
14. Display contacts → ask next step (mention Profile may be used in outreach drafting)
```

### 改动 6：改写 Workflow C

同样的改造模式：前置 Profile 加载 + Discovery + Rotation Hint；中间插入 Expansion；结果展示前后插入 viewed.json 读写。

### 改动 7：改写 `## User Input Guidance` 段（第 323-347 行）

把当前的「vague/better」对照表替换为：

- 保留 "Language rule"（第 325 行）
- 删除「Common vague inputs」表和「Suggest better phrasing」段
- 替换为简短说明："For vague prospecting requests, run the Prospecting Brief Discovery workflow defined in `references/discovery-playbook.md`, and use Merchant Profile defaults from `references/merchant-profile-playbook.md`. Do NOT improvise clarifying questions."
- 对 balance/email status 等不需要 brief 的请求，保留"execute directly"的指引

### 改动 8：版本号与 changelog

- 顶部 `version: 1.0.12` → `version: 1.2.0`（minor bump，反映 Profile + Discovery + Expansion + Anti-Staleness 四大新模块）
- 各处 `1.0.12` 字面量同步替换
- 在 SKILL.md 末尾加 CHANGELOG 注释

## 状态文件设计汇总

两个新状态文件，均位于 `~/.config/okki-go/`（与现有 `credentials.json` 同目录）：

| 文件 | 用途 | 大小估算 | 生命周期 | mode |
|---|---|---|---|---|
| `profile.json` | Merchant Profile | ~2-4 KB | 长期持久化 | 0600 |
| `viewed.json` | 已展示公司去重 | 随使用增长，预计 100 条 ~10 KB | 30 天滚动过期 | 0600 |

读写时机由 SKILL.md 内的 workflow 步骤直接规定，**不引入新脚本**——所有读写都通过模型生成的 `cat`/`jq`/`echo` 命令完成（沿用现有 SKILL.md 风格）。

**容错原则**：
- 任何状态文件不存在或损坏 → 按"零状态"降级运行，不阻塞核心流程
- 文件 mode 不对（如 0644）→ 自动 chmod 0600，告知用户
- profile.json 字段缺失 → completeness 自动重算，进入对应 Progressive Enrichment

## 不做的事（明确划界）

- 不改 API Key resolver、`scripts/`、`api-reference.md`
- 不改邮件发送 / 邮件状态查询 / 计费 / 余额查询的工作流主流程（仅在文档中说明 Profile 字段如何被触达端复用）
- 不持久化 Brief / Expansion 历史到本地文件（只持久化 Profile 和 viewed）
- 不为「找联系人」（Workflow B）单独引入 discovery
- 不修改 `okki-go/eval/` 下任何测试代码
- Expansion 不调用任何外部知识图谱 API
- 不引入新的脚本——所有状态文件读写都用现有 `cat`/`jq`/`echo` 命令模式

## v2 候选清单（本次不做，但已为对接预留接口）

以下机制讨论过且认可方向，但出于范围/成本考虑放到下一个版本：

| 候选 | 描述 | 触发预留 | 预期影响 |
|---|---|---|---|
| **E. Prospect Pool** | 把每次搜索结果累积到本地潜客池 + 状态机（new/contacted/replied/closed）| 可在本次 viewed.json 基础上扩展为 pool.json | 价值锚点从"搜索"转向"经营管理"，但需重新审视 Skill 与 CRM 的边界 |
| **D. 反馈循环** | 用户对结果标 👍/👎，下次搜索时调权 | 可在 viewed.json 中扩展 `feedback` 字段 | 长期个性化，但需用户配合打标 |
| **H. 触达端个性化升级** | 同一公司用 USP × 对方画像多组合生成不同切入 | 依赖 Profile 已有 USP 字段 | 与本次 plan 完成后的触达体验联动评估 |
| **C/G. 服务端时序订阅 + 竞争对手反向挖掘** | 需要 search-advanced API 扩展（`since` / `excludeViewed` / `competitorTrade` 参数）| 需 OKKI 服务端 Roadmap 配合 | 数据库时序新鲜度，最高价值但跨团队 |

## 验证策略

由于这是 prompt 工程改造而非代码改动，验证方式是：

- **干跑测试用例**：在 `merchant-profile-playbook.md` 和 `discovery-playbook.md` 中各列 6-8 个典型输入，标注 Skip/Enter 路径和 Profile 默认值替换效果
- **状态文件 round-trip 测试**：手动模拟「首次启动 → Lite Onboarding → 写入 profile → 第二次进入 → 默认值被加载 → 用户调整 → 写回 profile」全链路，验证 SKILL.md 的步骤描述足以让弱模型完成
- **viewed.json 隔离测试**：搜同样 brief 两次，验证第二次结果中已展示项被标注
- **跨模型差异度量**：使用 `okki-go/eval/scenarios/` 跑同一组场景，对比改造前后不同模型行为一致性
