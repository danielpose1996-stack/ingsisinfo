-- =========================================================================
-- MIGRACIÓN: Políticas RLS para Supabase Storage (Bucket ovas-publico)
-- Instrucciones: Ejecuta este script en el SQL Editor de Supabase.
-- =========================================================================

-- 1. Crear el bucket 'ovas-publico' si no existe y asegurarse de que sea público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ovas-publico', 
  'ovas-publico', 
  true, 
  52428800, -- 50MB límite
  ARRAY[
    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'text/html', 'application/zip', 'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'text/html', 'application/zip', 'text/plain'
  ];

-- 2. Eliminar políticas previas si existían
DROP POLICY IF EXISTS "Permitir lectura publica de ovas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de ovas a autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizacion de ovas a autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminacion de ovas a autenticados" ON storage.objects;

-- 3. POLÍTICAS DE ACCESO:

-- A) LECTURA PÚBLICA: Cualquier persona o estudiante puede ver/descargar los recursos de ovas-publico
CREATE POLICY "Permitir lectura publica de ovas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ovas-publico');

-- B) INSERCIÓN: Cualquier usuario autenticado (administrador o docente) puede subir archivos
CREATE POLICY "Permitir subida de ovas a autenticados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ovas-publico');

-- C) ACTUALIZACIÓN: Usuarios autenticados pueden sobrescribir/actualizar archivos
CREATE POLICY "Permitir actualizacion de ovas a autenticados"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ovas-publico')
  WITH CHECK (bucket_id = 'ovas-publico');

-- D) ELIMINACIÓN: Usuarios autenticados pueden eliminar archivos
CREATE POLICY "Permitir eliminacion de ovas a autenticados"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ovas-publico');
