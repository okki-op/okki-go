# 📬 更新通知 | Update Notifications

**有新版本时自动通知你，更新决定完全由你控制。**

---

## 快速启用

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

## 功能说明

启用后你将收到：
- 📦 **新版本提醒** - 发现更新时立即通知
- 📝 **更新日志预览** - 查看新版本功能和修复
- ⚡ **一键更新命令** - 快速完成更新

**检查频率：** 每周一上午 10 点（可自定义为每天/每周/每月）

---

## 管理更新通知

**查看状态/修改设置:**
```bash
# macOS / Linux
bash scripts/enable-notifications.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts\enable-notifications.ps1
```

运行后会显示：
- ✅ 当前通知状态
- 📅 检查频率设置
- 🔧 管理选项（关闭/修改频率/手动检查）

**手动检查更新:**
```bash
# macOS / Linux
bash scripts/check-update.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts\check-update.ps1
```

---

## 自定义检查频率

可以通过管理脚本修改检查频率：

| 频率 | 说明 |
|------|------|
| 每天 | 每天上午 10 点检查 |
| 每周 | 每周一上午 10 点 (默认) |
| 每月 | 每月 1 号上午 10 点 |

---

## 隐私说明

- ✅ 不会收集个人信息
- ✅ 不会自动更新，仅发送通知
- ✅ 更新决定完全由用户控制
- ✅ 仅查询公开的版本信息

---

## 故障排查

### 问题：提示找不到 openclaw 命令

```bash
# 安装 OpenClaw
npm install -g openclaw
```

### 问题：通知没有收到

```bash
# 检查网关状态
openclaw gateway status
```

### 问题：如何完全关闭通知

```bash
# 运行管理脚本，选择选项 1
bash scripts/enable-notifications.sh
```

或直接删除 cron 任务：
```bash
openclaw cron list  # 找到任务 ID
openclaw cron remove --jobId <ID>
```

---

## 通知内容示例

当你有新版本时会收到：

```
📦 Okki Go 有新版本可用

当前版本：1.1.0
最新版本：1.2.0

更新内容：
## 1.2.0
- ✨ 新增联系人搜索功能
- 🐛 修复 EDM 发送配额显示问题
- ⚡ 提升搜索速度 30%

更新命令：openclaw skills update okki go
跳过：忽略此通知，下周继续提醒
```

---

## 文件说明

相关脚本文件：

| 文件 | 适用系统 | 说明 |
|------|---------|------|
| `scripts/enable-notifications.sh` | macOS / Linux | 启用/管理更新通知 |
| `scripts/enable-notifications.ps1` | Windows | 启用/管理更新通知 |
| `scripts/check-update.sh` | macOS / Linux | 手动检查更新 |
| `scripts/check-update.ps1` | Windows | 手动检查更新 |
| `scripts/post-install.sh` | macOS / Linux | 安装后初始化 |
| `scripts/post-install.ps1` | Windows | 安装后初始化 |

详细脚本说明请参见 [scripts/README.md](./scripts/README.md)

---

## 相关文档

- 脚本详细说明：[scripts/README.md](./scripts/README.md)
- 安装后初始化：运行 `bash scripts/post-install.sh` (macOS/Linux) 或 `powershell -ExecutionPolicy Bypass -File scripts\post-install.ps1` (Windows)

---

**最后更新:** 2026-04-01  
**版本:** okki go v1.1.0+
