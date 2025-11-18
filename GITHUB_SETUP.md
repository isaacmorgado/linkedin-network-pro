# GitHub Setup Guide

Your LinkedIn Network Pro extension is **ready to push to GitHub**!

Everything is committed locally. Choose one of the methods below:

---

## ✅ Method 1: Quick Manual Setup (Recommended - 2 minutes)

### Step 1: Create the Repository on GitHub

1. Go to: **https://github.com/new**
2. Fill in:
   - **Repository name**: `linkedin-network-pro`
   - **Description**: `AI-powered LinkedIn networking Chrome extension with Apple-inspired design`
   - **Visibility**: Choose **Public** or **Private**
   - ❌ **DO NOT** check "Add a README file"
   - ❌ **DO NOT** add .gitignore or license (we already have them)
3. Click **"Create repository"**

### Step 2: Push Your Code

Open terminal in the `linkedin-extension` directory and run:

```bash
cd /home/imorgado/Documents/agent-girl/chat-1341ae5d/linkedin-extension

# Add GitHub remote
git remote add origin https://github.com/isaacmorgado/linkedin-network-pro.git

# Push to GitHub
git push -u origin main
```

**Done!** ✅ Your code is now on GitHub.

---

## 🔐 Method 2: Use GitHub CLI (If you prefer automation)

### Step 1: Create a New Token with Proper Permissions

Your current token doesn't have `repo` scope. Create a new one:

1. Go to: **https://github.com/settings/tokens/new**
2. Set:
   - **Note**: `LinkedIn Extension - Full Access`
   - **Expiration**: Choose your preference
   - **Scopes**: Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `write:packages` (optional)
     - ✅ `delete_repo` (optional)
3. Click **"Generate token"**
4. **Copy the new token** (starts with `ghp_` or `github_pat_`)

### Step 2: Use the Automated Script

Edit `push-to-github.sh` and replace the token on line 11:

```bash
GITHUB_TOKEN="your_new_token_here"
```

Then run:

```bash
cd /home/imorgado/Documents/agent-girl/chat-1341ae5d/linkedin-extension
./push-to-github.sh
```

---

## 🎯 After Pushing to GitHub

### Add Repository Topics

Make your repo discoverable:

1. Go to your repository: `https://github.com/isaacmorgado/linkedin-network-pro`
2. Click the ⚙️ gear icon next to "About"
3. Add topics:
   - `chrome-extension`
   - `linkedin`
   - `ai`
   - `react`
   - `typescript`
   - `tailwind`
   - `supabase`
   - `anthropic-claude`
   - `networking`
   - `job-search`

### Add a License

1. Click "Add file" → "Create new file"
2. Name it `LICENSE`
3. Click "Choose a license template"
4. Select **MIT License** (recommended for open source)
5. Commit

### Create a Beautiful README Badge

Add this to the top of your README.md on GitHub:

```markdown
[![GitHub stars](https://img.shields.io/github/stars/isaacmorgado/linkedin-network-pro?style=social)](https://github.com/isaacmorgado/linkedin-network-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Enable Discussions (Optional)

1. Go to Settings → Features
2. Check "Discussions"
3. Great for user feedback and support

---

## 📊 Current Status

✅ **Local Repository**: Initialized and committed
✅ **Files**: 22 files, 4,358 lines of code
✅ **Commit**: Clean, professional commit message
✅ **Branch**: `main` (modern default)
✅ **Ready to Push**: Just add remote and push!

---

## 🆘 Troubleshooting

### "Authentication failed"

Use token authentication:

```bash
git remote set-url origin https://isaacmorgado:YOUR_TOKEN@github.com/isaacmorgado/linkedin-network-pro.git
git push -u origin main
```

Replace `YOUR_TOKEN` with your GitHub personal access token.

### "Repository not found"

Make sure you created the repository on GitHub first (Method 1, Step 1).

### "Permission denied"

Your token needs `repo` scope. Create a new token with proper permissions (Method 2, Step 1).

---

## 🎉 Quick Start (Copy-Paste)

**If you've already created the repo on GitHub:**

```bash
cd /home/imorgado/Documents/agent-girl/chat-1341ae5d/linkedin-extension
git remote add origin https://github.com/isaacmorgado/linkedin-network-pro.git
git push -u origin main
```

**That's it!** Your extension skeleton is now on GitHub! 🚀

---

**Repository URL (after creation):**
👉 https://github.com/isaacmorgado/linkedin-network-pro
