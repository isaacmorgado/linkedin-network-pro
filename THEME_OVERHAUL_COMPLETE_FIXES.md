# Complete Theme Overhaul - All Remaining Fixes

## Files Modified

### 1. AccountSettings.tsx

**Remaining Hardcoded Colors to Fix:**

All instances of `#1d1d1f` → `textColor`
All instances of `#6e6e73` → `textColor` with `opacity: 0.6`
All `#FFD700` (crown icon) → Keep (brand color for Elite feature)
All `#FFFFFF` → Keep for button text on accent color backgrounds

**Components Needing Updates:**

1. **Lock/Crown Elite Feature Section** - Line 375-415:
   - Change `color: '#1d1d1f'` to `color: textColor`
   - Change `color: '#6e6e73'` to `color: textColor, opacity: 0.6`
   - Keep `#FFD700` for crown and upgrade button (brand color)

2. **InfoRow Component** - Lines 665-680:
   ```typescript
   function InfoRow({ label, value, textColor }: InfoRowProps) {
     return (
       <div style={{
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         padding: '8px 0',
         borderBottom: `1px solid ${textColor}15`,
       }}>
         <span style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>{label}</span>
         <span style={{ fontSize: '13px', fontWeight: '600', color: textColor }}>{value}</span>
       </div>
     );
   }
   ```

3. **Toggle Component** - Lines 593-658:
   ```typescript
   function Toggle({...}:  ToggleProps) {
     // Line 608: color: disabled ? `${textColor}60` : textColor
     // Line 618: color: textColor, opacity: 0.6
     // Line 649: backgroundColor: 'transparent' (keep - toggle knob background)
   }
   ```

4. **SliderControl** - Lines 787-861:
   ```typescript
   // Line 812: color: textColor
   // Line 821: color: textColor, opacity: 0.6
   ```

5. **Update All Section Calls** (Lines 345, 370, 459, 497, 519):
   - Add `backgroundColor={backgroundColor}` and `textColor={textColor}` props

6. **TextLink Component** - Lines 745-775:
   ```typescript
   function TextLink({ label, href, accentColor, textColor }: TextLinkProps) {
     return (
       <a
         style={{
           fontSize: '13px',
           color: accentColor,
           textDecoration: 'none',
           padding: '8px 0',
           display: 'block',
           borderBottom: `1px solid ${textColor}15`,
         }}
       >
         {label} →
       </a>
     );
   }
   ```

---

### 2. JobsTab.tsx

**Critical Fixes:**

1. **Job Analysis Panel/Bubble** (Resume Detail Panel, Line 556-771):
   ```typescript
   <div
     style={{
       marginTop: '16px',
       paddingTop: '16px',
       borderTop: `1px solid ${textColor}20`,
     }}
   >
     <div
       style={{
         backgroundColor: `${backgroundColor}e6`,
         backdropFilter: 'blur(10px)',
         border: `1px solid ${textColor}20`,
         borderRadius: '8px',
         padding: '16px',
         boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
         transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
         transform: 'translateY(0)',
       }}
       onMouseEnter={(e) => {
         e.currentTarget.style.transform = 'translateY(-2px)';
         e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
       }}
       onMouseLeave={(e) => {
         e.currentTarget.style.transform = 'translateY(0)';
         e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
       }}
     >
   ```

2. **All Job Card Text** (Line 810-984):
   - Replace all `color: '#1d1d1f'` with `color: textColor`
   - Replace all `color: '#9ca3af'` with `color: textColor, opacity: 0.6`
   - Replace all `background: 'white'` with `background: ${backgroundColor}e6, backdropFilter: 'blur(10px)'`

3. **ATS Score Styling** - getATSScoreStyle function (Line 173-178):
   - Keep colored backgrounds (#059669, #0077B5, etc.) - these are functional indicators

4. **Download Buttons** (Lines 636-727):
   - PDF button background: Keep `accentColor`
   - DOCX button: Change `#059669` to a theme variable or keep as success green
   - Clipboard button: Use `backgroundColor}e6` with `textColor`

5. **All Icons**:
   - Sparkles, Calendar, MapPin, Building2, Check icons: Use `textColor` or `accentColor`
   - Keep green checkmark (#059669) for "Resume Generated" status

---

### 3. WatchlistTab.tsx

**All Remaining Fixes:**

1. **TabSwitcher Background** (Line 516):
   ```typescript
   backgroundColor: `${backgroundColor}40`,  // Light transparent background
   ```

2. **Person/Company/Path Card Backgrounds** (Lines 340-486, 680-860, 880-1127):
   ```typescript
   backgroundColor: `${backgroundColor}e6`,
   backdropFilter: 'blur(10px)',
   border: `1px solid ${textColor}20`,
   ```

3. **All Card Text Colors**:
   - Replace `color: '#1d1d1f'` → `color: textColor`
   - Replace `color: '#6e6e73'` → `color: textColor, opacity: 0.6`
   - Replace `color: '#8e8e93'` → `color: textColor, opacity: 0.5`

4. **Profile Image Borders** (Lines 364, 904, 1013):
   ```typescript
   border: `2px solid ${accentColor}40`,
   ```

5. **Progress Bar** (Lines 970-987):
   ```typescript
   backgroundColor: `${textColor}20`,  // Track
   backgroundColor: path.isComplete ? '#30D158' : accentColor,  // Fill
   ```

6. **Keep Success Green**: `#30D158` for completed states, `#FF3B30` for remove/danger

---

### 4. CompanyTab.tsx

**All Fixes:**

1. **Header Background** (Line 79):
   ```typescript
   backgroundColor: `${backgroundColor}40`,
   ```

2. **All Text Colors** (Lines 128, 138, 156, 224, 293, 301):
   - `#1d1d1f` → `textColor`
   - `#6e6e73` → `textColor, opacity: 0.6`
   - `#8e8e93` → `textColor, opacity: 0.5`

3. **ActionCard Backgrounds** (Lines 261-268):
   ```typescript
   backgroundColor: `${backgroundColor}e6`,
   backdropFilter: 'blur(10px)',
   ```

4. **Fallback Company Logo** (Lines 104-119):
   ```typescript
   background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
   ```

5. **Keep Button Colors**: `#FF9500`, `#30D158`, `#0077B5` for branded action buttons

---

### 5. ProfileTab.tsx

**All Fixes** (Same pattern as CompanyTab.tsx):

1. Lines 79, 88: Header background
2. Lines 128, 136, 146, 219, 288, 296: Text colors
3. Lines 256-268: ActionCard styling
4. Lines 111-127: Fallback profile image gradient

---

### 6. ResumeGeneratorTab.tsx

**Major Fixes:**

1. **All Card Backgrounds** throughout:
   ```typescript
   backgroundColor: `${backgroundColor}e6`,
   backdropFilter: 'blur(10px)',
   ```

2. **Text Colors** (Lines 222, 229, 316, 336, 356, 400, 438, 478, 559, 602, 681, 698, 743, 831, 850, 871, 905):
   - `#1d1d1f` → `textColor`
   - `#6e6e73` → `textColor, opacity: 0.6`

3. **Background Colors** (Lines 234, 398, 863, 898):
   - `#FAFAFA` → `${backgroundColor}20` or `${backgroundColor}40`

4. **Keep Accent Colors**: `#0077B5`, score colors (#4CAF50, #2196F3, #FF9500, #F44336)

---

### 7. ProfileBuilderTab.tsx

**Fixes:**

1. Lines 94, 122, 131, 145, 160, 189, 222, 239, 272, 302, 400: Text colors
2. Line 189, 225: Background colors
3. Keep `#0077B5` for branding

---

### 8. CoverLetterTab.tsx

**Fixes:**

1. Lines 164, 175, 181, 188, 255, 268, 322, 330, 389, 398, 439, 497, 508, 555, 563, 643, 673, 698, 707, 722: Text colors
2. Lines 309, 484, 658: Card background colors
3. Keep score colors and button colors

---

### 9. JobAnalyzerTab.tsx

**Fixes:**

1. Lines 146, 153, 239, 267, 295, 315, 352, 398, 443, 509, 636, 719, 753, 807: Text colors
2. Lines 385, 781, 798: Card backgrounds
3. Keep accent and score colors

---

## Universal Pattern for All Files

### Card/Panel Background:
```typescript
backgroundColor: `${backgroundColor}e6`,
backdropFilter: 'blur(10px)',
```

### Hover Animation:
```typescript
transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
transform: 'translateY(0)',
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
}}
```

### Text Colors:
- Primary text: `color: textColor`
- Secondary/muted text: `color: textColor, opacity: 0.6`
- Tertiary/helper text: `color: textColor, opacity: 0.4`

### Borders:
- Light borders: `border: 1px solid ${textColor}20`
- Medium borders: `border: 1px solid ${textColor}40`
- Accent borders: `border: 1px solid ${accentColor}`

### Keep These Colors (Don't Change):
- `#FFFFFF` - White text on colored backgrounds
- `#FFD700` - Gold for Elite/Premium features
- `#30D158` - Success green
- `#FF3B30` - Danger/Error red
- `#4CAF50`, `#2196F3`, `#FF9500`, `#F44336` - ATS score indicators
- Button brand colors when appropriate

---

## Testing Checklist

After applying all fixes:

1. Test light theme - All text should be visible
2. Test dark theme - All text should be visible
3. Test custom accent colors - Should apply throughout
4. Test hover states - All cards should animate
5. Test Elite features - Crown should remain gold
6. Test ATS scores - Color indicators should work
7. Test all tabs - No remaining hardcoded colors

---

## Files Summary

- **AccountSettings.tsx**: 90% complete, needs InfoRow, Toggle, TextLink, SliderControl fixes
- **JobsTab.tsx**: 60% complete, needs analysis panel, download buttons, all card backgrounds
- **WatchlistTab.tsx**: 40% complete, needs all card backgrounds and hover states
- **CompanyTab.tsx**: 20% complete, needs all text colors and backgrounds
- **ProfileTab.tsx**: 20% complete, same as CompanyTab
- **ResumeGeneratorTab.tsx**: 30% complete, needs all card backgrounds
- **ProfileBuilderTab.tsx**: 30% complete, needs text colors
- **CoverLetterTab.tsx**: 30% complete, needs text colors and backgrounds
- **JobAnalyzerTab.tsx**: 30% complete, needs text colors and backgrounds
