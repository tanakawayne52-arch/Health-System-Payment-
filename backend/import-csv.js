
import mysql from 'mysql2/promise';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database config
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'fepms_db',
  multipleStatements: true
};

async function importCsvToDb(filePath, tableName, mapRow) {
  const connection = await mysql.createConnection(dbConfig);
  console.log(`Importing ${filePath} into ${tableName}...`);
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const mapped = mapRow(row);
          const keys = Object.keys(mapped);
          const values = Object.values(mapped);
          const placeholders = keys.map(() => '?').join(',');
          const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`;
          await connection.execute(sql, values);
        }
        console.log(`Successfully imported ${results.length} rows into ${tableName}`);
      } catch (err) {
        console.error(`Error importing ${filePath}:`, err);
      } finally {
        await connection.end();
      }
    });
}

async function main() {
  // Import VHW Master List
  const csvFilesPath = path.join(__dirname, '../CVS FILES');
  const masterListFile = path.join(csvFilesPath, 'Master_List...VHM1.csv');
  
  await importCsvToDb(masterListFile, 'vhw_master_list', (row) => ({
    id: row.INDEX || `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    province: row.PROVINCE,
    district: row.DISTRICT,
    health_centre: row['HEALTH CENTRE'],
    village: row.VILLAGE,
    ward: row.WARD,
    first_name: row['FIRST NAME'],
    last_name: row['LAST NAME'],
    id_number: row['ID NUMBER'],
    dob_reformat: row.DOBreformat,
    sex: row.SEX,
    phone_number: row['PHONE NUMBER'],
    active_q1: row['Active Q1'] ? parseInt(row['Active Q1']) : null,
    active_q2: row['Active Q2'] ? parseInt(row['Active Q2']) : null,
    active_q3: row['Active Q3'] ? parseInt(row['Active Q3']) : null,
    active_q4: row['Active Q4'] ? parseInt(row['Active Q4']) : null,
    payment_q1: row['Payment Q1'] ? parseInt(row['Payment Q1']) : null,
    payment_q2: row['Payment Q2'] ? parseInt(row['Payment Q2']) : null,
    payment_q3: row['Payment Q3'] ? parseInt(row['Payment Q3']) : null,
    payment_q4: row['Payment Q4'] ? parseInt(row['Payment Q4']) : null,
    payment_amt_q1_q2: row['Payment Amt Q1Q2'] ? parseFloat(row['Payment Amt Q1Q2']) : null,
    payment_category: row['Payment Category'],
    payment_difference: row['Payment Difference'] ? parseFloat(row['Payment Difference']) : null,
    duplicate_records: row['Duplicate Records'] ? parseInt(row['Duplicate Records']) : null,
    duplicate_status: row['Duplicate Status'],
    date4_calc: row.date4calc,
    age: row.AGE ? parseInt(row.AGE) : null,
    health_check: row.HEALTHCHECK,
    id_check: row.IDCHECK,
    age_check: row.AGECHECK,
    sex_check: row.SEXCHECK,
    phone_check: row.PHONECHECK,
    village_check: row.VILLAGECHECK,
    ward_check: row.WARDCHECK,
    data_quality: row.DATAQUALITY,
    index_column: row.INDEX
  }));
}

main().catch(console.error);
