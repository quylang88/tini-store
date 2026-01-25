## 2024-05-22 - Optimize Sort by Removing Date Instantiation
**Learning:** Instantiating `new Date()` inside a sort comparator or Schwartzian transform loop (even N times) is significantly slower than string comparison for ISO 8601 strings. For 10,000 items, `new Date()` approach took ~100ms vs ~2ms for string compare.
**Action:** When sorting by ISO date strings, compare strings directly instead of parsing to Date/Timestamp.
