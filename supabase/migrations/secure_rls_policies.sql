-- =========================================================================
-- SCRIPT DE MIGRACIÓN: Políticas RLS Seguras para SISINFO
-- Instrucciones: Ejecuta este script en el editor SQL de Supabase.
-- NOTA: Si ya tienes políticas existentes en estas tablas, asegúrate de
-- eliminarlas desde el panel de Supabase para evitar conflictos.
-- =========================================================================

-- 1. Funciones auxiliares de verificación de roles con SECURITY DEFINER
-- Estas funciones evitan la recursividad RLS al consultar la tabla perfiles.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE (user_id = auth.uid() OR id = auth.uid()) AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.es_docente()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE (user_id = auth.uid() OR id = auth.uid()) AND rol = 'docente'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Habilitar RLS en las tablas (por seguridad, en caso de que falte alguna)
ALTER TABLE IF EXISTS public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.observaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.versiones_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resultados_ovas ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- TABLA: perfiles
-- =========================================================================
DROP POLICY IF EXISTS perfiles_select_policy ON public.perfiles;
DROP POLICY IF EXISTS perfiles_insert_policy ON public.perfiles;
DROP POLICY IF EXISTS perfiles_update_policy ON public.perfiles;
DROP POLICY IF EXISTS perfiles_delete_policy ON public.perfiles;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.perfiles;
DROP POLICY IF EXISTS "Allow user update" ON public.perfiles;
DROP POLICY IF EXISTS "Allow admin insert" ON public.perfiles;
DROP POLICY IF EXISTS "Allow admin update" ON public.perfiles;
DROP POLICY IF EXISTS "Allow admin delete" ON public.perfiles;

-- Cualquier usuario autenticado puede leer perfiles (ej. estudiantes buscan docentes, docentes ven estudiantes)
-- Pero limitamos para que solo lean su propio perfil o perfiles de docentes, a menos que sean admin/docente.
CREATE POLICY perfiles_select_policy ON public.perfiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR id = auth.uid()
    OR public.es_admin()
    OR public.es_docente()
    OR rol = 'docente'
  );

-- Permitir autoinserción al registrarse en el sistema
CREATE POLICY perfiles_insert_policy ON public.perfiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR id = auth.uid()
  );

-- Solo el propietario o el administrador pueden actualizar el perfil (evita escalamiento de rol)
CREATE POLICY perfiles_update_policy ON public.perfiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR id = auth.uid()
    OR public.es_admin()
  )
  WITH CHECK (
    (
      (user_id = auth.uid() OR id = auth.uid())
      AND (
        -- No puede cambiar su propio rol a menos que ya sea administrador
        rol = (SELECT rol FROM public.perfiles WHERE user_id = auth.uid() OR id = auth.uid() LIMIT 1)
        OR public.es_admin()
      )
    )
    OR public.es_admin()
  );

-- Solo administradores pueden eliminar perfiles
CREATE POLICY perfiles_delete_policy ON public.perfiles
  FOR DELETE TO authenticated
  USING (public.es_admin());


-- =========================================================================
-- TABLA: proyectos
-- =========================================================================
DROP POLICY IF EXISTS proyectos_select_policy ON public.proyectos;
DROP POLICY IF EXISTS proyectos_insert_policy ON public.proyectos;
DROP POLICY IF EXISTS proyectos_update_policy ON public.proyectos;
DROP POLICY IF EXISTS proyectos_delete_policy ON public.proyectos;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow user read" ON public.proyectos;
DROP POLICY IF EXISTS "Allow user insert" ON public.proyectos;
DROP POLICY IF EXISTS "Allow user update" ON public.proyectos;
DROP POLICY IF EXISTS "Allow admin delete" ON public.proyectos;

-- Lectura: Estudiante/Docente dueño del proyecto, Administrador, o proyectos finalizados (terminado = true)
CREATE POLICY proyectos_select_policy ON public.proyectos
  FOR SELECT TO authenticated
  USING (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = estudiante_id OR user_id = estudiante_id LIMIT 1) = auth.uid()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
    OR terminado = true
  );

-- Inserción: Solo el propio estudiante del proyecto o el administrador
CREATE POLICY proyectos_insert_policy ON public.proyectos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = estudiante_id OR user_id = estudiante_id LIMIT 1) = auth.uid()
  );

-- Actualización: Estudiante asignado, docente asignado, o el administrador
CREATE POLICY proyectos_update_policy ON public.proyectos
  FOR UPDATE TO authenticated
  USING (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = estudiante_id OR user_id = estudiante_id LIMIT 1) = auth.uid()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = estudiante_id OR user_id = estudiante_id LIMIT 1) = auth.uid()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  );

-- Eliminación: Solo el docente asesor asignado o el administrador
CREATE POLICY proyectos_delete_policy ON public.proyectos
  FOR DELETE TO authenticated
  USING (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  );


-- =========================================================================
-- TABLA: observaciones
-- =========================================================================
DROP POLICY IF EXISTS observaciones_select_policy ON public.observaciones;
DROP POLICY IF EXISTS observaciones_insert_policy ON public.observaciones;
DROP POLICY IF EXISTS observaciones_update_policy ON public.observaciones;
DROP POLICY IF EXISTS observaciones_delete_policy ON public.observaciones;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow user read" ON public.observaciones;
DROP POLICY IF EXISTS "Allow user insert" ON public.observaciones;
DROP POLICY IF EXISTS "Allow user update" ON public.observaciones;
DROP POLICY IF EXISTS "Allow admin delete" ON public.observaciones;

-- Lectura: Si el usuario puede leer el proyecto, puede ver sus observaciones
CREATE POLICY observaciones_select_policy ON public.observaciones
  FOR SELECT TO authenticated
  USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.proyectos p
      WHERE p.id = proyecto_id
      AND (
        (SELECT user_id FROM public.perfiles WHERE id = p.estudiante_id OR user_id = p.estudiante_id LIMIT 1) = auth.uid()
        OR (SELECT user_id FROM public.perfiles WHERE id = p.docente_id OR user_id = p.docente_id LIMIT 1) = auth.uid()
      )
    )
  );

-- Inserción: Solo el docente asignado al proyecto o el administrador
CREATE POLICY observaciones_insert_policy ON public.observaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    public.es_admin()
    OR (
      EXISTS (
        SELECT 1 FROM public.proyectos p
        WHERE p.id = proyecto_id
        AND (SELECT user_id FROM public.perfiles WHERE id = p.docente_id OR user_id = p.docente_id LIMIT 1) = auth.uid()
      )
      AND (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
    )
  );

-- Actualización/Eliminación: El autor de la observación o administrador
CREATE POLICY observaciones_update_policy ON public.observaciones
  FOR UPDATE TO authenticated
  USING (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  );

CREATE POLICY observaciones_delete_policy ON public.observaciones
  FOR DELETE TO authenticated
  USING (
    public.es_admin()
    OR (SELECT user_id FROM public.perfiles WHERE id = docente_id OR user_id = docente_id LIMIT 1) = auth.uid()
  );


-- =========================================================================
-- TABLA: notificaciones
-- =========================================================================
DROP POLICY IF EXISTS notificaciones_select_policy ON public.notificaciones;
DROP POLICY IF EXISTS notificaciones_insert_policy ON public.notificaciones;
DROP POLICY IF EXISTS notificaciones_update_policy ON public.notificaciones;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow user read" ON public.notificaciones;
DROP POLICY IF EXISTS "Allow user update" ON public.notificaciones;

-- Lectura: Solo el destinatario de la notificación o el administrador
CREATE POLICY notificaciones_select_policy ON public.notificaciones
  FOR SELECT TO authenticated
  USING (
    (SELECT user_id FROM public.perfiles WHERE id = usuario_id OR user_id = usuario_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  );

-- Inserción: Solo el sistema/triggers o administradores
CREATE POLICY notificaciones_insert_policy ON public.notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (public.es_admin());

-- Actualización: Solo el destinatario para marcar como leída
CREATE POLICY notificaciones_update_policy ON public.notificaciones
  FOR UPDATE TO authenticated
  USING (
    (SELECT user_id FROM public.perfiles WHERE id = usuario_id OR user_id = usuario_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  )
  WITH CHECK (
    (SELECT user_id FROM public.perfiles WHERE id = usuario_id OR user_id = usuario_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  );


-- =========================================================================
-- TABLA: versiones_proyecto
-- =========================================================================
DROP POLICY IF EXISTS versiones_proyecto_select_policy ON public.versiones_proyecto;
DROP POLICY IF EXISTS versiones_proyecto_insert_policy ON public.versiones_proyecto;
DROP POLICY IF EXISTS versiones_proyecto_modify_policy ON public.versiones_proyecto;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow user read" ON public.versiones_proyecto;
DROP POLICY IF EXISTS "Allow user insert" ON public.versiones_proyecto;
DROP POLICY IF EXISTS "Allow admin delete" ON public.versiones_proyecto;

-- Lectura: Si el usuario es dueño del proyecto o el proyecto está finalizado
CREATE POLICY versiones_proyecto_select_policy ON public.versiones_proyecto
  FOR SELECT TO authenticated
  USING (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.proyectos p
      WHERE p.id = proyecto_id
      AND (
        (SELECT user_id FROM public.perfiles WHERE id = p.estudiante_id OR user_id = p.estudiante_id LIMIT 1) = auth.uid()
        OR (SELECT user_id FROM public.perfiles WHERE id = p.docente_id OR user_id = p.docente_id LIMIT 1) = auth.uid()
        OR p.terminado = true
      )
    )
  );

-- Inserción: Solo el estudiante asignado al proyecto o el administrador
CREATE POLICY versiones_proyecto_insert_policy ON public.versiones_proyecto
  FOR INSERT TO authenticated
  WITH CHECK (
    public.es_admin()
    OR EXISTS (
      SELECT 1 FROM public.proyectos p
      WHERE p.id = proyecto_id
      AND (SELECT user_id FROM public.perfiles WHERE id = p.estudiante_id OR user_id = p.estudiante_id LIMIT 1) = auth.uid()
    )
  );

-- Modificaciones/Eliminaciones: Solo administradores
CREATE POLICY versiones_proyecto_modify_policy ON public.versiones_proyecto
  FOR ALL TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());


-- =========================================================================
-- TABLA: resultados_ovas
-- =========================================================================
DROP POLICY IF EXISTS resultados_ovas_select_policy ON public.resultados_ovas;
DROP POLICY IF EXISTS resultados_ovas_insert_policy ON public.resultados_ovas;
DROP POLICY IF EXISTS resultados_ovas_update_policy ON public.resultados_ovas;
DROP POLICY IF EXISTS resultados_ovas_delete_policy ON public.resultados_ovas;
-- Eliminación de políticas previas detectadas en tu panel
DROP POLICY IF EXISTS "Allow user read" ON public.resultados_ovas;
DROP POLICY IF EXISTS "Allow user insert" ON public.resultados_ovas;
DROP POLICY IF EXISTS "Allow user update" ON public.resultados_ovas;

-- Lectura: El estudiante dueño de los resultados, administradores, o docentes (para seguimiento)
CREATE POLICY resultados_ovas_select_policy ON public.resultados_ovas
  FOR SELECT TO authenticated
  USING (
    (SELECT user_id FROM public.perfiles WHERE id = perfil_id OR user_id = perfil_id LIMIT 1) = auth.uid()
    OR public.es_admin()
    OR public.es_docente()
  );

-- Inserción/Actualización: Solo el propio estudiante o administrador
CREATE POLICY resultados_ovas_insert_policy ON public.resultados_ovas
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT user_id FROM public.perfiles WHERE id = perfil_id OR user_id = perfil_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  );

CREATE POLICY resultados_ovas_update_policy ON public.resultados_ovas
  FOR UPDATE TO authenticated
  USING (
    (SELECT user_id FROM public.perfiles WHERE id = perfil_id OR user_id = perfil_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  )
  WITH CHECK (
    (SELECT user_id FROM public.perfiles WHERE id = perfil_id OR user_id = perfil_id LIMIT 1) = auth.uid()
    OR public.es_admin()
  );

-- Eliminación: Solo administradores
CREATE POLICY resultados_ovas_delete_policy ON public.resultados_ovas
  FOR DELETE TO authenticated
  USING (public.es_admin());
