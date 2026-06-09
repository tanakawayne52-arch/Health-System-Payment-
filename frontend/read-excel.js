import { readFile, utils } from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'Copy of VHWML MasterList Dashboard_2025_Q3_Payments (6).xlsm');

console.log('Reading Excel file from:', filePath);

try {
  const workbook = readFile(filePath);
  
  console.log('\nWorksheet names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet, { header: 1 });
    console.log('First 30 rows:', JSON.stringify(data.slice(0, 30), null, 2));
    if (data.length > 30) {
      console.log(`... and ${data.length - 30} more rows`);
    }
  });
} catch (error) {
  console.error('Error reading Excel file:', error);
  console.error('Stack:', error.stack);
}
