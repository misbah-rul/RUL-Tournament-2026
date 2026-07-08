import fs from 'fs';

let content = fs.readFileSync('src/components/admin/AdminStandingsSync.tsx', 'utf8');

const newLogic = `
        if (!playerId) {
          // Create the missing player
          const { data: newPlayer, error: createError } = await supabase
            .from('players')
            .insert({ name: row.player })
            .select()
            .single();
            
          if (createError) {
             console.error(\`Failed to create player \${row.player}\`, createError);
             continue;
          }
          playerId = newPlayer.id;
          playerMap.set(row.player.toLowerCase().trim(), playerId);
        }

        // Use the existing standings table to update records
        const { error: upsertError } = await supabase
`;

content = content.replace(
  /\n        if \(\!playerId\) \{[\s\S]*?\n        \}\n\n        \/\/ Use the existing standings table to update records\n        const \{ error: upsertError \} = await supabase/m,
  newLogic
);

// Add navigate to handleSync to refresh the standings page automatically
content = content.replace(
  `import { RefreshCw } from 'lucide-react';`,
  `import { RefreshCw } from 'lucide-react';\nimport { useNavigate } from 'react-router-dom';`
);

content = content.replace(
  `const [isSyncing, setIsSyncing] = useState(false);`,
  `const [isSyncing, setIsSyncing] = useState(false);\n  const navigate = useNavigate();`
);

content = content.replace(
  `      // Refresh the page to show immediately updated standings
      setTimeout(() => {
        window.location.reload();
      }, 1500);`,
  `      // Refresh the page to show immediately updated standings
      setTimeout(() => {
        navigate('/standings');
      }, 1500);`
);

fs.writeFileSync('src/components/admin/AdminStandingsSync.tsx', content);
