import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gamepad2, Info, CheckCircle2, AlertTriangle, CalendarClock, ShieldCheck, ListOrdered, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rules() {
  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-border py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 to-transparent opacity-70"></div>
        <Container className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-sm">
            <Gamepad2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase mb-6 text-foreground max-w-4xl">
            Riseup Labs PS5 FIFA Tournament 2026
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
            The ultimate office FIFA showdown where every match matters. Follow the rules, play fair, and compete for the championship trophy.
          </p>
        </Container>
      </section>

      <Container className="py-12 space-y-12 max-w-5xl">
        
        {/* Tournament Format */}
        <section>
          <Card className="bg-blue-50/50 border-blue-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Info className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-blue-900">Tournament Format</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800/80 font-medium">
              <ul className="space-y-3 mt-2 list-disc pl-5">
                <li>Every participant plays one match against every other participant.</li>
                <li>The tournament follows a Round Robin (League) format.</li>
                <li>After all league matches are completed, the <strong className="text-blue-900">Top 4 players</strong> qualify for the Semi-Finals.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Points System */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-primary">Points System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">🏆</div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-2">Win</h3>
                <p className="text-4xl font-black text-green-600">3 Points</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">🤝</div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-2">Draw</h3>
                <p className="text-4xl font-black text-amber-500">1 Point</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 text-4xl">❌</div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-2">Loss</h3>
                <p className="text-4xl font-black text-red-500">0 Points</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Ranking Rules */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-primary">Ranking Rules</h2>
          <p className="text-muted-foreground font-medium text-lg">If two or more players have equal points, ranking will be determined by:</p>
          <div className="grid gap-4">
            {[
              { num: "1", title: "Goal Difference (GD)" },
              { num: "2", title: "Goals Scored (GF)" },
              { num: "3", title: "Head-to-Head Result" }
            ].map((rule) => (
              <div key={rule.num} className="flex items-center gap-4 bg-white border border-border p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-lg">
                  {rule.num}
                </div>
                <p className="text-lg font-bold text-foreground">{rule.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Match Rules */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-primary">Match Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-16 h-16" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase tracking-tight text-primary">Rule 1</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-muted-foreground relative z-10">Match timings must be strictly maintained.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CalendarClock className="w-16 h-16" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase tracking-tight text-primary">Rule 2</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-muted-foreground relative z-10">Players have a maximum 5-minute grace period after the scheduled match time.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Ban className="w-16 h-16" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase tracking-tight text-primary">Rule 3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-muted-foreground relative z-10">If a player fails to arrive within 5 minutes, the opponent receives a walkover victory and 3 points.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Fair Play */}
        <section>
          <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-emerald-900">Fair Play & Sportsmanship</CardTitle>
            </CardHeader>
            <CardContent className="text-emerald-800/80 font-medium space-y-4">
              <p>All participants are expected to maintain respect, honesty, and good sportsmanship throughout the tournament.</p>
              <p className="font-bold text-emerald-900">Unsportsmanlike behavior may result in organizer action.</p>
            </CardContent>
          </Card>
        </section>

        {/* Daily Fixtures */}
        <section>
          <Card className="bg-violet-50/50 border-violet-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ListOrdered className="h-6 w-6 text-violet-500" />
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-violet-900">Daily Fixture Announcements</CardTitle>
            </CardHeader>
            <CardContent className="text-violet-800/80 font-medium">
              <p className="mb-4">To keep the excitement alive, daily fixtures will be announced either:</p>
              <ul className="space-y-2 list-disc pl-5 mb-4 font-bold text-violet-900">
                <li>The evening before the match day</li>
              </ul>
              <p className="uppercase tracking-widest text-xs font-black text-violet-500 mb-4 pl-5">OR</p>
              <ul className="space-y-2 list-disc pl-5 mb-4 font-bold text-violet-900">
                <li>On the morning of the match day</li>
              </ul>
              <p>Players should regularly check the tournament group for updates.</p>
            </CardContent>
          </Card>
        </section>

        {/* Organizer Decision */}
        <section>
          <Card className="bg-red-50/50 border-red-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle className="text-xl font-bold uppercase tracking-tight text-red-900">Final Decision</CardTitle>
            </CardHeader>
            <CardContent className="text-red-800/80 font-medium">
              <p>The Tournament Organizer's decision will be final in case of any disputes or exceptional situations.</p>
            </CardContent>
          </Card>
        </section>

        {/* Footer Note */}
        <section className="pt-12 pb-8 text-center border-t border-border">
          <div className="flex justify-center mb-6">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-foreground max-w-3xl mx-auto leading-relaxed">
            "Play hard. Respect everyone. Enjoy the game. May the best player become the Riseup Labs PS5 FIFA Tournament 2026 Champion."
          </p>
        </section>

      </Container>
    </div>
  );
}
