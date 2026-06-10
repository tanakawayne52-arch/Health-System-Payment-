const fs = require('fs');
const ts = require('./node_modules/typescript');
const src = fs.readFileSync('src/pages/ReportsPage.tsx','utf8');
const start = src.indexOf("{activeTab === 'summary' && (");
const beneficiaryStart = src.indexOf('{/* Beneficiary Report */}');
const cardsStart = src.indexOf('<div className="grid grid-cols-1 sm:grid-cols-4 gap-5">', start);
const provinceChartStart = src.indexOf('<div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">', cardsStart + 1);
const duplicateRiskStart = src.indexOf('<div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">', provinceChartStart + 1);
const tableStart = src.indexOf('<div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">', duplicateRiskStart + 1);
const sections = [
  {name:'cards', start: cardsStart, end: provinceChartStart},
  {name:'provinceChart', start: provinceChartStart, end: duplicateRiskStart},
  {name:'duplicateRisk', start: duplicateRiskStart, end: tableStart},
  {name:'table', start: tableStart, end: beneficiaryStart},
];
for (const sec of sections) {
  const modified = src.slice(0, start) + src.slice(start, sec.start) + '<div />' + src.slice(sec.end, beneficiaryStart) + '\n' + src.slice(beneficiaryStart);
  const sf = ts.createSourceFile('ReportsPage.tsx', modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  console.log(sec.name, sf.parseDiagnostics.length, sf.parseDiagnostics.map(d => ({ line: modified.slice(0, d.start).split('\n').length, msg: ts.flattenDiagnosticMessageText(d.messageText, '\n') })));
}
