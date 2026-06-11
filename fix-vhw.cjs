const fs = require('fs');
const path = require('path');

const content = `import type { VhwRecord } from '../types/vhw';
import vhwData from './vhw-masterlist.json' assert { type: 'json' };

// Properly typed VHW master list imported from JSON
// This eliminates the union type complexity by using a JSON import
export const vhwMasterList: VhwRecord[] = vhwData;
`;

const filePath = path.resolve(__dirname, 'src', 'data', 'vhw-masterlist.ts');
fs.writeFileSync(filePath, content);
console.log('✓ File fixed successfully at:', filePath);
