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

1. **Download the skill file**:
   ```bash
   # After installing the npm package
   npm install @okki-global/okki-go
   
   # The SKILL.md file is located at:
   node_modules/@okki-global/okki-go/skill/SKILL.md
   ```

2. **Or download directly from npm**:
   - Visit: https://www.npmjs.com/package/@okki-global/okki-go
   - Download the package
   - Extract and locate `skill/SKILL.md`

3. **Upload to your platform**:
   - Open your AI assistant's settings/configuration
   - Look for "Upload Skill" or "Add Custom Instructions"
   - Select the `SKILL.md` file
   - Save and restart your AI assistant

**Important**: The `SKILL.md` file contains all necessary instructions, API references, and workflows. Make sure to upload this specific file, not other markdown files in the package.

### Supported Platforms

- **Claude Code** - AI coding assistant CLI
- **OpenClaw** - Open-source AI coding platform
- **Cursor** - AI-first code editor
- **Windsurf** - AI coding assistant
- **Codex, Copilot, Gemini, Cline** - Other AI platforms
- **Custom platforms** - Use `--custom=<name>` for unlisted platforms

### Configure API Key

After installation, configure your API key:

```bash
# Get your API key at: https://go.okki.ai

# For platforms with config commands:
openclaw config set skills.entries.okkigo.apiKey "sk-xxx"

# For Claude Code (add to ~/.claude/settings.local.json):
{
  "env": {
    "OKKIGO_API_KEY": "sk-xxx"
  }
}

# Or use environment variable:
export OKKIGO_API_KEY="sk-xxx"
```

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
- `skill.md` or `SKILL.md` - Main skill file (platform-dependent)
- `references/` - API documentation
- `scripts/` - Helper scripts
- `VERSION` - Version tracking

## Documentation

- [Installation Guide](INSTALL.md) - Detailed installation instructions
- [Skill Documentation](skill/SKILL.md) - Complete API reference and workflows
- [API Reference](skill/references/api-reference.md) - Full API documentation

## Installation Architecture

Multi-runtime installation system with the following features:

- ✅ Multi-runtime support (9+ platforms + custom)
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

**Current**: 1.0.9

## Links

- Homepage: https://go.okki.ai
- Documentation: https://docs.okki.ai
- Support: support@okki.ai
- npm: https://www.npmjs.com/package/@okki-global/okki-go

## License

MIT
