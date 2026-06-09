import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Master List JSON file
const masterListPath = path.join(__dirname, 'excel-output', 'Master_List_array.json');
const masterListData = JSON.parse(fs.readFileSync(masterListPath, 'utf8'));

// Convert data to TypeScript
const headers = masterListData[0];
const records = masterListData.slice(1).map(row => {
  return {
    province: row[0] || '',
    district: row[1] || '',
    healthCentre: row[2] || '',
    village: row[3] || '',
    ward: row[4] || '',
    firstName: row[5] || '',
    lastName: row[6] || '',
    idNumber: row[7] || '',
    dobReformat: row[8] || '',
    sex: row[9] || '',
    phoneNumber: row[10]?.toString() || '',
    activeQ1: row[11] ?? null,
    activeQ2: row[12] ?? null,
    activeQ3: row[13] ?? null,
    activeQ4: row[14] ?? null,
    paymentQ1: row[15] ?? null,
    paymentQ2: row[16] ?? null,
    paymentQ3: row[17] ?? null,
    paymentQ4: row[18] ?? null,
    paymentAmtQ1Q2: row[19] ?? null,
    paymentCategory: row[20] || '',
    paymentDifference: row[21] ?? 0,
    duplicateRecords: row[22] ?? 0,
    duplicateStatus: row[23] || '',
    date4Calc: row[24] || '',
    age: row[25] ?? null,
    healthCheck: row[26] ?? null,
    idCheck: row[27] ?? null,
    ageCheck: row[28] ?? null,
    sexCheck: row[29] ?? null,
    phoneCheck: row[30] ?? null,
    villageCheck: row[31] ?? null,
    wardCheck: row[32] ?? null,
    dataQuality: row[33] || '',
    index: row[34] || '',
  };
});

// Write to TypeScript file
const outputPath = path.join(__dirname, 'src', 'data', 'vhw-masterlist.ts');
const tsContent = `import type { VhwRecord } from '../types/vhw';

export const vhwMasterList: VhwRecord[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent);
console.log('Converted data to:', outputPath);
