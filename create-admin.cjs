const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

// Cargar la clave service_role (secreta) desde el archivo .env como SUPABASE_SERVICE_ROLE_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Error: No se encontró VITE_SUPABASE_URL en el archivo .env');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: Por favor configura la clave service_role en tu archivo .env como SUPABASE_SERVICE_ROLE_KEY');
  console.error('Puedes obtenerla en: Supabase Dashboard -> Settings -> API -> service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function crearAdmin() {
  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL || 'admin.rueda@unipaz.edu.co';
  const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('❌ Error: Por favor configura la contraseña del administrador en tu archivo .env como SUPABASE_ADMIN_PASSWORD');
    process.exit(1);
  }

  console.log('⏳ Iniciando creación de administrador...');
  console.log(`URL de Supabase: ${SUPABASE_URL}`);
  console.log(`Correo: ${adminEmail}`);

  // 1. Crear el usuario en auth.users a través del API de Administración (Bypassea RLS y restricciones)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
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
        email: adminEmail,
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
