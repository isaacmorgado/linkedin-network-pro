#!/bin/bash
# Quick push to GitHub - Run this AFTER creating repo on GitHub

set -e

echo "🚀 Pushing to GitHub..."

# Configure git to use token for this repo
git remote remove origin 2>/dev/null || true
git remote add origin https://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@github.com/isaacmorgado/linkedin-network-pro.git

# Push to main branch
git push -u origin main

echo ""
echo "✅ SUCCESS! Your code is on GitHub!"
echo ""
echo "🌐 View at: https://github.com/isaacmorgado/linkedin-network-pro"
echo ""
