import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: perfiles, error: pError } = await supabase.from('perfiles').select('*');
    const { data: mascotas, error: mError } = await supabase.from('mascotas').select('*');
    const { data: citas, error: cError } = await supabase.from('citas').select('*');

    console.log('--- PERFILES ---');
    console.log(perfiles ? perfiles.map(p => ({ id: p.id, email: p.email, nombre: p.nombre_completo, rol: p.rol })) : pError);

    console.log('--- MASCOTAS ---');
    console.log(mascotas ? mascotas.map(m => ({ id: m.id, nombre: m.nombre, dueno_id: m.dueno_id })) : mError);

    console.log('--- CITAS ---');
    console.log(citas ? citas.map(c => ({ id: c.id, mascota_id: c.mascota_id, groomer_id: c.groomer_id, estado: c.estado, inicio: c.fecha_hora_inicio })) : cError);

  } catch (err) {
    console.error(err);
  }
}

run();
