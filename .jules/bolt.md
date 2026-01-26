## 2026-01-26 - [Intl Performance & Locale Consistency]
**Learning:** The application intentionally mixes locales (`en-US` for numbers, `vi-VN` for currency/dates). While `toLocaleString("vi-VN")` is performant in modern V8 (Node 22), relying on system locale (via `toLocaleString()` without args) caused inconsistency. Caching `Intl` instances provides a 2.5x speedup for currency formatting and ensures consistent UX.
**Action:** When formatting numbers/dates in render loops (like lists), always use cached `Intl` instances from `formatUtils.js` instead of inline `.toLocaleString()`.
