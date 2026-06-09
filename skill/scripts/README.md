# Okki Go Update Notification Scripts

These scripts manage automatic update notifications for the Okki Go skill.

## Compact Output Contract

Normal OKKI Go tool output must be compact and user-facing. Raw API JSON, long email bodies, full profile objects, full local state, and internal identifiers must not be streamed into the model unless the user explicitly asks for raw/debug output. For large raw data, save it to a local file and return a path plus a short summary.

Default private raw files should live under `/private/tmp/okki-go-batches`. Compact mode is a presentation filter, not data deletion: wrapper scripts save raw records or mappings when the compact output would otherwise omit private fields.

Compact wrapper stdout includes `output_budget`, `truncated`, `available`, and `next_offset`. Batch-producing scripts update a latest batch pointer with a default 24h TTL so row-selector follow-ups can reuse the displayed mapping without re-searching.

Default visible caps:

| Output type | Default visible cap | Raw handling |
|---|---:|---|
| Company rows | 50 for single page, requested count for batch, hard cap 100 | Save raw batch file |
| Contacts | 20 visible, hard cap 100 | Save contact batch file |
| profileEmails | 20 visible per company, hard cap 100 | Save company contact file |
| Email task list | 20 tasks | Save raw status file |
| Email task detail mails | Show aggregate + failed rows first | Save full detail file |
| Single email body | Hidden unless explicitly requested | Truncate to 500 chars or save file |
| Viewed/Profile state | Counts/redacted fields only | Full state only under explicit debug/export |

## Prospecting Wrappers

Single-page company search:

```bash
node scripts/search-companies.js \
  --json '<search-advanced payload>' \
  --compact \
  --locale '<user-locale>' \
  --fields company_name,country_name,email_count,employees_count,company_type,fit \
  --limit-output 50 \
  --save-raw /private/tmp/okki-go-batches/search-raw.json
```

`--compact` omits `domain`, raw IDs, website/homepage/URL/link fields from stdout and writes row-to-domain mapping plus raw records to `--save-raw`. `--locale` adds localized `country_name` values for user-facing display while preserving `country_code` for internal workflow use.

Batch discovery for "more", pagination-heavy, or count-based requests:

```bash
node scripts/discover-companies-batch.js \
  --plan /private/tmp/de-autoglass-plan.json \
  --target-count N \
  --save-batch /private/tmp/okki-go-batches/de-autoglass-20260604.json \
  --compact \
  --locale '<user-locale>'
```

The numeric values in examples are placeholders; scripts use the requested target count and generic row selectors such as `1,3,7-9`.

The batch script scans configured pages, deduplicates by domain then company name, saves private mapping, updates the latest batch pointer, and emits compact rows plus scanned/deduped/returned counts.

Unlock selected rows after explicit credit confirmation:

```bash
node scripts/unlock-companies.js \
  --batch latest \
  --rows ROWS \
  --mark-unlocked \
  --compact \
  --locale '<user-locale>'
```

`unlock-companies.js` reads saved row mappings, including `--batch latest` within the 24h TTL, calls paid `/companies/unlock`, fetches profile/profileEmails/balance, uses `mark-unlocked-batch`, and emits charge/balance/company summaries only. Compact output includes `raw_path`; it never prints `domain` or `companyHashId`. The skill workflow must still ask explicit paid confirmation before calling it.

Cross-company contact search after first-session paid confirmation:

```bash
node scripts/search-contacts.js \
  --json '{"title":"Procurement Manager","country_codes":"DE","has_email":1,"size":20}' \
  --save-batch /private/tmp/okki-go-batches/contacts-de-procurement-20260604.json \
  --compact
```

Default visible size is 20. Internal contact IDs are saved in the raw file, not stdout. Phone numbers are hidden unless `--include-phone` is used because the user requested phone/contact details.

Email status:

```bash
node scripts/email-status.js tasks --json '{"page":1,"page_size":20}' --compact
node scripts/email-status.js task --task-id 1001 --compact
node scripts/email-status.js mails --json '{"statuses":"failed","page":1,"page_size":20}' --compact
node scripts/email-status.js mail --mail-id 2001 --compact
```

Email bodies are omitted by default. Use `--include-body` only when the user explicitly asks to view the body; the preview is capped at 500 characters and raw detail is saved to a file.

Email send after explicit recipient and content confirmation:

```bash
node scripts/send-email.js batch --json '<payload>' --mapping-file /private/tmp/okki-go-batches/email-send.json --compact
node scripts/send-email.js personalized --file /private/tmp/personalized-send.json --compact
```

Post-send output summarizes task IDs/counts and mapping path. It does not echo full email bodies or all recipient variables.

Compact viewed state writes:

```bash
node scripts/okki-state.js viewed mark-unlocked --domain a.de --country-code DE --compact
node scripts/okki-state.js viewed mark-unlocked-batch --json '[{"domain":"a.de","country_code":"DE"}]'
node scripts/okki-state.js viewed classify --results-file /tmp/results.json --compact
```

## File Overview

| File | Platform | Description |
|------|----------|-------------|
| `enable-notifications.sh` | macOS / Linux | Enable/manage update notifications |
| `enable-notifications.ps1` | Windows | Enable/manage update notifications (PowerShell) |
| `check-update.sh` | macOS / Linux | Manually check for updates |
| `check-update.ps1` | Windows | Manually check for updates (PowerShell) |
| `post-install.sh` | macOS / Linux | Post-install initialization (optional) |
| `post-install.ps1` | Windows | Post-install initialization (optional) |

## Quick Start

### First Use After Installation

**Recommended:** Run the post-install initialization script (guided setup)

**macOS / Linux:**
```bash
bash scripts/post-install.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\post-install.ps1
```

This script will:
1. Confirm the skill installation location
2. Ask whether to enable update notifications
3. Guide you through API Key configuration

### Enable Notifications Manually

**macOS / Linux:**
```bash
bash scripts/enable-notifications.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\enable-notifications.ps1
```

**Windows (Git Bash):**
```bash
bash scripts/enable-notifications.sh
```

### Check for Updates Manually

**macOS / Linux:**
```bash
bash scripts/check-update.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-update.ps1
```

## Features

### After Enabling Notifications

- **Check frequency**: Every Monday at 10:00 AM automatically
- **Notification content**:
  - Current version vs. latest version
  - Changelog preview
  - One-command update
- **Delivery method**: OpenClaw message push

### Management Options

After running the `enable-notifications` script, you can choose:

1. **Disable notifications** - Turn off update reminders completely
2. **Change frequency** - Switch to daily/weekly/monthly checks
3. **Check now** - Immediately check for updates
4. **Exit** - Make no changes

## Customize Check Frequency

Adjust the check frequency by modifying the cron job:

| Frequency | Cron Expression | Description |
|-----------|----------------|-------------|
| Daily | `0 10 * * *` | Every day at 10:00 AM |
| Weekly | `0 10 * * 1` | Every Monday at 10:00 AM (default) |
| Monthly | `0 10 1 * *` | 1st of every month at 10:00 AM |

Run the management script and choose option 2 to change it.

## FAQ

### Q: How should I configure the OKKI Go API Key?
A: Prefer the Codex-style local login helper. Run it from the installed OKKI Go skill directory:

```bash
printf '%s\n' 'sk-xxx' | node scripts/okki-auth.js login --with-api-key
```

This stores the key in `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/credentials.json` and writes non-secret source metadata to `auth-source.json`. Both files use mode `0600`.

Explicit platform/environment sources are still supported:

1. Platform secrets/config injection as `OKKIGO_API_KEY`
2. Environment variable: `export OKKIGO_API_KEY="sk-xxx"`
3. Legacy local fallback file: `~/.config/okki-go/credentials.json` with mode `0600`

The runtime resolver does not scan platform-specific config directories. Platforms should inject `OKKIGO_API_KEY` or register a non-secret source during setup.

Verify without printing the secret:

```bash
bash scripts/resolve-api-key.sh --check
bash scripts/resolve-api-key.sh --source
node scripts/okki-auth.js status --json
node scripts/okki-auth.js doctor --json
```

### Q: "openclaw command not found"?
A: Make sure OpenClaw is installed:
```bash
npm install -g openclaw
```

### Q: Not receiving notifications?
A: Check that the OpenClaw gateway is running:
```bash
openclaw gateway status
```

### Q: How to disable notifications completely?
A: Run the management script and choose option 1, or delete the cron job directly:
```bash
openclaw cron list  # find the job ID
openclaw cron remove --jobId <ID>
```

### Q: Can I use this on multiple devices?
A: Yes. Run the enable script once on each device.

## Create Notifications Manually

If the script cannot run, create manually:

```bash
openclaw cron add \
  --name "okkigo-update-reminder" \
  --schedule "0 10 * * 1" \
  --payload "clawhub search okki-go --limit 1" \
  --delivery "announce"
```

## Privacy

- Scripts do not collect any personal information
- Will not auto-update the skill — notifications only
- Update decisions are entirely user-controlled
- Checks query only publicly available version information

## Support

For issues, visit:
- Project homepage: https://go.okki.ai
- Documentation: https://docs.openclaw.ai
