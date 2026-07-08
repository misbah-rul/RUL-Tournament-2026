import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('information_schema.columns' as any)
    .select('table_name, column_name, data_type')
    .in('table_name', ['fixtures', 'results']);
  console.log("Columns:", data, "Error:", error);
}
run();
