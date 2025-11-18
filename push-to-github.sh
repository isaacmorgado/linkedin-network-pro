#!/bin/bash

# LinkedIn Network Pro - Push to GitHub Script
# This script creates a GitHub repository and pushes your code

set -e  # Exit on error

echo "🚀 LinkedIn Network Pro - GitHub Setup"
echo "========================================"
echo ""

# Configuration
GITHUB_TOKEN="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"
GITHUB_USERNAME="isaacmorgado"
REPO_NAME="linkedin-network-pro"
REPO_DESCRIPTION="AI-powered LinkedIn networking Chrome extension with Apple-inspired design"

echo "📝 Repository Details:"
echo "   Name: $REPO_NAME"
echo "   Owner: $GITHUB_USERNAME"
echo "   Visibility: Public"
echo ""

# Create repository using GitHub API
echo "📦 Creating GitHub repository..."

RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESCRIPTION\",\"private\":false,\"auto_init\":false}")

# Check if repository was created or already exists
if echo "$RESPONSE" | grep -q '"id"'; then
  echo "✅ Repository created successfully!"
elif echo "$RESPONSE" | grep -q "name already exists"; then
  echo "⚠️  Repository already exists. Will push to existing repo."
else
  echo "❌ Error creating repository:"
  echo "$RESPONSE" | grep -o '"message":"[^"]*"' || echo "$RESPONSE"
  echo ""
  echo "Please create the repository manually at:"
  echo "https://github.com/new"
  echo ""
  echo "Repository name: $REPO_NAME"
  echo "Description: $REPO_DESCRIPTION"
  echo "Visibility: Public"
  echo ""
  echo "Then run: git push -u origin main"
  exit 1
fi

echo ""
echo "🔗 Adding remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ SUCCESS! Your code is now on GitHub!"
echo ""
echo "🌐 Repository URL:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📋 Next steps:"
echo "   1. Visit your repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "   2. Add topics: chrome-extension, linkedin, ai, react, typescript"
echo "   3. Add a license (MIT recommended)"
echo "   4. Enable GitHub Pages (optional)"
echo "   5. Set up GitHub Actions for CI/CD (optional)"
echo ""
echo "🎉 Happy coding!"
