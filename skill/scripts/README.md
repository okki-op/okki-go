# Okki Go Update Notification Scripts

These scripts manage automatic update notifications for the Okki Go skill.

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
