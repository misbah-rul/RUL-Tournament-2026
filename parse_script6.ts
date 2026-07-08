import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Dashboard.tsx', 'utf8');

// Import AdminStandingsSync
content = content.replace(
  `import { ResultManagement } from "@/components/admin/ResultManagement";`,
  `import { ResultManagement } from "@/components/admin/ResultManagement";\nimport { AdminStandingsSync } from "@/components/admin/AdminStandingsSync";`
);

// Add to grid
content = content.replace(
  `<h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Quick Actions</h2>`,
  `<h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Quick Actions</h2>
            
            <div className="mb-6 max-w-sm">
              <AdminStandingsSync />
            </div>`
);

fs.writeFileSync('src/pages/admin/Dashboard.tsx', content);
