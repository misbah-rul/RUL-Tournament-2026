import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

content = content.replace(
  `const existingNames = new Set((existingPlayers || []).map(p => p.name));`,
  `const existingNames = new Set(((existingPlayers as any[]) || []).map(p => p.name));`
);

content = content.replace(
  `const dbPlayersMap = new Map((allPlayers || []).map(p => [p.name, p.id]));`,
  `const dbPlayersMap = new Map(((allPlayers as any[]) || []).map(p => [p.name, p.id]));`
);

content = content.replace(
  `const existingFixturesSet = new Set((existingFixtures || []).map(f => \`\${f.player1_id}-\${f.player2_id}\`));`,
  `const existingFixturesSet = new Set(((existingFixtures as any[]) || []).map(f => \`\${f.player1_id}-\${f.player2_id}\`));`
);

content = content.replace(
  `const existingResultsSet = new Set((existingResults || []).map(r => r.fixture_id));`,
  `const existingResultsSet = new Set(((existingResults as any[]) || []).map(r => r.fixture_id));`
);


fs.writeFileSync('src/pages/admin/Import.tsx', content);
