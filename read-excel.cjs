const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'Copy of VHWML MasterList Dashboard_2025_Q3_Payments (6).xlsm');
const outputDir = path.join(process.cwd(), 'excel-output');

console.log('Reading Excel file from:', filePath);

try {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const workbook = xlsx.readFile(filePath);
  
  console.log('\nWorksheet names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\nProcessing Sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Save as JSON with header: 1 (array of arrays)
    const dataArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const arrayOutputPath = path.join(outputDir, `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_array.json`);
    fs.writeFileSync(arrayOutputPath, JSON.stringify(dataArray, null, 2));
    console.log(`  Saved array format to: ${arrayOutputPath}`);
    
    // Save as JSON with header: 'A' (object with keys from first row)
    try {
      const dataObject = xlsx.utils.sheet_to_json(worksheet, { header: 'A' });
      const objectOutputPath = path.join(outputDir, `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_object.json`);
      fs.writeFileSync(objectOutputPath, JSON.stringify(dataObject, null, 2));
      console.log(`  Saved object format to: ${objectOutputPath}`);
    } catch (err) {
      console.log(`  Could not save object format:`, err.message);
    }
  });

  console.log('\nAll sheets processed successfully!');
} catch (error) {
  console.error('Error reading Excel file:', error);
  console.error('Stack:', error.stack);
}
