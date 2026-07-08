import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MatchCard, MatchProps } from "@/components/shared/MatchCard";
import { Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function Results() {
  const [results, setResults] = useState<MatchProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();

    const resultsSubscription = supabase
      .channel('results_page_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => fetchResults())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, () => fetchResults())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchResults())
      .subscribe();

    return () => {
      supabase.removeChannel(resultsSubscription);
    };
  }, []);

  const fetchResults = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        player1:player1_id(*),
        player2:player2_id(*),
        results(*)
      `)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .order('time', { ascending: false });
      
    if (data) {
      const formattedResults: MatchProps[] = data.map((f: any) => {
        const result = f.results && f.results.length > 0 ? f.results[0] : null;
        let winner: 'player1' | 'player2' | 'draw' | undefined;
        
        if (result) {
          if (result.player1_score > result.player2_score) winner = 'player1';
          else if (result.player2_score > result.player1_score) winner = 'player2';
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
          winner
        };
      });
      setResults(formattedResults);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <PageHeader 
        title="Results" 
        subTitle="Match Outcomes"
        description="Latest match scores and tournament outcomes."
      />
      <Container className="py-8 md:py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState 
            icon={<Trophy className="h-12 w-12 text-muted-foreground/50" />}
            title="No results available"
            description="The tournament hasn't started yet. Results will appear here once the first match concludes."
          />
        ) : (
          <div className="grid gap-6">
            {results.map((match) => (
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
        )}
      </Container>
    </div>
  );
}
