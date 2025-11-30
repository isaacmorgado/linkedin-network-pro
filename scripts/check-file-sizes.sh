#!/bin/bash
# File Size Checker for LinkedIn Network Pro
# Enforces 300-line limit for pathfinding/scoring files

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📏 FILE SIZE VALIDATION - 300 Line Limit Enforcement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

VIOLATIONS=0
MAX_LINES=300

# Check pathfinding files
echo "🔍 Checking pathfinding files in src/services/universal-connection/..."
echo ""

while IFS= read -r file; do
    lines=$(wc -l < "$file")
    filename=$(basename "$file")

    if [ "$lines" -gt "$MAX_LINES" ]; then
        echo -e "${RED}❌ VIOLATION${NC}: $filename (${RED}$lines lines${NC}) - MUST BE < $MAX_LINES"
        VIOLATIONS=$((VIOLATIONS + 1))
    elif [ "$lines" -gt 250 ]; then
        echo -e "${YELLOW}⚠️  WARNING${NC}: $filename (${YELLOW}$lines lines${NC}) - approaching limit"
    else
        echo -e "${GREEN}✅ PASS${NC}: $filename ($lines lines)"
    fi
done < <(find src/services/universal-connection -name "*.ts" ! -name "*.test.ts" ! -name "*.spec.ts" 2>/dev/null)

echo ""
echo "🔍 Checking graph/algorithm files in src/lib/..."
echo ""

while IFS= read -r file; do
    lines=$(wc -l < "$file")
    filename=$(basename "$file")

    # Skip data files
    if [[ "$filename" == "industry-mapping.ts" ]] || [[ "$filename" == "skills-database.ts" ]]; then
        echo -e "${GREEN}📊 DATA FILE${NC}: $filename ($lines lines) - exempt from limit"
        continue
    fi

    if [ "$lines" -gt "$MAX_LINES" ]; then
        echo -e "${RED}❌ VIOLATION${NC}: $filename (${RED}$lines lines${NC}) - MUST BE < $MAX_LINES"
        VIOLATIONS=$((VIOLATIONS + 1))
    elif [ "$lines" -gt 250 ]; then
        echo -e "${YELLOW}⚠️  WARNING${NC}: $filename (${YELLOW}$lines lines${NC}) - approaching limit"
    else
        echo -e "${GREEN}✅ PASS${NC}: $filename ($lines lines)"
    fi
done < <(find src/lib -name "*.ts" ! -name "*.test.ts" ! -name "*.spec.ts" 2>/dev/null)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$VIOLATIONS" -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}: $VIOLATIONS file(s) exceed 300 line limit"
    echo ""
    echo "📋 Action Required:"
    echo "  1. Refactor violating files into subdirectories"
    echo "  2. Follow splitting strategy in CLAUDE.md"
    echo "  3. Run this script again to verify"
    echo ""
    echo "See CLAUDE.md for refactoring guidelines"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
else
    echo -e "${GREEN}✅ VALIDATION PASSED${NC}: All files within 300 line limit"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi
