const { performance } = require('perf_hooks');

function testArrayFrom() {
  const start = performance.now();
  let sum = 0;
  for (let iter = 0; iter < 100000; iter++) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    sum += months[0];
  }
  const end = performance.now();
  console.log(`Array.from: ${end - start} ms`);
}

function testForLoop() {
  const start = performance.now();
  let sum = 0;
  for (let iter = 0; iter < 100000; iter++) {
    const months = new Array(12);
    for (let i = 0; i < 12; i++) {
      months[i] = i;
    }
    sum += months[0];
  }
  const end = performance.now();
  console.log(`For loop: ${end - start} ms`);
}

testArrayFrom();
testForLoop();
