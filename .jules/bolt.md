## 2024-05-23 - Data Normalization on Hot Path
**Learning:** `normalizePurchaseLots` runs for every product on app load. It was re-allocating full object trees even for clean data, causing unnecessary GC pressure during startup.
**Action:** For normalization/sanitization functions on hot paths, always implement a "dirty check" to return the original object reference if no changes are required.
