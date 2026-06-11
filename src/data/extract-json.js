import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the TypeScript file
const filePath = path.join(__dirname, 'vhw-masterlist.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract JSON array
const startIdx = content.indexOf('[');
const endIdx = content.lastIndexOf(']') + 1;
const jsonContent = content.substring(startIdx, endIdx);

// Write JSON file
const outputPath = path.join(__dirname, 'vhw-masterlist.json');
fs.writeFileSync(outputPath, jsonContent);

console.log('✓ JSON file created successfully at:', path.relative(process.cwd(), outputPath));
console.log(`✓ File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
