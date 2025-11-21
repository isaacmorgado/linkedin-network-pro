#!/usr/bin/env python3
"""
Complete Theme Color Fix Script
Fixes ALL remaining hardcoded colors in the LinkedIn Network Pro extension
"""

import re
import os
from pathlib import Path

# Color mapping - what to replace
COLOR_REPLACEMENTS = [
    # Text colors
    (r"color:\s*['\"]#1d1d1f['\"]", "color: textColor"),
    (r"color:\s*['\"]#6e6e73['\"]", "color: textColor, opacity: 0.6"),
    (r"color:\s*['\"]#8e8e93['\"]", "color: textColor, opacity: 0.5"),
    (r"color:\s*['\"]#86868b['\"]", "color: textColor, opacity: 0.5"),

    # Backgrounds (cards, panels)
    (r"backgroundColor:\s*['\"]transparent['\"](?=.*borderRadius.*boxShadow)",
     "backgroundColor: `${backgroundColor}e6`, backdropFilter: 'blur(10px)'"),
    (r"backgroundColor:\s*['\"]white['\"]", "backgroundColor: `${backgroundColor}e6`, backdropFilter: 'blur(10px)'"),
    (r"backgroundColor:\s*['\"]#FFFFFF['\"]", "backgroundColor: `${backgroundColor}e6`, backdropFilter: 'blur(10px)'"),
    (r"backgroundColor:\s*['\"]#FAFAFA['\"]", "backgroundColor: `${backgroundColor}40`"),
    (r"backgroundColor:\s*['\"]#F5F5F7['\"]", "backgroundColor: `${backgroundColor}20`"),

    # Borders
    (r"border:\s*['\"]1px solid rgba\(0,\s*0,\s*0,\s*0\.08\)['\"]", "border: `1px solid ${textColor}20`"),
    (r"border:\s*['\"]1px solid rgba\(0,\s*0,\s*0,\s*0\.12\)['\"]", "border: `1px solid ${textColor}30`"),
    (r"borderBottom:\s*['\"]1px solid rgba\(0,\s*0,\s*0,\s*0\.08\)['\"]", "borderBottom: `1px solid ${textColor}20`"),
    (r"borderTop:\s*['\"]1px solid rgba\(0,\s*0,\s*0,\s*0\.08\)['\"]", "borderTop: `1px solid ${textColor}20`"),
    (r"borderLeft:\s*['\"]2px solid rgba\(0,\s*119,\s*181,\s*0\.2\)['\"]", "borderLeft: `2px solid ${accentColor}40`"),

    # LinkedIn blue (only in specific contexts - profile images, logos)
    (r"border:\s*['\"]2px solid rgba\(0,\s*119,\s*181,\s*0\.2\)['\"]", "border: `2px solid ${accentColor}40`"),
    (r"linear-gradient\(135deg,\s*#0077B5\s*0%,\s*#00A0DC\s*100%\)", "linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)"),
]

# Colors to KEEP (don't replace)
COLORS_TO_KEEP = [
    '#FFFFFF',  # White text on colored backgrounds
    '#FFD700',  # Gold for Elite features
    '#30D158',  # Success green
    '#FF3B30',  # Danger red
    '#4CAF50', '#059669',  # Success variants
    '#F44336', '#dc2626',  # Error variants
    '#2196F3', '#0077B5',  # Info blue (in scores)
    '#FF9500', '#ea580c',  # Warning orange (in scores)
    '#34C759',  # iOS green
]

def fix_file_colors(filepath):
    """Fix all hardcoded colors in a file"""
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Check if useTheme is imported
    if 'useTheme' not in content and 'textColor' not in content:
        print(f"  ⚠️  {filepath.name}: Missing useTheme import")
        return False

    # Apply replacements
    changes = 0
    for pattern, replacement in COLOR_REPLACEMENTS:
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            changes += len(matches)

    # Write back if changed
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓  {filepath.name}: Fixed {changes} color references")
        return True
    else:
        print(f"  →  {filepath.name}: No changes needed")
        return False

def add_hover_animations(filepath):
    """Add hover animations to card/panel components"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern: Find divs with borderRadius and boxShadow but no transition
    pattern = r'(<div[^>]*style={{[^}]*borderRadius:[^}]*boxShadow:[^}]*}})'

    def add_animation(match):
        div_content = match.group(1)
        if 'transition:' not in div_content:
            # Add transition and transform
            insert_pos = div_content.rfind('}}')
            new_div = div_content[:insert_pos] + ", transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)', transform: 'translateY(0)'" + div_content[insert_pos:]

            # Add hover handlers
            close_pos = new_div.find('>')
            hover_handlers = '''
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}'''
            return new_div[:close_pos] + hover_handlers + new_div[close_pos:]
        return div_content

    content = re.sub(pattern, add_animation, content)

    with open(filepath, 'w') as f:
        f.write(content)

def main():
    """Main execution"""
    print("🎨 Starting Complete Theme Color Fix...")
    print()

    # Get all Tab files
    tabs_dir = Path("src/components/tabs")
    tab_files = list(tabs_dir.glob("**/*Tab.tsx"))

    # Add AccountSettings
    settings_file = tabs_dir / "settings" / "AccountSettings.tsx"
    if settings_file.exists():
        tab_files.append(settings_file)

    print(f"Found {len(tab_files)} files to fix:")
    print()

    fixed_count = 0
    for filepath in sorted(tab_files):
        if fix_file_colors(filepath):
            fixed_count += 1

    print()
    print(f"✨ Fixed {fixed_count}/{len(tab_files)} files")
    print()
    print("🎨 Theme overhaul complete!")
    print()
    print("Next steps:")
    print("  1. Test in light mode")
    print("  2. Test in dark mode")
    print("  3. Test custom accent colors")
    print("  4. Verify all hover animations")

if __name__ == "__main__":
    main()
