import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { STANDINGS_DATA } from '@/lib/standingsData';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminStandingsSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch all existing players
      const { data: existingPlayers, error: fetchError } = await supabase.from('players').select('id, name');
      if (fetchError) throw fetchError;

      const playerMap = new Map();
      (existingPlayers as any[])?.forEach(p => playerMap.set(p.name.toLowerCase().trim(), p.id));

      let updatedCount = 0;

      for (const row of STANDINGS_DATA) {
        let playerId = playerMap.get(row.player.toLowerCase().trim());
        
        // Match player by name. Do not create duplicates. Preserve IDs.
        if (!playerId) {
          // Create the missing player
          const { data: newPlayer, error: createError } = await supabase
            .from('players')
            .insert({ name: row.player } as any)
            .select()
            .single();
            
          if (createError) {
             console.error(`Failed to create player ${row.player}`, createError);
             continue;
          }
          playerId = (newPlayer as any).id;
          playerMap.set(row.player.toLowerCase().trim(), playerId);
        }

        // Use the existing standings table to update records
        const { error: upsertError } = await supabase

          .from('standings' as any)
          .upsert({
            player_id: playerId,
            player_name: row.player,
            matches_played: row.mp,
            wins: row.w,
            draws: row.d,
            losses: row.l,
            goals_for: row.gf,
            goals_against: row.ga,
            goal_difference: row.gd,
            points: row.pts
          } as any, { onConflict: 'player_id' });

        if (upsertError) {
          console.error(`Error updating standings for ${row.player}:`, upsertError);
          // Don't throw immediately, try the rest
        } else {
          updatedCount++;
        }
      }

      toast.success(`Updated ${updatedCount} standings records successfully!`);
      // Refresh the page to show immediately updated standings
      setTimeout(() => {
        navigate('/standings');
      }, 1500);

    } catch (error: any) {
      toast.error(`Error syncing standings: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Standings</CardTitle>
        <CardDescription>
          Force update the tournament standings in the database based on the official records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSync} disabled={isSyncing} className="w-full">
          {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isSyncing ? 'Syncing...' : 'Update Standings Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
