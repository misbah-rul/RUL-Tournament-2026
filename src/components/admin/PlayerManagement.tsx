import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Edit2, Trash2, Loader2, User } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const playerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatar: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface Player {
  id: string;
  name: string;
  avatar: string | null;
  created_at: string;
}

export function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema), defaultValues: { name: "", avatar: "" }
  });

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPlayers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const openAddDialog = () => {
    setEditingPlayer(null);
    reset({ name: '', avatar: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    reset({ name: player.name, avatar: player.avatar || '' });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PlayerFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingPlayer) {
        const { error } = await supabase
          .from('players')
          // @ts-ignore
          .update({ name: data.name, avatar: data.avatar || null })
          .eq('id', editingPlayer.id);
          
        if (error) throw error;
        toast.success("Player updated successfully");
      } else {
        const { error } = await supabase
          .from('players')
          // @ts-ignore
          .insert([{ name: data.name, avatar: data.avatar || null }]);
          
        if (error) throw error;
        toast.success("Player added successfully");
      }
      setIsDialogOpen(false);
      fetchPlayers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      toast.error(error.message || "Failed to delete player");
    } else {
      toast.success("Player deleted successfully");
      fetchPlayers();
    }
  };

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search players..." 
            className="pl-9 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs">
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-xs text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32 text-muted-foreground font-medium">
                    No players found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden border border-border">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{player.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(player)} className="h-8 w-8 hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {player.name} and remove them from all fixtures and results. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel variant="outline" size="default">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(player.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tight font-black italic">{editingPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
            <DialogDescription>
              {editingPlayer ? 'Update the details of the player.' : 'Enter the details of the new player.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
              <Input id="name" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avatar URL (Optional)</Label>
              <Input id="avatar" placeholder="https://example.com/avatar.jpg" {...register('avatar')} />
              {errors.avatar && <p className="text-xs font-medium text-destructive">{errors.avatar.message}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold uppercase tracking-wider text-xs">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPlayer ? 'Save Changes' : 'Add Player'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
