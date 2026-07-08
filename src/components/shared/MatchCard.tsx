import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trophy } from "lucide-react";
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
  round?: string;
  className?: string;
  winner?: 'player1' | 'player2' | 'draw' | null;
  goals?: {
    player1?: string[];
    player2?: string[];
  };
}

export const MatchCard: React.FC<MatchProps> = ({
  player1,
  player2,
  date,
  time,
  status,
  player1Score,
  player2Score,
  round,
  winner,
  goals,
  className
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-primary text-primary-foreground hover:bg-primary font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Live Match</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-secondary text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border-border">Scheduled</Badge>;
    }
  };

  return (
    <Card className={cn("relative bg-gradient-to-br from-secondary to-background border border-border group overflow-hidden", className)}>
      {status === 'in_progress' && (
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent"></div>
      )}
      
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-center md:justify-between relative z-10">
          
          <div className="flex flex-col gap-1 items-start">
            {getStatusBadge()}
            <h3 className="text-xl font-bold mt-3 uppercase tracking-tight">{round || 'Group Stage'}</h3>
            <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {date}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {time}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0">
            {/* Player 1 */}
            <div className="flex flex-col items-center gap-3 w-24">
              <div className="relative">
                <div className={cn("w-16 h-16 bg-secondary rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden", winner === 'player1' ? 'border-primary' : 'border-border')}>
                  {player1.avatar ? (
                    <img src={player1.avatar} alt={player1.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black italic">{player1.name.charAt(0)}</span>
                  )}
                </div>
                {winner === 'player1' && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 text-primary-foreground shadow-lg">
                    <Trophy className="w-4 h-4" />
                  </div>
                )}
              </div>
              <span className={cn("font-black italic text-center truncate w-full text-sm", winner === 'player1' ? 'text-primary' : '')}>{player1.name}</span>
            </div>
            
            {/* Score / VS */}
            <div className="flex flex-col items-center justify-center">
              {status === 'completed' || status === 'in_progress' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className={cn("text-4xl md:text-5xl font-black italic", status === 'in_progress' ? 'text-primary' : '')}>
                    {player1Score === -1 ? 0 : player1Score ?? 0} - {player2Score === -1 ? 0 : player2Score ?? 0}
                  </span>
                  <div className="flex flex-col items-center gap-1 mt-1">
                    {status === 'in_progress' && (
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Playing</span>
                    )}
                    {status === 'completed' && !(player1Score === -1 || player2Score === -1) && (
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">FT</span>
                    )}
                    {(player1Score === -1 || player2Score === -1) && (
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shadow-sm">
                          <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="font-extrabold text-xs text-amber-800">
                            {player1Score === -1 ? player2.name : player1.name}
                          </span>
                          <Badge className="text-[9px] bg-amber-500 text-white border-none hover:bg-amber-500 font-black uppercase px-1.5 py-0.5 rounded shrink-0">
                            W.O.
                          </Badge>
                        </div>
                        <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-0.5">
                          Wins by Walkover
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-2xl font-black italic text-muted-foreground/50 mx-4">VS</span>
              )}
            </div>
            
            {/* Player 2 */}
            <div className="flex flex-col items-center gap-3 w-24">
              <div className="relative">
                <div className={cn("w-16 h-16 bg-secondary rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden", winner === 'player2' ? 'border-primary' : 'border-border')}>
                  {player2.avatar ? (
                    <img src={player2.avatar} alt={player2.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black italic">{player2.name.charAt(0)}</span>
                  )}
                </div>
                {winner === 'player2' && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 text-primary-foreground shadow-lg">
                    <Trophy className="w-4 h-4" />
                  </div>
                )}
              </div>
              <span className={cn("font-black italic text-center truncate w-full text-sm", winner === 'player2' ? 'text-primary' : '')}>{player2.name}</span>
            </div>
          </div>
          
        </div>

        {/* Goals Section */}
        {goals && (goals.player1 || goals.player2) && (
          <div className="mt-6 pt-4 border-t border-border/50 flex flex-row justify-between text-xs text-muted-foreground font-medium w-full">
            <div className="flex-1 text-left">
              {goals.player1?.map((goal, i) => (
                <div key={i} className="mb-1">{goal}</div>
              ))}
            </div>
            <div className="flex-1 text-right">
              {goals.player2?.map((goal, i) => (
                <div key={i} className="mb-1">{goal}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
