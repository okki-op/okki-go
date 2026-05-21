#!/bin/bash
#
# publish-npm.sh - 自动化发布 @okki/go-skill 到 npm
#
# 用法:
#   ./scripts/publish-npm.sh [--version <version>] [--dry-run]
#
# 选项:
#   --version <version>  指定版本号 (默认：从 git tag 或 package.json 读取)
#   --dry-run           预演模式，不实际发布
#   --help              显示帮助信息
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 配置
DRY_RUN=false
VERSION=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "用法：$0 [--version <version>] [--dry-run]"
            echo ""
            echo "选项:"
            echo "  --version <version>  指定版本号 (默认：从 git tag 或 package.json 读取)"
            echo "  --dry-run           预演模式，不实际发布"
            echo "  --help              显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知选项：$1"
            exit 1
            ;;
    esac
done

# 获取版本号
if [[ -z "$VERSION" ]]; then
    # 尝试从 git tag 获取
    VERSION=$(git tag --points-at HEAD 2>/dev/null | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1 | sed 's/^v//' || true)

    # 如果没有 tag，从 package.json 读取
    if [[ -z "$VERSION" ]]; then
        VERSION=$(node -e "const pkg = require('$ROOT_DIR/package.json'); console.log(pkg.version)")
        echo "从 package.json 获取版本号：$VERSION"
    else
        echo "从 git tag 获取版本号：$VERSION"
    fi
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    echo "错误：版本号格式无效：\"$VERSION\"，必须符合 semver 格式（如 1.0.0）"
    exit 1
fi

echo "=============================================="
echo "  发布 @okki-global/okki-go 到 npm"
echo "  版本：$VERSION"
echo "  模式：$([ "$DRY_RUN" = true ] && echo '预演 (dry-run)' || echo '正式发布')"
echo "=============================================="

# 进入项目根目录
cd "$ROOT_DIR"

# Step 1: 更新 package.json 版本号
echo ""
echo "Step 1: 更新 package.json 版本号..."

node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$ROOT_DIR/package.json', 'utf8'));
    pkg.version = '$VERSION';
    fs.writeFileSync('$ROOT_DIR/package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('  更新：package.json -> ' + pkg.version);
"

# Step 2: 更新 skill/SKILL.md 的版本号
echo ""
echo "Step 2: 更新 skill/SKILL.md 的版本号..."

if [[ -f "$ROOT_DIR/skill/SKILL.md" ]]; then
    # 使用 sed 更新 frontmatter 中的 version
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^version: .*/version: $VERSION/" "$ROOT_DIR/skill/SKILL.md"
    else
        # Linux
        sed -i "s/^version: .*/version: $VERSION/" "$ROOT_DIR/skill/SKILL.md"
    fi
    echo "  更新：skill/SKILL.md -> $VERSION"
else
    echo "  警告：未找到 skill/SKILL.md"
fi

# Step 3: 更新 bin/install.js 的版本号
echo ""
echo "Step 3: 更新 bin/install.js 的版本号..."

if [[ -f "$ROOT_DIR/bin/install.js" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^const VERSION    = '.*';/const VERSION    = '$VERSION';/" "$ROOT_DIR/bin/install.js"
    else
        sed -i "s/^const VERSION    = '.*';/const VERSION    = '$VERSION';/" "$ROOT_DIR/bin/install.js"
    fi
    echo "  更新：bin/install.js -> $VERSION"
else
    echo "  警告：未找到 bin/install.js"
fi

# Step 4: 验证文件结构
echo ""
echo "Step 4: 验证文件结构..."

required_files=(
    "package.json"
    "bin/install.js"
    "skill/SKILL.md"
    "INSTALL.md"
    "README.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$ROOT_DIR/$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "  错误：缺少必需文件："
    for file in "${missing_files[@]}"; do
        echo "    - $file"
    done
    exit 1
fi

echo "  ✓ 所有必需文件存在"

# Step 5: 发布到 npm
echo ""
echo "Step 5: 发布到 npm..."

if [[ "$DRY_RUN" = true ]]; then
    echo "  [预演] npm publish --access public"
    echo "  [预演] 将发布以下文件："
    npm pack --dry-run
else
    npm_args="--access public"
    if [[ -n "${NPM_TOKEN:-}" ]]; then
        npm_args="$npm_args --//registry.npmjs.org/:_authToken=$NPM_TOKEN"
    fi

    npm publish $npm_args
    echo "  ✓ 已发布：@okki/go-skill@$VERSION"
fi

echo ""
echo "=============================================="
if [[ "$DRY_RUN" = true ]]; then
    echo "  预演完成！正式运行请去掉 --dry-run 选项"
else
    echo "  发布完成！"
    echo "  安装命令：npm install -g @okki-global/okki-go@$VERSION"
    echo "  或在项目中：node bin/install.js --global --claude"
fi
echo "=============================================="
