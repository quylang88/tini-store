## 2026-01-25 - Framer Motion Drag vs Scroll
**Learning:** Applying `drag="y"` to a container with scrollable children breaks touch scrolling on mobile because the drag gesture captures the pointer events.
**Action:** Use `dragListener={false}` on the container and attach `useDragControls` to a specific drag handle element (and add `touch-none` to the handle).
