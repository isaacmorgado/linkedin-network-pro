# Circular Color Picker - Testing Guide

## Test Environment Setup

### Prerequisites
1. Chrome browser (v88 or higher)
2. Extension development mode enabled
3. Project built successfully: `npm run build`
4. Extension loaded in `chrome://extensions`

### Test User Setup
```typescript
// Ensure test user has Elite tier
const testUser = {
  subscriptionTier: 'elite',
  // ... other user properties
};
```

## Visual Testing Checklist

### Test 1: Initial Render (Collapsed State)

**Expected Appearance:**
```
┌─────────────────────────────────────────────────┐
│ Primary Color                    [#0077B5] ■    │
│ Main UI color for buttons and active elements  │
└─────────────────────────────────────────────────┘
```

**Test Steps:**
1. Open extension panel
2. Navigate to Settings → Account Settings
3. Scroll to "Design Customization" section

**Verify:**
- [ ] Label "Primary Color" is visible and bold
- [ ] Description text is gray and smaller
- [ ] Hex input shows current color (e.g., #0077B5)
- [ ] Color square matches hex value
- [ ] Color square has subtle border
- [ ] Layout is aligned properly

**Screenshot Location**: Save as `test1-collapsed.png`

---

### Test 2: Hover States

**Test Steps:**
1. Hover over color preview square
2. Observe visual feedback

**Verify:**
- [ ] Color square scales up slightly (1.05x)
- [ ] Border becomes more prominent
- [ ] Transition is smooth (150ms)
- [ ] Cursor changes to pointer
- [ ] No layout shift occurs

**Screenshot Location**: Save as `test2-hover.png`

---

### Test 3: Expanded State

**Expected Appearance:**
```
┌────────────────────────────────────────────────────┐
│ Primary Color                       [#0077B5] ■    │
│ Main UI color for buttons and active elements     │
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │          ╭─────────────────────╮               │ │
│ │         ╱   ╭───────────╮      ╲              │ │
│ │        │   ╱  Sat/Bright ╲      │             │ │
│ │        │  │   Selector    │     │             │ │
│ │        │   ╲             ╱      │             │ │
│ │         ╲   ╰───────────╯      ╱              │ │
│ │          ╰─────────────────────╯               │ │
│ │                                                │ │
│ │         H: 203  S: 100%  B: 71%               │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Test Steps:**
1. Click on color preview square
2. Observe picker expansion

**Verify:**
- [ ] Picker expands smoothly
- [ ] Outer hue wheel displays full rainbow gradient
- [ ] Inner circle shows saturation/brightness gradient
- [ ] Hue indicator (white circle) is positioned correctly
- [ ] Inner indicator (colored circle) is positioned correctly
- [ ] HSB values display at bottom
- [ ] Background has light gray tint
- [ ] Border and shadow are visible

**Screenshot Location**: Save as `test3-expanded.png`

---

### Test 4: Hue Wheel Interaction (Click)

**Test Steps:**
1. Expand picker
2. Click on different positions around the outer ring
3. Observe changes

**Click Positions to Test:**
- Top (red, ~0°)
- Top-right (yellow, ~60°)
- Right (green, ~120°)
- Bottom-right (cyan, ~180°)
- Bottom (blue, ~240°)
- Bottom-left (magenta, ~300°)

**Verify for Each Position:**
- [ ] Hue indicator moves to clicked position
- [ ] Inner circle gradient changes to new hue
- [ ] Inner indicator color updates
- [ ] Hex value updates
- [ ] Color preview square updates
- [ ] HSB display shows correct hue value
- [ ] No lag or jitter

**Screenshot Locations**:
- `test4a-hue-red.png`
- `test4b-hue-yellow.png`
- `test4c-hue-green.png`
- `test4d-hue-cyan.png`
- `test4e-hue-blue.png`
- `test4f-hue-magenta.png`

---

### Test 5: Hue Wheel Interaction (Drag)

**Test Steps:**
1. Expand picker
2. Click and hold on outer ring
3. Drag mouse around the circle
4. Observe continuous updates

**Verify:**
- [ ] Hue indicator follows mouse smoothly
- [ ] Updates occur at 60fps (no skipped frames)
- [ ] Color updates in real-time
- [ ] No visual glitches
- [ ] Dragging works in both directions
- [ ] Dragging continues even outside wheel (until mouseup)

**Screenshot Location**: Save as `test5-hue-drag.png` (mid-drag)

---

### Test 6: Inner Circle Interaction (Click)

**Test Steps:**
1. Expand picker
2. Click on different positions in inner circle
3. Observe saturation/brightness changes

**Click Positions to Test:**
- Center (white, S=50%, B=100%)
- Top-left (desaturated bright)
- Top-right (saturated bright)
- Bottom-left (desaturated dark)
- Bottom-right (saturated dark)
- Middle-left (desaturated mid)
- Middle-right (saturated mid)

**Verify for Each Position:**
- [ ] Inner indicator moves to clicked position
- [ ] Indicator color matches expected S/B
- [ ] Hex value updates correctly
- [ ] Color preview updates
- [ ] HSB display shows correct S and B values
- [ ] Hue remains unchanged

**Screenshot Locations**:
- `test6a-inner-center.png`
- `test6b-inner-bright-sat.png`
- `test6c-inner-dark-sat.png`

---

### Test 7: Inner Circle Interaction (Drag)

**Test Steps:**
1. Expand picker
2. Click and hold in inner circle
3. Drag around the circle
4. Observe continuous updates

**Verify:**
- [ ] Inner indicator follows mouse smoothly
- [ ] Color updates in real-time
- [ ] Dragging is clamped to circle boundary
- [ ] Smooth performance (60fps)
- [ ] All UI elements sync correctly

**Screenshot Location**: Save as `test7-inner-drag.png`

---

### Test 8: Hex Input Validation

**Test Cases:**

| Input      | Expected Result | Should Accept? |
|------------|-----------------|----------------|
| #0077B5    | Valid           | ✓ Yes          |
| #FF5733    | Valid           | ✓ Yes          |
| #000000    | Valid (black)   | ✓ Yes          |
| #FFFFFF    | Valid (white)   | ✓ Yes          |
| #fff       | Invalid (short) | ✗ No           |
| 0077B5     | Invalid (no #)  | ✗ No           |
| #0077BZ    | Invalid (Z)     | ✗ No           |
| #0077B     | Invalid (short) | ✗ No           |
| #0077B567  | Invalid (long)  | ✗ No           |
| red        | Invalid (word)  | ✗ No           |

**Test Steps for Each:**
1. Click in hex input field
2. Clear existing value
3. Type test case
4. Observe behavior

**Verify:**
- [ ] Valid inputs update picker immediately
- [ ] Invalid inputs don't update picker
- [ ] Input field accepts uppercase and lowercase
- [ ] Auto-uppercase works (if implemented)
- [ ] Cursor position maintained during typing
- [ ] No console errors on invalid input

**Screenshot Location**: Save as `test8-hex-validation.png`

---

### Test 9: Bidirectional Sync

**Test Steps:**
1. Set color using hue wheel
2. Observe hex input updates
3. Set color using hex input
4. Observe picker updates
5. Set color using inner circle
6. Observe hex input updates

**Verify:**
- [ ] Picker → Hex sync is immediate
- [ ] Hex → Picker sync is immediate
- [ ] No circular update loops
- [ ] Values always match across all UI elements
- [ ] No rounding errors accumulate

**Screenshot Location**: Save as `test9-bidirectional-sync.png`

---

### Test 10: Multiple Pickers (Primary + Accent)

**Test Steps:**
1. Expand both color pickers
2. Interact with primary color picker
3. Interact with accent color picker
4. Verify independence

**Verify:**
- [ ] Both pickers render correctly
- [ ] Changing one doesn't affect the other
- [ ] Both maintain separate state
- [ ] No performance degradation
- [ ] Scroll works with both expanded
- [ ] Layout doesn't break

**Screenshot Location**: Save as `test10-multiple-pickers.png`

---

### Test 11: Save Functionality

**Test Steps:**
1. Change primary color to #FF5733
2. Change accent color to #28A745
3. Click "Save Changes" button
4. Wait for success message
5. Reload extension panel
6. Verify colors persist

**Verify:**
- [ ] "Save Changes" button appears when colors change
- [ ] Success message displays after save
- [ ] Colors persist after reload
- [ ] chrome.storage.local contains correct values
- [ ] No console errors during save

**Screenshot Locations**:
- `test11a-unsaved-changes.png`
- `test11b-save-success.png`
- `test11c-after-reload.png`

---

### Test 12: Discard Functionality

**Test Steps:**
1. Note current colors
2. Change primary color
3. Change accent color
4. Click "Discard" button
5. Observe colors revert

**Verify:**
- [ ] "Discard" button appears with "Save Changes"
- [ ] Colors revert to original values immediately
- [ ] Hex inputs update
- [ ] Color previews update
- [ ] Pickers update (if expanded)
- [ ] No persistence occurs

**Screenshot Location**: Save as `test12-discard.png`

---

### Test 13: Responsive Behavior

**Test Steps:**
1. Resize panel to minimum width (360px)
2. Resize to narrow width (380px)
3. Resize to default width (400px)
4. Resize to wide width (500px)

**Verify at Each Width:**
- [ ] Layout adapts appropriately
- [ ] No text overflow
- [ ] Color square remains visible
- [ ] Hex input doesn't break
- [ ] Picker scales or repositions correctly
- [ ] Padding adjusts for compact mode

**Screenshot Locations**:
- `test13a-width-360.png`
- `test13b-width-380.png`
- `test13c-width-400.png`
- `test13d-width-500.png`

---

### Test 14: Elite Gate

**Test Steps:**
1. Set user tier to 'free'
2. Navigate to Design Customization
3. Observe locked state
4. Set user tier to 'elite'
5. Observe unlocked state

**Verify:**
- [ ] Free tier shows lock icon
- [ ] Free tier shows "Elite Feature" message
- [ ] Free tier shows upgrade button
- [ ] Elite tier shows color pickers
- [ ] Elite tier shows crown icon
- [ ] Upgrade button triggers alert (or actual flow)

**Screenshot Locations**:
- `test14a-locked-free.png`
- `test14b-unlocked-elite.png`

---

### Test 15: Collapse/Expand Toggle

**Test Steps:**
1. Click color square to expand picker
2. Click color square again to collapse
3. Repeat several times
4. Test clicking outside picker
5. Test rapid clicking

**Verify:**
- [ ] Picker expands on first click
- [ ] Picker collapses on second click
- [ ] Toggle is consistent and reliable
- [ ] No animation glitches
- [ ] State persists during interaction
- [ ] Clicking inside picker doesn't collapse it

**Screenshot Location**: Save as `test15-toggle.png`

---

### Test 16: Edge Cases

**Test Cases:**

1. **Pure Black (#000000)**
   - Verify: H=any, S=0%, B=0%
   - Screenshot: `test16a-black.png`

2. **Pure White (#FFFFFF)**
   - Verify: H=any, S=0%, B=100%
   - Screenshot: `test16b-white.png`

3. **Pure Red (#FF0000)**
   - Verify: H=0°, S=100%, B=100%
   - Screenshot: `test16c-red.png`

4. **Gray (#808080)**
   - Verify: H=any, S=0%, B=50%
   - Screenshot: `test16d-gray.png`

5. **Very Dark Color (#010101)**
   - Verify: Indicators still visible
   - Screenshot: `test16e-very-dark.png`

6. **Very Bright Color (#FEFEFE)**
   - Verify: Indicators still visible
   - Screenshot: `test16f-very-bright.png`

---

### Test 17: Performance Stress Test

**Test Steps:**
1. Expand both pickers
2. Rapidly drag hue wheel back and forth (10 seconds)
3. Monitor CPU usage
4. Monitor frame rate
5. Check for memory leaks

**Verify:**
- [ ] Frame rate stays above 30fps (ideally 60fps)
- [ ] CPU usage remains reasonable (< 50% on mid-range CPU)
- [ ] No memory leaks after extended use
- [ ] No console warnings about performance
- [ ] UI remains responsive

**Metrics to Record:**
- Average FPS: _______
- Peak CPU: _______
- Memory after 1 min: _______
- Memory after 5 min: _______

---

### Test 18: Browser Console

**Test Steps:**
1. Open DevTools console
2. Perform all basic interactions
3. Monitor for errors/warnings

**Verify:**
- [ ] No errors in console
- [ ] No warnings about deprecated APIs
- [ ] No React key warnings
- [ ] No state update warnings
- [ ] No performance warnings

**Screenshot Location**: Save as `test18-console-clean.png`

---

### Test 19: Accessibility (Basic)

**Note**: Full accessibility testing requires screen reader, keyboard nav implementation

**Current Test:**
1. Tab through settings panel
2. Observe focus states
3. Check color contrast

**Verify:**
- [ ] Color square has visible focus state
- [ ] Hex input has visible focus state
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Interactive elements have clear visual feedback

**Screenshot Location**: Save as `test19-focus-states.png`

---

### Test 20: Integration Test (End-to-End)

**Scenario**: Complete color customization workflow

**Test Steps:**
1. Start with default colors
2. Open Design Customization section
3. Expand primary color picker
4. Select new primary color (#FF5733)
5. Collapse primary picker
6. Expand accent color picker
7. Select new accent color (#28A745)
8. Collapse accent picker
9. Adjust frosted glass intensity slider
10. Click "Save Changes"
11. Wait for success message
12. Reload extension
13. Verify all changes persisted
14. Navigate to different tab
15. Return to settings
16. Verify changes still visible

**Verify:**
- [ ] Complete workflow works without errors
- [ ] All UI updates correctly
- [ ] Persistence works across reloads
- [ ] Persistence works across navigation
- [ ] No data loss occurs
- [ ] Performance remains good throughout

**Screenshot Locations**:
- `test20a-start.png`
- `test20b-mid-workflow.png`
- `test20c-saved.png`
- `test20d-after-reload.png`

---

## Bug Report Template

If you find issues during testing, use this template:

```markdown
### Bug Report #XXX

**Title**: Brief description

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Screenshots**:
Attach relevant screenshots

**Environment**:
- Chrome Version:
- OS:
- Extension Version:
- Panel Width:

**Console Output**:
```
Paste any errors or warnings
```

**Additional Notes**:
Any other relevant information
```

---

## Test Results Summary

### Test Session Information
- Date: __________
- Tester: __________
- Browser: Chrome __________
- OS: __________
- Extension Version: __________

### Pass/Fail Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Initial Render | ☐ Pass ☐ Fail | |
| 2 | Hover States | ☐ Pass ☐ Fail | |
| 3 | Expanded State | ☐ Pass ☐ Fail | |
| 4 | Hue Click | ☐ Pass ☐ Fail | |
| 5 | Hue Drag | ☐ Pass ☐ Fail | |
| 6 | Inner Click | ☐ Pass ☐ Fail | |
| 7 | Inner Drag | ☐ Pass ☐ Fail | |
| 8 | Hex Validation | ☐ Pass ☐ Fail | |
| 9 | Bidirectional Sync | ☐ Pass ☐ Fail | |
| 10 | Multiple Pickers | ☐ Pass ☐ Fail | |
| 11 | Save Functionality | ☐ Pass ☐ Fail | |
| 12 | Discard Functionality | ☐ Pass ☐ Fail | |
| 13 | Responsive Behavior | ☐ Pass ☐ Fail | |
| 14 | Elite Gate | ☐ Pass ☐ Fail | |
| 15 | Collapse/Expand | ☐ Pass ☐ Fail | |
| 16 | Edge Cases | ☐ Pass ☐ Fail | |
| 17 | Performance | ☐ Pass ☐ Fail | |
| 18 | Console | ☐ Pass ☐ Fail | |
| 19 | Accessibility | ☐ Pass ☐ Fail | |
| 20 | End-to-End | ☐ Pass ☐ Fail | |

### Overall Results
- Tests Passed: ____ / 20
- Tests Failed: ____ / 20
- Pass Rate: _____%

### Critical Issues Found
1.
2.
3.

### Recommendation
☐ Approved for production
☐ Requires fixes before deployment
☐ Requires additional testing

### Tester Signature: _________________ Date: _________

---

## Automated Testing (Future Enhancement)

### Unit Tests (Jest)
```typescript
describe('CircularColorPicker', () => {
  test('converts hex to HSB correctly', () => {
    const result = hexToHSB('#0077B5');
    expect(result).toEqual({ h: 203, s: 100, b: 71 });
  });

  test('converts HSB to hex correctly', () => {
    const result = hsbToHex(203, 100, 71);
    expect(result).toBe('#005bb5');
  });

  test('handles invalid hex gracefully', () => {
    const result = hexToHSB('invalid');
    expect(result).toEqual({ h: 0, s: 0, b: 0 });
  });
});
```

### Integration Tests (React Testing Library)
```typescript
describe('CircularColorPicker Integration', () => {
  test('renders collapsed by default', () => {
    const { queryByRole } = render(<CircularColorPicker {...props} />);
    expect(queryByRole('slider')).not.toBeInTheDocument();
  });

  test('expands when preview clicked', () => {
    const { getByRole } = render(<CircularColorPicker {...props} />);
    fireEvent.click(getByRole('button'));
    expect(getByRole('slider')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright/Puppeteer)
```typescript
test('complete color selection workflow', async ({ page }) => {
  await page.goto('chrome-extension://...');
  await page.click('[data-testid="color-preview"]');
  await page.click('[data-testid="hue-wheel"]', { position: { x: 100, y: 50 } });
  const hexValue = await page.inputValue('[data-testid="hex-input"]');
  expect(hexValue).toMatch(/^#[0-9A-F]{6}$/);
});
```

---

**Testing Guide Version**: 1.0.0
**Last Updated**: 2025-11-20
**Status**: Ready for QA
