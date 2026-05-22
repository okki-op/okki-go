# Okki Go 安装示例

完整的安装场景和使用示例。

## 场景 1: OpenClaw 用户首次安装

```bash
# 1. 克隆或下载 okki-go skill
cd ~/Downloads
git clone https://github.com/okki-ai/okki-go-skill.git
cd okki-go-skill

# 2. 运行安装脚本（交互式）
node bin/install.js

# 提示：选择运行时
# > Select target runtime:
# >   1. Claude Code
# >   2. OpenClaw  ← 选择这个
# >   3. Cursor
# >   4. Windsurf
# >   5. Other
# Choose [1-5]: 2

# 提示：选择安装模式
# > Install mode:
# >   1. Global (user home directory)  ← 推荐
# >   2. Local (current project)
# Choose [1-2]: 1

# 提示：确认安装路径
# > Will install to: /Users/yourname/.openclaw/workspace/skills/okki-go
# Proceed? [Y/n]: Y

# 3. 配置 API Key
openclaw config set skills.entries.okkigo.apiKey "sk-your-api-key-here"

# 4. 测试 skill
openclaw chat
# > 帮我搜索德国的汽车零部件公司
```

## 场景 2: Claude Code 用户安装

```bash
# 1. 进入 okki-go 目录
cd /path/to/okki-go

# 2. 使用命令行参数安装
node bin/install.js --global --runtime=claude

# 输出：
# 🌐 Okki Go Skill Installer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# ℹ️  Runtime: claude
# ℹ️  Mode: global
# ℹ️  Target: /Users/yourname/.claude/commands/okki-go
# 
# ✅ Copied skill.md
# ✅ Copied references/
# ✅ Copied scripts/
# ✅ Installation complete!
# 
# Next steps:
#   1. Configure your API Key:
#      Visit https://go.okki.ai to get your API key

# 3. 在 Claude Code 中使用
claude
# > 帮我找一些美国的 SaaS 公司
```

## 场景 3: 多运行时安装（同时使用多个 AI 助手）

```bash
# 安装到 Claude Code
node bin/install.js --global --runtime=claude

# 安装到 OpenClaw
node bin/install.js --global --runtime=openclaw

# 安装到 Cursor
node bin/install.js --global --runtime=cursor

# 现在可以在三个平台上使用同一个 skill
```

## 场景 4: 项目级本地安装

```bash
# 进入你的项目目录
cd ~/my-sales-project

# 本地安装（仅在此项目中可用）
node /path/to/okki-go/bin/install.js --local --runtime=openclaw

# 安装位置：./openclaw/workspace/skills/okki-go/
# 好处：不影响全局配置，项目特定的 API Key
```

## 场景 5: 更新已安装的 skill

```bash
# 拉取最新代码
cd /path/to/okki-go
git pull origin main

# 重新安装（会保留你的本地修改）
node bin/install.js --global --runtime=openclaw

# 输出：
# ℹ️  Upgrading from v1.0.5 to v1.0.6
# ℹ️  Saved local modification: scripts/custom-hook.sh
# ✅ Installation complete!
# 
# Your local modifications were saved to .okki-patches/
```

## 场景 6: 卸载 skill

```bash
# 卸载（保留本地修改）
node bin/install.js --uninstall --runtime=openclaw --global

# 输出：
# 🗑️  Okki Go Skill Uninstaller
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# ✅ Skill uninstalled
# 
# ℹ️  Your local modifications were saved to .okki-patches/
```

## 场景 7: 恢复本地修改

```bash
# 更新后发现需要恢复之前的自定义修改
cd ~/.openclaw/workspace/skills/okki-go

# 查看保存的补丁
ls .okki-patches/
# scripts_custom-hook.sh

# 手动恢复
cp .okki-patches/scripts_custom-hook.sh scripts/custom-hook.sh
```

## 场景 8: 验证安装

```bash
# 检查安装的文件
ls -la ~/.openclaw/workspace/skills/okki-go/
# SKILL.md
# references/
# scripts/
# VERSION
# .okki-manifest.json

# 查看版本
cat ~/.openclaw/workspace/skills/okki-go/VERSION
# 1.0.9

# 查看清单（SHA256 哈希）
cat ~/.openclaw/workspace/skills/okki-go/.okki-manifest.json
# {
#   "version": "1.0.9",
#   "runtime": "openclaw",
#   "installedAt": "2026-04-24T06:30:00.000Z",
#   "files": {
#     "SKILL.md": "abc123...",
#     "references/api-reference.md": "def456...",
#     ...
#   }
# }
```

## 场景 9: 故障排除

### 问题：Node.js 版本过低

```bash
# 检查版本
node --version
# v12.0.0  ← 太旧

# 升级 Node.js
# macOS (使用 Homebrew)
brew install node

# 或使用 nvm
nvm install 18
nvm use 18

# 重新安装
node bin/install.js --global --runtime=openclaw
```

### 问题：权限错误

```bash
# 错误：EACCES: permission denied
# 解决：修复 npm 权限

mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 或使用 sudo（不推荐）
sudo node bin/install.js --global --runtime=openclaw
```

### 问题：找不到源文件

```bash
# 错误：SKILL.md not found in source directory
# 原因：在错误的目录运行脚本

# 正确做法：
cd /path/to/okki-go  # 确保在 okki-go 根目录
node bin/install.js --global --runtime=openclaw

# 或使用绝对路径
node /path/to/okki-go/bin/install.js --global --runtime=openclaw
```

## 场景 10: NPM 包安装（未来支持）

```bash
# 即将支持的安装方式

# 全局安装
npm install -g @okki/go-skill

# 自动检测运行时并安装
okki-go-install

# 或指定运行时
okki-go-install --runtime=openclaw

# 更新
npm update -g @okki/go-skill
okki-go-install --runtime=openclaw
```

## 高级配置

### 自定义安装路径

```javascript
// 修改 bin/install.js 中的 RUNTIME_DIRS
const RUNTIME_DIRS = {
  claude: '.claude',
  openclaw: '.openclaw/workspace',  // 默认
  // 自定义路径
  'openclaw-custom': '.my-custom-openclaw'
};

// 使用自定义路径
node bin/install.js --global --runtime=openclaw-custom
```

### 批量安装脚本

```bash
#!/bin/bash
# install-all.sh - 安装到所有运行时

RUNTIMES=("claude" "openclaw" "cursor" "windsurf")

for runtime in "${RUNTIMES[@]}"; do
    echo "Installing to $runtime..."
    node bin/install.js --global --runtime="$runtime"
done

echo "All installations complete!"
```

## 测试安装

```bash
# 运行测试脚本
bash scripts/test-installer.sh

# 输出：
# 🧪 Testing Okki Go Installer
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# Test 1: Help output
# ✅ Help command works
# 
# Test 2: Argument parsing
# ✅ Argument parsing works
# 
# Test 3: Source file structure
# ✅ Found: SKILL.md
# ✅ Found: api-reference.md
# ✅ Found: enable-notifications.sh
# ✅ Found: install.js
# 
# Test 4: Script permissions
# ✅ install.js is executable
# ✅ enable-notifications.sh is executable
# 
# Test 5: Node.js version
# ✅ Node.js version: v18.0.0
# 
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ All tests passed!
```

## 常见问题

### Q: 安装后找不到 skill？

**A:** 检查安装路径是否正确：

```bash
# OpenClaw
ls ~/.openclaw/workspace/skills/okki-go/

# Claude Code
ls ~/.claude/commands/okki-go/

# 如果找不到，重新安装并注意输出的路径
node bin/install.js --global --runtime=openclaw
```

### Q: 更新后 API Key 丢失？

**A:** API Key 应存储在平台 config/secrets、`OKKIGO_API_KEY` 环境变量，或 `~/.config/okki-go/credentials.json`。安装脚本不会覆盖这些位置。如果丢失：

```bash
# 重新配置平台注入
openclaw config set skills.entries.okkigo.apiKey "sk-xxx"

# 或使用本地 fallback
mkdir -p ~/.config/okki-go
umask 077
printf '%s\n' '{"apiKey":"sk-xxx"}' > ~/.config/okki-go/credentials.json
chmod 600 ~/.config/okki-go/credentials.json
```

### Q: 如何在多台电脑上同步配置？

**A:** 使用版本控制或云同步：

```bash
# 方案 1: Git 同步配置
cd ~/.openclaw/workspace/skills/okki-go
git init
git remote add origin https://your-private-repo.git
git push

# 方案 2: 符号链接到 Dropbox
ln -s ~/Dropbox/okki-go-config ~/.openclaw/workspace/skills/okki-go
```

---

**文档版本**: 1.0.9  
**最后更新**: 2026-04-24  
**适用平台**: Claude Code, OpenClaw, Cursor, Windsurf, Codex, Copilot, Gemini, Cline
