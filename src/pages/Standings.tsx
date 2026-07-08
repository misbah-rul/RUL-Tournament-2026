import React, { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

interface TeamStanding {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export function Standings() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStandings();

    const standingsSubscription = supabase
      .channel('standings_page_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => fetchStandings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => fetchStandings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchStandings())
      .subscribe();

    return () => {
      supabase.removeChannel(standingsSubscription);
    };
  }, []);

  const fetchStandings = async () => {
    setIsLoading(true);
    
    try {
      // First try to fetch from the view if the user created it
      const { data: viewData, error: viewError } = await supabase
        .from('standings' as any)
        .select('*');
        
      if (!viewError && viewData) {
        const mappedData = viewData.map((row: any) => {
          const gf = Math.max(0, Number(row.goals_for));
          const ga = Math.max(0, Number(row.goals_against));
          return {
            id: row.player_id,
            name: row.player_name,
            played: Number(row.matches_played),
            won: Number(row.wins),
            drawn: Number(row.draws),
            lost: Number(row.losses),
            gf,
            ga,
            gd: gf - ga,
            pts: Number(row.points)
          };
        });
        setStandings(mappedData);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      // Ignore and fallback
    }

    // Fallback: Calculate client-side if view doesn't exist
    const { data: players } = await supabase.from('players').select('*');
    const { data: fixtures } = await supabase.from('fixtures').select('*, results(*)').eq('status', 'completed');
    
    if (players && fixtures) {
      const statsMap: Record<string, TeamStanding> = {};
      
      (players as any[]).forEach(p => {
        statsMap[p.id] = {
          id: p.id,
          name: p.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          pts: 0
        };
      });
      
      (fixtures as any[]).forEach(f => {
        const result = f.results && f.results.length > 0 ? f.results[0] : null;
        if (!result) return;
        
        const p1 = statsMap[f.player1_id];
        const p2 = statsMap[f.player2_id];
        
        if (p1 && p2) {
          p1.played++;
          p2.played++;
          
          const p1ScoreClamped = Math.max(0, result.player1_score);
          const p2ScoreClamped = Math.max(0, result.player2_score);
          p1.gf += p1ScoreClamped;
          p1.ga += p2ScoreClamped;
          p2.gf += p2ScoreClamped;
          p2.ga += p1ScoreClamped;
          
          if (result.player1_score > result.player2_score) {
            p1.won++;
            p1.pts += 3;
            p2.lost++;
          } else if (result.player2_score > result.player1_score) {
            p2.won++;
            p2.pts += 3;
            p1.lost++;
          } else {
            p1.drawn++;
            p2.drawn++;
            p1.pts += 1;
            p2.pts += 1;
          }
        }
      });
      
      Object.values(statsMap).forEach(s => {
        s.gd = s.gf - s.ga;
      });
      
      const sorted = Object.values(statsMap).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
      
      setStandings(sorted);
    }
    
    setIsLoading(false);
  };

  const getHighlightClass = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-400 font-bold";
      case 1: return "text-slate-300 font-bold";
      case 2: return "text-amber-600 font-bold";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div>
      <PageHeader 
        title="Standings" 
        subTitle="Leaderboards"
        description="Current tournament leaderboards and points table."
      />
      <Container className="py-8 md:py-12">
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-2xl border border-border bg-secondary/30 overflow-hidden">
          <div className="overflow-x-auto relative">
            <Table>
              <TableHeader className="bg-secondary/90 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="border-border">
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">POS</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Team</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">P</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">W</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">D</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">L</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">GF</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">GA</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">GD</TableHead>
                  <TableHead className="w-16 text-center text-xs font-bold uppercase tracking-widest text-primary">PTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">Loading standings...</TableCell>
                  </TableRow>
                ) : standings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No matches completed yet.</TableCell>
                  </TableRow>
                ) : standings.map((team, index) => (
                  <TableRow key={team.id} className="border-border/50 hover:bg-secondary/40 transition-colors">
                    <TableCell className={cn("text-center font-black italic", getHighlightClass(index))}>
                      {String(index + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell className="font-bold">{team.name}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.played}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.won}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.drawn}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.lost}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.gf}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.ga}</TableCell>
                    <TableCell className="text-center font-medium text-muted-foreground">{team.gd}</TableCell>
                    <TableCell className="text-center font-black text-primary">{String(team.pts).padStart(2, '0')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading standings...</div>
          ) : standings.map((team, index) => (
            <Card key={team.id} className="bg-secondary/30 border-border overflow-hidden relative">
              <div className={cn(
                "absolute top-0 left-0 bottom-0 w-1",
                index === 0 ? "bg-yellow-400" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-border"
              )} />
              <CardContent className="p-4 pl-5">
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("text-2xl font-black italic", getHighlightClass(index))}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-lg">{team.name}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Points</span>
                    <span className="text-3xl font-black italic text-primary">{String(team.pts).padStart(2, '0')}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="flex flex-col p-2 bg-background/50 rounded-lg border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">P</span>
                    <span className="font-bold">{team.played}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-background/50 rounded-lg border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">W-D-L</span>
                    <span className="font-bold">{team.won}-{team.drawn}-{team.lost}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-background/50 rounded-lg border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">GF:GA</span>
                    <span className="font-bold">{team.gf}:{team.ga}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-background/50 rounded-lg border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">GD</span>
                    <span className="font-bold">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
