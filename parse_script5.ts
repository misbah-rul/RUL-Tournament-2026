import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

content = content.replace(
  /} catch \(err\)\n      toast\.error/,
  `} catch (err) {\n      toast.error`
);

fs.writeFileSync('src/pages/admin/Import.tsx', content);
