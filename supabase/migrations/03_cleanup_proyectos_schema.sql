-- =========================================================================
-- MIGRACIÓN: Limpieza de Tablas de Proyectos en SISINFO
-- Instrucciones: Ejecuta este script en el SQL Editor de Supabase
-- para eliminar de forma segura las tablas del antiguo módulo de proyectos.
-- =========================================================================

-- Eliminar tablas del módulo de proyectos
-- (CASCADE elimina automáticamente llaves foráneas, triggers y políticas RLS asociadas)
DROP TABLE IF EXISTS public.observaciones CASCADE;
DROP TABLE IF EXISTS public.versiones_proyecto CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;

