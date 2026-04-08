---
name: okki go
version: 1.0.3
description: "B2B 搜客户、找公司、开发客户、获取联系人的获客 skill; B2B lead prospecting & outreach — search companies, find contact emails, send cold emails (EDM), check status & credits; 搜索全球企业、获取联系人邮箱、搜索联系人、发送开发信、查邮件状态、查积分余额; Triggers: '搜客户' '找客户' '开发客户' '找买家' '拓客' '搜公司' '查邮箱' '发开发信' '查积分' 'find companies' 'get contact emails' 'send outreach email' 'check credits' '升级套餐' '买积分' 'upgrade plan' 'buy credits'; NOT for: 收邮件 receiving/reading emails, CRM/pipeline management, 账号管理 account/billing settings"
metadata:
  openclaw:
    emoji: "🌐"
    requires:
      bins: ["curl", "jq"]
    primaryEnv: "OKKIGO_API_KEY"
    homepage: "https://go.okki.ai"
config:
  apiKey:
    type: string
    required: true
    description: "API 密钥"
---

# Okki Go — B2B 潜客挖掘与触达 Skill

帮助销售人员和企业通过 AI Agent 快速发现、分析潜在客户并完成开发信触达，将 B2B 客户开发效率提升一个量级。

完整 API 参数说明和响应 Schema 参见 [references/api-reference.md](./references/api-reference.md)。

## 快速安装指南 | Quick Install

- openclaw 平台安装

** 方式1——打开openclaw网页交互界面 —> 侧边栏 -> 技能 -> 搜索“okki go” -> 点击安装 **

** 方式2——往openclaw对话框输入：“请执行 npx clawhub@latest install --force 'okki go' 安装这个skill，然后检查这个skill是否安装成功” **

## Routing

### Use this skill when | 使用本 skill 的场景

- User wants to find companies or customers — 用户想搜客户、找公司、找买家
- User wants to get contact emails for a company — 用户想查联系人邮箱、找决策人
- User wants to search contacts by name/title/email — 用户想按姓名、职位、邮箱搜索联系人
- User wants to send outreach or cold emails (EDM) — 用户想发开发信、群发邮件
- User wants to check email delivery status — 用户想查邮件发送结果
- User wants to check remaining credits or EDM quota — 用户想查积分余额
- User needs the full prospecting workflow: search → contacts → outreach — 用户需要完整获客链路
- User wants to upgrade plan or buy credit packs — 用户想升级套餐、购买积分包或加购 EDM 配额

### Do NOT use this skill when | 不要使用本 skill 的场景

- Reading or receiving incoming emails — this skill is outbound-only（本 skill 仅支持外发，不支持收件/阅读邮件）
- CRM pipeline management, deal tracking, or sales forecasting（不支持 CRM 管道管理、商机跟踪、销售预测）

---

## 功能一览 | Capabilities

| # | 功能 | 描述 | 扣费 |
|---|------|------|------|
| 1 | 搜索公司 | 按行业、国家、关键词等多维度筛选目标企业 | 免费 |
| 2 | 查看公司 Profile | 获取公司完整工商信息和贸易数据 | 1 积分（30 天去重）|
| 3 | 获取公司联系人邮件 | 获取指定公司的联系人邮箱列表 | 与 profile 共享去重；空结果不扣 |
| 4 | 搜索联系人 | 按姓名、职位、邮箱等跨公司搜索联系人 | 1 积分/次 |
| 5 | 发送批量开发信 | 同一模板群发，支持变量替换 | 1 EDM 配额/封 |
| 6 | 发送个性化开发信 | 每封独立内容，千人千面 | 1 EDM 配额/封 |
| 7 | 查询邮件发送状态 | 查看任务列表、单封状态、失败原因 | 免费 |
| 8 | 查询积分与 EDM 余额 | 查看剩余搜索积分和邮件配额 | 免费 |

---

## 认证与 API Key 管理 | Authentication

所有接口使用 API Key 认证。每个用户持有独立的 `sk-` 开头密钥。请求头格式：

```
Authorization: ApiKey $OKKIGO_API_KEY
X-Hostname: xxx
```

### 首次使用检查

每次会话首次调用 API 前，检测 key 是否已配置：

```bash
[ -z "$OKKIGO_API_KEY" ] && echo "NO_KEY" || echo "KEY_SET"
```

- **`KEY_SET`** → 直接执行用户请求
- **`NO_KEY`** → 走下方邮箱验证流程

如果在 NO_KEY 的情况下，用户上下文中明确给出了Api Key，则直接保存用户给出的Api Key，保存Api Key的详细操作见下文。

### 邮箱验证获取 API Key

1. 请用户提供邮箱地址
2. 发送验证码：

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/register-email" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"email":"<用户邮箱>"}' | jq '.'
```

3. 用户提供 6 位验证码后，换取 API Key：

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/verify-email" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "X-OpenClaw-Provision-Api-Key: true" \
  -H "Content-Type: application/json" \
  -d '{"email":"<用户邮箱>","code":"<6位验证码>"}' | jq '.'
```

4. 保存 API Key（**必须，只需执行一次**）：

经过邮箱验证获取 `apiKey` 后，**必须先告知用户** Agent 即将执行以下命令来持久化配置，并**强制询问用户是否同意**，用户确认后方可执行：

```bash
我即将执行以下命令，将您的 API Key 保存到 okki go skill 配置中：
`openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"`
是否同意执行？
```

用户同意后执行：

```bash
openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"
```

如果命令执行失败，输出以下提示让用户手动执行（仅提示一次）：

> 您的 API Key: sk-xxxxxxxxxxxxxxxxxxxx
> 请立即执行以下命令保存！此 Key 只显示这一次。
> `openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"`

保存后 OpenClaw 在后续会话中自动注入为 `OKKIGO_API_KEY`，无需重复验证。

---

## 计费确认规则 | Billing Confirmation Rules

以下规则保护用户不在不知情的情况下被扣积分，**所有工作流统一遵守**。

### 规则 1：隐式调用付费接口须确认

"隐式调用"指用户未明确要求查详情/找邮箱，但 Agent 自主决定调用 `profile` 或 `profileEmails`。此时须先向用户确认，话术示例：

> 我找到了一些符合条件的公司。获取某家公司的完整详情或联系人邮件，每家首次查询消耗 1 积分（30 天内重复免费）。需要继续吗？

**例外（无需确认）：** 用户明确说了"查详情"、"看公司信息"、"找邮箱"、"要联系人"等意图，视为主动触发，直接调用。

### 规则 2：调用付费接口后必须告知扣费

每次成功调用付费接口，在回答末尾附上积分消耗情况：

> 💡 本次查询消耗了 1 积分，当前剩余：XX（月度）+ YY（加购）。

多家公司汇总时：

> 💡 本次共查询了 3 家公司，消耗 2 积分（1 家为 30 天内重复查询，未扣费）。当前剩余：XX。

如果不确定余额，可在付费接口返回后额外调用 `GET /api/v1/credit/balance` 获取最新余额再展示。

### 规则 3：联系人搜索首次会话确认

本次会话中**第一次**调用 `POST /contacts/search` 前，无论用户是否主动提出，须告知扣费并征求确认：

> 联系人搜索每次查询消耗 1 积分。现在继续搜索吗？

用户确认后，本次会话后续调用不再重复提示，直接执行。

---

## 输出格式化指引 | Output Formatting

Agent 展示 API 结果时，应使用用户友好的格式，而非直接输出 JSON。

### 公司搜索结果

以表格展示关键信息，帮助用户快速筛选：

| # | 公司名称 | 国家 | 行业 | 官网 |
|---|---------|------|------|------|
| 1 | TechCorp GmbH | 德国 | Electronics | techcorp.de |
| 2 | ElekTech AG | 德国 | Electronics | elektech.com |

- 超过 10 条结果时展示前 10 条，告知总数并提示"需要查看更多请说'下一页'"
- 搜索无结果时建议放宽条件（换关键词、去掉国家限制等）

### 联系人信息

以清晰列表展示，标注有无邮箱/LinkedIn：

| 姓名 | 职位 | 邮箱 | LinkedIn |
|------|------|------|----------|
| Hans Mueller | Procurement Manager | hans@techcorp.de | ✅ |
| Lisa Schmidt | CEO | — | ✅ |

### 余额信息

用简洁格式汇总：

> **当前账户余额**
> - 搜索积分：80（月度）+ 400（加购）= **480 可用**
> - EDM 配额：200（月度）+ 2000（加购）= **2200 可用**
> - 月度配额重置时间：2026-04-30

### 邮件发送反馈

发送后展示任务摘要：

> ✅ 已提交 2 封邮件（任务 ID: 1001），状态: 等待处理
> 邮件为异步发送，实际送达需数秒至数分钟。需要稍后查询发送状态请告诉我。

查询状态时展示汇总 + 失败明细：

> **任务 1001 发送情况**：48 封成功 / 2 封失败 / 共 50 封
> 失败明细：bob@globex.com — Invalid email address

---

## 场景编排指引 | Workflow Orchestration

用户需求常跨越多个工作流，Agent 需要理解何时串联、何时停下来等用户决策。

### 探索型："帮我找一批目标客户"

1. **搜索公司**（免费）→ 展示结果表格
2. **等待用户选择**感兴趣的公司 → 不要主动调用付费接口
3. 用户指定后 → **获取联系人邮件**（遵循计费规则 1 确认后执行）
4. 展示联系人 → 询问是否需要发开发信

### 精准型："给德国电子行业的采购经理发开发信"

1. 搜索公司 → 展示结果让用户确认目标公司
2. 获取联系人（确认扣费后执行）→ 筛选采购相关职位
3. 展示联系人列表 → **征求用户确认发送对象和邮件内容**
4. 用户确认后才发送，**绝不在用户确认前自动发送邮件**

### 回查型："上次发的邮件情况怎么样"

直接调用邮件状态查询接口（免费），无需确认。

### 核心原则

- **免费操作可以积极执行**：搜索公司、查余额、查邮件状态
- **付费操作严格遵循计费确认规则**，不可跳过
- **发送邮件永远需要用户显式确认**内容和收件人
- 不确定时，**优先展示信息让用户决策**，而非替用户做决定

---

## 触发场景 | When to Use This Skill

### 触发本 skill 的典型用户意图

| 用户说 | 对应操作 |
|-------|---------|
| "帮我找德国的电子产品企业" | 工作流 A 步骤 1 |
| "查一下这家公司的详细信息" | 工作流 A 步骤 2 |
| "帮我找这家公司的联系人邮箱" | 工作流 A 步骤 3 |
| "帮我找 Alice Wang 的联系方式" | 工作流 B |
| "搜索有邮箱的采购经理" | 工作流 B |
| "帮我给这些客户发一封开发信" | 工作流 C |
| "给每家公司各发一封个性化邮件" | 工作流 D |
| "上次发的邮件发出去多少封了" | 工作流 F |
| "我还有多少积分" | 工作流 E |

### 不适合使用本 skill 的场景

- 接收/阅读收到的邮件（本 skill 仅支持外发）
- 用户注册、充值、修改密码等账号管理操作（引导用户去官网）
- 单次发送超 100 封（需分批调用）
- Free 套餐用户发送 EDM（引导升级）

---

## 详细步骤 | Step-by-Step Workflows

### 工作流 A：搜索公司 → 查看详情 → 获取联系人信息（串行流程）

**步骤 1：搜索公司列表（免费）**

```bash
# 搜索德国的电子产品企业，每页 20 条
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "electronics",
    "countryCode": "DE",
    "pageSize": 20,
    "page": 1
  }' | jq '.list[] | {companyHashId, name, country, industry}'
```

从响应中记录 `companyHashId`，用于后续查询。搜索结果中 `contacts` 和 `phone` 字段已隐藏，需通过 profileEmails 获取。

> **⚠️ 计费确认（适用于隐式调用）：** 若用户未明确要求查看公司详情，调用前须先确认（见「计费确认规则」Rule 1）。用户主动请求则直接执行。调用成功后需在回答中说明积分消耗情况（见 Rule 2）。

**步骤 2：查看公司 Profile（付费 — 遵循计费规则 1 & 2）**

```bash
COMPANY_ID="abc123hash"

curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profile" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.'
```

**步骤 3：获取联系人邮件（付费 — 与 profile 共享 30 天去重）**

```bash
# 支持按关键词筛选联系人（如职位关键词 "CEO"、"Buyer"）
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profileEmails?keyword=buyer&page=1" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.emails[] | {name, email, title}'
```

多家公司可并行获取：

```bash
for COMPANY_ID in "hash001" "hash002" "hash003"; do
  curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profileEmails" \
    ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
    -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq --arg id "$COMPANY_ID" '{companyId: $id, emails: [.emails[]? | {name, email}]}' &
done
wait
```

> profile 和 profileEmails 共享同一个 30 天去重记录，若已调用过 profile 再调 profileEmails 不重复扣分。若该公司返回的 emails 为空不扣积分。

---

### 工作流 B：直接搜索联系人

独立于公司搜索，按姓名/邮箱/职位跨公司搜索。**遵循计费规则 3（首次会话确认）和规则 2（告知扣费）。**

```bash
# 按姓名搜索
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Wang", "size": 20, "page": 1}' | jq '.list[] | {name, email, title, company}'

# 按邮箱搜索（contact_match 指定按邮箱匹配）
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"contact_match": "alice@acme.com", "size": 10, "page": 1}' | jq '.'

# 按职位 + 国家搜索，要求有邮箱
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"title": "Procurement Manager", "country_codes": "US", "has_email": 1, "size": 20, "page": 1}' | jq '.list[] | {name, email, title, company}'
```

> 完整参数列表参见 [api-reference.md § 5. 搜索联系人](./references/api-reference.md#5-搜索联系人)。

---

### 工作流 C：发送批量开发信

同一模板发给多人，支持 `#variable_name#` 格式的变量替换。

**步骤 1：查余额确认 EDM 配额**

```bash
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | \
  jq '{monthlyEdm, addonEdm, totalEdm: (.monthlyEdm + .addonEdm)}'
```

配额不足时引导用户前往定价页查看套餐和加购选项：[go.okki.ai/pricing](https://go.okki.ai/pricing)

**步骤 2：展示邮件内容让用户确认，确认后发送**

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/send/batch" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Dear #company_name#, we would love to partner with you on our latest products.",
    "body_format": "html",
    "recipients": [
      {
        "email": "alice@acme.com",
        "subject": "Partnership Opportunity",
        "nickname": "Alice",
        "variables": { "#company_name#": "Acme Corp" }
      },
      {
        "email": "bob@globex.com",
        "subject": "Partnership Opportunity",
        "nickname": "Bob",
        "variables": { "#company_name#": "Globex Inc" }
      }
    ]
  }' | jq '.'
```

> 发送为异步处理，记录响应中的 `task_id` 供工作流 F 查询进度。

---

### 工作流 D：发送个性化开发信

每封邮件使用独立内容，适合 AI 生成的千人千面开发信。

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/send/personalized" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {
        "content": "Hi Alice, Acme Corp has been a leader in textiles and we believe...",
        "body_format": "html",
        "email": "alice@acme.com",
        "subject": "Custom Proposal for Acme Corp",
        "nickname": "Alice"
      },
      {
        "content": "Hi Bob, we noticed Globex recently expanded to Europe and...",
        "body_format": "html",
        "email": "bob@globex.com",
        "subject": "Growth Opportunity for Globex",
        "nickname": "Bob"
      }
    ]
  }' | jq '.'
```

---

### 工作流 E：查询积分与 EDM 余额

```bash
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.'
```

字段说明：
- `monthlyPoints + addonPoints` = 当前可用搜索积分总量
- `monthlyEdm + addonEdm` = 当前可发送邮件总量
- `monthlyExpiresAt` = 月度配额重置时间
- 扣费优先消耗 monthly 配额，不足时自动使用 addon 加购包

---

### 工作流 F：查询邮件发送状态

用户主动询问时才调用（"发了没"、"哪些失败了"），**不需要主动轮询**。

```bash
# F1：查看最近任务列表
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/tasks" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | \
  jq '.data[] | {taskId, status, sentCount, failedCount, totalCount, createdAt}'

# F2：查看某次任务详情（含每封邮件状态）
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/tasks/${TASK_ID}" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.'

# F3：跨任务查询特定收件人的发送记录
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/mails?recipient_email=alice@acme.com" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.data[] | {mailId, taskId, status, sentAt}'

# F4：查看单封邮件完整详情
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/mails/${MAIL_ID}" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.'
```

任务状态流转：`pending`（等待）→ `requested`（已提交）→ `completed`（全部成功）/ `partial`（部分成功）/ `failed`（全部失败）

> 完整查询参数（按时间/状态/主题过滤等）参见 [api-reference.md § 8-11](./references/api-reference.md#8-查询邮件任务列表)。

---

## 错误处理 | Error Handling

| HTTP 码 | 场景 | Agent 处理方式 |
|---------|------|---------------|
| 401 | API Key 无效或未配置 | 引导重新配置（参考「认证与 API Key 管理」章节）|
| 402 | 积分或 EDM 配额不足 | 告知余额已用尽，引导前往 [pricing](https://go.okki.ai/pricing) 购买 |
| 403 | Free 套餐无 EDM 权限 | 告知 Free 套餐不支持邮件发送，引导升级 |
| 400 | 参数格式错误 | 检查 email 格式、content ≤50000 字符、recipients ≤100 |
| 404 | 资源不存在 | 确认 ID 来自搜索结果，不要手动构造 |
| 429 | 速率限制（60 次/分钟）或配额超限 | 等待后重试；配额超限向用户说明剩余量及重置时间 |
| 502 | EDM 第三方服务异常 | 提示稍后重试，已扣配额会自动退还 |

错误响应格式为 RFC 7807 Problem Details，包含 `type`、`title`、`status`、`detail` 字段。

---

## 套餐与定价 | Pricing

当用户询问套餐详情、升级或购买积分包时，引导用户访问定价页获取最新信息：
[go.okki.ai/pricing](https://go.okki.ai/pricing)

When users ask about plans, upgrades, or credit packs, direct them to the pricing page for up-to-date details.

---

## 注意事项 | Important Notes

1. **30 天去重** — profile 和 profileEmails 对同一公司共享去重记录，30 天内重复查看不扣积分
2. **空邮件不计费** — profileEmails 返回空列表不扣任何积分
3. **EDM 异步发送** — 调用后立即返回 `task_id`，实际送达需等待数秒至数分钟
4. **单次 EDM 上限 100 封** — 超过 100 封需分批调用
5. **积分双桶扣费** — 先消耗月度配额，不足时自动扣加购包
6. **搜索公司完全免费** — `POST /companies/search` 不扣积分，可多次调用筛选
7. **companyHashId 不可手动构造** — 必须从搜索结果中获取

---

## 安装 | Installation

### OpenClaw 安装步骤

```bash
# 1. 创建 skill 目录
mkdir -p ~/.openclaw/workspace/skills/okki-go

# 2. 复制 skill 文件
cp {okki go skill 目录}/skill.md ~/.openclaw/workspace/skills/okki-go/
cp -r {okki go skill 目录}/references ~/.openclaw/workspace/skills/okki-go/

# 3. 设置环境变量（可选，未设置时可在首次使用时通过邮箱验证获取）
export OKKIGO_API_KEY="sk-your-key-here"
export OKKIGO_BASE_URL="https://go.okki.ai"
```

将环境变量添加到 `~/.bashrc` 或 `~/.zshrc` 以持久化。

### 验证安装

```bash
# 查询余额（免费接口，验证 Key 是否有效）
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '{monthlyPoints, monthlyEdm}'
```

预期返回包含 `monthlyPoints` 和 `monthlyEdm` 字段。若返回 401，请检查 `OKKIGO_API_KEY`。

### 获取 API Key

两种方式：
1. **对话中自动获取**：首次使用时 Agent 会引导邮箱验证，自动完成 `openclaw config set` 持久化
2. **手动获取**：访问 [go.okki.ai](https://go.okki.ai) 注册账号，在控制台创建密钥

---

## 高级参考 | Advanced Reference

完整的请求/响应 Schema、全部参数约束和分页说明，参见 [references/api-reference.md](./references/api-reference.md)。
