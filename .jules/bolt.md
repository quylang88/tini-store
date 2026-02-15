## 2024-05-23 - Premature optimization check on normalizePurchaseLots
**Learning:** Initial profiling suggested `normalizePurchaseLots` (ran on every product load) might be slow due to eager map allocation. However, benchmarks showed 10,000 items processed in < 1ms. Modern JS engines optimize short-lived object allocation extremely well.
**Action:** Always verify "obvious" bottlenecks with micro-benchmarks before refactoring.
