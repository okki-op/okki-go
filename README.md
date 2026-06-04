# Okki Go Skill

B2B lead prospecting and outreach skill for AI coding assistants.

## Quick Start

### Method 1: Automated Installation (Recommended)

```bash
# Using npx (no installation required)
npx @okki-global/okki-go

# Or install globally first
npm install -g @okki-global/okki-go
okki-go
```

The installer supports:
- **Global installation** - Install to `~/.{runtime}/skills/okki-go`
- **Current directory** - Install to `./skills/okki-go`
- **Custom path** - Install to a directory you specify

### Method 2: Manual Upload (For platforms with file upload)

If your AI platform requires manual file upload:

1. **Download the skill package**:
   ```bash
   # After installing the npm package
   npm install @okki-global/okki-go

   # The full skill directory is located at:
   node_modules/@okki-global/okki-go/skill/
   ```

2. **Or download directly from npm**:
   - Visit: https://www.npmjs.com/package/@okki-global/okki-go
   - Download the package
   - Extract and locate the `skill/` directory

3. **Upload to your platform**:
   - Open your AI assistant's settings/configuration
   - Look for "Upload Skill" or "Add Custom Instructions"
   - Select the full `skill/` directory when the platform supports scripts
   - Save and restart your AI assistant

**Important**: OKKI Go uses helper scripts for authentication diagnostics and company search wrappers. Prefer uploading/installing the full `skill/` directory. If a platform only accepts a single markdown file, `SKILL.md` still documents the workflow, but script-based helpers such as `scripts/okki-auth.js` will not be available.

### Supported Platforms

- **Claude Code** - AI coding assistant CLI
- **OpenClaw** - Open-source AI coding platform
- **Cursor** - AI-first code editor
- **Windsurf** - AI coding assistant
- **Accio Work** - Alibaba International cross-border business agent workspace
- **Codex, Copilot, Gemini, Cline** - Other AI platforms
- **Custom platforms** - Use `--custom=<name>` for unlisted platforms

### Configure API Key

After installation, configure your API key once. The recommended local flow caches the key in the user-level OKKI Go config directory so future agent sessions can detect it without asking again:

```bash
# Get your API key at: https://go.okki.ai
# Run this from the installed OKKI Go skill directory.
printf '%s\n' 'sk-xxx' | node scripts/okki-auth.js login --with-api-key
```

The helper writes `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/credentials.json` and non-secret source metadata in `auth-source.json`, both with mode `0600`.

Verify without printing the secret:

```bash
bash scripts/resolve-api-key.sh --check
node scripts/okki-auth.js status --json
```

For automation or platforms that provide secrets injection, use explicit environment/config sources:

```bash
# Platform secrets/config that injects OKKIGO_API_KEY
openclaw config set skills.entries.okkigo.apiKey "sk-xxx"

# Standard environment variable, for CLI/CI/local agent sessions
export OKKIGO_API_KEY="sk-xxx"
```

For Claude Code or other runtimes with JSON settings, inject the same variable:

```json
{
  "env": {
    "OKKIGO_API_KEY": "sk-xxx"
  }
}
```

The skill resolves credentials in this order: registered user-level source, explicit environment/config overrides, then the legacy local credentials file. It does not scan platform-specific config directories at runtime; platforms should inject `OKKIGO_API_KEY` or register a source during setup.

## Features

- 🔍 **Company Search** - Find B2B prospects by industry, country, keywords
- 📧 **Contact Discovery** - Get decision-maker emails
- 📨 **Outreach Campaigns** - Send personalized cold emails
- 📊 **Email Tracking** - Monitor delivery status
- 💳 **Credit Management** - Check balance and upgrade plans

## Advanced Installation

### CLI Options

```bash
# Install to specific runtime
npx @okki-global/okki-go --global --claude

# Install to multiple runtimes
npx @okki-global/okki-go --global --claude --cursor

# Install to custom path
npx @okki-global/okki-go --claude --path /your/custom/path

# Install to custom runtime
npx @okki-global/okki-go --global --custom=myai

# Uninstall
npx @okki-global/okki-go --uninstall --global --claude
```

### File Locations

After installation, the skill files are located at:

- **Global**: `~/.{runtime}/skills/okki-go/`
- **Local**: `./skills/okki-go/`
- **Custom**: `<your-path>/skills/okki-go/`

The skill directory contains:
- `SKILL.md` - Main skill file for most runtimes (`instructions.md` for GitHub Copilot)
- `references/` - API documentation
- `scripts/` - Helper scripts
- `VERSION` - Version tracking

## Documentation

- [Installation Guide](INSTALL.md) - Detailed installation instructions
- [Skill Documentation](skill/SKILL.md) - Complete API reference and workflows
- [API Reference](skill/references/api-reference.md) - Full API documentation

## Installation Architecture

Multi-runtime installation system with the following features:

- ✅ Multi-runtime support (10 platforms + custom)
- ✅ SHA256 manifest for change detection
- ✅ Local modification protection
- ✅ Automatic version management
- ✅ Interactive & CLI modes
- ✅ Custom path support

## Troubleshooting

### npx cache issues

If you encounter issues with npx, clear the cache:

```bash
npm cache clean --force
npx clear-npx-cache
```

### Manual installation

If automated installation fails, you can manually copy the skill files:

```bash
# 1. Download the package
npm pack @okki-global/okki-go

# 2. Extract the tarball
tar -xzf okki-global-okki-go-*.tgz

# 3. Copy skill files to your platform's config directory
cp -r package/skill/* ~/.claude/skills/okki-go/
```

## Version

**Current**: 1.2.1

## Links

- Homepage: https://go.okki.ai
- Documentation: https://docs.okki.ai
- Support: go@okki.ai
- npm: https://www.npmjs.com/package/@okki-global/okki-go

## License

MIT
