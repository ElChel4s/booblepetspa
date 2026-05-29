import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables manually
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // Fetch all appointments with pending proposal
    const { data: appointments, error } = await supabase
      .from('citas')
      .select('id, mascota_id, groomer_id, estado, estado_propuesta, propuesta_mensaje, sugerencia_groomer_id');
    
    if (error) {
      console.error("Error fetching appointments:", error);
    } else {
      console.log("\n--- ALL APPOINTMENTS ---");
      console.log(JSON.stringify(appointments, null, 2));
      
      const pending = appointments?.filter(a => a.estado_propuesta === 'pendiente');
      console.log(`\nFound ${pending?.length || 0} pending proposals.`);
    }
  } catch (err) {
    console.error("Error running script:", err);
  }
}

run();
