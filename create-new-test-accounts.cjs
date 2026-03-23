const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAccounts() {
    const users = [
        {
            email: 'test.estudiante@unipaz.edu.co',
            password: 'password123',
            perfil: {
                nombre: 'Hermes',
                apellido: 'Estudiante',
                rol: 'estudiante',
                carrera: 'Ingeniería Informática',
                semestre: 5
            }
        },
        {
            email: 'test.docente@unipaz.edu.co',
            password: 'password123',
            perfil: {
                nombre: 'Daniel',
                apellido: 'Docente',
                rol: 'docente',
                linea_investigacion: 'Ingeniería de Software'
            }
        }
    ];

    for (const u of users) {
        console.log(`Creando cuenta para: ${u.email}...`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: u.email,
            password: u.password
        });

        if (authError) {
            console.error(`Error de Auth para ${u.email}:`, authError.message);
            continue;
        }

        const { error: perfilError } = await supabase.from('perfiles').insert({
            user_id: authData.user.id,
            email: u.email,
            ...u.perfil
        });

        if (perfilError) {
            console.error(`Error de Perfil para ${u.email}:`, perfilError.message);
        } else {
            console.log(`✅ Cuenta creada con éxito: ${u.email}`);
        }
    }
}

createAccounts();
