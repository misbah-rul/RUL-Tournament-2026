import { useState, useEffect, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MatchCard, MatchProps } from "@/components/shared/MatchCard";
import { Calendar, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase/client";

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
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        player1:player1_id(*),
        player2:player2_id(*),
        results(*)
      `)
      .order('date')
      .order('time');
      
    if (data) {
      const formattedFixtures: MatchProps[] = data.map((f: any) => {
        const result = f.results && f.results.length > 0 ? f.results[0] : null;
        return {
          id: f.id,
          player1: f.player1,
          player2: f.player2,
          date: f.date,
          time: f.time,
          status: f.status,
          player1Score: result ? result.player1_score : undefined,
          player2Score: result ? result.player2_score : undefined,
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

  const renderMatches = (matches: MatchProps[]) => {
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
      <div className="grid gap-6">
        {matches.map((match) => (
          <MatchCard 
            key={match.id}
            id={match.id}
            player1={match.player1}
            player2={match.player2}
            date={match.date}
            time={match.time}
            status={match.status}
            player1Score={match.player1Score}
            player2Score={match.player2Score}
            round={match.round}
            winner={match.winner}
            goals={match.goals}
          />
        ))}
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
            {renderMatches(allMatches)}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            {renderMatches(upcomingMatches)}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {renderMatches(completedMatches)}
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
