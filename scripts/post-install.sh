#!/bin/bash
# Okki Go 安装后初始化脚本
# 使用方法：bash scripts/post-install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🌐 Okki Go 安装完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ 技能已安装到：${NC}$SKILL_DIR"
echo ""

# 检查 openclaw 是否可用
if ! command -v openclaw &> /dev/null; then
    echo -e "${YELLOW}⚠️  未检测到 OpenClaw${NC}"
    echo ""
    echo "请先安装 OpenClaw:"
    echo "  npm install -g openclaw"
    echo ""
    exit 0
fi

echo -e "${CYAN}📬 是否启用更新通知？${NC}"
echo ""
echo "启用后你将收到："
echo "  • 新版本发布提醒"
echo "  • 更新内容预览"
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
else
    echo ""
    echo "📝 正在配置..."
    bash "$SCRIPT_DIR/enable-notifications.sh"
fi

echo ""
echo -e "${CYAN}下一步：配置 API Key${NC}"
echo ""
echo "1. 访问 https://go.okki.ai 注册账号"
echo "2. 在控制台创建 API Key"
echo "3. 运行以下命令保存："
echo "   openclaw config set skills.entries.prospectiq.apiKey 'sk-xxx'"
echo ""
echo -e "${GREEN}🎉 配置完成！开始使用吧！${NC}"
echo ""
