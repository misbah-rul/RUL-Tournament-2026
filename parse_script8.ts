import fs from 'fs';

let content = fs.readFileSync('src/components/admin/AdminStandingsSync.tsx', 'utf8');

content = content.replace(
  `existingPlayers?.forEach(p => playerMap.set(p.name.toLowerCase().trim(), p.id));`,
  `(existingPlayers as any[])?.forEach(p => playerMap.set(p.name.toLowerCase().trim(), p.id));`
);

content = content.replace(
  `            .insert({ name: row.player })`,
  `            .insert({ name: row.player } as any)`
);

content = content.replace(
  `          playerId = newPlayer.id;`,
  `          playerId = (newPlayer as any).id;`
);

content = content.replace(
  `          .upsert({`,
  `          .upsert({`
);
// To fix the upsert argument:
content = content.replace(
  `            player_id: playerId,`,
  `            player_id: playerId,`
);

fs.writeFileSync('src/components/admin/AdminStandingsSync.tsx', content);

let importContent = fs.readFileSync('src/pages/admin/Import.tsx', 'utf8');
importContent = importContent.replace(
  /const dbPlayerNames = new Set\(\(dbPlayers \|\| \[\]\)\.map\(p => p\.name\.toLowerCase\(\)\.trim\(\)\)\);/g,
  `const dbPlayerNames = new Set(((dbPlayers as any[]) || []).map(p => p.name.toLowerCase().trim()));`
);
fs.writeFileSync('src/pages/admin/Import.tsx', importContent);

