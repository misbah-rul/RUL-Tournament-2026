const fs = require('fs');
let content = fs.readFileSync('src/components/admin/PlayerManagement.tsx', 'utf-8');
content = content.replace(
  ".update({ name: data.name, avatar: data.avatar || null } as any)",
  "// @ts-ignore\n          .update({ name: data.name, avatar: data.avatar || null })"
);
content = content.replace(
  ".insert([{ name: data.name, avatar: data.avatar || null } as any])",
  "// @ts-ignore\n          .insert([{ name: data.name, avatar: data.avatar || null }])"
);
fs.writeFileSync('src/components/admin/PlayerManagement.tsx', content);
