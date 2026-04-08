#!/bin/bash
# Okki Go 更新通知设置脚本 (macOS/Linux)
# 使用方法：bash scripts/enable-notifications.sh

set -e

SKILL_NAME="okki go"
CRON_NAME="${SKILL_NAME}-update-reminder"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🌐 Okki Go 技能更新通知设置${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 openclaw 命令是否存在
if ! command -v openclaw &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到 openclaw 命令${NC}"
    echo ""
    echo "请先安装 OpenClaw:"
    echo "  npm install -g openclaw"
    exit 1
fi

# 检查是否已存在通知任务
if openclaw cron list 2>/dev/null | grep -q "$CRON_NAME"; then
    echo -e "${GREEN}✅ 更新通知已启用${NC}"
    echo ""
    echo "当前设置：每周一上午 10 点检查新版本"
    echo ""
    echo -e "${YELLOW}管理选项:${NC}"
    echo "  1. 关闭通知"
    echo "  2. 修改检查频率"
    echo "  3. 手动检查更新"
    echo "  4. 退出"
    echo ""
    read -p "请选择 [1-4]: " choice
    
    case $choice in
        1)
            JOB_ID=$(openclaw cron list | grep "$CRON_NAME" | awk '{print $1}')
            if [ -n "$JOB_ID" ]; then
                openclaw cron remove --jobId "$JOB_ID"
                echo -e "${GREEN}✅ 已关闭更新通知${NC}"
            fi
            ;;
        2)
            echo ""
            echo "请选择检查频率:"
            echo "  1. 每天"
            echo "  2. 每周 (当前)"
            echo "  3. 每月"
            read -p "选择 [1-3]: " freq
            case $freq in
                1) SCHEDULE="0 10 * * *" ;;
                2) SCHEDULE="0 10 * * 1" ;;
                3) SCHEDULE="0 10 1 * *" ;;
                *) echo "无效选择"; exit 1 ;;
            esac
            JOB_ID=$(openclaw cron list | grep "$CRON_NAME" | awk '{print $1}')
            if [ -n "$JOB_ID" ]; then
                openclaw cron update --jobId "$JOB_ID" --schedule "$SCHEDULE"
                echo -e "${GREEN}✅ 已更新检查频率${NC}"
            fi
            ;;
        3)
            echo ""
            echo "🔍 手动检查更新..."
            bash "$SCRIPT_DIR/check-update.sh"
            ;;
        *)
            echo "已退出"
            ;;
    esac
    exit 0
fi

# 欢迎信息
echo -e "${CYAN}📬 是否启用 Okki Go 更新通知？${NC}"
echo ""
echo "启用后你将收到："
echo "  • 新版本发布提醒"
echo "  • 更新内容预览 (Changelog)"
echo "  • 一键更新命令"
echo ""
echo "检查频率：每周一上午 10 点 (可自定义)"
echo ""

read -p "是否启用？[Y/n] " confirm

if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${YELLOW}⏭️ 已跳过${NC}"
    echo ""
    echo "需要时可手动启用："
    echo "  bash scripts/enable-notifications.sh"
    exit 0
fi

# 创建 cron 任务
PAYLOAD='CURRENT=$(grep "^version:" ~/.openclaw/workspace/skills/okki go/SKILL.md 2>/dev/null | awk '\''{print $2}'\'') || CURRENT="unknown"; LATEST=$(clawhub search okki go --limit 1 2>/dev/null | jq -r '\''if .[0] then .[0].version else "unknown" end'\''); if [ -n "$LATEST" ] && [ "$CURRENT" != "$LATEST" ] && [ "$LATEST" != "unknown" ]; then CHANGELOG=$(clawhub show okki go@$LATEST --changelog 2>/dev/null | head -15); echo "📦 Okki Go 有新版本可用"; echo ""; echo "当前版本：$CURRENT"; echo "最新版本：$LATEST"; echo ""; echo "更新内容："; echo "$CHANGELOG"; echo ""; echo "更新命令：openclaw skills update okki go"; echo "跳过：忽略此通知，下周继续提醒"; elif [ "$CURRENT" = "$LATEST" ]; then echo "✅ Okki Go 已是最新版本 ($CURRENT)"; fi'

echo ""
echo "📝 正在配置更新通知..."

if openclaw cron add \
  --name "$CRON_NAME" \
  --schedule "0 10 * * 1" \
  --payload "$PAYLOAD" \
  --delivery "announce" 2>/dev/null; then
    
    echo ""
    echo -e "${GREEN}✅ 更新通知已启用！${NC}"
    echo ""
    echo "配置详情:"
    echo "  技能名称：$SKILL_NAME"
    echo "  检查频率：每周一上午 10 点"
    echo "  通知方式：OpenClaw 消息"
    echo ""
    echo -e "${CYAN}管理命令:${NC}"
    echo "  查看状态：bash scripts/enable-notifications.sh"
    echo "  手动检查：bash scripts/check-update.sh"
    echo "  关闭通知：运行脚本后选择选项 1"
    echo ""
    echo -e "${YELLOW}提示：${NC}有新版本时，你可以选择立即更新或稍后处理"
else
    echo ""
    echo -e "${RED}❌ 配置失败${NC}"
    echo ""
    echo "请检查:"
    echo "  1. OpenClaw 网关是否运行 (openclaw gateway status)"
    echo "  2. 是否有足够的权限"
    echo ""
    echo "或手动创建通知任务:"
    echo "  openclaw cron add --name \"$CRON_NAME\" --schedule \"0 10 * * 1\" --delivery \"announce\""
    exit 1
fi
