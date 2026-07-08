import { useState, useEffect, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Loader2, Clock, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface MatchProps {
  id: string;
  player1: { id?: string; name: string; avatar?: string };
  player2: { id?: string; name: string; avatar?: string };
  date: string;
  time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  player1Score?: number;
  player2Score?: number;
  winner?: 'player1' | 'player2' | 'draw' | null;
}

export function Fixtures() {
  const [activeTab, setActiveTab] = useState("all");
  const [fixtures, setFixtures] = useState<MatchProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFixtures();

    const fixturesSubscription = supabase
      .channel('fixtures_page_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => fetchFixtures())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => fetchFixtures())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchFixtures())
      .subscribe();

    return () => {
      supabase.removeChannel(fixturesSubscription);
    };
  }, []);

  const fetchFixtures = async () => {
    setIsLoading(true);

    // Fetch fixtures and results separately — embedded join (results(*))
    // silently fails when the FK isn't in Supabase's schema cache.
    const [{ data: fixturesData }, { data: resultsData }] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*, player1:player1_id(*), player2:player2_id(*)')
        .order('date')
        .order('time'),
      supabase.from('results').select('*'),
    ]);

    if (fixturesData) {
      const formattedFixtures: MatchProps[] = fixturesData.map((f: any) => {
        // Match results to this fixture client-side
        const allResults = (resultsData as any) ?? [];
        const result = allResults.find((r: any) => r.fixture_id === f.id) ?? null;

        let winner: 'player1' | 'player2' | 'draw' | undefined;
        if (result) {
          // -1 is the walkover sentinel (that player LOST)
          const p1 = result.player1_score === -1 ? -Infinity : result.player1_score;
          const p2 = result.player2_score === -1 ? -Infinity : result.player2_score;
          if (p1 > p2) winner = 'player1';
          else if (p2 > p1) winner = 'player2';
          else winner = 'draw';
        }

        return {
          id: f.id,
          player1: f.player1,
          player2: f.player2,
          date: f.date,
          time: f.time,
          status: f.status,
          player1Score: result ? result.player1_score : undefined,
          player2Score: result ? result.player2_score : undefined,
          winner,
        };
      });
      setFixtures(formattedFixtures);
    }
    setIsLoading(false);
  };

  const { upcomingMatches, completedMatches, allMatches } = useMemo(() => {
    const sorted = [...fixtures].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      allMatches: sorted,
      upcomingMatches: sorted.filter(m => m.status === 'scheduled'),
      completedMatches: sorted.filter(m => m.status === 'completed' || m.status === 'in_progress').reverse(),
    };
  }, [fixtures]);

  const getStatusBadge = (status: MatchProps['status']) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-primary text-primary-foreground hover:bg-primary font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Live</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-secondary text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">FT</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border-border">Scheduled</Badge>;
    }
  };

  const renderMatchesTable = (matches: MatchProps[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <EmptyState 
          icon={<Calendar className="h-12 w-12 text-muted-foreground/50" />}
          title="No fixtures found"
          description="There are no matches to display for this category."
        />
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
        <div className="overflow-x-auto relative">
          <Table className="min-w-[700px] md:min-w-0">
            <TableHeader className="bg-secondary/90 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="border-border">
                <TableHead className="w-24 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="w-48 text-xs font-bold uppercase tracking-widest text-muted-foreground">Date & Time</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground pr-8">Player 1</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Score</TableHead>
                <TableHead className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground pl-8">Player 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                const isP1Winner = match.winner === 'player1';
                const isP2Winner = match.winner === 'player2';
                
                return (
                  <TableRow key={match.id} className="border-border/50 hover:bg-secondary/40 transition-colors">
                    {/* Status */}
                    <TableCell className="text-center py-4">
                      {getStatusBadge(match.status)}
                    </TableCell>
                    
                    {/* Date & Time */}
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{match.date}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {match.time}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Player 1 */}
                    <TableCell className="text-right py-4 pr-8">
                      <div className="flex items-center justify-end gap-3">
                        <span className={cn(
                          "font-black italic text-sm transition-colors",
                          isP1Winner ? "text-primary font-extrabold" : "text-foreground"
                        )}>
                          {match.player1.name}
                        </span>
                        <div className="relative">
                          <div className={cn(
                            "w-9 h-9 rounded-full border-2 bg-secondary flex items-center justify-center overflow-hidden shadow-sm",
                            isP1Winner ? "border-primary" : "border-border"
                          )}>
                            {match.player1.avatar ? (
                              <img src={match.player1.avatar} alt={match.player1.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black italic">{match.player1.name.charAt(0)}</span>
                            )}
                          </div>
                          {isP1Winner && (
                            <div className="absolute -top-1 -right-1.5 bg-primary rounded-full p-0.5 text-primary-foreground shadow">
                              <Trophy className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Score / VS */}
                    <TableCell className="text-center py-4 font-black text-lg">
                      {match.status === 'completed' || match.status === 'in_progress' ? (() => {
                        const isWalkover = match.player1Score === -1 || match.player2Score === -1;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-1.5 bg-background/50 border border-border px-3 py-1 rounded-lg w-max mx-auto shadow-sm">
                              <span className={cn(isP1Winner ? "text-primary" : "text-muted-foreground")}>
                                {match.player1Score === -1 ? 0 : match.player1Score ?? 0}
                              </span>
                              <span className="text-muted-foreground/30">-</span>
                              <span className={cn(isP2Winner ? "text-primary" : "text-muted-foreground")}>
                                {match.player2Score === -1 ? 0 : match.player2Score ?? 0}
                              </span>
                            </div>
                            {isWalkover && (
                              <Badge className="text-[9px] bg-amber-100 text-amber-700 border border-amber-300 font-bold uppercase tracking-widest px-1.5 py-0 rounded w-max mx-auto">
                                W.O.
                              </Badge>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-xs font-bold text-muted-foreground/40 bg-secondary/50 border border-border/50 px-2.5 py-1 rounded-lg">
                          VS
                        </span>
                      )}
                    </TableCell>
                    
                    {/* Player 2 */}
                    <TableCell className="text-left py-4 pl-8">
                      <div className="flex items-center justify-start gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-9 h-9 rounded-full border-2 bg-secondary flex items-center justify-center overflow-hidden shadow-sm",
                            isP2Winner ? "border-primary" : "border-border"
                          )}>
                            {match.player2.avatar ? (
                              <img src={match.player2.avatar} alt={match.player2.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black italic">{match.player2.name.charAt(0)}</span>
                            )}
                          </div>
                          {isP2Winner && (
                            <div className="absolute -top-1 -right-1.5 bg-primary rounded-full p-0.5 text-primary-foreground shadow">
                              <Trophy className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "font-black italic text-sm transition-colors",
                          isP2Winner ? "text-primary font-extrabold" : "text-foreground"
                        )}>
                          {match.player2.name}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader 
        title="Fixtures" 
        description="Upcoming matches and tournament schedule."
      />
      <Container className="py-8 md:py-12">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="text-xs font-bold uppercase tracking-widest">All Matches</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs font-bold uppercase tracking-widest">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs font-bold uppercase tracking-widest">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {renderMatchesTable(allMatches)}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            {renderMatchesTable(upcomingMatches)}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {renderMatchesTable(completedMatches)}
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
