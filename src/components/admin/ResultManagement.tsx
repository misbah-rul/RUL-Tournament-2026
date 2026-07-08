import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

type Player = Database['public']['Tables']['players']['Row'];
type Result = Database['public']['Tables']['results']['Row'];
type Fixture = Database['public']['Tables']['fixtures']['Row'] & {
  player1?: Player;
  player2?: Player;
  results?: Result[]; // Using array because left join might return multiple due to structure, though it's unique
};

export function ResultManagement() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  
  // Form State
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch fixtures with player details and results
    const { data: fixturesData } = await supabase
      .from('fixtures')
      .select(`
        *,
        player1:player1_id(*),
        player2:player2_id(*),
        results(*)
      `)
      .order('date')
      .order('time');
      
    if (fixturesData) {
      setFixtures(fixturesData as any);
    }
    
    setIsLoading(false);
  };

  const openDialog = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    const result = fixture.results && fixture.results.length > 0 ? fixture.results[0] : null;
    
    if (result) {
      setPlayer1Score(result.player1_score);
      setPlayer2Score(result.player2_score);
    } else {
      setPlayer1Score(0);
      setPlayer2Score(0);
    }
    
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;

    setIsSubmitting(true);
    
    const existingResult = selectedFixture.results && selectedFixture.results.length > 0 ? selectedFixture.results[0] : null;

    if (existingResult) {
      // Update existing
      const { error } = await (supabase
        .from('results') as any)
        .update({
          player1_score: player1Score,
          player2_score: player2Score
        })
        .eq('id', existingResult.id);
        
      if (!error) {
        // Automatically set fixture status to completed
        await (supabase.from('fixtures') as any).update({ status: 'completed' }).eq('id', selectedFixture.id);
        setIsDialogOpen(false);
        toast.success("Result updated successfully");
        fetchData();
      } else {
        toast.error(error.message);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('results')
        .insert([{
          fixture_id: selectedFixture.id,
          player1_score: player1Score,
          player2_score: player2Score
        }] as any);
        
      if (!error) {
        // Automatically set fixture status to completed
        await (supabase.from('fixtures') as any).update({ status: 'completed' }).eq('id', selectedFixture.id);
        setIsDialogOpen(false);
        toast.success("Result recorded successfully");
        fetchData();
      } else {
        toast.error(error.message);
      }
    }
    
    setIsSubmitting(false);
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Upcoming</Badge>;
      case 'in_progress': return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">In Progress</Badge>;
      case 'completed': return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
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
                    Loading results...
                  </TableCell>
                </TableRow>
              ) : fixtures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No fixtures found to record results for.
                  </TableCell>
                </TableRow>
              ) : (
                fixtures.map((fixture) => {
                  const hasResult = fixture.results && fixture.results.length > 0;
                  const result = hasResult ? fixture.results![0] : null;
                  
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
                          <div className="font-bold text-lg">
                            {result?.player1_score} - {result?.player2_score}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No result recorded</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={hasResult ? "outline" : "default"}
                          size="sm" 
                          onClick={() => openDialog(fixture)}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          {hasResult ? 'Edit Result' : 'Add Result'}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Record Match Result</DialogTitle>
              <DialogDescription>
                Enter the final score for this match. Saving will mark the fixture as completed.
              </DialogDescription>
            </DialogHeader>
            {selectedFixture && (
              <div className="grid gap-6 py-4">
                <div className="text-center font-medium border-b pb-4">
                  {new Date(selectedFixture.date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center space-y-2">
                    <Label htmlFor="p1Score" className="text-lg block truncate">
                      {selectedFixture.player1?.name}
                    </Label>
                    <Input
                      id="p1Score"
                      type="number"
                      min="0"
                      className="text-center text-2xl h-14"
                      value={player1Score}
                      onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="text-2xl font-bold text-muted-foreground pt-8">
                    -
                  </div>
                  
                  <div className="flex-1 text-center space-y-2">
                    <Label htmlFor="p2Score" className="text-lg block truncate">
                      {selectedFixture.player2?.name}
                    </Label>
                    <Input
                      id="p2Score"
                      type="number"
                      min="0"
                      className="text-center text-2xl h-14"
                      value={player2Score}
                      onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Result'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
