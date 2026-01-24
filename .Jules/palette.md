## 2024-05-22 - SPA Navigation Accessibility
**Learning:** Custom "Tab Bars" in SPAs often function as main navigation but lack semantic structure. React developers frequently use `<div>` containers which strip context for screen readers.
**Action:** Always wrap bottom navigation in `<nav aria-label="Main">` and use `aria-current="page"` on the active button to clearly communicate location, rather than relying on visual cues alone.

## 2024-05-22 - Color Contrast in Light Themes
**Learning:** Standard "inactive" colors (like Amber-500) often fail contrast ratios on light backgrounds (Amber-50), making navigation hard to read for low-vision users (2:1 ratio).
**Action:** Verify contrast ratios for inactive states specifically. Darker shades (Amber-700) are often necessary to hit the 4.5:1 WCAG AA standard while maintaining the color family hue.
