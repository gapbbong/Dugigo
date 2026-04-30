const fs = require('fs');
const content = fs.readFileSync('e:/1cl/Teachers.csv', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    const parts = line.split(',');
    if (parts.length > 5 && (parts[5] || parts[6])) {
        console.log(`Line ${i+1}: ${parts[1]} -> Sub Grade: ${parts[5]}, Sub Class: ${parts[6]}`);
    }
});
