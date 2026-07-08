const fs = require('fs');
let content = fs.readFileSync('src/components/admin/PlayerManagement.tsx', 'utf-8');
content = content.replace(
  "avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),",
  "avatar: z.string().optional(),"
);
fs.writeFileSync('src/components/admin/PlayerManagement.tsx', content);
