# Paid Actions

Read this for `PAID_ACTION`: unlock, cross-company contact search, or sending email.

## Contents

1. Non-Bypassable Rules
2. Company Unlock
3. Contact Search
4. Email Send
5. Balance and Local State
6. Missing Batch Recovery

## 1. Non-Bypassable Rules

- Free company search is allowed without paid confirmation.
- Unlock selected companies requires explicit credit confirmation before every `/companies/unlock` call.
- Cross-company `POST /contacts/search` requires first-session confirmation that it costs 1 credit per query.
- Email send requires explicit recipient and content confirmation.
- Profile, Web Research, Expansion, result review, and search strategy cannot authorize paid actions.

## 2. Company Unlock

Ask before every unlock:

```text
Unlocking this company costs 1 credit unless it was unlocked in the last 30 days. Proceed?
```

After confirmation for displayed rows:

```bash
node scripts/unlock-companies.js --batch latest --rows 1,3,5 --mark-unlocked --compact --locale '<user-locale>'
```

Report:

- charged count or whether no credit was charged
- remaining balance when available
- company details directly; show at most 5 in chat
- Markdown detail document path containing all unlocked company details
- warnings

Field ownership, raw/debug behavior, and private metadata handling are governed by `output-contracts.md`. Free-search domains stay hidden, but unlocked company details may show `display_website` derived from profile website/domain or saved search domain.

## 3. Contact Search

Before the first contact search in a session:

```text
Contact search costs 1 credit per query. Do you want to continue?
```

After confirmation:

```bash
node scripts/search-contacts.js --json '<contacts/search payload>' --save-batch /private/tmp/okki-go-batches/<contacts>.json --compact
```

Default visible size is 20 unless the user asked for more. Save raw contact results when many contacts are requested; field ownership follows `output-contracts.md`.

## 4. Email Send

Drafting is free. Sending consumes EDM quota.

Before sending:

1. Show recipient summary.
2. Show or reference the content to be sent.
3. Ask for explicit confirmation of both recipients and content.

After confirmation:

```bash
node scripts/send-email.js batch --json '<payload>' --mapping-file /private/tmp/okki-go-batches/email-send.json --compact
node scripts/send-email.js personalized --file /private/tmp/personalized-send.json --compact
```

Post-send output should be task IDs, counts, status, and next status-check command. Do not echo full bodies unless requested.

## 5. Balance and Local State

Balance is free:

```bash
OKKIGO_API_KEY="$(bash scripts/resolve-api-key.sh --print)"
curl -s -X GET "${OKKIGO_BASE_URL:-https://go.okki.ai}/api/v1/credit/balance" \
  -H "Authorization: ApiKey ${OKKIGO_API_KEY}" \
  -H "X-Okki-Skill-Version: ${OKKIGO_SKILL_VERSION:-1.3.0}"
```

`--mark-unlocked` only updates local viewed state. If local state write fails after unlock succeeds, tell the user the company was unlocked but local viewed records were not updated. Do not repeat the paid unlock.

## 6. Missing Batch Recovery

Latest batch reuse does not bypass confirmation.

If batch mapping is missing, unreadable, or stale:

1. Explain that the private row mapping is unavailable.
2. Re-run a free lookup or ask the user to choose from a new displayed list.
3. Ask explicit paid confirmation before unlocking.
