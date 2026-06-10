const fs = require('fs');
const ts = require('./node_modules/typescript');
const source = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');
const sf = ts.createSourceFile('src/pages/ReportsPage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = sf.parseDiagnostics.map(d => ({ start: d.start, length: d.length, line: source.slice(0, d.start).split('\n').length, col: d.start - source.lastIndexOf('\n', d.start - 1)}));
console.log(JSON.stringify(diagnostics, null, 2));
