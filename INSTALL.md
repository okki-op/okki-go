# Okki Go Skill 安装指南

多运行时安装系统，支持 Claude Code、OpenClaw、Accio Work、Cursor、Windsurf 等 AI 助手。

## 快速安装

### 方式 1: 交互式安装（推荐）

```bash
cd okki-go
node bin/install.js
```

按提示选择：
1. 目标运行时（输入数字或名称）
2. 安装模式（全局/本地）

### 方式 2: 命令行参数

```bash
# 安装到 Claude Code
node bin/install.js --global --claude

# 安装到 OpenClaw
node bin/install.js --global --openclaw

# 安装到 Accio Work
node bin/install.js --global --accio

# 同时安装到多个运行时
node bin/install.js --global --claude --openclaw --accio --cursor

# 安装到所有支持的运行时
node bin/install.js --global --all
```

## 支持的运行时

| 运行时 | 参数 | 配置目录 | Skill 位置 | 主文件名 |
|--------|------|----------|-----------|---------|
| Claude Code | `--claude` | `~/.claude` | `skills/okki-go/` | skill.md |
| OpenClaw | `--openclaw` | `~/.openclaw/workspace` | `skills/okki-go/` | SKILL.md |
| OpenCode | `--opencode` | `~/.config/opencode` | `skills/okki-go/` | SKILL.md |
| Gemini | `--gemini` | `~/.gemini` | `skills/okki-go/` | skill.md |
| Cursor | `--cursor` | `~/.cursor` | `skills/okki-go/` | skill.md |
| Windsurf | `--windsurf` | `~/.codeium/windsurf` | `skills/okki-go/` | skill.md |
| Codex | `--codex` | `~/.codex` | `skills/okki-go/` | skill.md |
| Copilot | `--copilot` | `~/.copilot` | `skills/okki-go/` | instructions.md |
| Cline | `--cline` | `~/.cline` | `skills/okki-go/` | skill.md |
| Accio Work | `--accio` | `~/.accio` | `accounts/<accountId>/skills/okki-go/` | SKILL.md |

## 环境变量支持

安装脚本支持通过环境变量自定义配置目录：

```bash
# Claude Code
export CLAUDE_CONFIG_DIR=~/my-custom-claude
node bin/install.js --global --claude

# OpenClaw
export OPENCLAW_CONFIG_DIR=~/my-openclaw
node bin/install.js --global --openclaw

# OpenCode (XDG 标准)
export XDG_CONFIG_HOME=~/.config
node bin/install.js --global --opencode

# Accio Work
export ACCIO_ACCOUNT_ID=1763281345
node bin/install.js --global --accio
```

支持的环境变量：
- `CLAUDE_CONFIG_DIR`
- `OPENCLAW_CONFIG_DIR`
- `OPENCODE_CONFIG_DIR`
- `GEMINI_CONFIG_DIR`
- `CURSOR_CONFIG_DIR`
- `WINDSURF_CONFIG_DIR`
- `CODEX_HOME`
- `COPILOT_CONFIG_DIR`
- `CLINE_CONFIG_DIR`
- `ACCIO_CONFIG_DIR`
- `ACCIO_ACCOUNT_ID`
- `ACCIO_ACCOUNT_DIR`
- `XDG_CONFIG_HOME` (用于 OpenCode)

Accio Work 需要先打开桌面端并登录。安装器会自动检测 `~/.accio/accounts/` 下的账号；如果有多个账号，请设置 `ACCIO_ACCOUNT_ID`。使用 `--all` 时，如果未检测到 Accio 账号，安装器会跳过 Accio Work，不阻断其他运行时安装。

## 安装后配置

### 配置 API Key

OKKI Go Skill 使用多层凭证解析，优先使用平台注入；在 Accio Work 中还会读取账号级 Skill 配置；然后读取环境变量；最后使用本地安全 fallback 文件。

**1. 平台 config/secrets 注入（推荐）**
```bash
openclaw config set skills.entries.okkigo.apiKey "sk-xxx"
```

平台应在新 agent 会话中注入 `OKKIGO_API_KEY`。这是 OpenClaw / Accio 等有 Skill 配置能力的平台的首选方式。

**2. Accio Work 账号级配置**
安装器会读取 `~/.accio/accounts/<accountId>/skills/skills_config.json` 中 `OKKI Go` 或 `okki-go` 条目的 `apiKey` / `OKKIGO_API_KEY` 字段。若在 Accio 中已保存过 API Key，新会话会自动识别。

**3. 标准环境变量**
```bash
export OKKIGO_API_KEY="sk-xxx"
```

适合 Codex、Claude、Cursor、OpenCode、CI、终端启动的 agent。桌面应用不一定会读取 `.zshrc` 或 `.bashrc`，因此不要只依赖 shell profile。

**4. 本地安全 fallback 文件**
```bash
mkdir -p ~/.config/okki-go
umask 077
printf '%s\n' '{"apiKey":"sk-xxx"}' > ~/.config/okki-go/credentials.json
chmod 600 ~/.config/okki-go/credentials.json
```

适合无法注入 secrets 的平台。不要把 API Key 写进 `SKILL.md`、仓库、聊天记录或日志。

**Accio Work:**
安装器会同步更新 `~/.accio/accounts/<accountId>/skills/skills_config.json`，并把 OKKI Go 写入现有 Agent 的 `agent-core/skills/skills.jsonc` 选中列表。如 Accio Work 已打开，安装后建议重启 Accio Work 或新开会话以加载新 Skill。

## 更新 Skill

重新运行安装命令即可更新：

```bash
node bin/install.js --global --openclaw
```

更新时会：
- 自动检测版本升级（如 v1.0.5 → v1.0.6）
- 保存你的本地修改到 `.okki-go-patches/`
- 安装新版本文件
- 保留你的 API Key 配置

## 卸载

```bash
node bin/install.js --uninstall --global --openclaw
```

卸载会：
- 删除 skill 目录
- 保存你的本地修改（如果有）
- 不会删除 API Key 配置

## 高级用法

### 批量安装到多个运行时

```bash
# 同时安装到 Claude、OpenClaw 和 Cursor
node bin/install.js --global --claude --openclaw --cursor

# 安装到所有支持的运行时
node bin/install.js --global --all
```

### 本地安装（项目级）

```bash
# 进入你的项目目录
cd ~/my-sales-project

# 本地安装（仅在此项目中可用）
node bin/install.js --local --openclaw

# 安装位置：./.openclaw/workspace/skills/okki-go/
```

### 查看帮助

```bash
node bin/install.js --help
```

## 本地修改保护

安装脚本使用 SHA256 清单检测文件修改：

```bash
# 更新时自动保存修改
node bin/install.js --global --openclaw

# 输出示例：
# Upgrading v1.0.5 → v1.0.6
# Saved local modification: scripts/custom-hook.sh
```

修改过的文件会自动保存到 `.okki-go-patches/`，你可以在更新后手动恢复：

```bash
cd ~/.openclaw/workspace/skills/okki-go
ls .okki-go-patches/
# scripts_custom-hook.sh

# 恢复修改
cp .okki-go-patches/scripts_custom-hook.sh scripts/custom-hook.sh
```

## 故障排除

### "Node.js version too old"

```bash
# 检查版本
node --version

# 升级 Node.js (macOS)
brew install node

# 或使用 nvm
nvm install 18
nvm use 18
```

### 权限错误

```bash
# 修复 npm 全局权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 找不到源文件

```bash
# 确保在 okki-go 根目录运行
cd /path/to/okki-go
ls skill/SKILL.md  # 应该存在

# 然后运行安装
node bin/install.js --global --openclaw
```

### 验证安装

```bash
# 检查安装的文件
ls -la ~/.openclaw/workspace/skills/okki-go/

# Accio Work
ls -la ~/.accio/accounts/<accountId>/skills/okki-go/

# 应该包含：
# - SKILL.md (或 skill.md/instructions.md)
# - references/
# - scripts/
# - VERSION
# - .okki-go-manifest.json
```

## 文件结构

安装后的目录结构：

```
okki-go/
├── SKILL.md (或 skill.md/instructions.md)  # 主 skill 文件
├── references/
│   └── api-reference.md                    # API 文档
├── scripts/
│   ├── enable-notifications.sh             # 更新通知
│   ├── check-update.sh                     # 手动检查更新
│   ├── post-install.sh                     # 安装后初始化
│   └── README.md                           # 脚本说明
├── VERSION                                 # 版本号
├── .okki-go-manifest.json                     # 文件清单（SHA256）
└── .okki-go-patches/                          # 本地修改备份（如有）
```

## 安装系统特性

本安装系统采用多运行时安装模式，具有以下特性：

| 特性 | 说明 |
|------|------|
| 参数风格 | 支持 `--claude`, `--all` 等简洁参数 |
| 环境变量 | 支持 XDG 等标准环境变量 |
| 路径解析 | 健壮的多级回退机制 |
| 清单检测 | SHA256 哈希验证文件完整性 |
| 补丁保存 | 自动保存本地修改到 `.okki-go-patches/` |
| 多运行时 | 支持 10 种 AI 助手 |

## NPM 包安装（即将支持）

未来版本将支持：

```bash
# 全局安装
npm install -g @okki/go-skill

# 自动安装到检测到的运行时
okki-go-install --global --all
```


---

**当前版本**: 1.0.12
**安装脚本**: bin/install.js
**最后更新**: 2026-04-24
