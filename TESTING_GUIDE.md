# Quick Testing Guide - Extension Sizing Fixes

## ⚡ Quick Start

### Load Extension
1. Open Chrome
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select: `/home/imorgado/Documents/agent-girl/chat-abc62d98/linkedin-network-pro/.output/chrome-mv3/`

---

## 🎯 Priority Tests (5 minutes)

### Test 1: Edge Boundary Protection
**What to test:** Panels can't go off-screen
**How:**
1. Open LinkedIn (https://linkedin.com/feed)
2. Press `Alt+1` to open extension
3. Try to resize panel from **left edge** - drag left edge to the left
   - ✅ Panel should stop at X=0, not go off-screen
4. Try to resize panel from **top edge** - drag top edge upward
   - ✅ Panel should stop at Y=0, not go off-screen
5. Try to drag panel **past left edge** of screen
   - ✅ Panel should snap back to visible area

**Expected:** Panel always stays within viewport boundaries

---

### Test 2: Z-Index on 3rd Party Sites
**What to test:** Extension appears on top of website elements
**How:**
1. Go to YouTube.com and play a video
2. Press `Alt+1` to open extension
3. Try to interact with extension panel
   - ✅ Panel should be on top of video player
   - ✅ Can click buttons and drag panel
   - ✅ Video controls still accessible

**Expected:** Extension panel visible and interactive

---

### Test 3: Minimize/Maximize Animation
**What to test:** Smooth animations without glitches
**How:**
1. Open extension on LinkedIn
2. Click minimize button (- icon)
3. Click maximize button (□ icon)
4. Repeat 5-10 times rapidly

**Expected:**
- ✅ Smooth 500ms animation
- ✅ No visual glitches or jumps
- ✅ Panel repositions if at bottom of screen

---

### Test 4: Memory Leak Check
**What to test:** Memory stays stable during heavy use
**How:**
1. Open Chrome Task Manager (`Shift+Esc`)
2. Find your extension process
3. Note initial memory usage
4. Resize panel 50 times from different edges
5. Minimize/maximize 50 times
6. Check memory usage again

**Expected:**
- ✅ Memory increase < 10MB
- ✅ No continuous growth pattern

---

### Test 5: 3rd Party Job Site (Minimal Panel)
**What to test:** MinimalAutofillPanel works on non-LinkedIn sites
**How:**
1. Visit any Workday/Greenhouse job application site
2. Extension should auto-inject MinimalAutofillPanel
3. Test all 4 edge resizes
4. Test all 4 corner resizes
5. Try to drag panel off-screen

**Expected:**
- ✅ Panel constrained to viewport
- ✅ All resize handles work
- ✅ Z-index above site modals

---

## ✅ Success Criteria

Extension passes if:
- ✅ All edge resizes stay within viewport
- ✅ All corner resizes work without off-screen movement
- ✅ Z-index keeps panel visible on all tested sites
- ✅ Animations are smooth with no visual glitches
- ✅ Memory usage remains stable during stress tests
- ✅ Works on both LinkedIn (full panel) and 3rd party sites (minimal panel)
