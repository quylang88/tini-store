## 2026-01-26 - Avoid per-item scroll effects in lists
**Learning:** `ChatBubble` components had a `useEffect` triggering `scrollIntoView` on mount. In a long list (`MessageList`), this causes N redundant scroll calls and layout thrashing on initial load, fighting against the parent's `useAutoScroll`.
**Action:** When implementing scroll-to-bottom for chat or logs, handle it **once** at the container level (e.g., in the parent component or a dedicated hook like `useAutoScroll`) instead of inside individual list items.
