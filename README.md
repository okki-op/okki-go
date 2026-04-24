# Okki Go Skill

B2B lead prospecting and outreach skill for AI coding assistants.

## Quick Start

### Install

```bash
# Interactive installation (recommended)
cd okki-go
node bin/install.js

# Or with parameters
node bin/install.js --global --runtime=openclaw
```

### Supported Platforms

- **Claude Code** - AI coding assistant CLI
- **OpenClaw** - Open-source AI coding platform
- **Cursor** - AI-first code editor
- **Windsurf** - AI coding assistant
- **Codex, Copilot, Gemini, Cline** - Other AI platforms

### Configure API Key

```bash
# OpenClaw
openclaw config set skills.entries.okkigo.apiKey "sk-xxx"

# Get your key at: https://go.okki.ai
```

## Features

- 🔍 **Company Search** - Find B2B prospects by industry, country, keywords
- 📧 **Contact Discovery** - Get decision-maker emails
- 📨 **Outreach Campaigns** - Send personalized cold emails
- 📊 **Email Tracking** - Monitor delivery status
- 💳 **Credit Management** - Check balance and upgrade plans

## Documentation

- [Installation Guide](INSTALL.md) - Detailed installation instructions
- [Skill Documentation](SKILL.md) - Complete API reference and workflows
- [API Reference](references/api-reference.md) - Full API documentation
- [Update Scripts](scripts/README.md) - Automatic update notifications

## Installation Architecture

Multi-runtime installation system with the following features:

- ✅ Multi-runtime support (8+ platforms)
- ✅ SHA256 manifest for change detection
- ✅ Local modification protection
- ✅ Automatic version management
- ✅ Interactive & CLI modes

## Version

**Current**: 1.0.6

## Links

- Homepage: https://go.okki.ai
- Documentation: https://docs.okki.ai
- Support: support@okki.ai

## License

MIT
