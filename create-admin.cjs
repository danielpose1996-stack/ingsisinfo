const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

// IMPORTANTE: Debes colocar tu clave service_role (secreta) aquí o en tu archivo .env como SUPABASE_SERVICE_ROLE_KEY
// Puedes obtenerla en: Supabase Dashboard -> Settings -> API -> service_role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY_AQUI';

if (!SUPABASE_URL) {
  console.error('❌ Error: No se encontró VITE_SUPABASE_URL en el archivo .env');
  process.exit(1);
}

if (SERVICE_ROLE_KEY === 'TU_SERVICE_ROLE_KEY_AQUI' || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Por favor configura la clave service_role en el script o en tu archivo .env como SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function crearAdmin() {
  console.log('⏳ Iniciando creación de administrador...');
  console.log(`URL de Supabase: ${SUPABASE_URL}`);
  console.log('Correo: admin.rueda@unipaz.edu.co');

  // 1. Crear el usuario en auth.users a través del API de Administración (Bypassea RLS y restricciones)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin.rueda@unipaz.edu.co',
    password: 'admin023',
    email_confirm: true,
    user_metadata: { nombre: 'Admin Rueda', rol: 'admin' }
  });

  if (authError) {
    console.error('❌ Error de autenticación (auth.users):', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Usuario creado en Auth exitosamente. ID: ${userId}`);

  // 2. Insertar el perfil en public.perfiles
  // Nota: Como usamos la clave service_role, no nos afectarán las políticas RLS
  const { error: perfilError } = await supabase
    .from('perfiles')
    .insert({
      id: userId,
      nombre: 'Admin Rueda',
      rol: 'admin'
    });

  if (perfilError) {
    // Si la tabla perfiles usa user_id en lugar de id (por compatibilidad):
    console.log('⚠️ Reintentando inserción con la columna "user_id"...');
    const { error: perfilRetryError } = await supabase
      .from('perfiles')
      .insert({
        user_id: userId,
        email: 'admin.rueda@unipaz.edu.co',
        nombre: 'Admin Rueda',
        rol: 'admin'
      });

    if (perfilRetryError) {
      console.error('❌ Error al crear perfil en public.perfiles:', perfilRetryError.message);
    } else {
      console.log('✅ Perfil creado con éxito usando la columna "user_id".');
    }
  } else {
    console.log('✅ Perfil creado con éxito en public.perfiles.');
  }
}

crearAdmin();
