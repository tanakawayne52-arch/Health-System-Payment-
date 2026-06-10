const fs = require('fs');
const ts = require('./node_modules/typescript');
const content = fs.readFileSync('src/pages/ReportsPage.tsx','utf8');
for (let offset = 12000; offset <= content.length; offset += 200) {
  const slice = content.slice(0, offset);
  const sf = ts.createSourceFile('ReportsPage.tsx', slice, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diags = sf.parseDiagnostics;
  if (diags.length) {
    console.log('break at offset', offset, 'line', slice.slice(0,diags[0].start).split('\n').length, 'msg', ts.flattenDiagnosticMessageText(diags[0].messageText,'\n'));
    console.log(slice.slice(diags[0].start-20, diags[0].start+20));
    process.exit(0);
  }
}
console.log('no diagnostics up to full file length?');
