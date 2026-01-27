# Palette's Journal

## 2024-05-22 - iOS PWA Native Feel
**Learning:** iOS Safari delays `:active` CSS states by ~300ms unless `ontouchstart` is present on the body or element.
**Action:** Always add `ontouchstart=""` to `<body>` in PWAs to make buttons feel instant and "native-like".

## 2024-05-22 - iOS Numeric Keypad
**Learning:** The iOS numeric keypad (`inputMode="numeric"`) lacks a "Return" or "Done" key, often trapping the user.
**Action:** Always add `enterKeyHint="done"` to numeric inputs to provide a way to dismiss the keyboard.
