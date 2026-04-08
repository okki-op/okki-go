#!/bin/bash
# Okki Go 版本检查脚本 (macOS/Linux)
# 使用方法：bash scripts/check-update.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_NAME="okki go"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}🔍 检查 Okki Go 更新...${NC}"
echo ""

# 获取当前版本
CURRENT=$(grep "^version:" "$SKILL_DIR/SKILL.md" 2>/dev/null | awk '{print $2}')
if [ -z "$CURRENT" ]; then
    CURRENT="unknown"
fi

# 获取最新版本
LATEST=$(clawhub search "$SKILL_NAME" --limit 1 2>/dev/null | jq -r 'if .[0] then .[0].version else "unknown" end')

echo "当前版本：$CURRENT"
echo "最新版本：$LATEST"
echo ""

if [ "$CURRENT" = "$LATEST" ]; then
    echo -e "${GREEN}✅ 已是最新版本 ($CURRENT)${NC}"
    exit 0
fi

if [ "$LATEST" = "unknown" ]; then
    echo -e "${YELLOW}⚠️ 无法获取最新版本信息${NC}"
    echo ""
    echo "请检查网络连接或稍后重试"
    exit 1
fi

# 有新版本
echo -e "${YELLOW}📦 发现新版本：$CURRENT → $LATEST${NC}"
echo ""

# 获取更新日志
echo "更新内容:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
clawhub show "${SKILL_NAME}@${LATEST}" --changelog 2>/dev/null | head -20
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 询问是否更新
echo "可选操作:"
echo "  1. 立即更新"
echo "  2. 稍后处理"
echo "  3. 不再提醒 (关闭通知)"
echo ""

read -p "请选择 [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 正在更新..."
        if openclaw skills update "$SKILL_NAME"; then
            echo -e "${GREEN}✅ 更新完成！${NC}"
            echo ""
            echo "新版本功能已就绪"
        else
            echo -e "${RED}❌ 更新失败${NC}"
            echo ""
            echo "请检查网络或手动更新:"
            echo "  openclaw skills update $SKILL_NAME"
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}⏭️ 已跳过${NC}"
        echo ""
        echo "有新版本时将继续提醒"
        echo "更新命令：openclaw skills update $SKILL_NAME"
        ;;
    3)
        echo ""
        CRON_NAME="${SKILL_NAME}-update-reminder"
        JOB_ID=$(openclaw cron list 2>/dev/null | grep "$CRON_NAME" | awk '{print $1}')
        if [ -n "$JOB_ID" ]; then
            openclaw cron remove --jobId "$JOB_ID"
            echo -e "${GREEN}✅ 已关闭更新通知${NC}"
        else
            echo "未找到通知任务"
        fi
        ;;
    *)
        echo "无效选择"
        ;;
esac
