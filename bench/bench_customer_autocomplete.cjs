const { performance } = require('perf_hooks');

// Dummy normalizeString function to mimic the real one
const normalizeString = (str) => {
  if (!str) return "";
  return str.toLowerCase().trim();
};

const value = "john";
const normalizedValue = normalizeString(value);

const generateCustomers = (count) => {
  const customers = [];
  for (let i = 0; i < count; i++) {
    customers.push({
      id: i,
      name: i % 10 === 0 ? `John Doe ${i}` : `Jane Doe ${i}`,
    });
  }
  return customers;
};

const customers = generateCustomers(100000);

// Original approach
const testOriginal = () => {
  const start = performance.now();
  let suggestions = [];
  for (let i = 0; i < 100; i++) {
    suggestions =
      value && value.trim().length > 0
        ? customers
            .filter((c) =>
              normalizeString(c.name).includes(normalizedValue),
            )
            .slice(0, 3)
        : [];
  }
  const end = performance.now();
  return { time: end - start, suggestions };
};

// Optimized approach
const testOptimized = () => {
  const start = performance.now();
  let suggestions = [];
  for (let i = 0; i < 100; i++) {
    suggestions = [];
    if (value && value.trim().length > 0) {
      for (const c of customers) {
        if (normalizeString(c.name).includes(normalizedValue)) {
          suggestions.push(c);
          if (suggestions.length === 3) break;
        }
      }
    }
  }
  const end = performance.now();
  return { time: end - start, suggestions };
};

const resOrig = testOriginal();
const resOpt = testOptimized();

console.log(`Original time: ${resOrig.time.toFixed(2)}ms`);
console.log(`Optimized time: ${resOpt.time.toFixed(2)}ms`);
console.log(`Speedup: ${(resOrig.time / resOpt.time).toFixed(2)}x`);

// correctness check
const origIds = resOrig.suggestions.map(s => s.id).join(',');
const optIds = resOpt.suggestions.map(s => s.id).join(',');
console.log(`Correctness match: ${origIds === optIds}`);
