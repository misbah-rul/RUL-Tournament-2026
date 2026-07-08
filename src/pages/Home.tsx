import { Container } from "@/components/layout/Container";
import { Link } from "react-router-dom";
import { Trophy, Calendar, Users, ChevronRight } from "lucide-react";

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent opacity-50"></div>
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center rounded bg-primary px-3 py-1 text-[10px] font-black text-primary-foreground uppercase tracking-widest">
                Tournament starts August 2026
              </span>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              RISEUP LABS FIFA <span className="text-primary">2026</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-8 sm:text-xl font-medium">
              The ultimate showdown of digital football excellence. Follow the journey, track the standings, and see who takes home the glory.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/fixtures" className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-md bg-primary px-8 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                View Fixtures
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/standings" className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-md border border-border bg-secondary/50 px-8 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors hover:bg-secondary hover:text-foreground">
                Current Standings
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border group overflow-hidden relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent transition-opacity duration-500"></div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 relative z-10">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight relative z-10">Live Fixtures</h3>
              <p className="text-muted-foreground text-sm relative z-10">Keep track of all upcoming matches, dates, and times. Never miss a game.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border group overflow-hidden relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent transition-opacity duration-500"></div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 relative z-10">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight relative z-10">Real-time Results</h3>
              <p className="text-muted-foreground text-sm relative z-10">Instant updates on match scores, goal scorers, and tournament progression.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br from-secondary to-background border border-border group overflow-hidden relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent transition-opacity duration-500"></div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 relative z-10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight relative z-10">Player Stats</h3>
              <p className="text-muted-foreground text-sm relative z-10">Comprehensive leaderboards, goal differentials, and points tracking.</p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
