const fs = require('fs');
const source = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');
const lines = source.split('\n');
for (let i = 248; i <= 262; i++) {
  if (i < lines.length) console.log(`${i+1}: ${lines[i]}`);
}
