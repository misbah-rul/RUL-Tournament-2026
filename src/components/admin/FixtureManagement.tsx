import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Player = Database['public']['Tables']['players']['Row'];
type Fixture = Database['public']['Tables']['fixtures']['Row'] & {
  player1?: Player;
  player2?: Player;
};

export function FixtureManagement() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  
  // Form State
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<Database['public']['Enums']['fixture_status']>('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('name');
      
    if (playersData) setPlayers(playersData);
    
    // Fetch fixtures with player details
    const { data: fixturesData } = await supabase
      .from('fixtures')
      .select(`
        *,
        player1:player1_id(*),
        player2:player2_id(*)
      `)
      .order('date')
      .order('time');
      
    if (fixturesData) {
      setFixtures(fixturesData as any);
    }
    
    setIsLoading(false);
  };

  const openDialog = (fixture?: Fixture) => {
    if (fixture) {
      setEditingFixture(fixture);
      setPlayer1Id(fixture.player1_id);
      setPlayer2Id(fixture.player2_id);
      setDate(fixture.date);
      setTime(fixture.time);
      setStatus(fixture.status);
    } else {
      setEditingFixture(null);
      setPlayer1Id('');
      setPlayer2Id('');
      setDate('');
      setTime('');
      setStatus('scheduled');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Id || !player2Id || !date || !time) {
      toast.error("Please fill in all fields");
      return;
    }
    if (player1Id === player2Id) {
      toast.error("Players must be different");
      return;
    }

    setIsSubmitting(true);
    
    const fixtureData = {
      player1_id: player1Id,
      player2_id: player2Id,
      date,
      time,
      status,
    };

    if (editingFixture) {
      const { error } = await (supabase
        .from('fixtures') as any)
        .update(fixtureData)
        .eq('id', editingFixture.id);
        
      if (!error) {
        setIsDialogOpen(false);
        toast.success("Fixture updated successfully");
        fetchData();
      } else {
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase
        .from('fixtures')
        .insert([fixtureData] as any);
        
      if (!error) {
        setIsDialogOpen(false);
        toast.success("Fixture created successfully");
        fetchData();
      } else {
        toast.error(error.message);
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('fixtures')
      .delete()
      .eq('id', id);
      
    if (!error) {
      toast.success("Fixture deleted successfully");
      fetchData();
    } else {
      toast.error(error.message);
    }
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
        <h2 className="text-2xl font-bold tracking-tight">Fixtures</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Fixture
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Player A</TableHead>
                <TableHead>Player B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading fixtures...
                  </TableCell>
                </TableRow>
              ) : fixtures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No fixtures found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                fixtures.map((fixture) => (
                  <TableRow key={fixture.id}>
                    <TableCell>
                      <div className="font-medium">{new Date(fixture.date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">{fixture.time}</div>
                    </TableCell>
                    <TableCell className="font-medium">{fixture.player1?.name || 'Unknown'}</TableCell>
                    <TableCell className="font-medium">{fixture.player2?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatStatus(fixture.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(fixture)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this fixture and any associated results.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(fixture.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingFixture ? 'Edit Fixture' : 'Create Fixture'}</DialogTitle>
              <DialogDescription>
                {editingFixture ? 'Update the details for this fixture.' : 'Set up a new match between two players.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="player1">Player A</Label>
                <select
                  id="player1"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Player A</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="player2">Player B</Label>
                <select
                  id="player2"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Player B</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  required
                >
                  <option value="scheduled">Upcoming (Scheduled)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Fixture'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
