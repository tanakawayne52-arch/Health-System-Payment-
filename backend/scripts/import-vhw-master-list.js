import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import csvParser from 'csv-parser';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const csvPath = path.resolve(repoRoot, 'CVS FILES', 'Master_List...VHM1.csv');

dotenv.config({ path: path.resolve(repoRoot, 'backend', '.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_NAME = process.env.DB_NAME || 'fepms_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';

const provinceMap = {
  'MASH  CENTRAL': 'MASHONALAND CENTRAL',
  'MASH CENTRAL': 'MASHONALAND CENTRAL',
  'MASH EAST': 'MASHONALAND EAST',
  'MASH WEST': 'MASHONALAND WEST',
  'MAT NORTH': 'MATABELELAND NORTH',
  'MAT SOUTH': 'MATABELELAND SOUTH',
  'HARARE': 'HARARE',
  'BULAWAYO': 'BULAWAYO',
  'MANICALAND': 'MANICALAND',
  'MASVINGO': 'MASVINGO',
  'MIDLANDS': 'MIDLANDS',
};

const districtMap = {
  'UMP': 'UZUMBA MARAMBA PFUNGWE',
  'MBERENGWA': 'MBERENGWA',
  'KWEKWE': 'KWEKWE',
  'GWERU': 'GWERU',
  'BINGA': 'BINGA',
  'BULILIMA': 'BULILIMA',
  'CHIVI': 'CHIVI',
  'CHIPINGE': 'CHIPINGE',
  'CHIRUMANZU': 'CHIRUMANZU',
  'GOKWE NORTH': 'GOKWE NORTH',
  'GOKWE SOUTH': 'GOKWE SOUTH',
  'GWANDA': 'GWANDA',
  'HARARE': 'HARARE',
  'HWANGE': 'HWANGE',
  'LUPANE': 'LUPANE',
  'MASH EAST': 'MASHONALAND EAST',
  'MASH WEST': 'MASHONALAND WEST',
};

function normalizeProvince(value) {
  if (!value) return value;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, ' ');
  return provinceMap[normalized] ?? normalized;
}

function normalizeDistrict(value) {
  if (!value) return value;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, ' ');
  return districtMap[normalized] ?? normalized;
}

function parseBoolean(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim();
  if (normalized === '1' || normalized.toLowerCase() === 'true') return 1;
  if (normalized === '0' || normalized.toLowerCase() === 'false') return 0;
  return null;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

async function main() {
  const args = process.argv.slice(2);
  const truncate = args.includes('--truncate');
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(arg.split('=')[1]) : undefined;

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    multipleStatements: true,
  });

  if (truncate) {
    console.log('Truncating existing vhw_master_list rows...');
    await connection.execute('DELETE FROM vhw_master_list');
    await connection.execute('ALTER TABLE vhw_master_list AUTO_INCREMENT = 1');
  }

  const headers = await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(csvPath, { encoding: 'utf8' })
      .pipe(csvParser({ renameHeaders: (header) => {
        // Strip BOM from first header if present
        return header.replace(/^\ufeff/, '');
      }}))
      .on('headers', (headerRow) => {
        stream.destroy();
        resolve(headerRow);
      })
      .on('error', reject);
  });

  const fieldMap = {
    'PROVINCE': 'province',
    '∩╗┐PROVINCE': 'province',  // Handle BOM-prefixed header
    'DISTRICT': 'district',
    'HEALTH CENTRE': 'health_centre',
    'VILLAGE': 'village',
    'WARD': 'ward',
    'FIRST NAME': 'first_name',
    'LAST NAME': 'last_name',
    'ID NUMBER': 'id_number',
    'DOBreformat': 'dob_reformat',
    'SEX': 'sex',
    'PHONE NUMBER': 'phone_number',
    'Active Q1': 'active_q1',
    'Active Q2': 'active_q2',
    'Active Q3': 'active_q3',
    'Active Q4': 'active_q4',
    'Payment Q1': 'payment_q1',
    'Payment Q2': 'payment_q2',
    'Payment Q3': 'payment_q3',
    'Payment Q4': 'payment_q4',
    'Payment Amt Q1Q2': 'payment_amt_q1_q2',
    'Payment Category': 'payment_category',
    'Payment Difference': 'payment_difference',
    'Duplicate Records': 'duplicate_records',
    'Duplicate Status': 'duplicate_status',
    'date4calc': 'date4_calc',
    'Age': 'age',
    'HEALTHCHECK': 'health_check',
    'IDCHECK': 'id_check',
    'AGECHECK': 'age_check',
    'SEXCHECK': 'sex_check',
    'PHONECHECK': 'phone_check',
    'VILLAGECHECK': 'village_check',
    'WARDCHECK': 'ward_check',
    'DATAQUALITY': 'data_quality',
    'INDEX': 'index_column',
  };

  const insertColumns = [
    'id',
    'province',
    'district',
    'health_centre',
    'village',
    'ward',
    'first_name',
    'last_name',
    'id_number',
    'dob_reformat',
    'sex',
    'phone_number',
    'active_q1',
    'active_q2',
    'active_q3',
    'active_q4',
    'payment_q1',
    'payment_q2',
    'payment_q3',
    'payment_q4',
    'payment_amt_q1_q2',
    'payment_category',
    'payment_difference',
    'duplicate_records',
    'duplicate_status',
    'date4_calc',
    'age',
    'health_check',
    'id_check',
    'age_check',
    'sex_check',
    'phone_check',
    'village_check',
    'ward_check',
    'data_quality',
    'index_column',
    'created_at',
    'updated_at',
  ];

  const rows = [];
  let counter = 0;
  let imported = 0;
  let errors = 0;

  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (row) => {
        counter += 1;
        if (limit && imported >= limit) return;

        const mapped = {};
        
        // Build a dynamic field map from the actual row keys
        const dynamicFieldMap = {};
        for (const rowKey of Object.keys(row)) {
          const cleanKey = rowKey.replace(/^[^\w]/, ''); // Remove any non-word char at start
          if (fieldMap[rowKey]) {
            dynamicFieldMap[rowKey] = fieldMap[rowKey];
          } else if (fieldMap[cleanKey]) {
            dynamicFieldMap[rowKey] = fieldMap[cleanKey];
          }
        }
        
        for (const [rowKey, dbKey] of Object.entries(dynamicFieldMap)) {
          const rawValue = row[rowKey];
          
          if (dbKey === 'province') {
            mapped[dbKey] = normalizeProvince(rawValue);
          } else if (dbKey === 'district') {
            mapped[dbKey] = normalizeDistrict(rawValue);
          } else if (dbKey.startsWith('active_') || dbKey.startsWith('payment_')) {
            mapped[dbKey] = parseBoolean(rawValue);
          } else if (dbKey === 'payment_amt_q1_q2' || dbKey === 'payment_difference' || dbKey === 'age') {
            mapped[dbKey] = parseNumber(rawValue);
          } else {
            mapped[dbKey] = normalizeText(rawValue);
          }
        }

        if (counter === 1) {
          console.log('Mapped province:', mapped.province);
          console.log('Mapped district:', mapped.district);
          console.log('Mapped first_name:', mapped.first_name);
          console.log('Mapped last_name:', mapped.last_name);
        }

        if (!mapped.province || !mapped.district || !mapped.first_name || !mapped.last_name) {
          errors += 1;
          return;
        }

        const id = `vhw_${counter.toString().padStart(6, '0')}`;
        const values = [
          id,
          mapped.province,
          mapped.district,
          mapped.health_centre,
          mapped.village,
          mapped.ward,
          mapped.first_name,
          mapped.last_name,
          mapped.id_number,
          mapped.dob_reformat,
          mapped.sex,
          mapped.phone_number,
          mapped.active_q1,
          mapped.active_q2,
          mapped.active_q3,
          mapped.active_q4,
          mapped.payment_q1,
          mapped.payment_q2,
          mapped.payment_q3,
          mapped.payment_q4,
          mapped.payment_amt_q1_q2,
          mapped.payment_category,
          mapped.payment_difference,
          mapped.duplicate_records,
          mapped.duplicate_status,
          mapped.date4_calc,
          mapped.age,
          mapped.health_check,
          mapped.id_check,
          mapped.age_check,
          mapped.sex_check,
          mapped.phone_check,
          mapped.village_check,
          mapped.ward_check,
          mapped.data_quality,
          mapped.index_column,
          new Date(),
          new Date(),
        ];

        rows.push(values);
        imported += 1;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${counter} rows; ${imported} ready for import; ${errors} skipped due to missing required fields.`);

  if (rows.length === 0) {
    console.log('No rows to insert.');
    await connection.end();
    process.exit(0);
  }

  // Insert in batches to avoid packet size issues
  const batchSize = 100;
  let inserted = 0;
  
  console.log(`Inserting ${rows.length} rows in batches of ${batchSize}...`);
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const placeholders = batch.map(() => '(' + insertColumns.map(() => '?').join(', ') + ')').join(', ');
    const query = `INSERT INTO vhw_master_list (${insertColumns.join(', ')}) VALUES ${placeholders}`;
    const flatValues = batch.flat();
    
    await connection.execute(query, flatValues);
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length} rows...`);
  }
  
  console.log(`Successfully inserted ${rows.length} rows.`);
  await connection.end();
}

main().catch((error) => {
  console.error('Failed to import VHW master list:', error);
  process.exit(1);
});
