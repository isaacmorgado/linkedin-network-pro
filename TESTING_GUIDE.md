# Testing Guide - Feature by Feature

## 🧪 Phase 1: Verify Extension Loads

### Step 1: Load Extension in Chrome

1. **Build the extension** (if not already done):
   ```bash
   cd /home/imorgado/Documents/agent-girl/chat-1341ae5d/linkedin-extension
   npm run build
   ```

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"**

5. **Select folder**:
   ```
   /home/imorgado/Documents/agent-girl/chat-1341ae5d/linkedin-extension/.output/chrome-mv3
   ```

6. **Expected Result**: Extension loads without errors
   - ✅ Green badge with "Service worker (Active)"
   - ✅ No error messages
   - ✅ Extension icon appears in toolbar

### Step 2: Test on LinkedIn

1. **Navigate to** https://www.linkedin.com

2. **Open DevTools** (F12 or Right-click → Inspect)

3. **Check Console** for:
   ```
   LinkedIn Extension content script loaded
   Initializing LinkedIn extension content script
   Floating panel injected
   ```

4. **Look for the floating panel** on the page
   - Should appear as a draggable window
   - Should show "LinkedIn Network Pro" header
   - Should display "Sign in with Google" / "Sign in with Email" buttons

5. **Try clicking the extension icon** in toolbar
   - Should open a small popup
   - Popup should have "Open Panel" button

### Step 3: Debug Any Issues

**If extension doesn't load:**
- Check for error messages in `chrome://extensions`
- Look at "Errors" button next to the extension

**If content script doesn't inject:**
- Open Console on LinkedIn page
- Look for any error messages
- Check if content script is blocked by CSP

**If panel doesn't appear:**
- Check Console for "Floating panel injected" message
- Inspect page DOM for element with id `linkedin-extension-root`
- Check if Shadow DOM is attached

---

## ✅ Current Testing Checklist

### Phase 1: Basic Loading
- [ ] Extension loads in chrome://extensions
- [ ] No errors in extension page
- [ ] Service worker is active
- [ ] Content script logs appear on LinkedIn
- [ ] Floating panel renders on page
- [ ] Panel is visible and draggable
- [ ] Popup opens when clicking icon
- [ ] Login screen displays correctly

### What Should Work Now:
1. ✅ Extension loads and installs
2. ✅ Content script injects into LinkedIn pages
3. ✅ Floating panel appears with Apple-like design
4. ✅ Panel shows login screen (not functional yet)
5. ✅ Tab navigation displays (6 tabs)
6. ✅ Extension icon popup works

### What Won't Work Yet:
1. ❌ Authentication (Phase 2)
2. ❌ LinkedIn scraping (Phase 3)
3. ❌ AI features (Phase 4)
4. ❌ Graph algorithms (Phase 5)
5. ❌ Resume tools (Phase 6)

---

## 📋 Report Format

After testing Phase 1, please report:

**Working:**
- List what works

**Not Working:**
- List any errors or issues
- Include console errors
- Include screenshots if helpful

**Next Steps:**
- What should we fix/build next?

---

## 🐛 Common Issues & Fixes

### Issue: "Manifest file is missing or unreadable"
**Fix**: Make sure you selected the `.output/chrome-mv3` folder, not the parent folder

### Issue: Content script not injecting
**Fix**: Check that you're on `https://www.linkedin.com/*` (not HTTP)

### Issue: Panel doesn't show
**Fix**: Check Console for React errors. Shadow DOM might be blocking styles.

### Issue: Extension icon does nothing
**Fix**: The popup should open. If not, check for popup.html errors.

---

## 🔄 Rebuild After Changes

Whenever we make code changes:

```bash
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Click the 🔄 reload button on the extension
3. Refresh the LinkedIn page (Ctrl+R)
4. Check Console for new logs

---

**Ready to test? Follow Step 1 above and let me know what you see!**
