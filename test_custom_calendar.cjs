const fs = require('fs');

const content = fs.readFileSync('src/components/common/CustomCalendar.jsx', 'utf8');

if (content.includes('Array.from')) {
    console.error('Test Failed: Array.from is still present in CustomCalendar.jsx');
    process.exit(1);
}

if (!content.includes('new Array(101)')) {
    console.error('Test Failed: new Array(101) is not present in CustomCalendar.jsx');
    process.exit(1);
}

if (!content.includes('const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]')) {
    console.error('Test Failed: MONTHS array is not present in CustomCalendar.jsx');
    process.exit(1);
}

console.log('Test Passed: CustomCalendar.jsx uses for loops and static array correctly.');
