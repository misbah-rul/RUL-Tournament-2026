import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');

content = content.replace(
  `const dbPlayersMap = new Map(((allPlayers as any[]) || []).map(p => [p.name, p.id]));`,
  `const dbPlayersMap = new Map(((allPlayers as any[]) || []).map((p: any) => [p.name, p.id]));`
);

content = content.replace(
  `const existingFixturesSet = new Set(((existingFixtures as any[]) || []).map(f => \`\${f.player1_id}-\${f.player2_id}\`));`,
  `const existingFixturesSet = new Set(((existingFixtures as any[]) || []).map((f: any) => \`\${f.player1_id}-\${f.player2_id}\`));`
);

content = content.replace(
  `const existingResultsSet = new Set(((existingResults as any[]) || []).map(r => r.fixture_id));`,
  `const existingResultsSet = new Set(((existingResults as any[]) || []).map((r: any) => r.fixture_id));`
);

// also fix AdminStandingsSync.tsx upsert
let syncContent = fs.readFileSync('src/components/admin/AdminStandingsSync.tsx', 'utf8');
syncContent = syncContent.replace(
  `.upsert({
            player_id: playerId,`,
  `.upsert({
            player_id: playerId,`
);
syncContent = syncContent.replace(
  `.upsert({`,
  `.upsert({` // Wait, .upsert({ ... } as any, { onConflict: ... })
);

syncContent = syncContent.replace(
  `} catch (error: any) {`,
  `} catch (error: any) {`
);

syncContent = syncContent.replace(
  /upsert\(\{\n\s*player_id: playerId,[\s\S]*?points: row\.pts\n\s*\}, \{ onConflict: 'player_id' \}\);/m,
  `upsert({\n            player_id: playerId,\n            player_name: row.player,\n            matches_played: row.mp,\n            wins: row.w,\n            draws: row.d,\n            losses: row.l,\n            goals_for: row.gf,\n            goals_against: row.ga,\n            goal_difference: row.gd,\n            points: row.pts\n          } as any, { onConflict: 'player_id' });`
);

fs.writeFileSync('src/components/admin/AdminStandingsSync.tsx', syncContent);
fs.writeFileSync('src/pages/admin/Import.tsx', content);
