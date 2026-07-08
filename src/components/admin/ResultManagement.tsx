import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Player = Database['public']['Tables']['players']['Row'];
type Result = Database['public']['Tables']['results']['Row'];
type Fixture = Database['public']['Tables']['fixtures']['Row'] & {
  player1?: Player;
  player2?: Player;
  results?: Result[];
};

export function ResultManagement() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [walkoverWinner, setWalkoverWinner] = useState<'player1' | 'player2' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch fixtures and results in parallel — avoids relying on PostgREST
    // embedded join which can silently fail if FK isn't in the schema cache.
    const [{ data: fixturesData }, { data: resultsData }] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*, player1:player1_id(*), player2:player2_id(*)')
        .order('date')
        .order('time'),
      supabase.from('results').select('*'),
    ]);

    if (fixturesData) {
      // Merge results onto their parent fixture
      const merged = fixturesData.map((fixture: any) => ({
        ...fixture,
        results: (resultsData ?? []).filter((r: any) => r.fixture_id === fixture.id),
      }));
      setFixtures(merged as any);
    }

    setIsLoading(false);
  };

  const openDialog = async (fixture: Fixture, editMode: boolean) => {
    // Open dialog immediately with loading state
    setSelectedFixture(fixture);
    setIsEditMode(editMode);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setWalkoverWinner(null);
    setIsLoadingDialog(true);
    setIsDialogOpen(true);

    // Fetch live result from DB — avoids any stale data
    const { data: liveResults, error } = await supabase
      .from('results')
      .select('*')
      .eq('fixture_id', fixture.id)
      .limit(1);

    setIsLoadingDialog(false);

    if (!error && liveResults && liveResults.length > 0) {
      const result = liveResults[0] as any;
      const isWalkover = result.player1_score === -1 || result.player2_score === -1;
      if (isWalkover) {
        setWalkoverWinner(result.player1_score >= 0 ? 'player1' : 'player2');
        setPlayer1Score(result.player1_score);
        setPlayer2Score(result.player2_score);
      } else {
        setPlayer1Score(result.player1_score);
        setPlayer2Score(result.player2_score);
        setWalkoverWinner(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;

    setIsSubmitting(true);

    try {
      // Always query DB live to get the definitive existing result
      const { data: existingResults, error: fetchError } = await supabase
        .from('results')
        .select('*')
        .eq('fixture_id', selectedFixture.id)
        .limit(1);

      if (fetchError) {
        toast.error(fetchError.message);
        setIsSubmitting(false);
        return;
      }

      const existingResult = existingResults && existingResults.length > 0 ? (existingResults[0] as any) : null;

      const scorePayload = {
        player1_score: player1Score,
        player2_score: player2Score,
      };

      if (existingResult) {
        // UPDATE
        const { error } = await (supabase.from('results') as any)
          .update(scorePayload)
          .eq('id', existingResult.id);

        if (error) {
          toast.error(error.message);
        } else {
          await (supabase.from('fixtures') as any)
            .update({ status: 'completed' })
            .eq('id', selectedFixture.id);
          setIsDialogOpen(false);
          toast.success('Result updated successfully');
          fetchData();
        }
      } else {
        // INSERT
        const { error } = await (supabase.from('results') as any)
          .insert([{ fixture_id: selectedFixture.id, ...scorePayload }]);

        if (error) {
          toast.error(error.message);
        } else {
          await (supabase.from('fixtures') as any)
            .update({ status: 'completed' })
            .eq('id', selectedFixture.id);
          setIsDialogOpen(false);
          toast.success('Result recorded successfully');
          fetchData();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred');
    }

    setIsSubmitting(false);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Upcoming</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const displayScore = (score: number | undefined | null) => {
    if (score === undefined || score === null) return 0;
    return score === -1 ? 0 : score;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Results</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fixture</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Result</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : fixtures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No fixtures found.
                  </TableCell>
                </TableRow>
              ) : (
                fixtures.map((fixture) => {
                  const hasResult = fixture.results && fixture.results.length > 0;
                  const result = hasResult ? fixture.results![0] : null;
                  const isWalkover = result && (result.player1_score === -1 || result.player2_score === -1);

                  return (
                    <TableRow key={fixture.id}>
                      <TableCell>
                        <div className="font-medium">
                          {fixture.player1?.name || 'Unknown'} vs {fixture.player2?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(fixture.date).toLocaleDateString()} at {fixture.time}
                        </div>
                      </TableCell>
                      <TableCell>{formatStatus(fixture.status)}</TableCell>
                      <TableCell>
                        {hasResult ? (
                          isWalkover ? (
                            // Walkover result — show winner name clearly
                            (() => {
                              const walkoverWinnerName =
                                result!.player1_score === -1
                                  ? fixture.player2?.name   // player1 lost (score=-1) → player2 wins
                                  : fixture.player1?.name;  // player2 lost (score=-1) → player1 wins
                              return (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span className="font-bold text-sm text-foreground truncate">
                                      {walkoverWinnerName}
                                    </span>
                                    <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-300 font-bold uppercase px-1.5 py-0 shrink-0">
                                      W.O.
                                    </Badge>
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-medium pl-5">
                                    Wins by Walkover
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            // Normal score
                            <div className="flex items-center gap-2">
                              <span className="font-black text-lg tabular-nums">
                                {displayScore(result?.player1_score)}
                              </span>
                              <span className="text-muted-foreground font-bold">–</span>
                              <span className="font-black text-lg tabular-nums">
                                {displayScore(result?.player2_score)}
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-muted-foreground italic text-sm">No result recorded</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={hasResult ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => openDialog(fixture, !!hasResult)}
                        >
                          {hasResult ? (
                            <><Pencil className="mr-2 h-3.5 w-3.5" />Edit Result</>
                          ) : (
                            <><Plus className="mr-2 h-3.5 w-3.5" />Add Result</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Result Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!isSubmitting) setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-y-auto bg-background border border-border rounded-2xl shadow-xl max-h-[90vh]">
          <form onSubmit={handleSave} className="flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-secondary/10">
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                {isEditMode ? 'Edit Match Result' : 'Record Match Result'}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-1">
                {isEditMode
                  ? 'Update the scores or change the outcome for this match.'
                  : 'Enter the match outcome. Select walkover or standard scores.'}
              </DialogDescription>
            </DialogHeader>

            {selectedFixture && (
              <div className="p-6 space-y-6">
                {/* Matchup Header */}
                <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
                  <div className="font-black italic text-base text-foreground break-words w-full px-2">
                    {selectedFixture.player1?.name}
                  </div>
                  <div className="text-[9px] font-black tracking-widest text-muted-foreground/60 bg-background border border-border/50 px-2.5 py-0.5 rounded-md">
                    VS
                  </div>
                  <div className="font-black italic text-base text-foreground break-words w-full px-2">
                    {selectedFixture.player2?.name}
                  </div>
                </div>

                {/* Loading state while fetching existing result */}
                {isLoadingDialog ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-medium">Loading current result...</span>
                  </div>
                ) : (
                  <>
                    {/* Walkover Options */}
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Walkover Options
                      </Label>
                      <div className="flex flex-col gap-2.5">
                        {/* Player 1 Walkover */}
                        <button
                          type="button"
                          onClick={() => {
                            if (walkoverWinner === 'player1') {
                              setWalkoverWinner(null);
                              setPlayer1Score(0);
                              setPlayer2Score(0);
                            } else {
                              setWalkoverWinner('player1');
                              setPlayer1Score(0);
                              setPlayer2Score(-1);
                            }
                          }}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer w-full text-left',
                            walkoverWinner === 'player1'
                              ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary'
                              : 'border-border bg-transparent hover:bg-secondary/40 text-foreground'
                          )}
                        >
                          <div className="flex flex-col items-start min-w-0 pr-4">
                            <span className="text-sm font-black italic truncate w-full">
                              {selectedFixture.player1?.name}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                              Wins by Walkover
                            </span>
                          </div>
                          {walkoverWinner === 'player1' && (
                            <Trophy className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>

                        {/* Player 2 Walkover */}
                        <button
                          type="button"
                          onClick={() => {
                            if (walkoverWinner === 'player2') {
                              setWalkoverWinner(null);
                              setPlayer1Score(0);
                              setPlayer2Score(0);
                            } else {
                              setWalkoverWinner('player2');
                              setPlayer1Score(-1);
                              setPlayer2Score(0);
                            }
                          }}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer w-full text-left',
                            walkoverWinner === 'player2'
                              ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary'
                              : 'border-border bg-transparent hover:bg-secondary/40 text-foreground'
                          )}
                        >
                          <div className="flex flex-col items-start min-w-0 pr-4">
                            <span className="text-sm font-black italic truncate w-full">
                              {selectedFixture.player2?.name}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                              Wins by Walkover
                            </span>
                          </div>
                          {walkoverWinner === 'player2' && (
                            <Trophy className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Score Inputs OR Walkover Confirmation */}
                    {!walkoverWinner ? (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Match Scores
                        </Label>
                        <div className="flex items-center justify-between gap-6 bg-secondary/10 border border-border/50 rounded-xl p-4">
                          <div className="flex-1 text-center space-y-2">
                            <Label htmlFor="p1Score" className="text-xs font-bold text-muted-foreground block truncate">
                              {selectedFixture.player1?.name}
                            </Label>
                            <Input
                              id="p1Score"
                              type="number"
                              min="0"
                              className="text-center text-2xl h-12 bg-background border-border font-black italic shadow-sm"
                              value={player1Score < 0 ? 0 : player1Score}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setPlayer1Score(isNaN(val) || val < 0 ? 0 : val);
                              }}
                              required
                            />
                          </div>

                          <div className="text-2xl font-black text-muted-foreground/30 pt-6">-</div>

                          <div className="flex-1 text-center space-y-2">
                            <Label htmlFor="p2Score" className="text-xs font-bold text-muted-foreground block truncate">
                              {selectedFixture.player2?.name}
                            </Label>
                            <Input
                              id="p2Score"
                              type="number"
                              min="0"
                              className="text-center text-2xl h-12 bg-background border-border font-black italic shadow-sm"
                              value={player2Score < 0 ? 0 : player2Score}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setPlayer2Score(isNaN(val) || val < 0 ? 0 : val);
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center gap-2">
                        <Trophy className="h-6 w-6 text-primary animate-bounce" />
                        <span className="text-sm font-black italic text-foreground">Walkover Result Active</span>
                        <span className="text-xs text-muted-foreground px-4">
                          <strong>
                            {walkoverWinner === 'player1'
                              ? selectedFixture.player1?.name
                              : selectedFixture.player2?.name}
                          </strong>{' '}
                          will be awarded 3 points. Scoreline will be recorded as 0 – 0. Score fields are locked.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setWalkoverWinner(null);
                            setPlayer1Score(0);
                            setPlayer2Score(0);
                          }}
                          className="text-[10px] underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors mt-1"
                        >
                          Clear walkover
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <DialogFooter className="p-6 bg-secondary/10 border-t border-border/50 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto font-bold"
                disabled={isSubmitting || isLoadingDialog}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  isEditMode ? 'Update Result' : 'Save Result'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
