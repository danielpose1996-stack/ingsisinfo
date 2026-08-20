-- =========================================================================
-- SCRIPT DE MIGRACIÓN: Google OAuth con Dominio Institucional @unipaz.edu.co
-- Semillero de Investigación SISINFO
-- Instrucciones: Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. LIMPIEZA DE DATOS Y USUARIOS ANTERIORES
-- (Ejecuta esta sección para reiniciar las cuentas de prueba de forma segura)
-- -------------------------------------------------------------------------
DELETE FROM public.observaciones;
DELETE FROM public.versiones_proyecto;
DELETE FROM public.resultados_ovas;
DELETE FROM public.proyectos;
DELETE FROM public.notificaciones;
DELETE FROM public.perfiles;
DELETE FROM auth.users;

-- -------------------------------------------------------------------------
-- 2. FUNCIÓN Y TRIGGER PARA REGISTRO AUTOMÁTICO VÍA GOOGLE OAUTH
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_full_name text;
  user_first_name text;
  user_last_name text;
BEGIN
  user_email := LOWER(TRIM(NEW.email));

  -- A. SEGURIDAD: Validación estricta del dominio institucional
  IF user_email NOT LIKE '%@unipaz.edu.co' THEN
    RAISE EXCEPTION 'Acceso denegado: solo se permiten correos institucionales de @unipaz.edu.co';
  END IF;

  -- B. Extracción y sanitización de nombres desde la metadata de Google
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(user_email, '@', 1));
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'family_name', '');

  -- Si Google solo envió nombre completo en una sola cadena
  IF (user_first_name = split_part(user_email, '@', 1) OR user_first_name IS NULL) AND user_full_name <> '' THEN
    user_first_name := split_part(user_full_name, ' ', 1);
    user_last_name := NULLIF(TRIM(SUBSTRING(user_full_name FROM LENGTH(user_first_name) + 1)), '');
  END IF;

  -- C. Inserción en la tabla de perfiles con rol 'estudiante' por defecto
  INSERT INTO public.perfiles (
    user_id,
    email,
    nombre,
    apellido,
    rol,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_email,
    COALESCE(NULLIF(TRIM(user_first_name), ''), 'Estudiante'),
    COALESCE(NULLIF(TRIM(user_last_name), ''), ''),
    'estudiante',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -------------------------------------------------------------------------
-- 3. VINCULACIÓN DEL TRIGGER A auth.users
-- -------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 4. INSTRUCCIÓN PARA ASIGNAR EL PRIMER ADMINISTRADOR (SUPERADMIN)
-- Tras iniciar sesión por primera vez con tu cuenta @unipaz.edu.co mediante Google,
-- ejecuta la siguiente sentencia reemplazando el correo por el tuyo:
--
-- UPDATE public.perfiles 
-- SET rol = 'admin' 
-- WHERE email = 'tu_correo_institucional@unipaz.edu.co';
-- -------------------------------------------------------------------------
