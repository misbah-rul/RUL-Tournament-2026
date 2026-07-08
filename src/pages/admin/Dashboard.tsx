import React, { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Trophy, LogOut, Settings2, Swords, Edit3, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PlayerManagement } from "@/components/admin/PlayerManagement";
import { FixtureManagement } from "@/components/admin/FixtureManagement";
import { ResultManagement } from "@/components/admin/ResultManagement";
import { AdminStandingsSync } from "@/components/admin/AdminStandingsSync";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<'dashboard' | 'players' | 'fixtures' | 'results'>('dashboard');
  
  const [stats, setStats] = useState({
    players: 0,
    upcomingMatches: 0,
    completedMatches: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (activeModule !== 'dashboard') return;
      
      const { count: playersCount } = await supabase.from('players').select('*', { count: 'exact', head: true });
      const { count: upcomingCount } = await supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('status', 'scheduled');
      const { count: completedCount } = await supabase.from('fixtures').select('*', { count: 'exact', head: true }).in('status', ['completed', 'cancelled']);
      
      setStats({
        players: playersCount || 0,
        upcomingMatches: upcomingCount || 0,
        completedMatches: completedCount || 0
      });
    }
    
    fetchStats();
  }, [activeModule]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div>
      <PageHeader 
        title={
          activeModule === 'dashboard' ? "Admin Dashboard" :
          activeModule === 'players' ? "Manage Players" :
          activeModule === 'fixtures' ? "Manage Fixtures" : "Enter Results"
        } 
        description={
          activeModule === 'dashboard' ? "Tournament overview and management controls." :
          activeModule === 'players' ? "Add, edit, or remove participants." :
          activeModule === 'fixtures' ? "Generate matches and set timings." : "Record match scores and statistics."
        }
      >
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {activeModule !== 'dashboard' && (
            <Button variant="outline" onClick={() => setActiveModule('dashboard')} className="font-bold uppercase tracking-wider text-xs border-border">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout} className="font-bold uppercase tracking-wider text-xs border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </PageHeader>
      
      <Container className="py-8 md:py-12 max-w-6xl">
        {activeModule === 'dashboard' ? (
          <>
            {/* Stats Row */}
            <div className="grid gap-6 md:grid-cols-3 mb-10">
              <Card className="bg-white border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Players</p>
                      <div className="text-4xl font-black text-foreground">{stats.players}</div>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upcoming Matches</p>
                      <div className="text-4xl font-black text-foreground">{stats.upcomingMatches}</div>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed Matches</p>
                      <div className="text-4xl font-black text-foreground">{stats.completedMatches}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Trophy className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">Quick Actions</h2>
            
            <div className="mb-6 max-w-sm">
              <AdminStandingsSync />
            </div>
            
            {/* Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-secondary/30" onClick={() => setActiveModule('players')}>
                <CardHeader>
                  <div className="mb-2 p-2 w-fit rounded-lg bg-background border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Manage Players</CardTitle>
                  <CardDescription className="font-medium">Add, edit, or remove participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between font-bold uppercase tracking-wider text-xs group-hover:bg-primary/10">
                    Open module <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-secondary/30" onClick={() => setActiveModule('fixtures')}>
                <CardHeader>
                  <div className="mb-2 p-2 w-fit rounded-lg bg-background border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <Swords className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Manage Fixtures</CardTitle>
                  <CardDescription className="font-medium">Generate matches and set timings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between font-bold uppercase tracking-wider text-xs group-hover:bg-primary/10">
                    Open module <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-secondary/30" onClick={() => setActiveModule('results')}>
                <CardHeader>
                  <div className="mb-2 p-2 w-fit rounded-lg bg-background border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Enter Results</CardTitle>
                  <CardDescription className="font-medium">Record match scores and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between font-bold uppercase tracking-wider text-xs group-hover:bg-primary/10">
                    Open module <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-secondary/30" onClick={() => navigate('/admin/import')}>
                <CardHeader>
                  <div className="mb-2 p-2 w-fit rounded-lg bg-background border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Import Data</CardTitle>
                  <CardDescription className="font-medium">Upload Excel fixtures and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between font-bold uppercase tracking-wider text-xs group-hover:bg-primary/10">
                    Open Import <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : activeModule === 'players' ? (
          <PlayerManagement />
        ) : activeModule === 'fixtures' ? (
          <FixtureManagement />
        ) : (
          <ResultManagement />
        )}
      </Container>
    </div>
  );
}
