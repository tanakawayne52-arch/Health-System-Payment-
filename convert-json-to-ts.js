
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'frontend', 'src', 'data', 'vhw-masterlist.json');
const tsPath = path.join(__dirname, 'frontend', 'src', 'data', 'vhw-masterlist.ts');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const tsContent = `
export const vhwMasterList = ${JSON.stringify(data, null, 2)} as const;
`;

fs.writeFileSync(tsPath, tsContent.trim(), 'utf8');

console.log('✅ Successfully converted to TypeScript!');
