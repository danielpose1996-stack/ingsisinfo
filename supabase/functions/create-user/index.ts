import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Verificación de CORS para solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Falta cabecera de Autorización' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace(/^Bearer\s/i, '')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    // Rechazar si se usa la clave anónima como token Bearer
    if (token === anonKey) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: el token anónimo no puede realizar operaciones de administración' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseClient = createClient(supabaseUrl, anonKey ?? '')

    // Validar el token mediante Supabase Auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Consultar perfiles para verificar si el usuario tiene el rol 'admin'
    const { data: profile, error: profileError } = await supabaseClient
      .from('perfiles')
      .select('rol')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.rol !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado: se requieren privilegios de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Autenticación validada: inicializar el cliente con la clave SERVICE ROLE
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno de la Edge Function')
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Interpretar el cuerpo de la solicitud
    const body = await req.json()
    const { action, user_id, password, email, nombre, apellido, rol, linea_investigacion } = body

    if (action === 'update') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'Falta el ID del usuario a actualizar (user_id)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Actualizar la contraseña en Auth si fue proporcionada
      if (password) {
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(user_id, {
          password: password
        })
        if (updateAuthError) {
          return new Response(
            JSON.stringify({ error: `Error al actualizar credenciales: ${updateAuthError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Credenciales del usuario actualizadas con éxito' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Flujo de creación de usuario
      if (!email || !password || !nombre || !apellido || !rol) {
        return new Response(
          JSON.stringify({ error: 'Faltan campos obligatorios para la creación del usuario' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 1. Crear el usuario en Auth
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre: `${nombre} ${apellido}`, rol }
      })

      if (authError || !authData?.user) {
        return new Response(
          JSON.stringify({ error: `Error al crear usuario en Auth: ${authError?.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 2. Insertar el perfil en public.perfiles
      const { error: profileInsertError } = await adminClient
        .from('perfiles')
        .insert({
          user_id: authData.user.id,
          email,
          nombre,
          apellido,
          rol,
          linea_investigacion: rol === 'docente' ? (linea_investigacion || 'Ingeniería de Software') : null
        })

      if (profileInsertError) {
        // Intentar revertir el usuario creado en Auth para conservar un estado limpio
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: `Error al registrar perfil: ${profileInsertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Usuario y perfil creados exitosamente', user: authData.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno de la Edge Function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
