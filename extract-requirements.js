const fs = require('fs');
const path = require('path');
const { ZipFile } = require('yazl');

// Using built-in approach to extract DOCX
function extractDocxText(filePath) {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(filePath);
    const xmlEntry = zip.getEntry('word/document.xml');
    if (xmlEntry) {
      const xmlData = zip.readAsText(xmlEntry);
      // Extract text between <w:t> tags
      const textMatches = xmlData.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      const text = textMatches.map(m => m.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join(' ');
      return text;
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
  }
  return '';
}

const docxFiles = [
  'C:\\Users\\MOHCC\\Desktop\\MoHCC Systems\\Health-System-Payment--main\\backend\\data\\SYSTEM REQUIREMENTS DOCUMENT for VHW APP.docx',
  'C:\\Users\\MOHCC\\Desktop\\MoHCC Systems\\Health-System-Payment--main\\backend\\data\\SYSTEM REQUIREMENT DOCUMENT 11052026.docx',
  'C:\\Users\\MOHCC\\Desktop\\MoHCC Systems\\Health-System-Payment--main\\backend\\data\\Front-End Payment Management System (FEPMS) Final.docx'
];

console.log('Attempting to extract DOCX files...\n');

docxFiles.forEach(file => {
  console.log(`\n=== ${path.basename(file)} ===\n`);
  if (fs.existsSync(file)) {
    const text = extractDocxText(file);
    console.log(text.substring(0, 2000)); // First 2000 chars
    console.log('...\n[Content continues]\n');
  } else {
    console.log('File not found\n');
  }
});
