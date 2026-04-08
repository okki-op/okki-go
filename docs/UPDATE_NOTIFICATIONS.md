# Update Notifications

**Get notified automatically when a new version is available — update decisions are entirely yours.**

---

## Quick Enable

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

---

## Features

Once enabled, you will receive:
- 📦 **New version alerts** — notified immediately when an update is found
- 📝 **Changelog previews** — see what's new and what's fixed
- ⚡ **One-command update** — update quickly with a single command

**Check frequency:** Every Monday at 10:00 AM (customizable to daily/weekly/monthly)

---

## Manage Update Notifications

**View status / change settings:**
```bash
# macOS / Linux
bash scripts/enable-notifications.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts\enable-notifications.ps1
```

Running the script shows:
- ✅ Current notification status
- 📅 Check frequency setting
- 🔧 Management options (disable / change frequency / manual check)

**Check for updates manually:**
```bash
# macOS / Linux
bash scripts/check-update.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts\check-update.ps1
```

---

## Customize Check Frequency

Change the check frequency using the management script:

| Frequency | Description |
|-----------|-------------|
| Daily | Every day at 10:00 AM |
| Weekly | Every Monday at 10:00 AM (default) |
| Monthly | 1st of every month at 10:00 AM |

---

## Privacy

- ✅ No personal information is collected
- ✅ Will not auto-update — notifications only
- ✅ Update decisions are entirely user-controlled
- ✅ Checks query only publicly available version information

---

## Troubleshooting

### Issue: "openclaw command not found"

```bash
# Install OpenClaw
npm install -g openclaw
```

### Issue: Not receiving notifications

```bash
# Check gateway status
openclaw gateway status
```

### Issue: How to disable notifications completely

```bash
# Run the management script and choose option 1
bash scripts/enable-notifications.sh
```

Or delete the cron job directly:
```bash
openclaw cron list  # find the job ID
openclaw cron remove --jobId <ID>
```

---

## Sample Notification

When a new version is available, you will receive:

```
📦 Okki Go new version available

Current version: 1.1.0
Latest version:  1.2.0

What's new:
## 1.2.0
- ✨ Added contact search feature
- 🐛 Fixed EDM send quota display issue
- ⚡ Improved search speed by 30%

Update command: openclaw skills update okki-go
Skip: dismiss this notification, remind again next week
```

---

## File Reference

Related script files:

| File | Platform | Description |
|------|----------|-------------|
| `scripts/enable-notifications.sh` | macOS / Linux | Enable/manage update notifications |
| `scripts/enable-notifications.ps1` | Windows | Enable/manage update notifications |
| `scripts/check-update.sh` | macOS / Linux | Manually check for updates |
| `scripts/check-update.ps1` | Windows | Manually check for updates |
| `scripts/post-install.sh` | macOS / Linux | Post-install initialization |
| `scripts/post-install.ps1` | Windows | Post-install initialization |

For detailed script documentation, see [scripts/README.md](./scripts/README.md)

---

## Related Docs

- Script details: [scripts/README.md](./scripts/README.md)
- Post-install setup: run `bash scripts/post-install.sh` (macOS/Linux) or `powershell -ExecutionPolicy Bypass -File scripts\post-install.ps1` (Windows)

---

**Last updated:** 2026-04-01
**Version:** okki-go v1.1.0+
