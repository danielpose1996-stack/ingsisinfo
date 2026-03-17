const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dwwhqkowmyrdauzygztb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3d2hxa293bXlyZGF1enlnenRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NDgwODksImV4cCI6MjA4OTEyNDA4OX0.BG48KWhJC4kD6IAAVGjtH4S26aO80Y-7124WKSgRGvc';

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
