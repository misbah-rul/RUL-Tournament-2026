import fs from 'fs';
async function run() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(url);
  const data = await res.text();
  fs.writeFileSync('schema.json', data);
}
run();
