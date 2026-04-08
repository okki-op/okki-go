---
name: okki go
version: 1.0.5
description: "B2B lead prospecting & outreach — search companies, find contact emails, send cold emails (EDM), check status & credits; Search global companies, get contact emails, find contacts, send outreach emails, check email status, check credit balance; Triggers: 'find companies' 'find customers' 'prospect customers' 'find buyers' 'search companies' 'get emails' 'send outreach email' 'check credits' 'upgrade plan' 'buy credits'; NOT for: receiving/reading emails, CRM/pipeline management, account/billing settings"
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
    description: "API Key"
---

# Okki Go — B2B Lead Prospecting & Outreach Skill

Helps sales teams and businesses rapidly discover and analyze potential customers and execute outreach campaigns via AI Agent, taking B2B customer acquisition efficiency to the next level.

For complete API parameter documentation and response schemas, see [references/api-reference.md](./references/api-reference.md).

## Quick Install

- Install via OpenClaw platform

**Option 1 — Open the OpenClaw web UI → Sidebar → Skills → Search "okki-go" → Click Install**

**Option 2 — Type in the OpenClaw chat: "Please run npx clawhub@latest install --force 'okki-go' to install this skill, then verify the installation was successful"**

## Routing

### Use this skill when

- User wants to find companies or customers
- User wants to get contact emails for a company — find decision makers
- User wants to search contacts by name/title/email
- User wants to send outreach or cold emails (EDM)
- User wants to check email delivery status
- User wants to check remaining credits or EDM quota
- User needs the full prospecting workflow: search → contacts → outreach
- User wants to upgrade plan or buy credit packs

### Do NOT use this skill when

- Reading or receiving incoming emails — this skill is outbound-only
- CRM pipeline management, deal tracking, or sales forecasting

---

## Capabilities

| # | Feature | Description | Cost |
|---|---------|-------------|------|
| 1 | Search Companies | Filter target companies by industry, country, keywords, and more | Free |
| 2 | Company Profile | Get complete company business info and trade data | 1 credit (30-day dedup) |
| 3 | Company Contact Emails | Get contact email list for a specified company | Shared dedup with profile; no charge for empty results |
| 4 | Search Contacts | Search contacts across companies by name, title, email, etc. | 1 credit/query |
| 5 | Send Batch Outreach Emails | Same template to multiple recipients with variable substitution | 1 EDM quota/email |
| 6 | Send Personalized Outreach Emails | Individual content per recipient | 1 EDM quota/email |
| 7 | Check Email Delivery Status | View task list, per-email status, failure reasons | Free |
| 8 | Check Credits & EDM Balance | View remaining search credits and email quota | Free |

---

## Authentication & API Key Management

All endpoints use API Key authentication. Each user holds an independent key starting with `sk-`. Request header format:

```
Authorization: ApiKey $OKKIGO_API_KEY
X-Hostname: xxx
```

### First-Use Check

Before the first API call in each session, check whether a key is configured:

```bash
[ -z "$OKKIGO_API_KEY" ] && echo "NO_KEY" || echo "KEY_SET"
```

- **`KEY_SET`** → Proceed directly with the user's request
- **`NO_KEY`** → Follow the email verification flow below

If `NO_KEY` but the user has explicitly provided an API Key in context, save it directly. See saving instructions below.

### Email Verification to Obtain API Key

1. Ask the user for their email address
2. Send verification code:

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/register-email" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"email":"<user email>"}' | jq '.'
```

3. After the user provides the 6-digit code, exchange it for an API Key:

```bash
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/auth/verify-email" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "X-OpenClaw-Provision-Api-Key: true" \
  -H "Content-Type: application/json" \
  -d '{"email":"<user email>","code":"<6-digit code>"}' | jq '.'
```

4. Save the API Key (**required, one-time only**):

After obtaining the `apiKey` via email verification, **you must first inform the user** that you are about to run the following command to persist the config, and **explicitly ask for their consent** before proceeding:

```
I am about to run the following command to save your API Key to the okki-go skill config:
`openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"`
Do you agree?
```

Once the user confirms, execute:

```bash
openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"
```

If the command fails, display the following prompt for the user to run manually (show only once):

> Your API Key: sk-xxxxxxxxxxxxxxxxxxxx
> Please run the following command immediately to save it! This key is only shown once.
> `openclaw config set skills.entries.okkigo.apiKey "sk-xxxxxxxxxxxxxxxxxxxx"`

Once saved, OpenClaw will automatically inject it as `OKKIGO_API_KEY` in future sessions — no need to verify again.

---

## Billing Confirmation Rules

These rules protect users from being charged without their knowledge. **All workflows must follow them.**

### Rule 1: Confirm before implicitly calling paid endpoints

"Implicit call" means the user did not explicitly ask for company details or emails, but the Agent decided independently to call `profile` or `profileEmails`. In this case, confirm with the user first, e.g.:

> I found some matching companies. Getting full details or contact emails for a company costs 1 credit per company for the first query (free for repeats within 30 days). Should I proceed?

**Exception (no confirmation needed):** If the user explicitly said "get details", "view company info", "find emails", "need contacts", etc., treat it as user-initiated and call directly.

### Rule 2: Notify user of charges after calling paid endpoints

After each successful call to a paid endpoint, append a credit usage summary at the end of your response:

> 💡 This query used 1 credit. Current balance: XX (monthly) + YY (add-on).

For multiple companies in one batch:

> 💡 Queried 3 companies in total, used 2 credits (1 was a repeat within 30 days, no charge). Current balance: XX.

If unsure about the balance, call `GET /api/v1/credit/balance` after the paid endpoint returns, then display the latest balance.

### Rule 3: Confirm contact search on first call per session

**Before the first** call to `POST /contacts/search` in a session, regardless of whether the user brought it up, inform them of the charge and ask for confirmation:

> Contact search costs 1 credit per query. Continue searching now?

Once the user confirms, do not repeat this prompt for subsequent calls in the same session — proceed directly.

---

## Output Formatting

When presenting API results, use user-friendly formats rather than raw JSON.

### Company Search Results

Display key info in a table to help users quickly filter:

| # | Company Name | Country | Industry | Website |
|---|-------------|---------|----------|---------|
| 1 | TechCorp GmbH | Germany | Electronics | techcorp.de |
| 2 | ElekTech AG | Germany | Electronics | elektech.com |

- For more than 10 results, show the first 10, state the total count, and prompt "say 'next page' to see more"
- For no results, suggest relaxing criteria (different keywords, remove country filter, etc.)

### Contact Info

Display in a clear list, indicating whether email/LinkedIn is available:

| Name | Title | Email | LinkedIn |
|------|-------|-------|----------|
| Hans Mueller | Procurement Manager | hans@techcorp.de | ✅ |
| Lisa Schmidt | CEO | — | ✅ |

### Balance Info

Summarize in a concise format:

> **Current Account Balance**
> - Search credits: 80 (monthly) + 400 (add-on) = **480 available**
> - EDM quota: 200 (monthly) + 2000 (add-on) = **2200 available**
> - Monthly quota resets: 2026-04-30

### Email Send Feedback

Show a task summary after sending:

> ✅ Submitted 2 emails (Task ID: 1001), Status: Pending
> Emails are sent asynchronously — actual delivery takes seconds to minutes. Let me know if you'd like to check delivery status later.

Show a summary + failure details when checking status:

> **Task 1001 Delivery Status**: 48 sent / 2 failed / 50 total
> Failures: bob@globex.com — Invalid email address

---

## Workflow Orchestration

User requests often span multiple workflows. The Agent needs to understand when to chain steps and when to pause for user decisions.

### Exploratory: "Help me find a batch of target customers"

1. **Search companies** (free) → display results table
2. **Wait for user to select** companies of interest → do NOT proactively call paid endpoints
3. Once user specifies → **get contact emails** (confirm billing per Rule 1, then execute)
4. Display contacts → ask if they want to send outreach emails

### Targeted: "Send outreach emails to procurement managers in the German electronics industry"

1. Search companies → show results for user to confirm target companies
2. Get contacts (confirm charge, then execute) → filter for procurement-related titles
3. Display contact list → **ask user to confirm recipients and email content**
4. Only send after user confirms — **never send emails automatically before user confirmation**

### Follow-up: "What happened with the emails I sent last time?"

Call the email status endpoint directly (free) — no confirmation needed.

### Core Principles

- **Free operations can be executed proactively**: search companies, check balance, check email status
- **Paid operations must strictly follow billing confirmation rules** — never skip them
- **Email sending always requires explicit user confirmation** of content and recipients
- When in doubt, **show the information and let the user decide** rather than deciding for them

---

## When to Use This Skill

### Typical user intents that trigger this skill

| User says | Corresponding action |
|-----------|---------------------|
| "Help me find electronics companies in Germany" | Workflow A step 1 |
| "Get detailed info on this company" | Workflow A step 2 |
| "Find contact emails for this company" | Workflow A step 3 |
| "Find Alice Wang's contact info" | Workflow B |
| "Search for procurement managers with emails" | Workflow B |
| "Send an outreach email to these customers" | Workflow C |
| "Send a personalized email to each company" | Workflow D |
| "How many of the emails I sent last time went through?" | Workflow F |
| "How many credits do I have left?" | Workflow E |

### Scenarios where this skill is NOT appropriate

- Receiving/reading incoming emails (this skill is outbound-only)
- User registration, recharging, password changes, or other account management (direct to the website)
- Sending more than 100 emails at once (split into batches)
- Free plan users sending EDM (prompt to upgrade)

---

## Step-by-Step Workflows

### Workflow A: Search Companies → View Profile → Get Contact Info (Sequential)

**Step 1: Search company list (free)**

```bash
# Search electronics companies in Germany, 20 per page
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

Note the `companyHashId` from the response for subsequent queries. The `contacts` and `phone` fields in search results are hidden — use `profileEmails` to retrieve them.

> **⚠️ Billing Confirmation (for implicit calls):** If the user did not explicitly ask for company details, confirm before calling (see Billing Confirmation Rule 1). For user-initiated requests, call directly. After a successful call, include credit usage in the response (see Rule 2).

**Step 2: View company profile (paid — follow Billing Rules 1 & 2)**

```bash
COMPANY_ID="abc123hash"

curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profile" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.'
```

**Step 3: Get contact emails (paid — shares 30-day dedup with profile)**

```bash
# Supports keyword filtering (e.g., job title keywords "CEO", "Buyer")
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profileEmails?keyword=buyer&page=1" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.emails[] | {name, email, title}'
```

Fetch multiple companies in parallel:

```bash
for COMPANY_ID in "hash001" "hash002" "hash003"; do
  curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/companies/${COMPANY_ID}/profileEmails" \
    ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
    -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq --arg id "$COMPANY_ID" '{companyId: $id, emails: [.emails[]? | {name, email}]}' &
done
wait
```

> `profile` and `profileEmails` share the same 30-day dedup record. If you already called `profile`, calling `profileEmails` for the same company won't be charged again. If the company returns an empty emails list, no credits are deducted.

---

### Workflow B: Search Contacts Directly

Independent of company search — search across companies by name/email/title. **Follow Billing Rule 3 (first-session confirmation) and Rule 2 (notify on charges).**

```bash
# Search by name
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Wang", "size": 20, "page": 1}' | jq '.list[] | {name, email, title, company}'

# Search by email (contact_match specifies email matching)
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"contact_match": "alice@acme.com", "size": 10, "page": 1}' | jq '.'

# Search by title + country, require email
curl -s -X POST "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/contacts/search" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Content-Type: application/json" \
  -d '{"title": "Procurement Manager", "country_codes": "US", "has_email": 1, "size": 20, "page": 1}' | jq '.list[] | {name, email, title, company}'
```

> For the full parameter list, see [api-reference.md § 5. Search Contacts](./references/api-reference.md#5-搜索联系人).

---

### Workflow C: Send Batch Outreach Emails

Same template to multiple recipients, with `#variable_name#` format variable substitution.

**Step 1: Check balance to confirm EDM quota**

```bash
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | \
  jq '{monthlyEdm, addonEdm, totalEdm: (.monthlyEdm + .addonEdm)}'
```

If quota is insufficient, direct the user to the pricing page: [go.okki.ai/pricing](https://go.okki.ai/pricing)

**Step 2: Show email content for user confirmation, then send**

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

> Sending is async. Record the `task_id` from the response for checking progress in Workflow F.

---

### Workflow D: Send Personalized Outreach Emails

Each email uses individual content — ideal for AI-generated personalized outreach.

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

### Workflow E: Check Credits & EDM Balance

```bash
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '.'
```

Field reference:
- `monthlyPoints + addonPoints` = total available search credits
- `monthlyEdm + addonEdm` = total available email quota
- `monthlyExpiresAt` = monthly quota reset date
- Charges deduct from monthly quota first; add-on packs are used automatically when monthly is exhausted

---

### Workflow F: Check Email Delivery Status

Only call when the user asks proactively ("did it send?", "which ones failed?") — **do not poll automatically**.

```bash
# F1: View recent task list
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/tasks" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | \
  jq '.data[] | {taskId, status, sentCount, failedCount, totalCount, createdAt}'

# F2: View task details (includes per-email status)
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/tasks/${TASK_ID}" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.'

# F3: Query delivery records for a specific recipient across tasks
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/mails?recipient_email=alice@acme.com" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.data[] | {mailId, taskId, status, sentAt}'

# F4: View full details for a single email
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/emails/mails/${MAIL_ID}" \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} | jq '.'
```

Task status flow: `pending` → `requested` → `completed` (all sent) / `partial` (partially sent) / `failed` (all failed)

> For full query parameters (filter by time/status/subject, etc.), see [api-reference.md § 8-11](./references/api-reference.md#8-查询邮件任务列表).

---

## Error Handling

| HTTP Code | Scenario | Agent Action |
|-----------|----------|--------------|
| 401 | Invalid or unconfigured API Key | Guide user to reconfigure (see Authentication section) |
| 402 | Insufficient credits or EDM quota | Inform user balance is exhausted; direct to [pricing](https://go.okki.ai/pricing) |
| 403 | Free plan has no EDM access | Inform user Free plan doesn't support email sending; prompt to upgrade |
| 400 | Invalid parameter format | Check email format, content ≤50000 chars, recipients ≤100 |
| 404 | Resource not found | Confirm ID came from search results — never manually construct IDs |
| 429 | Rate limit (60 req/min) or quota exceeded | Wait and retry; for quota exceeded, inform user of remaining amount and reset time |
| 502 | EDM third-party service error | Suggest retry later; deducted quota will be refunded automatically |

Error responses follow RFC 7807 Problem Details format, containing `type`, `title`, `status`, and `detail` fields.

---

## Pricing

When users ask about plan details, upgrades, or credit packs, direct them to the pricing page for up-to-date information:
[go.okki.ai/pricing](https://go.okki.ai/pricing)

---

## Important Notes

1. **30-day deduplication** — `profile` and `profileEmails` share the same dedup record for a company; no charge for repeat queries within 30 days
2. **No charge for empty emails** — `profileEmails` returning an empty list does not deduct any credits
3. **EDM is async** — returns `task_id` immediately; actual delivery takes seconds to minutes
4. **Single EDM batch limit: 100** — split into multiple calls for more than 100 emails
5. **Dual-bucket credit deduction** — monthly quota is consumed first; add-on packs are used automatically when monthly is exhausted
6. **Company search is completely free** — `POST /companies/search` does not deduct credits; call as many times as needed
7. **companyHashId cannot be manually constructed** — must be obtained from search results

---

## Installation

### OpenClaw Installation Steps

```bash
# 1. Create skill directory
mkdir -p ~/.openclaw/workspace/skills/okki-go

# 2. Copy skill files
cp {okki-go skill directory}/skill.md ~/.openclaw/workspace/skills/okki-go/
cp -r {okki-go skill directory}/references ~/.openclaw/workspace/skills/okki-go/

# 3. Set environment variables (optional — can be obtained via email verification on first use)
export OKKIGO_API_KEY="sk-your-key-here"
export OKKIGO_BASE_URL="https://go.okki.ai"
```

Add environment variables to `~/.bashrc` or `~/.zshrc` to persist them.

### Verify Installation

```bash
# Check balance (free endpoint — verifies Key is valid)
curl -s "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  ${HOSTNAME:+-H "X-Hostname: $HOSTNAME"} \
  -H "Authorization: ApiKey $OKKIGO_API_KEY" | jq '{monthlyPoints, monthlyEdm}'
```

Expected response includes `monthlyPoints` and `monthlyEdm` fields. If you get 401, check your `OKKIGO_API_KEY`.

### Get an API Key

Two options:
1. **Auto-obtain via conversation**: On first use, the Agent will guide you through email verification and automatically persist the key with `openclaw config set`
2. **Manual**: Visit [go.okki.ai](https://go.okki.ai), register an account, and create a key in the dashboard

---

## Advanced Reference

For complete request/response schemas, full parameter constraints, and pagination details, see [references/api-reference.md](./references/api-reference.md).
