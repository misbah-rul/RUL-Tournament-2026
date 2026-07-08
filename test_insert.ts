import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const fixture_id = '335f4875-7ba3-4129-b238-21f78bc586d8';
  // Insert
  const { data: inserted, error: insErr } = await supabase
    .from('results')
    .insert([{ fixture_id, player1_score: 3, player2_score: 0 }])
    .select();
  console.log("Inserted:", inserted, insErr);

  if (inserted && inserted.length > 0) {
    // Delete
    const { data: deleted, error: delErr } = await supabase
      .from('results')
      .delete()
      .eq('id', inserted[0].id)
      .select();
    console.log("Deleted:", deleted, delErr);
  }
}
run();
