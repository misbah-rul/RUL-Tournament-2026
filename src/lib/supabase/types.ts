export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          avatar: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar?: string | null
          created_at?: string
        }
      }
      fixtures: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          date: string
          time: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          player1_id: string
          player2_id: string
          date: string
          time: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          player1_id?: string
          player2_id?: string
          date?: string
          time?: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      results: {
        Row: {
          id: string
          fixture_id: string
          player1_score: number
          player2_score: number
          created_at: string
        }
        Insert: {
          id?: string
          fixture_id: string
          player1_score?: number
          player2_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          fixture_id?: string
          player1_score?: number
          player2_score?: number
          created_at?: string
        }
      }
    }
    Views: {
      standings: {
        Row: {
          player_id: string
          player_name: string
          player_avatar: string | null
          matches_played: number
          wins: number
          draws: number
          losses: number
          goals_for: number
          goals_against: number
          goal_difference: number
          points: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      fixture_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    }
  }
}
