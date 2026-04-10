
## 2024-05-24 - [Avoid chained array methods for dictionary iteration]
**Learning:** When iterating over dictionary-like objects (e.g., `cart` object mapped by ID) to filter and transform values into an array, chaining `Object.entries(obj).map().filter()` causes severe garbage collection pressure and intermediate array allocations. For React `useMemo` hooks, this overhead scales linearly with dictionary size.
**Action:** Default to using a standard `for...in` loop with `Object.prototype.hasOwnProperty.call()` and `.push()` to a pre-created array when transforming dictionaries into filtered lists, avoiding `.entries()`, `.map()`, and `.filter()` completely.
