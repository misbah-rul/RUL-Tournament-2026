import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: fixtures, error: err1 } = await supabase.from('fixtures').select('*').limit(1);
  const { data: results, error: err2 } = await supabase.from('results').select('*').limit(1);
  console.log("Fixtures:", fixtures, err1);
  console.log("Results:", results, err2);
}
run();
