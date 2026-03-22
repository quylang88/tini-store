const fs = require('fs');

const fileContent = fs.readFileSync('src/components/common/CustomCalendar.jsx', 'utf8');

if (fileContent.includes('const MONTH_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];') &&
    fileContent.includes('MONTH_INDICES.map((m) => (') &&
    !fileContent.includes('Array.from({ length: 12 }') &&
    fileContent.includes('const startYear = viewDate.getFullYear() - 50;') &&
    fileContent.includes('const years = new Array(101);') &&
    fileContent.includes('for (let i = 0; i < 101; i++) {') &&
    fileContent.includes('years[i] = startYear + i;') &&
    !fileContent.includes('Array.from({ length: 101 }')) {
    console.log("Verification passed: CustomCalendar optimizations are present and correct.");
} else {
    console.error("Verification failed: CustomCalendar optimizations are not correct.");
    process.exit(1);
}
