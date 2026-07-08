import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const fixture_id = '335f4875-7ba3-4129-b238-21f78bc586d8';
  
  // Test non-existent column
  const { error: err1 } = await supabase
    .from('results')
    .insert([{ fixture_id, player1_score: 3, player2_score: 0, non_existent_column: 123 }]);
  console.log("Non-existent column error:", err1?.message);

  // Test is_walkover column
  const { error: err2 } = await supabase
    .from('results')
    .insert([{ fixture_id, player1_score: 3, player2_score: 0, is_walkover: true }]);
  console.log("is_walkover column error:", err2?.message);
}
run();
