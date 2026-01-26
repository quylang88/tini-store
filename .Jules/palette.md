## 2025-05-24 - Optimize ScrollableTabs for iPhone PWA
**Learning:** On iOS PWAs, horizontal scroll containers can trigger page-level rubber-banding or navigation gestures when scrolling hits the edge.
**Action:** Use `overscroll-behavior-x: contain` on horizontal scroll containers to isolate the scroll interaction and mimic native app behavior.
