const { performance } = require('perf_hooks');

function testArrayFrom() {
  const viewDate = new Date();
  const start = performance.now();
  let sum = 0;
  for (let iter = 0; iter < 100000; iter++) {
    const rangeYears = Array.from({ length: 101 }, (_, i) => viewDate.getFullYear() - 50 + i);
    sum += rangeYears[0];
  }
  const end = performance.now();
  console.log(`Array.from: ${end - start} ms`);
}

function testForLoop() {
  const viewDate = new Date();
  const start = performance.now();
  let sum = 0;
  for (let iter = 0; iter < 100000; iter++) {
    const currentYear = viewDate.getFullYear();
    const rangeYears = new Array(101);
    for (let i = 0; i < 101; i++) {
      rangeYears[i] = currentYear - 50 + i;
    }
    sum += rangeYears[0];
  }
  const end = performance.now();
  console.log(`For loop: ${end - start} ms`);
}

testArrayFrom();
testForLoop();
