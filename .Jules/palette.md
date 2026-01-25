## 2026-01-25 - Framer Motion Touch Action
**Learning:** To allow both drag-to-dismiss and native content scrolling in a `SheetModal`, enable `drag="y"` on the parent but set `className="touch-pan-y"` (or `style={{ touchAction: "pan-y" }}`). This tells the browser to handle vertical scrolling first (consuming the event), while allowing Framer Motion to pick up the gesture when scrolling is not possible (e.g., at boundaries or on non-scrollable areas).
**Action:** Always combine `drag="y"` with `touch-pan-y` and `overscroll-behavior: contain` for scrollable bottom sheets.
