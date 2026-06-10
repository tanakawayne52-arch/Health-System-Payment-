const fs = require('fs');
const ts = require('./node_modules/typescript');
const src = fs.readFileSync('src/pages/ReportsPage.tsx','utf8');
const start = src.indexOf("{activeTab === 'summary' && (");
const end = src.indexOf('{/* Beneficiary Report */}');
console.log('start', start, 'end', end);
const modified = src.slice(0, start) + "{activeTab === 'summary' && (<div />)}\n" + src.slice(end);
const sf = ts.createSourceFile('ReportsPage.tsx', modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log('diagnostics', sf.parseDiagnostics.map(d => ({ line: modified.slice(0, d.start).split('\n').length, msg: ts.flattenDiagnosticMessageText(d.messageText, '\n') })));
