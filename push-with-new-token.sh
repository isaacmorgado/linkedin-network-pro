#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LinkedIn Network Pro - Push to GitHub
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# INSTRUCTIONS:
# 1. Create a new token at: https://github.com/settings/tokens/new
# 2. Check the "repo" scope
# 3. Copy the token
# 4. Replace "PASTE_YOUR_TOKEN_HERE" below with your token
# 5. Run: ./push-with-new-token.sh
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ⚠️ PASTE YOUR NEW TOKEN HERE (replace the text below)
NEW_TOKEN="PASTE_YOUR_TOKEN_HERE"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Don't edit below this line
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Check if token was updated
if [ "$NEW_TOKEN" = "PASTE_YOUR_TOKEN_HERE" ]; then
  echo "❌ ERROR: You need to paste your GitHub token!"
  echo ""
  echo "Steps:"
  echo "1. Open this file in a text editor: push-with-new-token.sh"
  echo "2. Find line 17: NEW_TOKEN=\"PASTE_YOUR_TOKEN_HERE\""
  echo "3. Replace PASTE_YOUR_TOKEN_HERE with your actual token"
  echo "4. Save and run again"
  echo ""
  echo "To create a token:"
  echo "👉 https://github.com/settings/tokens/new"
  echo "   - Check the 'repo' scope"
  echo "   - Copy the token"
  echo ""
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Pushing to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update remote URL with new token
echo "🔗 Configuring remote..."
git remote set-url origin "https://${NEW_TOKEN}@github.com/isaacmorgado/linkedin-network-pro.git"

# Push to GitHub
echo "📤 Pushing code..."
git push -u origin main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SUCCESS! Your code is on GitHub!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Repository:"
echo "   https://github.com/isaacmorgado/linkedin-network-pro"
echo ""
echo "🎯 Next steps:"
echo "   1. Visit your repo and verify all files are there"
echo "   2. Add topics: chrome-extension, linkedin, ai, react"
echo "   3. Add MIT license"
echo "   4. Star your repo ⭐"
echo ""
echo "🎉 Happy coding!"
echo ""
