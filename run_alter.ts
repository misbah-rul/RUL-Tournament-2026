import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { 
    sql: 'ALTER TABLE results ADD COLUMN IF NOT EXISTS is_walkover BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS walkover_winner_id UUID REFERENCES players(id);' 
  });
  console.log("Data:", data, "Error:", error);
}
run();
