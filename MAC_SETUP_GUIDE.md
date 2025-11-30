# Uproot Extension - Mac Setup Guide

Complete guide to set up and continue development on your Mac.

## 🔧 Prerequisites Installation

### 1. Install Homebrew (Mac Package Manager)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js & npm
```bash
# Install Node.js (v20+)
brew install node@20

# Verify installation
node --version  # Should be v20.x.x or higher
npm --version   # Should be v10.x.x or higher
```

### 3. Install Git (if not already installed)
```bash
brew install git

# Configure git
git config --global user.name "Isaac Morgado"
git config --global user.email "isaacmorgado@users.noreply.github.com"
```

### 4. Install GitHub CLI (Optional but Recommended)
```bash
brew install gh

# Authenticate with GitHub
gh auth login
```

## 📥 Clone the Repository

### Option 1: Using HTTPS (Recommended)
```bash
# Navigate to your projects folder
cd ~/Documents
mkdir -p projects
cd projects

# Clone the repository
git clone https://github.com/isaacmorgado/linkedin-network-pro.git
cd linkedin-network-pro
```

### Option 2: Using GitHub CLI
```bash
cd ~/Documents/projects
gh repo clone isaacmorgado/linkedin-network-pro
cd linkedin-network-pro
```

### Option 3: Using SSH (if you have SSH keys set up)
```bash
cd ~/Documents/projects
git clone git@github.com:isaacmorgado/linkedin-network-pro.git
cd linkedin-network-pro
```

## 🚀 Development Setup

### 1. Install Dependencies
```bash
# Make sure you're in the project root
cd ~/Documents/projects/linkedin-network-pro

# Install all npm packages (this will take a few minutes)
npm install

# This will automatically run 'npm postinstall' which executes 'wxt prepare'
```

### 2. Build the Extension
```bash
# Build for Chrome (production)
npm run build

# Or build for development with hot reload
npm run dev
```

### 3. Load Extension in Chrome

**For Production Build:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to: `~/Documents/projects/linkedin-network-pro/.output/chrome-mv3/`
5. Click "Select"

**For Development Build:**
1. Run `npm run dev` (this starts a development server)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Navigate to: `~/Documents/projects/linkedin-network-pro/.output/chrome-mv3/`
6. The extension will auto-reload when you make changes!

### 4. Firefox Support (Optional)
```bash
# Build for Firefox
npm run build:firefox

# Or run in development mode
npm run dev:firefox
```

Load in Firefox:
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `.output/firefox-mv3/manifest.json`

## 🛠️ Common Development Commands

```bash
# Start development server (auto-reload)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run specific stress tests
npm run test:stress

# Type checking (without building)
npm run compile

# Lint code
npm run lint

# Validate extension
npm run validate

# Check file sizes
npm run check:file-sizes
```

## 📁 Mac-Specific File Paths

Your project structure on Mac:
```
~/Documents/
└── projects/
    └── linkedin-network-pro/
        ├── .output/           # Built extension (load this in Chrome)
        ├── src/              # Source code
        ├── docs/             # Documentation
        ├── backend/          # Backend services
        ├── package.json      # Dependencies
        └── wxt.config.ts     # Build configuration
```

## 🔑 Git Credentials Setup (Mac)

### Option 1: Using macOS Keychain (Recommended)
```bash
# Configure git to use macOS keychain
git config --global credential.helper osxkeychain

# Next time you push, enter your GitHub credentials
# They'll be saved securely in macOS Keychain
```

### Option 2: Using Personal Access Token
```bash
# When prompted for password, use a GitHub Personal Access Token instead
# Generate one at: https://github.com/settings/tokens

# Or save credentials to file (less secure)
git config --global credential.helper store
```

## ⚙️ VS Code Setup (Recommended)

### 1. Install VS Code
```bash
brew install --cask visual-studio-code
```

### 2. Open Project
```bash
cd ~/Documents/projects/linkedin-network-pro
code .
```

### 3. Recommended Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens

Install via terminal:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension eamodio.gitlens
```

## 🔄 Syncing Changes from Windows

If you made changes on Windows that aren't pushed yet:

### Before Leaving Windows:
```bash
# Commit any changes
git add .
git commit -m "Work in progress from Windows"
git push origin main
```

### On Your Mac:
```bash
# Pull latest changes
cd ~/Documents/projects/linkedin-network-pro
git pull origin main

# Reinstall dependencies (in case package.json changed)
npm install

# Rebuild
npm run build
```

## 🐛 Troubleshooting

### Issue: "command not found: npm"
**Solution:**
```bash
# Add node to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Reload shell
source ~/.zshrc
```

### Issue: Permission errors during npm install
**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /opt/homebrew
```

### Issue: Extension not loading in Chrome
**Solution:**
1. Make sure you ran `npm run build` first
2. Load the `.output/chrome-mv3/` folder, not the root folder
3. Check Chrome console for errors
4. Try removing and re-adding the extension

### Issue: Port already in use (when running npm run dev)
**Solution:**
```bash
# Kill process on port (if dev server crashes)
lsof -ti:5173 | xargs kill -9
```

## 📱 Chrome Developer Tools

Access extension logs:
1. Right-click the extension icon
2. Click "Inspect popup" (for popup debugging)
3. For background script: Go to `chrome://extensions/` → Click "service worker" under your extension

## 🎯 Quick Start Checklist

- [ ] Install Homebrew
- [ ] Install Node.js v20+
- [ ] Install Git
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Load extension in Chrome from `.output/chrome-mv3/`
- [ ] Test the extension on LinkedIn

## 📚 Important Documentation

Located in the repository:
- `README.md` - Project overview
- `QUICKSTART.md` - Quick start guide
- `IMPLEMENTATION_GUIDE.md` - Development guide
- `docs/` - Architecture and API documentation
- `RESUME_MATCHER_DOCS.md` - Resume matching system
- `COVER_LETTER_STATUS.md` - Cover letter generator

## 🔗 Useful Links

- **Repository**: https://github.com/isaacmorgado/linkedin-network-pro
- **Chrome Extensions**: chrome://extensions/
- **WXT Framework Docs**: https://wxt.dev/
- **Node.js**: https://nodejs.org/

## 💡 Development Tips for Mac

1. **Use Terminal.app or iTerm2** for better command-line experience
2. **Spotlight Search (Cmd+Space)** to quickly open apps
3. **Chrome DevTools (Cmd+Option+I)** for debugging
4. **VS Code Command Palette (Cmd+Shift+P)** for quick actions
5. **Use `npm run dev`** for live reload during development

## 🚨 Important Notes

1. **Never commit** `.env` files with API keys
2. **Always test** before pushing to GitHub
3. **The extension builds to** `.output/chrome-mv3/` - this is what you load in Chrome
4. **Mac uses Cmd key** instead of Ctrl (e.g., Cmd+C for copy)
5. **Use forward slashes** in paths (same as Windows WSL/Linux)

## ✅ You're Ready!

Once you complete the setup, you can:
- Continue developing the extension
- Make changes and see them live reload
- Test on LinkedIn
- Commit and push changes to GitHub
- Build production versions

**Happy coding on your Mac! 🎉**
