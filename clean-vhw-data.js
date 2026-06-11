
const fs = require('fs');
const path = require('path');

// Read the CSV
const csvPath = path.join(__dirname, 'CVS FILES', 'Master_List...VHM1.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

// Province normalization map
const provinceMap = {
  'BULAWAYO': 'Bulawayo',
  'HARARE': 'Harare',
  'MANICALAND': 'Manicaland',
  'MASH CENTRAL': 'Mashonaland Central',
  'MASHONALAND CENTRAL': 'Mashonaland Central',
  'MASH EAST': 'Mashonaland East',
  'MASHONALAND EAST': 'Mashonaland East',
  'MASH WEST': 'Mashonaland West',
  'MASHONALAND WEST': 'Mashonaland West',
  'MASVINGO': 'Masvingo',
  'MAT NORTH': 'Matabeleland North',
  'MATABELELAND NORTH': 'Matabeleland North',
  'MAT SOUTH': 'Matabeleland South',
  'MATABELELAND SOUTH': 'Matabeleland South',
  'MIDLANDS': 'Midlands',
  '.MASVINGO': 'Masvingo',
  'MANICALANA': 'Manicaland',
  'MANICA+L491+B492+P560': 'Manicaland',
  'MASVI GO': 'Masvingo',
  'MASVI': 'Masvingo',
  'MH': 'Manicaland'
};

// Parse CSV
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

const records = [];
for (let i = 1; i < lines.length; i++) {
  // Handle cases where fields might have commas (though not likely here)
  // For simplicity, just split by comma since data doesn't seem to have quoted fields
  const values = lines[i].split(',');
  if (values.length < headers.length) continue;
  
  const record = {};
  headers.forEach((header, idx) => {
    record[header.trim()] = values[idx]?.trim() || '';
  });

  // Normalize province
  const rawProvince = record['PROVINCE']?.toUpperCase();
  record['province'] = provinceMap[rawProvince] || rawProvince;
  
  // Clean up other fields
  record['district'] = record['DISTRICT']?.trim();
  record['healthCentre'] = record['HEALTH CENTRE']?.trim();
  record['village'] = record['VILLAGE']?.trim();
  record['ward'] = record['WARD']?.trim();
  record['firstName'] = record['FIRST NAME']?.trim();
  record['lastName'] = record['LAST NAME']?.trim();
  record['idNumber'] = record['ID NUMBER']?.trim();
  record['dob'] = record['DOBreformat']?.trim();
  record['sex'] = record['SEX']?.trim();
  record['phoneNumber'] = record['PHONE NUMBER']?.trim();
  record['paymentCategory'] = record['Payment Category']?.trim();
  record['dataQuality'] = record['DATAQUALITY']?.trim();
  record['age'] = record['Age'] ? parseInt(record['Age'], 10) : null;
  record['index'] = record['INDEX']?.trim();
  
  // Only keep records with valid province
  if (record['province'] && record['province'] !== '') {
    records.push(record);
  }
}

// Save to frontend data
const outputPath = path.join(__dirname, 'frontend', 'src', 'data', 'vhw-masterlist.json');
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf8');

console.log(`✅ Successfully cleaned ${records.length} VHW records!`);
console.log(`📁 Saved to ${outputPath}`);
