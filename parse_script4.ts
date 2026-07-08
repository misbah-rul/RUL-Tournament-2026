import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

content = content.replace(
  /const errorCount = previewSummary\.fixtures\.filter\(f => f\.isMissingPlayer \|\| f\.hasInvalidValues \|\| f\.isMissingDate\)\.length;/,
  `const errorCount = previewSummary.validationErrors?.length || 0;`
);

fs.writeFileSync('src/pages/admin/Import.tsx', content);
