const { performance } = require('perf_hooks');

function testArrayFrom(length, offset) {
  return Array.from({ length }, (_, i) => offset + i);
}

function testForLoop(length, offset) {
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = offset + i;
  }
  return result;
}

const ITERATIONS = 100000;
const LENGTH = 101;
const OFFSET = 1974; // e.g. 2024 - 50

// Warmup
for (let i = 0; i < 1000; i++) {
  testArrayFrom(LENGTH, OFFSET);
  testForLoop(LENGTH, OFFSET);
}

const startArrayFrom = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testArrayFrom(LENGTH, OFFSET);
}
const endArrayFrom = performance.now();

const startForLoop = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testForLoop(LENGTH, OFFSET);
}
const endForLoop = performance.now();

console.log(`Array.from: ${(endArrayFrom - startArrayFrom).toFixed(2)} ms`);
console.log(`For loop: ${(endForLoop - startForLoop).toFixed(2)} ms`);
console.log(`Difference: ${((endArrayFrom - startArrayFrom) / (endForLoop - startForLoop)).toFixed(2)}x faster`);

const startArrayFrom12 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testArrayFrom(12, 0);
}
const endArrayFrom12 = performance.now();

const startForLoop12 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  testForLoop(12, 0);
}
const endForLoop12 = performance.now();

console.log(`\nLength 12:`);
console.log(`Array.from: ${(endArrayFrom12 - startArrayFrom12).toFixed(2)} ms`);
console.log(`For loop: ${(endForLoop12 - startForLoop12).toFixed(2)} ms`);
console.log(`Difference: ${((endArrayFrom12 - startArrayFrom12) / (endForLoop12 - startForLoop12)).toFixed(2)}x faster`);
