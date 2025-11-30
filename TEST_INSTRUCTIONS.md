# Testing the Extension Fix

## Quick Test

1. **Build the extension** (already done):
   ```bash
   npm run build
   ```

2. **Validate the build**:
   ```bash
   npm run validate:extension
   ```
   You should see: `✅ Extension validation PASSED`

3. **Load in Chrome (Windows)**:
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Navigate to or paste this path:
     ```
     \\wsl.localhost\Ubuntu\home\imorgado\Documents\agent-girl\uproot\.output\chrome-mv3
     ```
   - Press Enter and select the folder

4. **Verify Success**:
   - ✅ Extension appears in the list as "Uproot v1.0.0"
   - ✅ No "Service worker registration failed" error
   - ✅ Service worker shows as "active" (you can click the "service worker" link to see console)

## Troubleshooting

### If you still get "Status code: 15"
1. Check that `icon.svg` exists in the `.output/chrome-mv3/` directory
2. Run `npm run validate:extension` to verify all files are present
3. Try removing and re-adding the extension

### If service worker shows errors
1. Click the "service worker" link in chrome://extensions
2. Check the DevTools console for specific error messages
3. Common issues:
   - Network requests blocked (check host_permissions in manifest)
   - CSP violations (check content_security_policy in manifest)

## Testing Extension Features

Once loaded, test:
1. Click the extension icon - should toggle the Uproot panel
2. Try keyboard shortcuts:
   - `Alt+1` - Toggle panel
   - `Alt+2` - Save highlighted question
   - `Alt+3` - Paste to generate section
3. Visit LinkedIn.com and verify content scripts load

## Build Commands Reference

```bash
# Full build
npm run build

# Validate extension
npm run validate:extension

# Development mode (auto-rebuild)
npm run dev

# Run tests
npm test
```

## What Was Fixed

1. **Added missing icon files** - Created icon.svg and configured build to copy it
2. **Fixed WXT configuration** - Removed problematic IIFE format setting
3. **Added validation script** - Automatically checks all required files exist

See `EXTENSION_FIX_REPORT.md` for detailed technical information.
