
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const results = [];
const csvPath = path.join(__dirname, '../CVS FILES/Master_List...VHM1.csv');

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (data) => {
    results.push({
      firstName: data['FIRST NAME'] || '',
      lastName: data['LAST NAME'] || '',
      idNumber: data['ID NUMBER'] || '',
      phoneNumber: data['PHONE NUMBER'] || '',
      province: data.PROVINCE || '',
      district: data.DISTRICT || '',
      healthCentre: data['HEALTH CENTRE'] || '',
      village: data.VILLAGE || '',
      ward: data.WARD || '',
      paymentCategory: data['Payment Category'] || '',
      dataQuality: data.DATAQUALITY || '',
      activeQ1: data['Active Q1'] ? parseInt(data['Active Q1']) : null,
      activeQ2: data['Active Q2'] ? parseInt(data['Active Q2']) : null,
      activeQ3: data['Active Q3'] ? parseInt(data['Active Q3']) : null,
      activeQ4: data['Active Q4'] ? parseInt(data['Active Q4']) : null,
      paymentQ1: data['Payment Q1'] ? parseInt(data['Payment Q1']) : null,
      paymentQ2: data['Payment Q2'] ? parseInt(data['Payment Q2']) : null,
      paymentQ3: data['Payment Q3'] ? parseInt(data['Payment Q3']) : null,
      paymentQ4: data['Payment Q4'] ? parseInt(data['Payment Q4']) : null,
      paymentAmtQ1Q2: data['Payment Amt Q1Q2'] ? parseFloat(data['Payment Amt Q1Q2']) : null,
      paymentDifference: data['Payment Difference'] ? parseFloat(data['Payment Difference']) : null,
      duplicateRecords: data['Duplicate Records'] ? parseInt(data['Duplicate Records']) : null,
      duplicateStatus: data['Duplicate Status'] || '',
      date4Calc: data.date4calc || '',
      age: data.AGE ? parseInt(data.AGE) : null,
      healthCheck: data.HEALTHCHECK || '',
      idCheck: data.IDCHECK || '',
      ageCheck: data.AGECHECK || '',
      sexCheck: data.SEXCHECK || '',
      phoneCheck: data.PHONECHECK || '',
      villageCheck: data.VILLAGECHECK || '',
      wardCheck: data.WARDCHECK || '',
      indexColumn: data.INDEX || ''
    });
  })
  .on('end', () => {
    const tsData = `
import { VhwRecord } from "../types/vhw";

export const vhwMasterList: VhwRecord[] = ${JSON.stringify(results, null, 2)};
`;
    fs.writeFileSync(
      path.join(__dirname, 'src/data/vhw-master-list.ts'),
      tsData,
      'utf8'
    );
    console.log('Successfully generated src/data/vhw-master-list.ts');
  });
