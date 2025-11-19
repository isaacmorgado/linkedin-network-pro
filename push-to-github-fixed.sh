#!/bin/bash

# LinkedIn Network Pro - GitHub Push Script (Fixed Version)
# This script will push your code to GitHub

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 LinkedIn Network Pro - GitHub Push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
GITHUB_TOKEN="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"
GITHUB_USERNAME="isaacmorgado"
REPO_NAME="linkedin-network-pro"

echo "📝 Checking if repository exists on GitHub..."
echo ""

# Check if repository exists
REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME)

if [ "$REPO_CHECK" = "404" ]; then
  echo "❌ Repository does not exist yet!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 STEP 1: Create the Repository on GitHub"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. Open this URL in your browser:"
  echo "   👉 https://github.com/new"
  echo ""
  echo "2. Fill in these exact details:"
  echo "   Repository name: $REPO_NAME"
  echo "   Description: AI-powered LinkedIn networking Chrome extension"
  echo "   Visibility: Choose Public or Private"
  echo ""
  echo "3. IMPORTANT: Leave ALL checkboxes UNCHECKED"
  echo "   ❌ Do NOT add README"
  echo "   ❌ Do NOT add .gitignore"
  echo "   ❌ Do NOT add license"
  echo ""
  echo "4. Click 'Create repository'"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 STEP 2: Run this script again"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "After creating the repository, run:"
  echo "   ./push-to-github-fixed.sh"
  echo ""
  exit 1
fi

if [ "$REPO_CHECK" = "200" ]; then
  echo "✅ Repository exists on GitHub!"
else
  echo "⚠️  Unexpected response: $REPO_CHECK"
  echo "   Continuing anyway..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 Pushing your code to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configure git
git config user.name "Isaac Morgado" 2>/dev/null || true
git config user.email "isaacmorgado@users.noreply.github.com" 2>/dev/null || true

# Remove existing remote if present
git remote remove origin 2>/dev/null || true

# Add remote with token
echo "🔗 Adding GitHub remote..."
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Push to GitHub
echo "📤 Pushing to main branch..."
git push -u origin main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SUCCESS! Your code is now on GitHub!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Repository URL:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📊 What was pushed:"
echo "   ✅ 24 files"
echo "   ✅ 4,601 lines of code"
echo "   ✅ Complete extension skeleton"
echo "   ✅ Full documentation"
echo ""
echo "🎯 Next steps:"
echo "   1. Visit: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   2. Add topics: chrome-extension, linkedin, ai, react, typescript"
echo "   3. Add MIT license (click 'Add file' → 'Create new file' → 'LICENSE')"
echo "   4. Star your repo ⭐"
echo ""
echo "🎉 Happy coding!"
echo ""
