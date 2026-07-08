import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

content = content.replace(
  `const dbPlayersMap = new Map(((allPlayers as any[]) || []).map((p: any) => [p.name, p.id]));`,
  `const dbPlayersMap = new Map(((allPlayers as any[]) || []).map((p: any) => [p?.name, p?.id]));`
);

content = content.replace(
  `const existingFixturesSet = new Set(((existingFixtures as any[]) || []).map((f: any) => \`\${f.player1_id}-\${f.player2_id}\`));`,
  `const existingFixturesSet = new Set(((existingFixtures as any[]) || []).map((f: any) => \`\${f?.player1_id}-\${f?.player2_id}\`));`
);

content = content.replace(
  `const existingResultsSet = new Set(((existingResults as any[]) || []).map((r: any) => r.fixture_id));`,
  `const existingResultsSet = new Set(((existingResults as any[]) || []).map((r: any) => r?.fixture_id));`
);

fs.writeFileSync('src/pages/admin/Import.tsx', content);
