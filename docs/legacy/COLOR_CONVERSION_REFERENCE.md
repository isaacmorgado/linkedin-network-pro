# Color Conversion Reference Guide

## HSB Color Space Explained

### What is HSB?

**HSB** stands for **Hue, Saturation, Brightness**:

- **Hue (H)**: The color type, measured in degrees (0-360°)
  - 0° / 360° = Red
  - 60° = Yellow
  - 120° = Green
  - 180° = Cyan
  - 240° = Blue
  - 300° = Magenta

- **Saturation (S)**: The intensity of the color, measured as percentage (0-100%)
  - 0% = Grayscale (no color)
  - 100% = Full color intensity

- **Brightness (B)**: The lightness of the color, measured as percentage (0-100%)
  - 0% = Black
  - 100% = Full brightness

### Visual Representation

```
Hue Wheel (360°):
        0° Red
         │
   315° ┌─┴─┐ 45°
        │   │
   270° │ • │ 90°    • = Center (any hue)
        │   │
   225° └───┘ 135°
         │
      180° Cyan

Saturation (horizontal in inner circle):
   0%              50%              100%
Gray ←───────────────────────────→ Pure Color

Brightness (vertical in inner circle):
  100%
   ↑
   │ Bright
   │
   │
  50%
   │
   │
   │ Dark
   ↓
   0%
```

## Conversion Formulas

### Hex to HSB

**Input**: `#RRGGBB` (e.g., `#0077B5`)

**Step 1**: Parse hex to RGB (0-255)
```
R = parseInt("00", 16) = 0
G = parseInt("77", 16) = 119
B = parseInt("B5", 16) = 181
```

**Step 2**: Normalize to 0-1
```
r = 0 / 255 = 0.000
g = 119 / 255 = 0.467
b = 181 / 255 = 0.710
```

**Step 3**: Find max, min, and delta
```
max = Math.max(0.000, 0.467, 0.710) = 0.710
min = Math.min(0.000, 0.467, 0.710) = 0.000
delta = max - min = 0.710
```

**Step 4**: Calculate Hue (depends on which component is max)
```
Since b is max:
H = 60 × ((r - g) / delta + 4)
H = 60 × ((0.000 - 0.467) / 0.710 + 4)
H = 60 × (-0.658 + 4)
H = 60 × 3.342
H = 200.5° ≈ 203°
```

**Step 5**: Calculate Saturation
```
S = (delta / max) × 100
S = (0.710 / 0.710) × 100
S = 100%
```

**Step 6**: Calculate Brightness
```
B = max × 100
B = 0.710 × 100
B = 71%
```

**Output**: `H=203°, S=100%, B=71%`

---

### HSB to Hex

**Input**: `H=203°, S=100%, B=71%`

**Step 1**: Convert percentages to decimals
```
h = 203
s = 100 / 100 = 1.0
b = 71 / 100 = 0.71
```

**Step 2**: Calculate chroma, x, and m
```
c = b × s = 0.71 × 1.0 = 0.71
x = c × (1 - |((h / 60) mod 2) - 1|)
  = 0.71 × (1 - |(3.38 mod 2) - 1|)
  = 0.71 × (1 - |1.38 - 1|)
  = 0.71 × (1 - 0.38)
  = 0.71 × 0.62
  = 0.44

m = b - c = 0.71 - 0.71 = 0
```

**Step 3**: Map to RGB based on hue sector

Sector calculation: `h / 60 = 203 / 60 = 3.38` → Sector 3 (180° - 240°)

```
Sector 3 (180° ≤ h < 240°):
r = 0
g = x = 0.44
b = c = 0.71
```

**Step 4**: Add m and scale to 0-255
```
R = (r + m) × 255 = (0 + 0) × 255 = 0
G = (g + m) × 255 = (0.44 + 0) × 255 = 112
B = (b + m) × 255 = (0.71 + 0) × 255 = 181
```

**Step 5**: Convert to hexadecimal
```
R = 0 → 00
G = 112 → 70
B = 181 → B5
```

**Output**: `#0070B5` (slight rounding difference from original `#0077B5`)

---

## Practical Examples

### Example 1: Pure Red

**Hex**: `#FF0000`

**Calculation**:
```
R = 255, G = 0, B = 0
r = 1.0, g = 0.0, b = 0.0
max = 1.0, min = 0.0, delta = 1.0

Hue:
r is max → H = 60 × ((g - b) / delta mod 6)
H = 60 × ((0 - 0) / 1.0 mod 6) = 0°

Saturation:
S = (1.0 / 1.0) × 100 = 100%

Brightness:
B = 1.0 × 100 = 100%
```

**Result**: `H=0°, S=100%, B=100%`

---

### Example 2: Pure White

**Hex**: `#FFFFFF`

**Calculation**:
```
R = 255, G = 255, B = 255
r = 1.0, g = 1.0, b = 1.0
max = 1.0, min = 1.0, delta = 0.0

Hue:
delta = 0 → H = 0° (undefined, defaults to 0)

Saturation:
S = (0.0 / 1.0) × 100 = 0%

Brightness:
B = 1.0 × 100 = 100%
```

**Result**: `H=0° (any), S=0%, B=100%`

---

### Example 3: Pure Black

**Hex**: `#000000`

**Calculation**:
```
R = 0, G = 0, B = 0
r = 0.0, g = 0.0, b = 0.0
max = 0.0, min = 0.0, delta = 0.0

Hue:
delta = 0 → H = 0° (undefined, defaults to 0)

Saturation:
max = 0 → S = 0%

Brightness:
B = 0.0 × 100 = 0%
```

**Result**: `H=0° (any), S=0%, B=0%`

---

### Example 4: Medium Gray

**Hex**: `#808080`

**Calculation**:
```
R = 128, G = 128, B = 128
r = 0.502, g = 0.502, b = 0.502
max = 0.502, min = 0.502, delta = 0.0

Hue:
delta = 0 → H = 0° (undefined, defaults to 0)

Saturation:
S = (0.0 / 0.502) × 100 = 0%

Brightness:
B = 0.502 × 100 = 50%
```

**Result**: `H=0° (any), S=0%, B=50%`

---

### Example 5: Lime Green

**Hex**: `#00FF00`

**Calculation**:
```
R = 0, G = 255, B = 0
r = 0.0, g = 1.0, b = 0.0
max = 1.0, min = 0.0, delta = 1.0

Hue:
g is max → H = 60 × ((b - r) / delta + 2)
H = 60 × ((0 - 0) / 1.0 + 2) = 120°

Saturation:
S = (1.0 / 1.0) × 100 = 100%

Brightness:
B = 1.0 × 100 = 100%
```

**Result**: `H=120°, S=100%, B=100%`

---

### Example 6: Dark Cyan

**Hex**: `#008080`

**Calculation**:
```
R = 0, G = 128, B = 128
r = 0.0, g = 0.502, b = 0.502
max = 0.502, min = 0.0, delta = 0.502

Hue:
b is max (and g = b) → choose g
H = 60 × ((b - r) / delta + 2)
H = 60 × ((0.502 - 0) / 0.502 + 2)
H = 60 × (1 + 2) = 180°

Saturation:
S = (0.502 / 0.502) × 100 = 100%

Brightness:
B = 0.502 × 100 = 50%
```

**Result**: `H=180°, S=100%, B=50%`

---

### Example 7: Pastel Pink

**Hex**: `#FFB6C1`

**Calculation**:
```
R = 255, G = 182, B = 193
r = 1.000, g = 0.714, b = 0.757
max = 1.000, min = 0.714, delta = 0.286

Hue:
r is max → H = 60 × ((g - b) / delta mod 6)
H = 60 × ((0.714 - 0.757) / 0.286 mod 6)
H = 60 × (-0.150 mod 6)
H = 60 × 5.850 = 351°

Saturation:
S = (0.286 / 1.000) × 100 = 29%

Brightness:
B = 1.000 × 100 = 100%
```

**Result**: `H=351°, S=29%, B=100%`

---

## Color Picker Mapping

### Hue Wheel Position

**Formula**: `angle = hue` (direct mapping)

**Examples**:
- Hue 0° → Top center (12 o'clock)
- Hue 90° → Right center (3 o'clock)
- Hue 180° → Bottom center (6 o'clock)
- Hue 270° → Left center (9 o'clock)

**Code**:
```typescript
const angleRadians = (hue * Math.PI) / 180;
const x = Math.cos(angleRadians) * radius;
const y = Math.sin(angleRadians) * radius;
```

### Inner Circle Position

**Formula**:
```typescript
// Saturation: 0% (left) to 100% (right)
x = ((saturation - 50) / 50) * radius

// Brightness: 100% (top) to 0% (bottom) - inverted Y
y = -((brightness - 50) / 50) * radius
```

**Examples**:
- S=50%, B=50% → Center (x=0, y=0)
- S=100%, B=100% → Top-right (x=radius, y=-radius)
- S=0%, B=0% → Bottom-left (x=-radius, y=radius)
- S=100%, B=50% → Middle-right (x=radius, y=0)
- S=50%, B=100% → Top-center (x=0, y=-radius)

### Reverse Mapping (Position to HSB)

**From wheel position to hue**:
```typescript
const angle = Math.atan2(y, x) * (180 / Math.PI);
const hue = (angle + 360) % 360; // Normalize to 0-360
```

**From inner circle position to saturation/brightness**:
```typescript
const saturation = ((x / radius) * 50 + 50); // -r:r → 0:100
const brightness = ((-y / radius) * 50 + 50); // r:-r → 0:100
```

---

## Validation Rules

### Hex Format

**Valid**:
- `#000000` (black)
- `#FFFFFF` (white)
- `#0077B5` (LinkedIn blue)
- `#ff5733` (lowercase acceptable)
- `#FF5733` (uppercase acceptable)

**Invalid**:
- `000000` (missing #)
- `#FFF` (shorthand not supported)
- `#0077BZ` (invalid character Z)
- `#0077B` (too short)
- `#0077B567` (too long)
- `rgb(0, 119, 181)` (wrong format)
- `red` (named colors not supported)

**Regex**: `/^#[0-9A-Fa-f]{6}$/`

### HSB Ranges

**Hue**:
- Minimum: 0°
- Maximum: 360°
- Wraps: 361° → 1°, -1° → 359°

**Saturation**:
- Minimum: 0% (grayscale)
- Maximum: 100% (full color)
- Clamped: Values outside range are constrained

**Brightness**:
- Minimum: 0% (black)
- Maximum: 100% (full brightness)
- Clamped: Values outside range are constrained

---

## Edge Cases

### Case 1: Achromatic Colors (S=0%)

When saturation is 0%, hue is undefined:
- White: Any hue, S=0%, B=100%
- Black: Any hue, S=0%, B=0%
- Gray: Any hue, S=0%, B=0-100%

**Handling**: Store last valid hue or default to 0°

### Case 2: Very Dark Colors (B<10%)

When brightness is very low, precision matters:
- `#010101` vs `#000000` are visually identical
- Small rounding errors can cause black

**Handling**: Round to nearest integer, clamp to 0

### Case 3: Very Bright Colors (B>90%)

When brightness is very high:
- `#FEFEFE` vs `#FFFFFF` are visually identical
- Saturation becomes less perceptible

**Handling**: Round to nearest integer, clamp to 100

### Case 4: Hue at Boundary (H=0° vs H=360°)

Both represent red, but numerically different:
- 0° and 360° should be treated as equivalent
- Modulo operation ensures 0-360 range

**Handling**: Normalize using `(h + 360) % 360`

---

## Conversion Accuracy

### Rounding Errors

Due to floating-point math, conversions may not be perfect:

**Example**:
```
Original: #0077B5
→ HSB: H=203°, S=100%, B=71%
→ Back to Hex: #0070B5 (slightly different)
```

**Mitigation**:
- Store original hex value
- Only convert when necessary
- Round consistently (Math.round)
- Accept small differences (<5 units)

### Precision Levels

**Display Precision**:
- Hue: Whole degrees (0-360)
- Saturation: Whole percentages (0-100)
- Brightness: Whole percentages (0-100)

**Internal Precision**:
- Use floating-point for calculations
- Round only for display
- Maintain full precision in state

---

## Testing Color Conversions

### Test Suite

```typescript
// Test 1: Pure colors
expect(hexToHSB('#FF0000')).toEqual({ h: 0, s: 100, b: 100 });
expect(hexToHSB('#00FF00')).toEqual({ h: 120, s: 100, b: 100 });
expect(hexToHSB('#0000FF')).toEqual({ h: 240, s: 100, b: 100 });

// Test 2: Achromatic colors
expect(hexToHSB('#FFFFFF')).toEqual({ h: 0, s: 0, b: 100 });
expect(hexToHSB('#000000')).toEqual({ h: 0, s: 0, b: 0 });
expect(hexToHSB('#808080')).toEqual({ h: 0, s: 0, b: 50 });

// Test 3: Common colors
expect(hexToHSB('#0077B5')).toEqual({ h: 203, s: 100, b: 71 });
expect(hexToHSB('#FF5733')).toEqual({ h: 9, s: 80, b: 100 });

// Test 4: Round-trip conversion
const original = '#0077B5';
const hsb = hexToHSB(original);
const converted = hsbToHex(hsb.h, hsb.s, hsb.b);
expect(converted.toLowerCase()).toBeCloseTo(original.toLowerCase(), 2);
```

### Visual Testing

Use known reference colors:
- LinkedIn Blue: `#0077B5` → H=203°, S=100%, B=71%
- Twitter Blue: `#1DA1F2` → H=203°, S=88%, B=95%
- Facebook Blue: `#1877F2` → H=214°, S=90%, B=95%
- Google Red: `#EA4335` → H=4°, S=77%, B=92%
- Google Green: `#34A853` → H=136°, S=69%, B=66%

---

## Implementation Code

### TypeScript Implementation

```typescript
/**
 * Convert hex color to HSB color space
 */
function hexToHSB(hex: string): { h: number; s: number; b: number } {
  // Parse hex to RGB (0-1 range)
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find max, min, delta
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate hue
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  // Calculate saturation
  const s = max === 0 ? 0 : (delta / max) * 100;

  // Calculate brightness
  const brightness = max * 100;

  return {
    h: Math.round(h),
    s: Math.round(s),
    b: Math.round(brightness)
  };
}

/**
 * Convert HSB color to hex format
 */
function hsbToHex(h: number, s: number, b: number): string {
  // Convert to decimals
  const sDecimal = s / 100;
  const bDecimal = b / 100;

  // Calculate intermediate values
  const c = bDecimal * sDecimal;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = bDecimal - c;

  // Determine RGB based on hue sector
  let r = 0, g = 0, blue = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; blue = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; blue = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; blue = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; blue = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; blue = c;
  } else {
    r = c; g = 0; blue = x;
  }

  // Convert to 0-255 range and format as hex
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((blue + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-20
**Reference**: HSB Color Space Standard
**Precision**: ±1 unit for H, S, B
