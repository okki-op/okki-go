# Okki Go 更新通知脚本

这些脚本用于管理 Okki Go 技能的自动更新通知。

## 📁 文件说明

| 文件 | 适用系统 | 说明 |
|------|---------|------|
| `enable-notifications.sh` | macOS / Linux | 启用/管理更新通知 |
| `enable-notifications.ps1` | Windows | 启用/管理更新通知 (PowerShell) |
| `check-update.sh` | macOS / Linux | 手动检查更新 |
| `check-update.ps1` | Windows | 手动检查更新 (PowerShell) |
| `post-install.sh` | macOS / Linux | 安装后初始化（可选） |
| `post-install.ps1` | Windows | 安装后初始化（可选） |

## 🚀 快速开始

### 安装后首次使用

**推荐：** 运行安装后初始化脚本（自动引导配置）

**macOS / Linux:**
```bash
bash scripts/post-install.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\post-install.ps1
```

该脚本会：
1. 确认技能安装位置
2. 询问是否启用更新通知
3. 引导配置 API Key

### 手动启用通知

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

### 手动检查更新

**macOS / Linux:**
```bash
bash scripts/check-update.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-update.ps1
```

## 📋 功能说明

### 启用通知后

- **检查频率**: 每周一上午 10 点自动检查
- **通知内容**: 
  - 当前版本 vs 最新版本
  - 更新日志预览
  - 一键更新命令
- **通知方式**: OpenClaw 消息推送

### 管理选项

运行 `enable-notifications` 脚本后可以选择:

1. **关闭通知** - 完全禁用更新提醒
2. **修改频率** - 调整为每天/每周/每月检查
3. **手动检查** - 立即检查是否有更新
4. **退出** - 不做任何更改

## 🔧 自定义检查频率

可以通过修改 cron 任务来调整检查频率:

| 频率 | Cron 表达式 | 说明 |
|------|-----------|------|
| 每天 | `0 10 * * *` | 每天上午 10 点 |
| 每周 | `0 10 * * 1` | 每周一上午 10 点 (默认) |
| 每月 | `0 10 1 * *` | 每月 1 号上午 10 点 |

运行管理脚本，选择选项 2 来修改。

## ❓ 常见问题

### Q: 提示找不到 openclaw 命令？
A: 请确保 OpenClaw 已正确安装:
```bash
npm install -g openclaw
```

### Q: 通知没有收到？
A: 检查 OpenClaw 网关是否运行:
```bash
openclaw gateway status
```

### Q: 如何完全关闭通知？
A: 运行管理脚本，选择选项 1，或直接删除 cron 任务:
```bash
openclaw cron list  # 找到任务 ID
openclaw cron remove --jobId <ID>
```

### Q: 可以在多个设备上使用吗？
A: 可以。每个设备需要单独运行一次启用脚本。

## 📝 手动创建通知

如果脚本无法运行，可以手动创建:

```bash
openclaw cron add \
  --name "prospectiq-update-reminder" \
  --schedule "0 10 * * 1" \
  --payload "clawhub search okki go --limit 1" \
  --delivery "announce"
```

## 🔒 隐私说明

- 脚本不会收集任何个人信息
- 不会自动更新技能，仅发送通知
- 更新决定完全由用户控制
- 检查仅查询公开的版本信息

## 📞 技术支持

如有问题，请访问:
- 项目主页：https://go.okki.ai
- 文档：https://docs.openclaw.ai
