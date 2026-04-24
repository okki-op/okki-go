#!/bin/bash
# Quick test script for okki-go installer

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OKKI_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧪 Testing Okki Go Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Help output
echo "Test 1: Help output"
node "$OKKI_DIR/bin/install.js" --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Help command works"
else
    echo "❌ Help command failed"
    exit 1
fi
echo ""

# Test 2: Dry run - check if script can parse arguments
echo "Test 2: Argument parsing"
# This will fail at directory creation but that's ok - we're testing parsing
node "$OKKI_DIR/bin/install.js" --global --runtime=claude 2>&1 | grep -q "Okki Go Skill Installer"
if [ $? -eq 0 ]; then
    echo "✅ Argument parsing works"
else
    echo "❌ Argument parsing failed"
    exit 1
fi
echo ""

# Test 3: Check file structure
echo "Test 3: Source file structure"
REQUIRED_FILES=(
    "$OKKI_DIR/SKILL.md"
    "$OKKI_DIR/references/api-reference.md"
    "$OKKI_DIR/scripts/enable-notifications.sh"
    "$OKKI_DIR/bin/install.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $(basename $file)"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done
echo ""

# Test 4: Script permissions
echo "Test 4: Script permissions"
if [ -x "$OKKI_DIR/bin/install.js" ]; then
    echo "✅ install.js is executable"
else
    echo "⚠️  install.js not executable (run: chmod +x bin/install.js)"
fi

if [ -x "$OKKI_DIR/scripts/enable-notifications.sh" ]; then
    echo "✅ enable-notifications.sh is executable"
else
    echo "⚠️  enable-notifications.sh not executable"
fi
echo ""

# Test 5: Node.js version
echo "Test 5: Node.js version"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 14 ]; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js version too old: $(node --version) (requires >=14)"
    exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed!"
echo ""
echo "Ready to install. Try:"
echo "  node bin/install.js --help"
echo "  node bin/install.js  # interactive mode"
