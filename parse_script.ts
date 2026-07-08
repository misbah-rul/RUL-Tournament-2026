import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

// Update PreviewSummary interface
content = content.replace(
  `  validSheets: string[];\n  ignoredSheets: string[];\n}`,
  `  validSheets: string[];\n  ignoredSheets: string[];\n  validationErrors: { row: number, sheet: string, message: string }[];\n}`
);

// We need to update RECOGNIZED_SHEETS to include 'players' maybe?
content = content.replace(
  `  'fixtures',\n  'fixtures (2)',`,
  `  'fixtures',\n  'fixtures (2)',\n  'players',`
);

fs.writeFileSync('src/pages/admin/Import.tsx', content);
